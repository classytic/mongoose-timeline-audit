/**
 * Type definitions for mongoose-timeline-audit
 * Mongoose plugin for comprehensive timeline and audit trail tracking
 */

import { Schema, Document, Model, Types } from 'mongoose';

// ============ PLUGIN TYPES ============

/** Common actor roles (you can use custom roles too) */
export type CommonActorRole = 'customer' | 'admin' | 'superadmin' | 'guest' | 'system';

export interface TimelinePluginOptions {
  /** Field name that identifies the entity owner (default: 'customerId') */
  ownerField?: string;

  /** Timeline field name in schema (default: 'timeline') */
  fieldName?: string;

  /** Event retention limits (null = keep all, number = keep latest N) */
  eventLimits?: Record<string, number | null>;

  /** Enable/disable timeline tracking (default: true) */
  enabled?: boolean;

  /** Hide timeline field by default (requires .select('+timeline')) (default: false) */
  hideByDefault?: boolean;

  /** Custom actor resolver function */
  actorResolver?: (request: any, ownerId: any) => ActorInfo;
}

export interface ActorInfo {
  /** User ID or null for system/guest */
  actorId: string | Types.ObjectId | null;

  /** Actor role - can be any string (common: 'customer', 'admin', 'superadmin', 'guest', 'system') */
  actorRole: string;

  /** Additional metadata about the actor */
  metadata: Record<string, any>;
}

export interface TimelineEvent {
  /** Event type (e.g., 'order.created', 'payment.completed') */
  event: string;

  /** Human-readable description */
  description?: string;

  /** Timestamp of the event */
  timestamp: Date;

  /** User ID who performed the action (null for system/guest) */
  performedBy: Types.ObjectId | null;

  /** Event metadata including actor role and custom fields */
  metadata: Map<string, any> | Record<string, any>;

  /** Optional context (IP, userAgent, geo, device, etc.) */
  context?: any;
}

// ============ DOCUMENT EXTENSIONS ============

export interface TimelineDocument extends Document {
  /** Timeline events array */
  timeline?: TimelineEvent[];

  /**
   * Add a timeline event
   * @param event Event type
   * @param description Human-readable description
   * @param request Request object (for actor tracking)
   * @param additionalMetadata Extra metadata
   * @param context Optional context (geo, device, ip, etc.)
   */
  addTimelineEvent(
    event: string,
    description?: string | null,
    request?: any | null,
    additionalMetadata?: Record<string, any>,
    context?: any | null
  ): TimelineEvent;

  /**
   * Get timeline events filtered by actor role
   * @param actorRole Actor role to filter by
   */
  getTimelineEventsByActor(actorRole: string): TimelineEvent[];

  /**
   * Get timeline events filtered by event type
   * @param eventType Event type to filter by
   */
  getTimelineEventsByType(eventType: string): TimelineEvent[];

  /**
   * Check if timeline has specific event
   * @param eventType Event type to check
   */
  hasTimelineEvent(eventType: string): boolean;

  /**
   * Get latest timeline event
   */
  getLatestTimelineEvent(): TimelineEvent | null;
}

export interface TimelineModel<T extends TimelineDocument> extends Model<T> {
  /**
   * Configure event limits after plugin initialization
   * @param limits Event limits configuration
   */
  setTimelineEventLimits(limits: Record<string, number | null>): void;
}

// ============ PLUGIN FUNCTION ============

/**
 * Mongoose Timeline Audit Plugin
 * @param schema Mongoose schema
 * @param options Plugin configuration
 */
export default function timelineAuditPlugin(
  schema: Schema,
  options?: TimelinePluginOptions
): void;

// ============ CONFIGURATION HELPERS ============

/** Standard event retention limits */
export const STANDARD_EVENT_LIMITS: Record<string, number | null>;

/** Model-specific event limits */
export const MODEL_SPECIFIC_LIMITS: Record<string, Record<string, number | null>>;

/** Standard plugin configuration */
export const STANDARD_PLUGIN_CONFIG: TimelinePluginOptions;

/**
 * Get event limits for a specific model
 * @param modelName Mongoose model name
 */
export function getEventLimitsForModel(modelName: string): Record<string, number | null>;

/**
 * Get full plugin configuration for a model
 * @param modelName Mongoose model name
 * @param overrides Custom overrides
 */
export function getPluginConfig(
  modelName: string,
  overrides?: Partial<TimelinePluginOptions>
): TimelinePluginOptions;

// ============ ACTOR UTILITIES ============

/** Common actor role constants for convenience */
export const ACTOR_ROLES: {
  CUSTOMER: 'customer';
  ADMIN: 'admin';
  SUPERADMIN: 'superadmin';
  GUEST: 'guest';
  SYSTEM: 'system';
};

/**
 * Default actor resolver
 * @param request Request object
 * @param ownerId Entity owner ID
 */
export function resolveActor(request: any, ownerId: any): ActorInfo;

/**
 * Get human-readable actor description
 * @param actor Actor information
 */
export function getActorDescription(actor: ActorInfo): string;

// ============ EVENT TYPES ============

/** Authentication & Security Events */
export const AUTH_EVENTS: {
  LOGIN_SUCCESS: 'auth.login.success';
  LOGIN_FAILED: 'auth.login.failed';
  LOGOUT: 'auth.logout';
  PASSWORD_CHANGED: 'auth.password.changed';
  PASSWORD_RESET_REQUESTED: 'auth.password.reset_requested';
  PASSWORD_RESET_COMPLETED: 'auth.password.reset_completed';
  TWO_FACTOR_ENABLED: 'auth.2fa.enabled';
  TWO_FACTOR_DISABLED: 'auth.2fa.disabled';
  SESSION_EXPIRED: 'auth.session.expired';
  TOKEN_REFRESHED: 'auth.token.refreshed';
};

/** User Management Events */
export const USER_EVENTS: {
  CREATED: 'user.created';
  UPDATED: 'user.updated';
  DELETED: 'user.deleted';
  ACTIVATED: 'user.activated';
  DEACTIVATED: 'user.deactivated';
  SUSPENDED: 'user.suspended';
  ROLE_CHANGED: 'user.role.changed';
  PROFILE_UPDATED: 'user.profile.updated';
  EMAIL_VERIFIED: 'user.email.verified';
  PHONE_VERIFIED: 'user.phone.verified';
};

/** Access Control Events */
export const ACCESS_EVENTS: {
  GRANTED: 'access.granted';
  REVOKED: 'access.revoked';
  PERMISSION_ADDED: 'access.permission.added';
  PERMISSION_REMOVED: 'access.permission.removed';
  ROLE_ASSIGNED: 'access.role.assigned';
  ROLE_REMOVED: 'access.role.removed';
};

/** Data Events */
export const DATA_EVENTS: {
  CREATED: 'data.created';
  UPDATED: 'data.updated';
  DELETED: 'data.deleted';
  RESTORED: 'data.restored';
  ARCHIVED: 'data.archived';
  EXPORTED: 'data.exported';
  IMPORTED: 'data.imported';
  BULK_UPDATED: 'data.bulk_updated';
  BULK_DELETED: 'data.bulk_deleted';
};

/** Payment Events */
export const PAYMENT_EVENTS: {
  INITIATED: 'payment.initiated';
  COMPLETED: 'payment.completed';
  FAILED: 'payment.failed';
  REFUNDED: 'payment.refunded';
  PARTIALLY_REFUNDED: 'payment.partially_refunded';
  DISPUTED: 'payment.disputed';
  VERIFIED: 'payment.verified';
};

/** Subscription Events */
export const SUBSCRIPTION_EVENTS: {
  CREATED: 'subscription.created';
  ACTIVATED: 'subscription.activated';
  RENEWED: 'subscription.renewed';
  CANCELLED: 'subscription.cancelled';
  PAUSED: 'subscription.paused';
  RESUMED: 'subscription.resumed';
  EXPIRED: 'subscription.expired';
  UPGRADED: 'subscription.upgraded';
  DOWNGRADED: 'subscription.downgraded';
  RENEWAL_FAILED: 'subscription.renewal_failed';
};

/** Order Events */
export const ORDER_EVENTS: {
  CREATED: 'order.created';
  UPDATED: 'order.updated';
  CONFIRMED: 'order.confirmed';
  PROCESSING: 'order.processing';
  SHIPPED: 'order.shipped';
  DELIVERED: 'order.delivered';
  CANCELLED: 'order.cancelled';
  REFUNDED: 'order.refunded';
  FULFILLED: 'order.fulfilled';
  PAUSED: 'order.paused';
  RESUMED: 'order.resumed';
};

/** Enrollment Events */
export const ENROLLMENT_EVENTS: {
  CREATED: 'enrollment.created';
  STARTED: 'enrollment.started';
  PAUSED: 'enrollment.paused';
  RESUMED: 'enrollment.resumed';
  COMPLETED: 'enrollment.completed';
  CANCELLED: 'enrollment.cancelled';
  LESSON_COMPLETED: 'enrollment.lesson.completed';
  QUIZ_COMPLETED: 'enrollment.quiz.completed';
  CERTIFICATE_ISSUED: 'enrollment.certificate.issued';
};

/** Admin Events */
export const ADMIN_EVENTS: {
  CONFIG_CHANGED: 'admin.config.changed';
  FEATURE_ENABLED: 'admin.feature.enabled';
  FEATURE_DISABLED: 'admin.feature.disabled';
  MAINTENANCE_STARTED: 'admin.maintenance.started';
  MAINTENANCE_ENDED: 'admin.maintenance.ended';
  BACKUP_CREATED: 'admin.backup.created';
  BACKUP_RESTORED: 'admin.backup.restored';
  USER_IMPERSONATED: 'admin.user.impersonated';
};

/** System Events */
export const SYSTEM_EVENTS: {
  CRON_EXECUTED: 'system.cron.executed';
  JOB_STARTED: 'system.job.started';
  JOB_COMPLETED: 'system.job.completed';
  JOB_FAILED: 'system.job.failed';
  EMAIL_SENT: 'system.email.sent';
  SMS_SENT: 'system.sms.sent';
  NOTIFICATION_SENT: 'system.notification.sent';
  WEBHOOK_TRIGGERED: 'system.webhook.triggered';
};

/** All events combined */
export const ALL_EVENTS: Record<string, string>;

/**
 * Get suggested event limits for event types
 */
export function getSuggestedEventLimits(): Record<string, number | null>;

// ============ CONTEXT HELPERS ============

/**
 * Build basic context from request
 * @param request Request object
 */
export function buildRequestContext(request: any): {
  ip?: string;
  userAgent?: string;
} | null;

/**
 * Build geo-location context
 * @param request Request object
 * @param geo Geo-location data
 */
export function buildGeoContext(request: any, geo?: any): any;

/**
 * Build device context from request
 * @param request Request object
 * @param device Device information
 */
export function buildDeviceContext(request: any, device?: any): any;

/**
 * Build security context
 * @param request Request object
 * @param options Additional options (geo, device, sessionId, requestId)
 */
export function buildSecurityContext(request: any, options?: {
  geo?: any;
  device?: any;
  sessionId?: string;
  requestId?: string;
}): any;

/**
 * Build custom context
 * @param data Any custom data to store
 */
export function buildCustomContext(data: any): any;

// ============ MODULE AUGMENTATION ============

declare module 'mongoose' {
  interface Schema {
    plugin(plugin: typeof timelineAuditPlugin, options?: TimelinePluginOptions): this;
  }
}
