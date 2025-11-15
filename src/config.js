/**
 * Centralized Timeline Audit Configuration
 *
 * Defines standard event retention limits across all models.
 * Models can override these defaults if needed.
 *
 * @module mongoose-timeline-audit/config
 */

/**
 * Standard event retention limits
 * - null = keep all events (critical audit events)
 * - number = keep latest N events (repeating events)
 */
export const STANDARD_EVENT_LIMITS = {
  // Repeating events - auto-trim to latest N
  'subscription.renewed': 10,
  'subscription.renewal_initiated': 10,
  'payment.completed': 10,
  'payment.initiated': 10,
  'payment.failed': 5,
  'payment.refunded': 10,

  // Critical audit events - keep ALL (no limit)
  'order.created': null,
  'order.cancelled': null,
  'order.paused': null,
  'order.resumed': null,
  'order.fulfilled': null,
  'order.refunded': null,

  'enrollment.created': null,
  'enrollment.cancelled': null,
  'enrollment.paused': null,
  'enrollment.resumed': null,
  'enrollment.completed': null,

  'access.granted': null,
  'access.revoked': null,

  // Status changes - keep all
  'status.changed': null,
};

/**
 * Model-specific configurations
 * Use this to override standard limits for specific models
 */
export const MODEL_SPECIFIC_LIMITS = {
  Order: {
    ...STANDARD_EVENT_LIMITS,
    // Order-specific overrides (if any)
    // 'order.updated': 20,  // example override
  },

  Enrollment: {
    ...STANDARD_EVENT_LIMITS,
    // Enrollment-specific overrides (if any)
  },

  Subscription: {
    ...STANDARD_EVENT_LIMITS,
    // Subscription-specific overrides (if any)
  },
};

/**
 * Get event limits for a specific model
 * @param {string} modelName - Mongoose model name
 * @returns {Object} Event limits configuration
 */
export function getEventLimitsForModel(modelName) {
  return MODEL_SPECIFIC_LIMITS[modelName] || STANDARD_EVENT_LIMITS;
}

/**
 * Standard plugin configuration
 * Reusable across all models
 */
export const STANDARD_PLUGIN_CONFIG = {
  ownerField: 'customerId',
  fieldName: 'timeline',
  enabled: true,
  hideByDefault: false,  // Timeline visible by default (set to true to hide)
};

/**
 * Get full plugin configuration for a model
 * @param {string} modelName - Mongoose model name
 * @param {Object} overrides - Custom overrides
 * @returns {Object} Complete plugin configuration
 */
export function getPluginConfig(modelName, overrides = {}) {
  return {
    ...STANDARD_PLUGIN_CONFIG,
    eventLimits: getEventLimitsForModel(modelName),
    ...overrides,
  };
}
