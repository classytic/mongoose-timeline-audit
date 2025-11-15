/**
 * Mongoose Timeline Audit Plugin
 *
 * A reusable Mongoose plugin for comprehensive timeline/audit trail tracking.
 *
 * @module mongoose-timeline-audit
 * @version 1.0.0
 * @license MIT
 */

import timelineAuditPlugin, { resolveActor, getActorDescription, ACTOR_ROLES } from './src/plugin.js';
import {
  STANDARD_EVENT_LIMITS,
  MODEL_SPECIFIC_LIMITS,
  STANDARD_PLUGIN_CONFIG,
  getEventLimitsForModel,
  getPluginConfig,
} from './src/config.js';
import {
  AUTH_EVENTS,
  USER_EVENTS,
  ACCESS_EVENTS,
  DATA_EVENTS,
  PAYMENT_EVENTS,
  SUBSCRIPTION_EVENTS,
  ORDER_EVENTS,
  ENROLLMENT_EVENTS,
  ADMIN_EVENTS,
  SYSTEM_EVENTS,
  ALL_EVENTS,
  getSuggestedEventLimits,
} from './src/event-types.js';
import {
  buildRequestContext,
  buildGeoContext,
  buildDeviceContext,
  buildSecurityContext,
  buildCustomContext,
} from './src/context-helpers.js';

// Default export: the plugin itself
export default timelineAuditPlugin;

// Named exports: configuration utilities
export {
  // Plugin utilities
  resolveActor,
  getActorDescription,
  ACTOR_ROLES,

  // Configuration
  STANDARD_EVENT_LIMITS,
  MODEL_SPECIFIC_LIMITS,
  STANDARD_PLUGIN_CONFIG,
  getEventLimitsForModel,
  getPluginConfig,

  // Pre-built event types (beginner-friendly)
  AUTH_EVENTS,
  USER_EVENTS,
  ACCESS_EVENTS,
  DATA_EVENTS,
  PAYMENT_EVENTS,
  SUBSCRIPTION_EVENTS,
  ORDER_EVENTS,
  ENROLLMENT_EVENTS,
  ADMIN_EVENTS,
  SYSTEM_EVENTS,
  ALL_EVENTS,
  getSuggestedEventLimits,

  // Context helpers (optional - use only if needed)
  buildRequestContext,
  buildGeoContext,
  buildDeviceContext,
  buildSecurityContext,
  buildCustomContext,
};
