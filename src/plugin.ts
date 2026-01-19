/**
 * Mongoose Timeline Audit Plugin
 *
 * A reusable Mongoose plugin that adds timeline/audit trail tracking to any model.
 * Tracks WHO performed WHAT action and WHEN with automatic event trimming.
 *
 * @module mongoose-timeline-audit/plugin
 * @license MIT
 *
 * @example
 * ```typescript
 * import { timelineAuditPlugin } from 'mongoose-timeline-audit';
 *
 * const orderSchema = new Schema({ ... });
 * orderSchema.plugin(timelineAuditPlugin, {
 *   ownerField: 'customerId',
 *   eventLimits: {
 *     'subscription.renewed': 10,
 *     'payment.completed': 10,
 *   }
 * });
 * ```
 */

import mongoose from 'mongoose';
import type {
  TimelinePluginOptions,
  TimelinePluginConfig,
  TimelineRequest,
  TimelineEvent,
  TimelineContext,
  Actor,
  ActorRole,
  EventLimits,
} from './types.js';

const { Schema } = mongoose;

// ============================================================================
// Constants
// ============================================================================

/** Common actor roles */
export const ACTOR_ROLES = {
  CUSTOMER: 'customer',
  ADMIN: 'admin',
  SUPERADMIN: 'superadmin',
  GUEST: 'guest',
  SYSTEM: 'system',
} as const;

/** Default plugin configuration */
const DEFAULT_CONFIG: TimelinePluginConfig = {
  ownerField: 'customerId',
  fieldName: 'timeline',
  eventLimits: {},
  enabled: true,
  hideByDefault: false,
  actorResolver: null,
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Create timeline event sub-schema
 */
function createTimelineSchema() {
  return new Schema(
    {
      event: { type: String, required: true },
      description: { type: String },
      timestamp: { type: Date, default: Date.now },
      performedBy: { type: Schema.Types.ObjectId, ref: 'User' },
      metadata: { type: Map, of: Schema.Types.Mixed },
      context: { type: Schema.Types.Mixed },
    },
    { _id: false }
  );
}

/**
 * Default actor resolver
 * Determines WHO performed an action based on request context
 */
export function defaultActorResolver(
  request: TimelineRequest | null,
  ownerId: mongoose.Types.ObjectId | string | null
): Actor {
  const ownerIdStr = ownerId?.toString?.() ?? String(ownerId ?? '');

  // No request = system action
  if (!request) {
    return {
      actorId: null,
      actorRole: 'system',
      metadata: { automated: true },
    };
  }

  const userId = request.user?._id?.toString() ?? request.user?.id?.toString();
  const userRole = request.user?.role;
  const contextCustomerId = request.context?.customerId?.toString();
  const contextOrgId = request.context?.organizationId?.toString();

  // No authenticated user = guest
  if (!userId) {
    return {
      actorId: null,
      actorRole: 'guest',
      metadata: {},
    };
  }

  // Superadmin
  if (userRole === 'superadmin') {
    return {
      actorId: userId,
      actorRole: 'superadmin',
      metadata: {
        platformAdmin: true,
        onBehalfOf: ownerIdStr,
      },
    };
  }

  // Admin managing customer's entity
  if (userRole === 'admin' && contextCustomerId && contextCustomerId !== ownerIdStr) {
    return {
      actorId: userId,
      actorRole: 'admin',
      metadata: {
        organizationId: contextOrgId,
        onBehalfOf: ownerIdStr,
      },
    };
  }

  // Customer self-service (default)
  return {
    actorId: userId,
    actorRole: 'customer',
    metadata: { selfService: true },
  };
}

/**
 * Get human-readable actor description
 */
export function getActorDescription(actor: Actor): string {
  const roleLabels: Record<string, string> = {
    customer: 'Customer',
    admin: 'Admin',
    superadmin: 'Superadmin',
    guest: 'Guest',
    system: 'System',
  };

  const label = roleLabels[actor.actorRole] ?? 'Unknown';

  if (actor.metadata?.onBehalfOf) {
    return `${label} (on behalf of customer)`;
  }

  if (actor.metadata?.automated) {
    return `${label} (automated)`;
  }

  return label;
}

// ============================================================================
// Main Plugin
// ============================================================================

/**
 * Mongoose Timeline Audit Plugin
 *
 * Adds timeline/audit trail tracking to any Mongoose schema.
 *
 * @param schema - Mongoose schema to extend
 * @param options - Plugin configuration options
 *
 * @example
 * ```typescript
 * import { timelineAuditPlugin } from 'mongoose-timeline-audit';
 *
 * const orderSchema = new Schema({
 *   customerId: { type: Schema.Types.ObjectId, ref: 'Customer' },
 *   status: String,
 * });
 *
 * orderSchema.plugin(timelineAuditPlugin, {
 *   ownerField: 'customerId',
 *   eventLimits: { 'order.updated': 20 },
 * });
 * ```
 */
export function timelineAuditPlugin(
  schema: mongoose.Schema,
  options: TimelinePluginOptions = {}
): void {
  const config: TimelinePluginConfig = { ...DEFAULT_CONFIG, ...options };

  if (!config.enabled) {
    return;
  }

  // Add timeline field to schema
  const timelineSchema = createTimelineSchema();

  const fieldConfig: { type: typeof timelineSchema[]; select?: boolean } = {
    type: [timelineSchema],
  };

  if (config.hideByDefault) {
    fieldConfig.select = false;
  }

  schema.add({
    [config.fieldName]: fieldConfig,
  } as mongoose.SchemaDefinition);

  // ─────────────────────────────────────────────────────────────────────────
  // Instance Methods
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Add timeline event to document
   */
  schema.methods.addTimelineEvent = function (
    this: mongoose.Document & Record<string, unknown>,
    event: string,
    description: string | null = null,
    request: TimelineRequest | null = null,
    additionalMetadata: Record<string, unknown> = {},
    context: TimelineContext | null = null
  ): TimelineEvent {
    const ownerId = this[config.ownerField] as mongoose.Types.ObjectId | string | null;

    // Resolve actor
    const actorResolver = config.actorResolver ?? defaultActorResolver;
    const actor = actorResolver(request, ownerId);

    // Build metadata as a Map for Mongoose
    const metadataMap = new Map<string, unknown>();
    metadataMap.set('actorRole', actor.actorRole);
    for (const [key, value] of Object.entries(actor.metadata)) {
      metadataMap.set(key, value);
    }
    for (const [key, value] of Object.entries(additionalMetadata)) {
      metadataMap.set(key, value);
    }

    // Build timeline event
    const timelineEvent: TimelineEvent = {
      event,
      description: description ?? getActorDescription(actor),
      timestamp: new Date(),
      performedBy: actor.actorId ? new mongoose.Types.ObjectId(actor.actorId) : null,
      metadata: metadataMap,
      context: context ?? undefined,
    };

    // Initialize timeline array if needed
    if (!this[config.fieldName]) {
      this[config.fieldName] = [];
    }

    // Add event using Mongoose's array push
    const timeline = this[config.fieldName] as mongoose.Types.DocumentArray<TimelineEvent>;
    timeline.push(timelineEvent);

    // Mark field as modified to ensure Mongoose tracks the change
    this.markModified(config.fieldName);

    // Auto-trim if limit configured
    const limit = config.eventLimits[event];
    if (limit !== null && limit !== undefined) {
      const eventsOfType = timeline.filter((e) => e.event === event);

      if (eventsOfType.length > limit) {
        // Sort by timestamp (oldest first)
        eventsOfType.sort(
          (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );

        // Calculate how many to remove
        const toRemove = eventsOfType.length - limit;

        // Get timestamps to remove
        const removeTimestamps = new Set(
          eventsOfType.slice(0, toRemove).map((e) => e.timestamp.getTime())
        );

        // Filter out old events and reassign
        this[config.fieldName] = timeline.filter(
          (e) => e.event !== event || !removeTimestamps.has(e.timestamp.getTime())
        );
        this.markModified(config.fieldName);
      }
    }

    return timelineEvent;
  };

  /**
   * Get timeline events filtered by actor role
   */
  schema.methods.getTimelineEventsByActor = function (
    this: mongoose.Document & Record<string, unknown>,
    actorRole: ActorRole
  ): TimelineEvent[] {
    const timeline = this[config.fieldName] as TimelineEvent[] | undefined;
    if (!timeline) return [];

    return timeline.filter((e) => {
      const metadata = e.metadata;
      if (metadata instanceof Map) {
        return metadata.get('actorRole') === actorRole;
      }
      return (metadata as Record<string, unknown>)?.actorRole === actorRole;
    });
  };

  /**
   * Get timeline events filtered by event type
   */
  schema.methods.getTimelineEventsByType = function (
    this: mongoose.Document & Record<string, unknown>,
    eventType: string
  ): TimelineEvent[] {
    const timeline = this[config.fieldName] as TimelineEvent[] | undefined;
    if (!timeline) return [];
    return timeline.filter((e) => e.event === eventType);
  };

  /**
   * Check if timeline has specific event
   */
  schema.methods.hasTimelineEvent = function (
    this: mongoose.Document & Record<string, unknown>,
    eventType: string
  ): boolean {
    const timeline = this[config.fieldName] as TimelineEvent[] | undefined;
    if (!timeline) return false;
    return timeline.some((e) => e.event === eventType);
  };

  /**
   * Get latest timeline event
   */
  schema.methods.getLatestTimelineEvent = function (
    this: mongoose.Document & Record<string, unknown>
  ): TimelineEvent | null {
    const timeline = this[config.fieldName] as TimelineEvent[] | undefined;
    if (!timeline || timeline.length === 0) return null;
    return timeline[timeline.length - 1];
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Static Methods
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Configure event limits after plugin initialization
   */
  schema.statics.setTimelineEventLimits = function (limits: EventLimits): void {
    Object.assign(config.eventLimits, limits);
  };
}

// Default export for convenience
export default timelineAuditPlugin;

// Re-export actor resolver for standalone use
export { defaultActorResolver as resolveActor };
