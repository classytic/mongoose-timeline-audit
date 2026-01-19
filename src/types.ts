/**
 * Type Definitions for Mongoose Timeline Audit
 *
 * @module mongoose-timeline-audit/types
 */

import type { Types } from 'mongoose';

// ============================================================================
// Actor Types
// ============================================================================

/** Common actor roles */
export type ActorRole = 'customer' | 'admin' | 'superadmin' | 'guest' | 'system' | string;

/** Actor resolution result */
export interface Actor {
  actorId: string | null;
  actorRole: ActorRole;
  metadata: Record<string, unknown>;
}

/** User object from request */
export interface RequestUser {
  _id?: Types.ObjectId | string;
  id?: string;
  role?: string;
  [key: string]: unknown;
}

/** Request context */
export interface RequestContext {
  customerId?: Types.ObjectId | string;
  organizationId?: Types.ObjectId | string;
  [key: string]: unknown;
}

/** Request object (framework-agnostic) */
export interface TimelineRequest {
  user?: RequestUser;
  context?: RequestContext;
  ip?: string;
  headers?: Record<string, string | string[] | undefined>;
  connection?: { remoteAddress?: string };
  session?: { id?: string };
  id?: string;
}

/** Actor resolver function signature */
export type ActorResolver = (
  request: TimelineRequest | null,
  ownerId: Types.ObjectId | string | null
) => Actor;

// ============================================================================
// Timeline Event Types
// ============================================================================

/** Timeline event stored in document */
export interface TimelineEvent {
  event: string;
  description?: string;
  timestamp: Date;
  performedBy: Types.ObjectId | null;
  metadata?: Map<string, unknown> | Record<string, unknown>;
  context?: TimelineContext;
}

/** Timeline context (IP, device, geo, etc.) */
export interface TimelineContext {
  ip?: string;
  userAgent?: string;
  geo?: GeoContext;
  device?: DeviceContext;
  sessionId?: string;
  requestId?: string;
  [key: string]: unknown;
}

/** Geo-location context */
export interface GeoContext {
  country?: string;
  city?: string;
  lat?: number;
  lon?: number;
}

/** Device context */
export interface DeviceContext {
  type?: 'mobile' | 'desktop' | 'tablet' | string;
  os?: string;
  browser?: string;
  fingerprint?: string;
}

// ============================================================================
// Plugin Configuration
// ============================================================================

/** Event limits configuration */
export type EventLimits = Record<string, number | null>;

/** Plugin configuration options */
export interface TimelinePluginOptions {
  /** Field name that identifies the entity owner (default: 'customerId') */
  ownerField?: string;
  /** Timeline field name in schema (default: 'timeline') */
  fieldName?: string;
  /** Event retention limits (null = keep all) */
  eventLimits?: EventLimits;
  /** Enable/disable timeline tracking (default: true) */
  enabled?: boolean;
  /** Hide timeline field by default with select: false (default: false) */
  hideByDefault?: boolean;
  /** Custom actor resolver function */
  actorResolver?: ActorResolver | null;
}

/** Full resolved configuration */
export interface TimelinePluginConfig extends Required<Omit<TimelinePluginOptions, 'actorResolver'>> {
  actorResolver: ActorResolver | null;
}

// ============================================================================
// Document Extension Types
// ============================================================================

/** Methods added to documents by the plugin */
export interface TimelineDocumentMethods<TOwnerField extends string = 'customerId'> {
  /** Add a timeline event */
  addTimelineEvent(
    event: string,
    description?: string | null,
    request?: TimelineRequest | null,
    additionalMetadata?: Record<string, unknown>,
    context?: TimelineContext | null
  ): TimelineEvent;

  /** Get events filtered by actor role */
  getTimelineEventsByActor(actorRole: ActorRole): TimelineEvent[];

  /** Get events filtered by event type */
  getTimelineEventsByType(eventType: string): TimelineEvent[];

  /** Check if timeline has specific event */
  hasTimelineEvent(eventType: string): boolean;

  /** Get latest timeline event */
  getLatestTimelineEvent(): TimelineEvent | null;
}

/** Static methods added to model by the plugin */
export interface TimelineModelStatics {
  /** Configure event limits after plugin initialization */
  setTimelineEventLimits(limits: EventLimits): void;
}

// ============================================================================
// Security Context Builder Options
// ============================================================================

/** Options for building security context */
export interface SecurityContextOptions {
  geo?: GeoContext;
  device?: DeviceContext;
  sessionId?: string;
  requestId?: string;
}

// ============================================================================
// Re-exports for convenience
// ============================================================================

export type { Types };
