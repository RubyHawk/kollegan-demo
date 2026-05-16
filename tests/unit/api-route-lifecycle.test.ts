import { describe, expect, it } from 'vitest';
import {
  API_ROUTE_LIFECYCLE_STATUSES,
  auditApiRouteLifecycle,
} from '../../scripts/lib/api-route-lifecycle.mjs';

const today = new Date('2026-05-16T00:00:00.000Z');

describe('api route lifecycle audit', () => {
  it('classifies a v1-only product family as canonical', () => {
    const audit = auditApiRouteLifecycle([
      'src/app/api/v1/offers/route.ts',
    ], [], today);

    expect(audit.counts).toMatchObject({
      canonicalV1: 1,
      removableDuplicates: 0,
    });
    expect(audit.families[0]?.status).toBe(API_ROUTE_LIFECYCLE_STATUSES.CANONICAL_V1);
  });

  it('blocks a duplicate legacy product route by default', () => {
    const audit = auditApiRouteLifecycle([
      'src/app/api/offers/route.ts',
      'src/app/api/v1/offers/route.ts',
    ], [], today);

    expect(audit.counts.removableDuplicates).toBe(1);
    expect(audit.families[0]?.status).toBe(API_ROUTE_LIFECYCLE_STATUSES.REMOVABLE_DUPLICATE);
  });

  it('rejects a legacy product route that has no canonical v1 replacement', () => {
    const audit = auditApiRouteLifecycle([
      'src/app/api/offers/route.ts',
    ], [], today);

    expect(audit.issues).toEqual([
      expect.objectContaining({ code: 'missing-canonical-route' }),
    ]);
    expect(audit.counts.removableDuplicates).toBe(1);
  });

  it('allows a duplicate only when it has a complete temporary overlap registration', () => {
    const audit = auditApiRouteLifecycle([
      'src/app/api/offers/route.ts',
      'src/app/api/v1/offers/route.ts',
    ], [{
      legacyPath: '/api/offers',
      canonicalPath: '/api/v1/offers',
      featureFlagKey: 'offers-v1-rollout',
      owner: 'Engineering lead',
      reason: 'Short-lived migration overlap during staged rollout.',
      expiresOn: '2026-06-01',
    }], today);

    expect(audit.issues).toEqual([]);
    expect(audit.counts).toMatchObject({
      temporaryRolloutOverlaps: 1,
      removableDuplicates: 0,
    });
    expect(audit.families[0]?.status).toBe(API_ROUTE_LIFECYCLE_STATUSES.TEMPORARY_ROLLOUT_OVERLAP);
  });

  it('rejects an expired temporary overlap registration', () => {
    const audit = auditApiRouteLifecycle([
      'src/app/api/offers/route.ts',
      'src/app/api/v1/offers/route.ts',
    ], [{
      legacyPath: '/api/offers',
      canonicalPath: '/api/v1/offers',
      featureFlagKey: 'offers-v1-rollout',
      owner: 'Engineering lead',
      reason: 'Short-lived migration overlap during staged rollout.',
      expiresOn: '2026-05-15',
    }], today);

    expect(audit.issues).toEqual([
      expect.objectContaining({ code: 'expired-overlap' }),
    ]);
    expect(audit.counts.removableDuplicates).toBe(1);
  });

  it('rejects an impossible temporary overlap expiry date', () => {
    const audit = auditApiRouteLifecycle([
      'src/app/api/offers/route.ts',
      'src/app/api/v1/offers/route.ts',
    ], [{
      legacyPath: '/api/offers',
      canonicalPath: '/api/v1/offers',
      featureFlagKey: 'offers-v1-rollout',
      owner: 'Engineering lead',
      reason: 'Short-lived migration overlap during staged rollout.',
      expiresOn: '2026-02-31',
    }], today);

    expect(audit.issues).toEqual([
      expect.objectContaining({ code: 'invalid-expiry' }),
    ]);
    expect(audit.counts.removableDuplicates).toBe(1);
  });
});
