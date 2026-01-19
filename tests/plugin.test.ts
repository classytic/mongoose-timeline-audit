import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import mongoose, { Schema, Model, Document } from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import {
  timelineAuditPlugin,
  ORDER_EVENTS,
  USER_EVENTS,
  SYSTEM_EVENTS,
  buildRequestContext,
  ACTOR_ROLES,
  resolveActor,
  getActorDescription,
  STANDARD_EVENT_LIMITS,
  getPluginConfig,
  defaultActorResolver,
} from '../dist/index.js';
import type {
  TimelineEvent,
  RequestUser,
  Actor,
} from '../dist/index.js';

// Test interfaces
interface IOrder {
  customerId: mongoose.Types.ObjectId;
  status: string;
  total: number;
  timeline?: TimelineEvent[];
}

interface IOrderMethods {
  addTimelineEvent(
    event: string,
    description?: string | null,
    request?: unknown,
    additionalMetadata?: Record<string, unknown>
  ): TimelineEvent;
  getTimelineEventsByType(eventType: string): TimelineEvent[];
  hasTimelineEvent(eventType: string): boolean;
  getLatestTimelineEvent(): TimelineEvent | null;
}

interface IOrderDocument extends Document, IOrder, IOrderMethods {}

let mongoServer: MongoMemoryServer;
let OrderModel: Model<IOrderDocument>;

describe('Mongoose Timeline Audit Plugin', () => {
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);

    // Define schema with plugin
    const orderSchema = new Schema<IOrderDocument>({
      customerId: { type: Schema.Types.ObjectId, ref: 'Customer' },
      status: { type: String, default: 'pending' },
      total: { type: Number, default: 0 },
    });

    orderSchema.plugin(timelineAuditPlugin, {
      ownerField: 'customerId',
      eventLimits: {
        [ORDER_EVENTS.UPDATED]: 20,
        [ORDER_EVENTS.STATUS_CHANGED]: 50,
      },
    });

    OrderModel = mongoose.model<IOrderDocument>('Order', orderSchema);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    await OrderModel.deleteMany({});
  });

  describe('Basic Timeline Operations', () => {
    it('should add timeline event to document', async () => {
      const order = new OrderModel({
        customerId: new mongoose.Types.ObjectId(),
        status: 'pending',
        total: 100,
      });

      order.addTimelineEvent(ORDER_EVENTS.CREATED, 'Order was created');
      await order.save();

      expect(order.timeline).toBeDefined();
      expect(order.timeline).toHaveLength(1);
      expect(order.timeline![0].event).toBe(ORDER_EVENTS.CREATED);
      expect(order.timeline![0].description).toBe('Order was created');
    });

    it('should add multiple timeline events', async () => {
      const order = new OrderModel({
        customerId: new mongoose.Types.ObjectId(),
        status: 'pending',
        total: 100,
      });

      order.addTimelineEvent(ORDER_EVENTS.CREATED, 'Order created');
      await order.save();

      order.addTimelineEvent(ORDER_EVENTS.PAYMENT_RECEIVED, 'Payment processed');
      await order.save();

      order.addTimelineEvent(ORDER_EVENTS.STATUS_CHANGED, 'Status changed to confirmed');
      await order.save();

      expect(order.timeline).toHaveLength(3);
    });

    it('should add event with request context', async () => {
      const order = new OrderModel({
        customerId: new mongoose.Types.ObjectId(),
        status: 'pending',
      });

      const mockRequest = {
        user: {
          _id: new mongoose.Types.ObjectId().toString(),
          role: 'admin' as const,
          email: 'admin@test.com',
        } as RequestUser,
        ip: '192.168.1.1',
        headers: {
          'user-agent': 'Mozilla/5.0',
        },
      };

      order.addTimelineEvent(ORDER_EVENTS.UPDATED, 'Order updated by admin', mockRequest);
      await order.save();

      expect(order.timeline![0].performedBy).toBeDefined();
    });

    it('should get latest timeline event', async () => {
      const order = new OrderModel({
        customerId: new mongoose.Types.ObjectId(),
      });

      order.addTimelineEvent(ORDER_EVENTS.CREATED, 'Created');
      await order.save();
      order.addTimelineEvent(ORDER_EVENTS.UPDATED, 'Update 1');
      await order.save();
      order.addTimelineEvent(ORDER_EVENTS.UPDATED, 'Update 2');
      await order.save();

      const latest = order.getLatestTimelineEvent();
      expect(latest).toBeDefined();
      expect(latest!.description).toBe('Update 2');
    });

    it('should get timeline events by type', async () => {
      const order = new OrderModel({
        customerId: new mongoose.Types.ObjectId(),
      });

      order.addTimelineEvent(ORDER_EVENTS.CREATED, 'Created');
      await order.save();
      order.addTimelineEvent(ORDER_EVENTS.UPDATED, 'Updated 1');
      await order.save();
      order.addTimelineEvent(ORDER_EVENTS.UPDATED, 'Updated 2');
      await order.save();
      order.addTimelineEvent(ORDER_EVENTS.STATUS_CHANGED, 'Status changed');
      await order.save();

      const updateEvents = order.getTimelineEventsByType(ORDER_EVENTS.UPDATED);
      expect(updateEvents).toHaveLength(2);
    });

    it('should check if event exists', async () => {
      const order = new OrderModel({
        customerId: new mongoose.Types.ObjectId(),
      });

      order.addTimelineEvent(ORDER_EVENTS.CREATED, 'Created');
      await order.save();

      expect(order.hasTimelineEvent(ORDER_EVENTS.CREATED)).toBe(true);
      expect(order.hasTimelineEvent(ORDER_EVENTS.CANCELLED)).toBe(false);
    });
  });

  describe('Event Trimming', () => {
    it('should trim events when exceeding limit', async () => {
      const order = new OrderModel({
        customerId: new mongoose.Types.ObjectId(),
      });

      // Add more than the limit (20 for UPDATED events)
      for (let i = 0; i < 25; i++) {
        order.addTimelineEvent(ORDER_EVENTS.UPDATED, `Update ${i + 1}`);
      }
      await order.save();

      const updateEvents = order.getTimelineEventsByType(ORDER_EVENTS.UPDATED);
      expect(updateEvents.length).toBeLessThanOrEqual(20);
    });
  });

  describe('Actor Resolution', () => {
    it('should resolve customer actor for regular user', () => {
      const actor = resolveActor({
        user: {
          _id: '123',
          role: 'customer',
          email: 'customer@test.com',
        },
      });

      expect(actor.actorId).toBe('123');
      expect(actor.actorRole).toBe('customer');
    });

    it('should resolve system actor when no request', () => {
      const actor = resolveActor(null);

      expect(actor.actorId).toBeNull();
      expect(actor.actorRole).toBe(ACTOR_ROLES.SYSTEM);
    });

    it('should resolve guest actor when no user in request', () => {
      const actor = resolveActor({});

      expect(actor.actorId).toBeNull();
      expect(actor.actorRole).toBe(ACTOR_ROLES.GUEST);
    });

    it('should get actor description', () => {
      const actor: Actor = {
        actorId: '123',
        actorRole: 'admin',
        metadata: {},
      };
      const description = getActorDescription(actor);
      expect(description).toBe('Admin');
    });

    it('should get actor description with onBehalfOf', () => {
      const actor: Actor = {
        actorId: '123',
        actorRole: 'admin',
        metadata: { onBehalfOf: 'customer456' },
      };
      const description = getActorDescription(actor);
      expect(description).toBe('Admin (on behalf of customer)');
    });
  });

  describe('Context Helpers', () => {
    it('should build request context', () => {
      const context = buildRequestContext({
        ip: '192.168.1.1',
        headers: {
          'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          referer: 'https://example.com',
        },
      });

      expect(context.ip).toBe('192.168.1.1');
      expect(context.userAgent).toContain('Mozilla');
    });
  });

  describe('Configuration', () => {
    it('should have standard event limits defined', () => {
      expect(STANDARD_EVENT_LIMITS).toBeDefined();
      expect(typeof STANDARD_EVENT_LIMITS).toBe('object');
    });

    it('should get plugin config with defaults', () => {
      const config = getPluginConfig('Order', {});
      expect(config.enabled).toBe(true);
      expect(config.fieldName).toBe('timeline');
    });
  });

  describe('Event Types', () => {
    it('should have ORDER_EVENTS defined', () => {
      expect(ORDER_EVENTS.CREATED).toBe('order.created');
      expect(ORDER_EVENTS.UPDATED).toBe('order.updated');
      expect(ORDER_EVENTS.CANCELLED).toBe('order.cancelled');
    });

    it('should have USER_EVENTS defined', () => {
      expect(USER_EVENTS).toBeDefined();
      expect(typeof USER_EVENTS.REGISTERED).toBe('string');
    });

    it('should have SYSTEM_EVENTS defined', () => {
      expect(SYSTEM_EVENTS).toBeDefined();
      expect(typeof SYSTEM_EVENTS.MAINTENANCE_START).toBe('string');
    });
  });

  describe('Metadata Support', () => {
    it('should add event with additional metadata', async () => {
      const order = new OrderModel({
        customerId: new mongoose.Types.ObjectId(),
      });

      order.addTimelineEvent(
        ORDER_EVENTS.PAYMENT_RECEIVED,
        'Payment received',
        null,
        {
          amount: 100,
          currency: 'USD',
          transactionId: 'txn_123',
        }
      );
      await order.save();

      const event = order.timeline![0];
      expect(event.metadata).toBeDefined();
      // Metadata is stored as a Map in Mongoose
      expect(event.metadata?.get('amount')).toBe(100);
      expect(event.metadata?.get('currency')).toBe('USD');
    });
  });
});
