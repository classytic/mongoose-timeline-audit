/**
 * Mongoose Timeline Audit Plugin
 *
 * A reusable Mongoose plugin that adds timeline/audit trail tracking to any model.
 * Tracks WHO performed WHAT action and WHEN with automatic event trimming.
 *
 * @module mongoose-timeline-audit/plugin
 * @version 1.0.0
 * @license MIT
 *
 * @example
 * import timelineAuditPlugin from 'mongoose-timeline-audit';
 *
 * const orderSchema = new Schema({ ... });
 * orderSchema.plugin(timelineAuditPlugin, {
 *   ownerField: 'customerId',
 *   eventLimits: {
 *     'subscription.renewed': 10,
 *     'payment.completed': 10,
 *   }
 * });
 */

import mongoose from 'mongoose';

const { Schema } = mongoose;

/**
 * Common actor roles (for convenience, you can use custom roles too)
 */
export const ACTOR_ROLES = {
  CUSTOMER: 'customer',
  ADMIN: 'admin',
  SUPERADMIN: 'superadmin',
  GUEST: 'guest',
  SYSTEM: 'system',
};

/**
 * Default configuration
 */
const DEFAULT_CONFIG = {
  // Field name that identifies the entity owner (used for actor resolution)
  ownerField: 'customerId',

  // Timeline field name in schema
  fieldName: 'timeline',

  // Event retention limits (null = keep all)
  eventLimits: {},

  // Enable/disable timeline tracking
  enabled: true,

  // Hide timeline field by default (select: false)
  // Set to false to include timeline in queries by default
  hideByDefault: false,

  // Custom actor resolver function (optional)
  actorResolver: null,
};

/**
 * Timeline event schema
 */
function createTimelineSchema() {
  return new Schema({
    event: { type: String, required: true },
    description: { type: String },
    timestamp: { type: Date, default: Date.now },
    performedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    metadata: { type: Map, of: Schema.Types.Mixed },

    // Flexible context field (like Stripe/Facebook)
    // Store anything: { ip, userAgent, geo, device, etc. }
    context: { type: Schema.Types.Mixed },
  }, { _id: false });
}

/**
 * Default actor resolver
 * Determines WHO performed an action
 */
function defaultActorResolver(request, ownerId) {
  // Normalize entity owner ID to string
  const ownerIdStr = ownerId?.toString?.() || ownerId;

  // Scenario: No request = system action
  if (!request) {
    return {
      actorId: null,
      actorRole: 'system',
      metadata: { automated: true },
    };
  }

  const userId = request.user?._id?.toString() || request.user?.id?.toString();
  const userRole = request.user?.role;
  const contextCustomerId = request.context?.customerId?.toString();
  const contextOrgId = request.context?.organizationId?.toString();

  // Scenario: No authenticated user = guest
  if (!userId) {
    return {
      actorId: null,
      actorRole: 'guest',
      metadata: {},
    };
  }

  // Scenario: Superadmin
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

  // Scenario: Admin managing customer's entity
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

  // Scenario: Customer self-service (default)
  return {
    actorId: userId,
    actorRole: 'customer',
    metadata: { selfService: true },
  };
}

/**
 * Get human-readable actor description
 */
function getActorDescription(actor) {
  const roleLabels = {
    customer: 'Customer',
    admin: 'Admin',
    superadmin: 'Superadmin',
    guest: 'Guest',
    system: 'System',
  };

  const label = roleLabels[actor.actorRole] || 'Unknown';

  if (actor.metadata?.onBehalfOf) {
    return `${label} (on behalf of customer)`;
  }

  if (actor.metadata?.automated) {
    return `${label} (automated)`;
  }

  return label;
}

/**
 * Mongoose Timeline Audit Plugin
 *
 * @param {Schema} schema - Mongoose schema
 * @param {Object} options - Plugin configuration
 * @param {string} options.ownerField - Field name that identifies entity owner (default: 'customerId')
 * @param {string} options.fieldName - Timeline field name (default: 'timeline')
 * @param {Object} options.eventLimits - Event retention limits, e.g., { 'subscription.renewed': 10 }
 * @param {boolean} options.enabled - Enable/disable timeline (default: true)
 * @param {boolean} options.hideByDefault - Hide timeline field by default with select: false (default: false)
 * @param {Function} options.actorResolver - Custom actor resolver function
 */
export default function timelineAuditPlugin(schema, options = {}) {
  const config = { ...DEFAULT_CONFIG, ...options };

  if (!config.enabled) {
    return;
  }

  // Add timeline field to schema
  const timelineSchema = createTimelineSchema();
  const fieldDefinition = {
    [config.fieldName]: {
      type: [timelineSchema],
    },
  };

  // Only add select: false if hideByDefault is true
  if (config.hideByDefault) {
    fieldDefinition[config.fieldName].select = false;
  }

  schema.add(fieldDefinition);

  /**
   * Add timeline event (instance method)
   *
   * @param {string} event - Event type
   * @param {string|null} description - Human-readable description
   * @param {Object|null} request - Request object (for actor tracking)
   * @param {Object} additionalMetadata - Extra metadata
   * @param {Object} context - Optional context (geo, device, ip, etc.) - user provides
   * @returns {Object} Created timeline event
   */
  schema.methods.addTimelineEvent = function(event, description = null, request = null, additionalMetadata = {}, context = null) {
    const ownerId = this[config.ownerField];

    // Resolve actor
    const actorResolver = config.actorResolver || defaultActorResolver;
    const actor = actorResolver(request, ownerId);

    // Build timeline event
    const timelineEvent = {
      event,
      description: description || getActorDescription(actor),
      timestamp: new Date(),
      performedBy: actor.actorId || null,
      metadata: {
        actorRole: actor.actorRole,
        ...actor.metadata,
        ...additionalMetadata,
      },
      context: context || undefined,  // Only include if provided
    };

    // Initialize timeline array if needed
    if (!this[config.fieldName]) {
      this[config.fieldName] = [];
    }

    // Add event
    this[config.fieldName].push(timelineEvent);

    // Auto-trim if limit configured
    const limit = config.eventLimits[event];
    if (limit !== null && limit !== undefined) {
      const eventsOfType = this[config.fieldName].filter(e => e.event === event);

      if (eventsOfType.length > limit) {
        // Sort by timestamp (oldest first)
        eventsOfType.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

        // Calculate how many to remove
        const toRemove = eventsOfType.length - limit;

        // Get timestamps to remove
        const removeTimestamps = new Set(
          eventsOfType.slice(0, toRemove).map(e => e.timestamp.getTime())
        );

        // Filter out old events
        this[config.fieldName] = this[config.fieldName].filter(e =>
          e.event !== event || !removeTimestamps.has(e.timestamp.getTime())
        );
      }
    }

    return timelineEvent;
  };

  /**
   * Get timeline events filtered by actor role
   */
  schema.methods.getTimelineEventsByActor = function(actorRole) {
    if (!this[config.fieldName]) return [];
    return this[config.fieldName].filter(e => e.metadata?.get?.('actorRole') === actorRole);
  };

  /**
   * Get timeline events filtered by event type
   */
  schema.methods.getTimelineEventsByType = function(eventType) {
    if (!this[config.fieldName]) return [];
    return this[config.fieldName].filter(e => e.event === eventType);
  };

  /**
   * Check if timeline has specific event
   */
  schema.methods.hasTimelineEvent = function(eventType) {
    if (!this[config.fieldName]) return false;
    return this[config.fieldName].some(e => e.event === eventType);
  };

  /**
   * Get latest timeline event
   */
  schema.methods.getLatestTimelineEvent = function() {
    if (!this[config.fieldName] || this[config.fieldName].length === 0) return null;
    return this[config.fieldName][this[config.fieldName].length - 1];
  };

  /**
   * Static method: Configure event limits after plugin initialization
   */
  schema.statics.setTimelineEventLimits = function(limits) {
    Object.assign(config.eventLimits, limits);
  };
}

/**
 * Export actor resolver for standalone use
 */
export { defaultActorResolver as resolveActor, getActorDescription };
