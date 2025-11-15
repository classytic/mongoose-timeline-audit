# Mongoose Timeline Audit Plugin

A reusable Mongoose plugin that adds comprehensive timeline/audit trail tracking to any model.

## Features

✅ **Track WHO, WHAT, WHEN** - Complete audit trail with actor tracking
✅ **Auto-trimming** - Configurable event retention (keep latest N)
✅ **Actor Resolution** - Automatic detection of customer/admin/guest/system
✅ **Flexible visibility** - Timeline visible by default, optionally hide with `hideByDefault`
✅ **Framework-agnostic** - Works with any Node.js/Mongoose project
✅ **Stripe-style metadata** - Clean, structured event metadata
✅ **Zero dependencies** - Only requires Mongoose

## Installation

```bash
npm install mongoose-timeline-audit
```

```javascript
import timelineAuditPlugin from 'mongoose-timeline-audit';
```

## Basic Usage

```javascript
import mongoose from 'mongoose';
import timelineAuditPlugin from 'mongoose-timeline-audit';

const orderSchema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  status: String,
  // ... other fields
});

// Apply plugin
orderSchema.plugin(timelineAuditPlugin, {
  ownerField: 'customerId',
  eventLimits: {
    'subscription.renewed': 10,  // Keep latest 10 renewals
    'payment.completed': 10,      // Keep latest 10 payments
  }
});

const Order = mongoose.model('Order', orderSchema);
```

## Plugin Configuration

```javascript
schema.plugin(timelineAuditPlugin, {
  // Field name that identifies the entity owner
  ownerField: 'customerId',  // default: 'customerId'

  // Timeline field name in schema
  fieldName: 'timeline',  // default: 'timeline'

  // Event retention limits (null = keep all)
  eventLimits: {
    'subscription.renewed': 10,
    'payment.completed': 10,
    'payment.failed': 5,
    // Events not listed keep all records (critical audit events)
  },

  // Enable/disable timeline
  enabled: true,  // default: true

  // Hide timeline field by default (requires .select('+timeline') to query)
  hideByDefault: false,  // default: false (visible by default)

  // Custom actor resolver (advanced)
  actorResolver: customResolverFunction,  // default: built-in resolver
});
```

## Instance Methods

### addTimelineEvent(event, description, request, metadata)

Add a timeline event to the document.

```javascript
// Customer cancels their own order
order.addTimelineEvent(
  'order.cancelled',
  'Customer requested cancellation',
  request,  // Fastify/Express request object
  {
    immediate: true,
    refunded: true,
    refundAmount: 500,
  }
);

// Admin cancels order on behalf of customer
order.addTimelineEvent(
  'order.cancelled',
  'Admin cancelled due to policy violation',
  request,  // request.user.role = 'admin'
  { policyViolation: 'duplicate-order' }
);

// System automated action (cron job)
order.addTimelineEvent(
  'subscription.renewed',
  'Automatic renewal',
  null,  // null request = system action
  { renewalCount: 5 }
);
```

### getTimelineEventsByActor(actorRole)

Get events filtered by actor role.

```javascript
const adminActions = order.getTimelineEventsByActor('admin');
const customerActions = order.getTimelineEventsByActor('customer');
const systemActions = order.getTimelineEventsByActor('system');
```

### getTimelineEventsByType(eventType)

Get events filtered by event type.

```javascript
const cancellations = order.getTimelineEventsByType('order.cancelled');
const renewals = order.getTimelineEventsByType('subscription.renewed');
```

### hasTimelineEvent(eventType)

Check if timeline has specific event.

```javascript
if (order.hasTimelineEvent('order.cancelled')) {
  console.log('Order was cancelled at some point');
}
```

### getLatestTimelineEvent()

Get most recent timeline event.

```javascript
const latest = order.getLatestTimelineEvent();
console.log(`Last action: ${latest.event} by ${latest.metadata.actorRole}`);
```

## Timeline Event Structure

```javascript
{
  event: 'order.cancelled',
  description: 'Admin (on behalf of customer)',
  timestamp: Date('2025-01-16T10:30:00Z'),
  performedBy: ObjectId('507f1f77bcf86cd799439011'),  // User ID or null
  metadata: {
    actorRole: 'admin',
    onBehalfOf: '507f191e810c19729de860ea',
    organizationId: '507f1f77bcf86cd799439012',
    // Custom metadata
    immediate: true,
    refunded: true,
    refundAmount: 500,
  }
}
```

## Actor Detection

The plugin automatically detects WHO performed an action:

| Scenario | actorRole | actorId | metadata |
|----------|-----------|---------|----------|
| Customer self-service | `customer` | userId | `{ selfService: true }` |
| Admin on behalf | `admin` | userId | `{ onBehalfOf: customerId, organizationId }` |
| Superadmin | `superadmin` | userId | `{ platformAdmin: true, onBehalfOf: customerId }` |
| Guest checkout | `guest` | null | `{ ipAddress, userAgent }` |
| System/Cron | `system` | null | `{ automated: true }` |

## Workflow Example

```javascript
// workflows/cancel-order.workflow.js
export async function cancelOrderWorkflow(orderId, customerId, options = {}) {
  const { reason, immediate, request } = options;

  const order = await Order.findById(orderId);

  // ... business logic ...

  // Add timeline event with automatic actor tracking
  order.addTimelineEvent(
    'order.cancelled',
    immediate ? `Cancelled immediately: ${reason}` : `Cancellation scheduled: ${reason}`,
    request,  // Plugin auto-detects actor from request
    {
      immediate,
      reason,
    }
  );

  await order.save();

  return { order };
}
```

## Querying Timeline Events

```javascript
// Find orders cancelled by admin
const orders = await Order.find({
  'timeline.event': 'order.cancelled',
  'timeline.metadata.actorRole': 'admin',
});

// Find orders with system-automated renewals
const orders = await Order.find({
  'timeline.event': 'subscription.renewed',
  'timeline.metadata.automated': true,
});

// Timeline is included by default in queries
const order = await Order.findById(id);
console.log(order.timeline);

// If using hideByDefault: true, you need to explicitly select it
const orderWithTimeline = await Order.findById(id).select('+timeline');
```

## Auto-Trimming Behavior

Events with configured limits automatically keep only the latest N events:

```javascript
// Config: eventLimits: { 'subscription.renewed': 10 }

// After 15 renewals, timeline will only contain:
// - Latest 10 renewal events
// - All other event types (no limit)

// Critical audit events (cancellations, refunds) are ALWAYS kept
```

## Visibility Control

By default, the timeline field is **visible** and included in all queries. You can change this behavior:

### Hide Timeline by Default

If you want to exclude timeline from queries by default (for performance or security):

```javascript
orderSchema.plugin(timelineAuditPlugin, {
  ownerField: 'customerId',
  hideByDefault: true,  // Exclude timeline from queries by default
  eventLimits: { /* ... */ }
});

// Now you need to explicitly select timeline
const order = await Order.findById(id);  // timeline NOT included
const orderWithTimeline = await Order.findById(id).select('+timeline');  // included
```

### Keep Timeline Visible (Default)

```javascript
orderSchema.plugin(timelineAuditPlugin, {
  ownerField: 'customerId',
  hideByDefault: false,  // or omit this option (default)
  eventLimits: { /* ... */ }
});

// Timeline is always included
const order = await Order.findById(id);  // timeline included
console.log(order.timeline);
```

**When to use `hideByDefault: true`:**
- Large timeline arrays that impact query performance
- Sensitive audit data that should only be accessed explicitly
- API responses where timeline should be opt-in

**When to use `hideByDefault: false` (default):**
- Timeline is part of normal data flow
- You always need timeline data
- Simplicity - no need to remember `.select('+timeline')`

## Centralized Configuration

Use the provided configuration helpers to maintain DRY principles:

```javascript
import timelineAuditPlugin, { getPluginConfig } from 'mongoose-timeline-audit';

// Use centralized config for standard models
orderSchema.plugin(timelineAuditPlugin, getPluginConfig('Order'));
enrollmentSchema.plugin(timelineAuditPlugin, getPluginConfig('Enrollment'));

// Override for specific models if needed
specialSchema.plugin(timelineAuditPlugin, getPluginConfig('Special', {
  eventLimits: {
    'special.event': 50,  // Custom limit
  }
}));
```

## Custom Actor Resolver (Advanced)

```javascript
function customActorResolver(request, ownerId) {
  // Custom logic to determine actor
  return {
    actorId: 'custom-id',
    actorRole: 'custom-role',
    metadata: { customField: 'value' },
  };
}

schema.plugin(timelineAuditPlugin, {
  actorResolver: customActorResolver,
});
```

## License

MIT

## Contributing

PRs welcome! Please ensure:
- No breaking changes without major version bump
- Tests for new features
- Documentation updates
