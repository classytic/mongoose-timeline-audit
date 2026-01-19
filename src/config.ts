/**
 * Centralized Timeline Audit Configuration
 *
 * Defines standard event retention limits across all models.
 * Models can override these defaults if needed.
 *
 * @module mongoose-timeline-audit/config
 */

import type { EventLimits, TimelinePluginOptions } from './types.js';

// ============================================================================
// Standard Event Limits
// ============================================================================

/**
 * Standard event retention limits
 * - null = keep all events (critical audit events)
 * - number = keep latest N events (repeating events)
 */
export const STANDARD_EVENT_LIMITS: EventLimits = {
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

// ============================================================================
// Model-Specific Configuration
// ============================================================================

/**
 * Model-specific event limit configurations
 * Use this to override standard limits for specific models
 */
export const MODEL_SPECIFIC_LIMITS: Record<string, EventLimits> = {
  Order: {
    ...STANDARD_EVENT_LIMITS,
  },
  Enrollment: {
    ...STANDARD_EVENT_LIMITS,
  },
  Subscription: {
    ...STANDARD_EVENT_LIMITS,
  },
};

/**
 * Get event limits for a specific model
 *
 * @param modelName - Mongoose model name
 * @returns Event limits configuration
 *
 * @example
 * ```typescript
 * const limits = getEventLimitsForModel('Order');
 * ```
 */
export function getEventLimitsForModel(modelName: string): EventLimits {
  return MODEL_SPECIFIC_LIMITS[modelName] ?? STANDARD_EVENT_LIMITS;
}

// ============================================================================
// Standard Plugin Configuration
// ============================================================================

/**
 * Standard plugin configuration
 * Reusable across all models
 */
export const STANDARD_PLUGIN_CONFIG: Omit<TimelinePluginOptions, 'eventLimits'> = {
  ownerField: 'customerId',
  fieldName: 'timeline',
  enabled: true,
  hideByDefault: false,
};

/**
 * Get full plugin configuration for a model
 *
 * @param modelName - Mongoose model name
 * @param overrides - Custom configuration overrides
 * @returns Complete plugin configuration
 *
 * @example
 * ```typescript
 * const config = getPluginConfig('Order', { hideByDefault: true });
 * orderSchema.plugin(timelineAuditPlugin, config);
 * ```
 */
export function getPluginConfig(
  modelName: string,
  overrides: Partial<TimelinePluginOptions> = {}
): TimelinePluginOptions {
  return {
    ...STANDARD_PLUGIN_CONFIG,
    eventLimits: getEventLimitsForModel(modelName),
    ...overrides,
  };
}
