/**
 * Mongoose Timeline Audit
 *
 * A comprehensive timeline and audit trail plugin for Mongoose.
 * Tracks WHO performed WHAT action and WHEN with automatic event trimming.
 *
 * @module mongoose-timeline-audit
 * @author Sadman Chowdhury (https://github.com/siam923)
 * @license MIT
 *
 * @example
 * ```typescript
 * import { timelineAuditPlugin, ORDER_EVENTS } from 'mongoose-timeline-audit';
 *
 * const orderSchema = new Schema({
 *   customerId: { type: Schema.Types.ObjectId, ref: 'Customer' },
 *   status: String,
 * });
 *
 * orderSchema.plugin(timelineAuditPlugin, {
 *   ownerField: 'customerId',
 *   eventLimits: {
 *     [ORDER_EVENTS.UPDATED]: 20,
 *   },
 * });
 *
 * // Later in your code
 * const order = await Order.findById(id);
 * order.addTimelineEvent(ORDER_EVENTS.CREATED, 'Order placed', req);
 * await order.save();
 * ```
 */

// Main plugin
export {
  timelineAuditPlugin,
  timelineAuditPlugin as default,
  ACTOR_ROLES,
  defaultActorResolver,
  resolveActor,
  getActorDescription,
} from './plugin.js';

// Configuration
export {
  STANDARD_EVENT_LIMITS,
  MODEL_SPECIFIC_LIMITS,
  STANDARD_PLUGIN_CONFIG,
  getEventLimitsForModel,
  getPluginConfig,
} from './config.js';

// Event types
export {
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
} from './event-types.js';

// Event type unions
export type {
  AuthEvent,
  UserEvent,
  AccessEvent,
  DataEvent,
  PaymentEvent,
  SubscriptionEvent,
  OrderEvent,
  EnrollmentEvent,
  AdminEvent,
  SystemEvent,
  AnyEvent,
} from './event-types.js';

// Context helpers
export {
  buildRequestContext,
  buildGeoContext,
  buildDeviceContext,
  buildSecurityContext,
  buildCustomContext,
} from './context-helpers.js';

// Types
export type {
  // Actor types
  ActorRole,
  Actor,
  RequestUser,
  RequestContext,
  TimelineRequest,
  ActorResolver,

  // Event types
  TimelineEvent,
  TimelineContext,
  GeoContext,
  DeviceContext,

  // Plugin configuration
  EventLimits,
  TimelinePluginOptions,
  TimelinePluginConfig,

  // Document extensions
  TimelineDocumentMethods,
  TimelineModelStatics,

  // Context builder options
  SecurityContextOptions,
} from './types.js';
