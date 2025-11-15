/**
 * Pre-built Event Types
 *
 * Common event types categorized by domain.
 * These are ready-to-use constants for beginners.
 *
 * @module mongoose-timeline-audit/event-types
 */

/**
 * Authentication & Security Events
 * Use these for user authentication, security, and access control
 */
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
};

/**
 * User Management Events
 * Use these for user account lifecycle
 */
export const USER_EVENTS = {
  CREATED: 'user.created',
  UPDATED: 'user.updated',
  DELETED: 'user.deleted',
  ACTIVATED: 'user.activated',
  DEACTIVATED: 'user.deactivated',
  SUSPENDED: 'user.suspended',
  ROLE_CHANGED: 'user.role.changed',
  PROFILE_UPDATED: 'user.profile.updated',
  EMAIL_VERIFIED: 'user.email.verified',
  PHONE_VERIFIED: 'user.phone.verified',
};

/**
 * Access Control Events
 * Use these for permissions and authorization
 */
export const ACCESS_EVENTS = {
  GRANTED: 'access.granted',
  REVOKED: 'access.revoked',
  PERMISSION_ADDED: 'access.permission.added',
  PERMISSION_REMOVED: 'access.permission.removed',
  ROLE_ASSIGNED: 'access.role.assigned',
  ROLE_REMOVED: 'access.role.removed',
};

/**
 * Data Events
 * Use these for CRUD operations on data
 */
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
};

/**
 * Payment & Transaction Events
 * Use these for financial operations
 */
export const PAYMENT_EVENTS = {
  INITIATED: 'payment.initiated',
  COMPLETED: 'payment.completed',
  FAILED: 'payment.failed',
  REFUNDED: 'payment.refunded',
  PARTIALLY_REFUNDED: 'payment.partially_refunded',
  DISPUTED: 'payment.disputed',
  VERIFIED: 'payment.verified',
};

/**
 * Subscription Events
 * Use these for subscription lifecycle
 */
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
};

/**
 * Order Events
 * Use these for order/purchase lifecycle
 */
export const ORDER_EVENTS = {
  CREATED: 'order.created',
  UPDATED: 'order.updated',
  CONFIRMED: 'order.confirmed',
  PROCESSING: 'order.processing',
  SHIPPED: 'order.shipped',
  DELIVERED: 'order.delivered',
  CANCELLED: 'order.cancelled',
  REFUNDED: 'order.refunded',
  FULFILLED: 'order.fulfilled',
  PAUSED: 'order.paused',
  RESUMED: 'order.resumed',
};

/**
 * Enrollment/Course Events
 * Use these for course/enrollment tracking
 */
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
};

/**
 * Admin Actions
 * Use these for administrative operations
 */
export const ADMIN_EVENTS = {
  CONFIG_CHANGED: 'admin.config.changed',
  FEATURE_ENABLED: 'admin.feature.enabled',
  FEATURE_DISABLED: 'admin.feature.disabled',
  MAINTENANCE_STARTED: 'admin.maintenance.started',
  MAINTENANCE_ENDED: 'admin.maintenance.ended',
  BACKUP_CREATED: 'admin.backup.created',
  BACKUP_RESTORED: 'admin.backup.restored',
  USER_IMPERSONATED: 'admin.user.impersonated',
};

/**
 * System Events
 * Use these for system-level operations
 */
export const SYSTEM_EVENTS = {
  CRON_EXECUTED: 'system.cron.executed',
  JOB_STARTED: 'system.job.started',
  JOB_COMPLETED: 'system.job.completed',
  JOB_FAILED: 'system.job.failed',
  EMAIL_SENT: 'system.email.sent',
  SMS_SENT: 'system.sms.sent',
  NOTIFICATION_SENT: 'system.notification.sent',
  WEBHOOK_TRIGGERED: 'system.webhook.triggered',
};

/**
 * All events combined
 * Useful for validation or autocomplete
 */
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
};

/**
 * Get suggested event limits for different event categories
 * @returns {Object} Suggested event limits
 */
export function getSuggestedEventLimits() {
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
