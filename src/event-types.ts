/**
 * Pre-built Event Types
 *
 * Common event types categorized by domain.
 * These are ready-to-use constants for type-safe event tracking.
 *
 * @module mongoose-timeline-audit/event-types
 */

import type { EventLimits } from './types.js';

// ============================================================================
// Authentication & Security Events
// ============================================================================

/** Authentication and security event types */
export const AUTH_EVENTS = {
  LOGIN_SUCCESS: 'auth.login.success',
  LOGIN_FAILED: 'auth.login.failed',
  LOGOUT: 'auth.logout',
  PASSWORD_CHANGED: 'auth.password.changed',
  PASSWORD_RESET_REQUESTED: 'auth.password.reset_requested',
  PASSWORD_RESET_COMPLETED: 'auth.password.reset_completed',
  TWO_FACTOR_ENABLED: 'auth.2fa.enabled',
  TWO_FACTOR_DISABLED: 'auth.2fa.disabled',
  SESSION_EXPIRED: 'auth.session.expired',
  TOKEN_REFRESHED: 'auth.token.refreshed',
} as const;

export type AuthEvent = (typeof AUTH_EVENTS)[keyof typeof AUTH_EVENTS];

// ============================================================================
// User Management Events
// ============================================================================

/** User account lifecycle event types */
export const USER_EVENTS = {
  REGISTERED: 'user.registered',
  CREATED: 'user.created',
  UPDATED: 'user.updated',
  DELETED: 'user.deleted',
  ACTIVATED: 'user.activated',
  DEACTIVATED: 'user.deactivated',
  SUSPENDED: 'user.suspended',
  ROLE_CHANGED: 'user.role_changed',
  PROFILE_UPDATED: 'user.profile_updated',
  EMAIL_VERIFIED: 'user.email_verified',
  PHONE_VERIFIED: 'user.phone_verified',
} as const;

export type UserEvent = (typeof USER_EVENTS)[keyof typeof USER_EVENTS];

// ============================================================================
// Access Control Events
// ============================================================================

/** Permission and authorization event types */
export const ACCESS_EVENTS = {
  GRANTED: 'access.granted',
  REVOKED: 'access.revoked',
  PERMISSION_ADDED: 'access.permission.added',
  PERMISSION_REMOVED: 'access.permission.removed',
  ROLE_ASSIGNED: 'access.role.assigned',
  ROLE_REMOVED: 'access.role.removed',
} as const;

export type AccessEvent = (typeof ACCESS_EVENTS)[keyof typeof ACCESS_EVENTS];

// ============================================================================
// Data Events
// ============================================================================

/** CRUD operation event types */
export const DATA_EVENTS = {
  CREATED: 'data.created',
  UPDATED: 'data.updated',
  DELETED: 'data.deleted',
  RESTORED: 'data.restored',
  ARCHIVED: 'data.archived',
  EXPORTED: 'data.exported',
  IMPORTED: 'data.imported',
  BULK_UPDATED: 'data.bulk_updated',
  BULK_DELETED: 'data.bulk_deleted',
} as const;

export type DataEvent = (typeof DATA_EVENTS)[keyof typeof DATA_EVENTS];

// ============================================================================
// Payment & Transaction Events
// ============================================================================

/** Financial operation event types */
export const PAYMENT_EVENTS = {
  INITIATED: 'payment.initiated',
  COMPLETED: 'payment.completed',
  FAILED: 'payment.failed',
  REFUNDED: 'payment.refunded',
  PARTIALLY_REFUNDED: 'payment.partially_refunded',
  DISPUTED: 'payment.disputed',
  VERIFIED: 'payment.verified',
} as const;

export type PaymentEvent = (typeof PAYMENT_EVENTS)[keyof typeof PAYMENT_EVENTS];

// ============================================================================
// Subscription Events
// ============================================================================

/** Subscription lifecycle event types */
export const SUBSCRIPTION_EVENTS = {
  CREATED: 'subscription.created',
  ACTIVATED: 'subscription.activated',
  RENEWED: 'subscription.renewed',
  CANCELLED: 'subscription.cancelled',
  PAUSED: 'subscription.paused',
  RESUMED: 'subscription.resumed',
  EXPIRED: 'subscription.expired',
  UPGRADED: 'subscription.upgraded',
  DOWNGRADED: 'subscription.downgraded',
  RENEWAL_FAILED: 'subscription.renewal_failed',
} as const;

export type SubscriptionEvent = (typeof SUBSCRIPTION_EVENTS)[keyof typeof SUBSCRIPTION_EVENTS];

// ============================================================================
// Order Events
// ============================================================================

/** Order/purchase lifecycle event types */
export const ORDER_EVENTS = {
  CREATED: 'order.created',
  UPDATED: 'order.updated',
  CONFIRMED: 'order.confirmed',
  PROCESSING: 'order.processing',
  SHIPPED: 'order.shipped',
  DELIVERED: 'order.delivered',
  CANCELLED: 'order.cancelled',
  COMPLETED: 'order.completed',
  REFUNDED: 'order.refunded',
  FULFILLED: 'order.fulfilled',
  PAUSED: 'order.paused',
  RESUMED: 'order.resumed',
  STATUS_CHANGED: 'order.status_changed',
  PAYMENT_RECEIVED: 'order.payment_received',
  PAYMENT_FAILED: 'order.payment_failed',
} as const;

export type OrderEvent = (typeof ORDER_EVENTS)[keyof typeof ORDER_EVENTS];

// ============================================================================
// Enrollment/Course Events
// ============================================================================

/** Course/enrollment tracking event types */
export const ENROLLMENT_EVENTS = {
  CREATED: 'enrollment.created',
  STARTED: 'enrollment.started',
  PAUSED: 'enrollment.paused',
  RESUMED: 'enrollment.resumed',
  COMPLETED: 'enrollment.completed',
  CANCELLED: 'enrollment.cancelled',
  LESSON_COMPLETED: 'enrollment.lesson.completed',
  QUIZ_COMPLETED: 'enrollment.quiz.completed',
  CERTIFICATE_ISSUED: 'enrollment.certificate.issued',
} as const;

export type EnrollmentEvent = (typeof ENROLLMENT_EVENTS)[keyof typeof ENROLLMENT_EVENTS];

// ============================================================================
// Admin Events
// ============================================================================

/** Administrative operation event types */
export const ADMIN_EVENTS = {
  CONFIG_CHANGED: 'admin.config.changed',
  FEATURE_ENABLED: 'admin.feature.enabled',
  FEATURE_DISABLED: 'admin.feature.disabled',
  MAINTENANCE_STARTED: 'admin.maintenance.started',
  MAINTENANCE_ENDED: 'admin.maintenance.ended',
  BACKUP_CREATED: 'admin.backup.created',
  BACKUP_RESTORED: 'admin.backup.restored',
  USER_IMPERSONATED: 'admin.user.impersonated',
} as const;

export type AdminEvent = (typeof ADMIN_EVENTS)[keyof typeof ADMIN_EVENTS];

// ============================================================================
// System Events
// ============================================================================

/** System-level operation event types */
export const SYSTEM_EVENTS = {
  MAINTENANCE_START: 'system.maintenance_start',
  MAINTENANCE_END: 'system.maintenance_end',
  DATA_MIGRATED: 'system.data_migrated',
  CRON_EXECUTED: 'system.cron_executed',
  JOB_STARTED: 'system.job_started',
  JOB_COMPLETED: 'system.job_completed',
  JOB_FAILED: 'system.job_failed',
  EMAIL_SENT: 'system.email_sent',
  SMS_SENT: 'system.sms_sent',
  NOTIFICATION_SENT: 'system.notification_sent',
  WEBHOOK_TRIGGERED: 'system.webhook_triggered',
} as const;

export type SystemEvent = (typeof SYSTEM_EVENTS)[keyof typeof SYSTEM_EVENTS];

// ============================================================================
// Combined Types
// ============================================================================

/** All event types combined */
export const ALL_EVENTS = {
  ...AUTH_EVENTS,
  ...USER_EVENTS,
  ...ACCESS_EVENTS,
  ...DATA_EVENTS,
  ...PAYMENT_EVENTS,
  ...SUBSCRIPTION_EVENTS,
  ...ORDER_EVENTS,
  ...ENROLLMENT_EVENTS,
  ...ADMIN_EVENTS,
  ...SYSTEM_EVENTS,
} as const;

/** Union type of all event strings */
export type AnyEvent =
  | AuthEvent
  | UserEvent
  | AccessEvent
  | DataEvent
  | PaymentEvent
  | SubscriptionEvent
  | OrderEvent
  | EnrollmentEvent
  | AdminEvent
  | SystemEvent;

// ============================================================================
// Suggested Event Limits
// ============================================================================

/**
 * Get suggested event limits for different event categories
 *
 * @returns Recommended event retention limits
 *
 * @example
 * ```typescript
 * const limits = getSuggestedEventLimits();
 * orderSchema.plugin(timelineAuditPlugin, { eventLimits: limits });
 * ```
 */
export function getSuggestedEventLimits(): EventLimits {
  return {
    // Authentication events - keep limited recent history
    [AUTH_EVENTS.LOGIN_SUCCESS]: 20,
    [AUTH_EVENTS.LOGIN_FAILED]: 10,
    [AUTH_EVENTS.LOGOUT]: 10,

    // Password events - keep all for security
    [AUTH_EVENTS.PASSWORD_CHANGED]: null,
    [AUTH_EVENTS.PASSWORD_RESET_REQUESTED]: null,
    [AUTH_EVENTS.PASSWORD_RESET_COMPLETED]: null,

    // 2FA events - keep all for security
    [AUTH_EVENTS.TWO_FACTOR_ENABLED]: null,
    [AUTH_EVENTS.TWO_FACTOR_DISABLED]: null,

    // Payment events - keep limited recent history
    [PAYMENT_EVENTS.INITIATED]: 10,
    [PAYMENT_EVENTS.COMPLETED]: 10,
    [PAYMENT_EVENTS.FAILED]: 5,

    // Payment critical events - keep all for compliance
    [PAYMENT_EVENTS.REFUNDED]: null,
    [PAYMENT_EVENTS.DISPUTED]: null,

    // Subscription events - keep recent renewals only
    [SUBSCRIPTION_EVENTS.RENEWED]: 10,
    [SUBSCRIPTION_EVENTS.RENEWAL_FAILED]: 5,

    // Subscription critical events - keep all
    [SUBSCRIPTION_EVENTS.CREATED]: null,
    [SUBSCRIPTION_EVENTS.CANCELLED]: null,
    [SUBSCRIPTION_EVENTS.PAUSED]: null,
    [SUBSCRIPTION_EVENTS.RESUMED]: null,

    // Order critical events - keep all
    [ORDER_EVENTS.CREATED]: null,
    [ORDER_EVENTS.CANCELLED]: null,
    [ORDER_EVENTS.REFUNDED]: null,
    [ORDER_EVENTS.FULFILLED]: null,

    // Access control - keep all for security
    [ACCESS_EVENTS.GRANTED]: null,
    [ACCESS_EVENTS.REVOKED]: null,
    [ACCESS_EVENTS.PERMISSION_ADDED]: null,
    [ACCESS_EVENTS.PERMISSION_REMOVED]: null,

    // Admin actions - keep all for audit
    [ADMIN_EVENTS.CONFIG_CHANGED]: null,
    [ADMIN_EVENTS.USER_IMPERSONATED]: null,

    // System events - keep limited
    [SYSTEM_EVENTS.EMAIL_SENT]: 20,
    [SYSTEM_EVENTS.SMS_SENT]: 20,
    [SYSTEM_EVENTS.NOTIFICATION_SENT]: 10,
  };
}
