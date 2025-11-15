/**
 * Context Helpers
 *
 * Optional utilities for building context objects.
 * Users can use these or create their own context.
 *
 * @module mongoose-timeline-audit/context-helpers
 */

/**
 * Build basic context from request (optional helper)
 * Only use when you actually need IP/user-agent tracking
 *
 * @param {Object} request - Request object
 * @returns {Object} Context object
 *
 * @example
 * import { buildRequestContext } from 'mongoose-timeline-audit';
 *
 * order.addTimelineEvent(
 *   'order.cancelled',
 *   'Order cancelled',
 *   req,
 *   { reason: 'fraud' },
 *   buildRequestContext(req)  // Optional context
 * );
 */
export function buildRequestContext(request) {
  if (!request) return null;

  return {
    ip: request.ip || request.headers?.['x-forwarded-for'] || request.connection?.remoteAddress,
    userAgent: request.headers?.['user-agent'],
  };
}

/**
 * Build context with geo-location
 * Use when you need geo-tracking (security, compliance)
 *
 * @param {Object} request - Request object
 * @param {Object} geo - Geo-location data { country, city, lat, lon }
 * @returns {Object} Context object
 *
 * @example
 * import { buildGeoContext } from 'mongoose-timeline-audit';
 *
 * const geo = await getGeoFromIP(req.ip);
 *
 * user.addTimelineEvent(
 *   'auth.login.success',
 *   'User logged in',
 *   req,
 *   {},
 *   buildGeoContext(req, geo)
 * );
 */
export function buildGeoContext(request, geo = null) {
  const context = buildRequestContext(request) || {};

  if (geo) {
    context.geo = {
      country: geo.country,
      city: geo.city,
      lat: geo.lat,
      lon: geo.lon,
    };
  }

  return context;
}

/**
 * Build context with device information
 * Use for security tracking (like Apple/Google "new device login")
 *
 * @param {Object} request - Request object
 * @param {Object} device - Device data { type, os, browser, fingerprint }
 * @returns {Object} Context object
 *
 * @example
 * import { buildDeviceContext } from 'mongoose-timeline-audit';
 *
 * const device = parseUserAgent(req.headers['user-agent']);
 *
 * user.addTimelineEvent(
 *   'auth.login.success',
 *   'User logged in from new device',
 *   req,
 *   {},
 *   buildDeviceContext(req, device)
 * );
 */
export function buildDeviceContext(request, device = null) {
  const context = buildRequestContext(request) || {};

  if (device) {
    context.device = {
      type: device.type,        // 'mobile', 'desktop', 'tablet'
      os: device.os,            // 'iOS', 'Android', 'Windows', 'macOS'
      browser: device.browser,  // 'Chrome', 'Safari', 'Firefox'
      fingerprint: device.fingerprint,  // Device fingerprint hash
    };
  }

  return context;
}

/**
 * Build comprehensive security context
 * Use for high-security events (auth, payments, sensitive operations)
 *
 * @param {Object} request - Request object
 * @param {Object} options - Additional options
 * @param {Object} options.geo - Geo-location data
 * @param {Object} options.device - Device data
 * @param {string} options.sessionId - Session ID
 * @param {string} options.requestId - Request ID
 * @returns {Object} Context object
 *
 * @example
 * import { buildSecurityContext } from 'mongoose-timeline-audit';
 *
 * const context = buildSecurityContext(req, {
 *   geo: await getGeoFromIP(req.ip),
 *   device: parseUserAgent(req.headers['user-agent']),
 *   sessionId: req.session.id,
 *   requestId: req.id,
 * });
 *
 * user.addTimelineEvent('auth.password.changed', 'Password changed', req, {}, context);
 */
export function buildSecurityContext(request, options = {}) {
  const context = buildRequestContext(request) || {};

  if (options.geo) {
    context.geo = {
      country: options.geo.country,
      city: options.geo.city,
      lat: options.geo.lat,
      lon: options.lon,
    };
  }

  if (options.device) {
    context.device = {
      type: options.device.type,
      os: options.device.os,
      browser: options.device.browser,
      fingerprint: options.device.fingerprint,
    };
  }

  if (options.sessionId) {
    context.sessionId = options.sessionId;
  }

  if (options.requestId) {
    context.requestId = options.requestId;
  }

  return context;
}

/**
 * Build custom context
 * Maximum flexibility - store anything you want
 *
 * @param {Object} data - Any data you want to store
 * @returns {Object} Context object
 *
 * @example
 * import { buildCustomContext } from 'mongoose-timeline-audit';
 *
 * const context = buildCustomContext({
 *   source: 'mobile-app',
 *   appVersion: '2.1.0',
 *   platform: 'iOS',
 *   referrer: 'push-notification',
 *   campaignId: 'summer-sale-2025',
 *   customField: 'any-value',
 * });
 *
 * order.addTimelineEvent('order.created', 'Order created', req, {}, context);
 */
export function buildCustomContext(data) {
  return data || null;
}
