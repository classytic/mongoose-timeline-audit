/**
 * Tests for mongoose-timeline-audit plugin
 * Using Node.js built-in test runner
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import mongoose from 'mongoose';
import timelineAuditPlugin from '../index.js';

const { Schema } = mongoose;

// MongoDB connection string for testing
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/mongoose-timeline-audit-test';

describe('Mongoose Timeline Audit Plugin', () => {
  let Order;
  let connection;

  before(async () => {
    // Connect to MongoDB
    connection = await mongoose.connect(MONGODB_URI);

    // Define test schema with plugin
    const orderSchema = new Schema({
      customerId: { type: Schema.Types.ObjectId, required: true },
      total: Number,
      status: String,
    });

    orderSchema.plugin(timelineAuditPlugin, {
      ownerField: 'customerId',
      eventLimits: {
        'order.updated': 5,
        'payment.completed': 10,
      },
    });

    // Clear any existing model
    if (mongoose.models.Order) {
      delete mongoose.models.Order;
    }

    Order = mongoose.model('Order', orderSchema);

    // Clean up test data
    await Order.deleteMany({});
  });

  after(async () => {
    // Cleanup
    await Order.deleteMany({});
    await mongoose.connection.close();
  });

  describe('Basic Timeline Operations', () => {
    it('should add timeline field to schema', async () => {
      const customerId = new mongoose.Types.ObjectId();
      const order = new Order({
        customerId,
        total: 100,
        status: 'pending',
      });

      assert.ok(order.timeline !== undefined, 'Timeline field should exist');
      assert.ok(Array.isArray(order.timeline), 'Timeline should be an array');
    });

    it('should add timeline event with system actor', async () => {
      const customerId = new mongoose.Types.ObjectId();
      const order = new Order({
        customerId,
        total: 100,
        status: 'pending',
      });

      const event = order.addTimelineEvent('order.created', 'Order created');

      assert.strictEqual(event.event, 'order.created');
      assert.strictEqual(event.description, 'Order created');
      assert.strictEqual(event.performedBy, null);
      assert.strictEqual(event.metadata?.actorRole || event.metadata.get?.('actorRole'), 'system');
      assert.ok(event.timestamp instanceof Date);
    });

    it('should add timeline event with custom metadata', async () => {
      const customerId = new mongoose.Types.ObjectId();
      const order = new Order({
        customerId,
        total: 100,
        status: 'pending',
      });

      const metadata = { source: 'api', version: '1.0' };
      const event = order.addTimelineEvent(
        'order.created',
        'Order created via API',
        null,
        metadata
      );

      assert.strictEqual(event.metadata?.source || event.metadata.get?.('source'), 'api');
      assert.strictEqual(event.metadata?.version || event.metadata.get?.('version'), '1.0');
    });

    it('should add timeline event with context', async () => {
      const customerId = new mongoose.Types.ObjectId();
      const order = new Order({
        customerId,
        total: 100,
        status: 'pending',
      });

      const context = {
        ip: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        geo: { country: 'US', city: 'New York' },
      };

      const event = order.addTimelineEvent(
        'order.created',
        'Order created',
        null,
        {},
        context
      );

      assert.strictEqual(event.context.ip, '192.168.1.1');
      assert.strictEqual(event.context.userAgent, 'Mozilla/5.0');
      assert.strictEqual(event.context.geo.country, 'US');
    });
  });

  describe('Actor Resolution', () => {
    it('should resolve customer actor from request', async () => {
      const customerId = new mongoose.Types.ObjectId();
      const userId = new mongoose.Types.ObjectId();

      const order = new Order({
        customerId,
        total: 100,
        status: 'pending',
      });

      const request = {
        user: {
          _id: userId,
          role: 'customer',
        },
      };

      const event = order.addTimelineEvent('order.created', null, request);

      assert.strictEqual(event.performedBy.toString(), userId.toString());
      assert.strictEqual(event.metadata?.actorRole || event.metadata.get?.('actorRole'), 'customer');
      assert.strictEqual(event.description, 'Customer');
    });

    it('should resolve admin actor', async () => {
      const customerId = new mongoose.Types.ObjectId();
      const adminId = new mongoose.Types.ObjectId();
      const orgId = new mongoose.Types.ObjectId();

      const order = new Order({
        customerId,
        total: 100,
        status: 'pending',
      });

      const request = {
        user: {
          _id: adminId,
          role: 'admin',
        },
        context: {
          customerId: new mongoose.Types.ObjectId(), // Different customer
          organizationId: orgId,
        },
      };

      const event = order.addTimelineEvent('order.created', null, request);

      assert.strictEqual(event.performedBy.toString(), adminId.toString());
      assert.strictEqual(event.metadata?.actorRole || event.metadata.get?.('actorRole'), 'admin');
      assert.strictEqual(event.metadata?.onBehalfOf || event.metadata.get?.('onBehalfOf'), customerId.toString());
      assert.strictEqual(event.description, 'Admin (on behalf of customer)');
    });

    it('should resolve superadmin actor', async () => {
      const customerId = new mongoose.Types.ObjectId();
      const superadminId = new mongoose.Types.ObjectId();

      const order = new Order({
        customerId,
        total: 100,
        status: 'pending',
      });

      const request = {
        user: {
          _id: superadminId,
          role: 'superadmin',
        },
      };

      const event = order.addTimelineEvent('order.created', null, request);

      assert.strictEqual(event.performedBy.toString(), superadminId.toString());
      assert.strictEqual(event.metadata?.actorRole || event.metadata.get?.('actorRole'), 'superadmin');
      assert.strictEqual(event.description, 'Superadmin (on behalf of customer)');
    });

    it('should resolve guest actor when no user', async () => {
      const customerId = new mongoose.Types.ObjectId();

      const order = new Order({
        customerId,
        total: 100,
        status: 'pending',
      });

      const request = {}; // No user

      const event = order.addTimelineEvent('order.created', null, request);

      assert.strictEqual(event.performedBy, null);
      assert.strictEqual(event.metadata?.actorRole || event.metadata.get?.('actorRole'), 'guest');
      assert.strictEqual(event.description, 'Guest');
    });
  });

  describe('Auto-trimming', () => {
    it('should trim old events when limit is reached', async () => {
      const customerId = new mongoose.Types.ObjectId();
      const order = new Order({
        customerId,
        total: 100,
        status: 'pending',
      });

      // Add 7 events (limit is 5)
      for (let i = 0; i < 7; i++) {
        order.addTimelineEvent('order.updated', `Update ${i}`);
        // Small delay to ensure different timestamps
        await new Promise(resolve => setTimeout(resolve, 10));
      }

      const updateEvents = order.timeline.filter(e => e.event === 'order.updated');
      assert.strictEqual(updateEvents.length, 5, 'Should keep only 5 most recent events');

      // Verify we kept the latest events
      const descriptions = updateEvents.map(e => e.description);
      assert.ok(descriptions.includes('Update 6'), 'Should keep latest event');
      assert.ok(descriptions.includes('Update 5'), 'Should keep latest event');
      assert.ok(!descriptions.includes('Update 0'), 'Should remove oldest event');
      assert.ok(!descriptions.includes('Update 1'), 'Should remove oldest event');
    });

    it('should trim different event types independently', async () => {
      const customerId = new mongoose.Types.ObjectId();
      const order = new Order({
        customerId,
        total: 100,
        status: 'pending',
      });

      // Add multiple event types
      order.addTimelineEvent('order.created', 'Created');

      for (let i = 0; i < 7; i++) {
        order.addTimelineEvent('order.updated', `Update ${i}`);
        await new Promise(resolve => setTimeout(resolve, 5));
      }

      for (let i = 0; i < 12; i++) {
        order.addTimelineEvent('payment.completed', `Payment ${i}`);
        await new Promise(resolve => setTimeout(resolve, 5));
      }

      const createdEvents = order.timeline.filter(e => e.event === 'order.created');
      const updateEvents = order.timeline.filter(e => e.event === 'order.updated');
      const paymentEvents = order.timeline.filter(e => e.event === 'payment.completed');

      assert.strictEqual(createdEvents.length, 1, 'Created event has no limit');
      assert.strictEqual(updateEvents.length, 5, 'Update events limited to 5');
      assert.strictEqual(paymentEvents.length, 10, 'Payment events limited to 10');
    });
  });

  describe('Query Methods', () => {
    it('should get timeline events by type', async () => {
      const customerId = new mongoose.Types.ObjectId();
      const order = new Order({
        customerId,
        total: 100,
        status: 'pending',
      });

      order.addTimelineEvent('order.created', 'Created');
      order.addTimelineEvent('order.updated', 'Updated');
      order.addTimelineEvent('order.updated', 'Updated again');

      const updateEvents = order.getTimelineEventsByType('order.updated');

      assert.strictEqual(updateEvents.length, 2);
      assert.ok(updateEvents.every(e => e.event === 'order.updated'));
    });

    it('should get timeline events by actor', async () => {
      const customerId = new mongoose.Types.ObjectId();
      const userId = new mongoose.Types.ObjectId();

      const order = new Order({
        customerId,
        total: 100,
        status: 'pending',
      });

      order.addTimelineEvent('order.created', 'System created');

      const request = {
        user: { _id: userId, role: 'customer' },
      };

      order.addTimelineEvent('order.updated', 'Customer updated', request);

      const customerEvents = order.getTimelineEventsByActor('customer');

      assert.strictEqual(customerEvents.length, 1);
      assert.strictEqual(customerEvents[0].event, 'order.updated');
    });

    it('should check if timeline has specific event', async () => {
      const customerId = new mongoose.Types.ObjectId();
      const order = new Order({
        customerId,
        total: 100,
        status: 'pending',
      });

      order.addTimelineEvent('order.created', 'Created');

      assert.strictEqual(order.hasTimelineEvent('order.created'), true);
      assert.strictEqual(order.hasTimelineEvent('order.cancelled'), false);
    });

    it('should get latest timeline event', async () => {
      const customerId = new mongoose.Types.ObjectId();
      const order = new Order({
        customerId,
        total: 100,
        status: 'pending',
      });

      order.addTimelineEvent('order.created', 'Created');
      await new Promise(resolve => setTimeout(resolve, 10));
      order.addTimelineEvent('order.updated', 'Updated');

      const latest = order.getLatestTimelineEvent();

      assert.strictEqual(latest.event, 'order.updated');
      assert.strictEqual(latest.description, 'Updated');
    });
  });

  describe('Persistence', () => {
    it('should persist timeline events to database', async () => {
      const customerId = new mongoose.Types.ObjectId();
      const order = new Order({
        customerId,
        total: 100,
        status: 'pending',
      });

      order.addTimelineEvent('order.created', 'Created');
      order.addTimelineEvent('order.updated', 'Updated');

      await order.save();

      const savedOrder = await Order.findById(order._id);

      assert.strictEqual(savedOrder.timeline.length, 2);
      assert.strictEqual(savedOrder.timeline[0].event, 'order.created');
      assert.strictEqual(savedOrder.timeline[1].event, 'order.updated');
    });

    it('should maintain timeline across updates', async () => {
      const customerId = new mongoose.Types.ObjectId();
      const order = new Order({
        customerId,
        total: 100,
        status: 'pending',
      });

      order.addTimelineEvent('order.created', 'Created');
      await order.save();

      const foundOrder = await Order.findById(order._id);
      foundOrder.status = 'confirmed';
      foundOrder.addTimelineEvent('order.confirmed', 'Confirmed');
      await foundOrder.save();

      const updatedOrder = await Order.findById(order._id);

      assert.strictEqual(updatedOrder.timeline.length, 2);
      assert.strictEqual(updatedOrder.timeline[0].event, 'order.created');
      assert.strictEqual(updatedOrder.timeline[1].event, 'order.confirmed');
    });
  });
});
