/**
 * Tests for helper modules
 * Testing config, event-types, and context-helpers
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  STANDARD_EVENT_LIMITS,
  MODEL_SPECIFIC_LIMITS,
  getEventLimitsForModel,
  getPluginConfig,
} from '../src/config.js';
import {
  AUTH_EVENTS,
  USER_EVENTS,
  PAYMENT_EVENTS,
  getSuggestedEventLimits,
  ALL_EVENTS,
} from '../src/event-types.js';
import {
  buildRequestContext,
  buildGeoContext,
  buildDeviceContext,
  buildSecurityContext,
  buildCustomContext,
} from '../src/context-helpers.js';

describe('Configuration Helpers', () => {
  describe('STANDARD_EVENT_LIMITS', () => {
    it('should have standard event limits defined', () => {
      assert.ok(typeof STANDARD_EVENT_LIMITS === 'object');
      assert.ok(STANDARD_EVENT_LIMITS['subscription.renewed'] > 0);
      assert.ok(STANDARD_EVENT_LIMITS['payment.completed'] > 0);
    });
  });

  describe('MODEL_SPECIFIC_LIMITS', () => {
    it('should have model-specific limits', () => {
      assert.ok(typeof MODEL_SPECIFIC_LIMITS === 'object');
      assert.ok(MODEL_SPECIFIC_LIMITS.Subscription);
      assert.ok(MODEL_SPECIFIC_LIMITS.Order);
      assert.ok(MODEL_SPECIFIC_LIMITS.Enrollment);
    });
  });

  describe('getEventLimitsForModel', () => {
    it('should return limits for Subscription model', () => {
      const limits = getEventLimitsForModel('Subscription');
      assert.ok(typeof limits === 'object');
      assert.ok(limits['subscription.renewed'] !== undefined);
      assert.ok(limits['payment.completed'] !== undefined);
    });

    it('should return limits for Order model', () => {
      const limits = getEventLimitsForModel('Order');
      assert.ok(typeof limits === 'object');
      assert.strictEqual(limits['order.created'], null); // null means keep all
      assert.ok(limits['payment.completed'] !== undefined);
    });

    it('should return standard limits for unknown model', () => {
      const limits = getEventLimitsForModel('UnknownModel');
      assert.deepStrictEqual(limits, STANDARD_EVENT_LIMITS);
    });
  });

  describe('getPluginConfig', () => {
    it('should return default config with no overrides', () => {
      const config = getPluginConfig('Order');
      assert.strictEqual(config.ownerField, 'customerId');
      assert.strictEqual(config.fieldName, 'timeline');
      assert.strictEqual(config.enabled, true);
      assert.ok(config.eventLimits);
    });

    it('should merge custom options', () => {
      const config = getPluginConfig('Order', {
        ownerField: 'userId',
        hideByDefault: true,
      });
      assert.strictEqual(config.ownerField, 'userId');
      assert.strictEqual(config.hideByDefault, true);
      assert.strictEqual(config.fieldName, 'timeline'); // Default preserved
    });

    it('should use model-specific limits', () => {
      const config = getPluginConfig('Subscription');
      assert.ok(config.eventLimits['subscription.renewed'] !== undefined);
    });
  });
});

describe('Event Types', () => {
  describe('Pre-built event constants', () => {
    it('should have AUTH_EVENTS as an object', () => {
      assert.ok(typeof AUTH_EVENTS === 'object');
      assert.ok(AUTH_EVENTS.LOGIN_SUCCESS);
      assert.ok(AUTH_EVENTS.LOGOUT);
    });

    it('should have USER_EVENTS as an object', () => {
      assert.ok(typeof USER_EVENTS === 'object');
      assert.ok(USER_EVENTS.CREATED);
      assert.ok(USER_EVENTS.UPDATED);
    });

    it('should have PAYMENT_EVENTS as an object', () => {
      assert.ok(typeof PAYMENT_EVENTS === 'object');
      assert.ok(PAYMENT_EVENTS.COMPLETED);
      assert.ok(PAYMENT_EVENTS.FAILED);
    });

    it('should have ALL_EVENTS', () => {
      assert.ok(typeof ALL_EVENTS === 'object');
      assert.ok(Object.keys(ALL_EVENTS).length > 0);
    });
  });

  describe('getSuggestedEventLimits', () => {
    it('should be a function', () => {
      assert.ok(typeof getSuggestedEventLimits === 'function');
    });
  });
});

describe('Context Helpers', () => {
  describe('buildRequestContext', () => {
    it('should build request context from Express-like request', () => {
      const req = {
        ip: '192.168.1.1',
        headers: {
          'user-agent': 'Mozilla/5.0',
        },
      };

      const context = buildRequestContext(req);

      assert.strictEqual(context.ip, '192.168.1.1');
      assert.strictEqual(context.userAgent, 'Mozilla/5.0');
    });

    it('should return null for null request', () => {
      const context = buildRequestContext(null);
      assert.strictEqual(context, null);
    });
  });

  describe('Other context helpers', () => {
    it('should export buildGeoContext', () => {
      assert.ok(typeof buildGeoContext === 'function');
    });

    it('should export buildDeviceContext', () => {
      assert.ok(typeof buildDeviceContext === 'function');
    });

    it('should export buildSecurityContext', () => {
      assert.ok(typeof buildSecurityContext === 'function');
    });

    it('should export buildCustomContext', () => {
      assert.ok(typeof buildCustomContext === 'function');
    });
  });
});
