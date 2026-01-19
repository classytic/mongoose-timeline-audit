/**
 * Context Helpers
 *
 * Optional utilities for building context objects.
 * Users can use these or create their own context.
 *
 * @module mongoose-timeline-audit/context-helpers
 */

import type {
  TimelineRequest,
  TimelineContext,
  GeoContext,
  DeviceContext,
  SecurityContextOptions,
} from './types.js';

/**
 * Build basic context from request
 *
 * Only use when you need IP/user-agent tracking.
 *
 * @param request - Request object
 * @returns Context object with IP and user agent
 *
 * @example
 * ```typescript
 * import { buildRequestContext } from 'mongoose-timeline-audit';
 *
 * order.addTimelineEvent(
 *   'order.cancelled',
 *   'Order cancelled',
 *   req,
 *   { reason: 'fraud' },
 *   buildRequestContext(req)
 * );
 * ```
 */
export function buildRequestContext(request: TimelineRequest | null): TimelineContext | null {
  if (!request) return null;

  const forwardedFor = request.headers?.['x-forwarded-for'];
  const ip =
    request.ip ??
    (Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor) ??
    request.connection?.remoteAddress;

  const userAgent = request.headers?.['user-agent'];

  return {
    ip,
    userAgent: Array.isArray(userAgent) ? userAgent[0] : userAgent,
  };
}

/**
 * Build context with geo-location
 *
 * Use when you need geo-tracking (security, compliance).
 *
 * @param request - Request object
 * @param geo - Geo-location data
 * @returns Context object with IP, user agent, and geo
 *
 * @example
 * ```typescript
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
 * ```
 */
export function buildGeoContext(
  request: TimelineRequest | null,
  geo: GeoContext | null = null
): TimelineContext {
  const context = buildRequestContext(request) ?? {};

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
 *
 * Use for security tracking (like "new device login" alerts).
 *
 * @param request - Request object
 * @param device - Device data
 * @returns Context object with IP, user agent, and device info
 *
 * @example
 * ```typescript
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
 * ```
 */
export function buildDeviceContext(
  request: TimelineRequest | null,
  device: DeviceContext | null = null
): TimelineContext {
  const context = buildRequestContext(request) ?? {};

  if (device) {
    context.device = {
      type: device.type,
      os: device.os,
      browser: device.browser,
      fingerprint: device.fingerprint,
    };
  }

  return context;
}

/**
 * Build comprehensive security context
 *
 * Use for high-security events (auth, payments, sensitive operations).
 *
 * @param request - Request object
 * @param options - Additional security options
 * @returns Complete security context
 *
 * @example
 * ```typescript
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
 * ```
 */
export function buildSecurityContext(
  request: TimelineRequest | null,
  options: SecurityContextOptions = {}
): TimelineContext {
  const context = buildRequestContext(request) ?? {};

  if (options.geo) {
    context.geo = {
      country: options.geo.country,
      city: options.geo.city,
      lat: options.geo.lat,
      lon: options.geo.lon,
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
 *
 * Maximum flexibility - store anything you want.
 *
 * @param data - Any data you want to store
 * @returns Context object (or null if no data)
 *
 * @example
 * ```typescript
 * import { buildCustomContext } from 'mongoose-timeline-audit';
 *
 * const context = buildCustomContext({
 *   source: 'mobile-app',
 *   appVersion: '2.1.0',
 *   platform: 'iOS',
 *   referrer: 'push-notification',
 *   campaignId: 'summer-sale-2025',
 * });
 *
 * order.addTimelineEvent('order.created', 'Order created', req, {}, context);
 * ```
 */
export function buildCustomContext<T extends TimelineContext>(data: T | null): T | null {
  return data ?? null;
}
