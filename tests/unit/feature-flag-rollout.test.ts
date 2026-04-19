import { describe, expect, it } from 'vitest';
import { evaluateFeatureFlagRollout } from '../../src/modules/supporting/feature-flags/domain/rollout';
import type { FeatureFlag } from '../../src/modules/supporting/feature-flags';

function flag(overrides: Partial<FeatureFlag>): FeatureFlag {
  return {
    id: 'flag_1',
    organizationId: 'org_1',
    key: 'public-offer-v2',
    description: null,
    type: 'release',
    owner: 'Engineering',
    environment: 'production',
    enabled: true,
    rolloutMode: 'off',
    rolloutScope: {},
    expiresAt: null,
    createdBy: 'user_1',
    createdAt: '2026-04-19T00:00:00.000Z',
    updatedAt: '2026-04-19T00:00:00.000Z',
    ...overrides,
  };
}

describe('evaluateFeatureFlagRollout', () => {
  it('keeps disabled and expired flags off', () => {
    expect(evaluateFeatureFlagRollout(flag({ enabled: false }), {
      organizationId: 'org_1',
      key: 'public-offer-v2',
    }).enabled).toBe(false);

    const expired = evaluateFeatureFlagRollout(
      flag({ expiresAt: '2026-01-01T00:00:00.000Z', rolloutMode: 'on' }),
      { organizationId: 'org_1', key: 'public-offer-v2' },
      new Date('2026-04-19T00:00:00.000Z'),
    );
    expect(expired).toMatchObject({ enabled: false, reason: 'expired' });
  });

  it('supports explicit user allowlists', () => {
    const active = evaluateFeatureFlagRollout(flag({
      rolloutMode: 'users',
      rolloutScope: { userIds: ['user_2'] },
    }), {
      organizationId: 'org_1',
      key: 'public-offer-v2',
      userId: 'user_2',
    });

    const inactive = evaluateFeatureFlagRollout(flag({
      rolloutMode: 'users',
      rolloutScope: { userIds: ['user_2'] },
    }), {
      organizationId: 'org_1',
      key: 'public-offer-v2',
      userId: 'user_3',
    });

    expect(active).toMatchObject({ enabled: true, reason: 'users' });
    expect(inactive).toMatchObject({ enabled: false, reason: 'users' });
  });

  it('uses deterministic percentage buckets', () => {
    const input = { organizationId: 'org_1', key: 'public-offer-v2', contextKey: 'offer_123' };
    const first = evaluateFeatureFlagRollout(flag({
      rolloutMode: 'percentage',
      rolloutScope: { percentage: 50 },
    }), input);
    const second = evaluateFeatureFlagRollout(flag({
      rolloutMode: 'percentage',
      rolloutScope: { percentage: 50 },
    }), input);

    expect(first).toEqual(second);
    expect(evaluateFeatureFlagRollout(flag({
      rolloutMode: 'percentage',
      rolloutScope: { percentage: 100 },
    }), input).enabled).toBe(true);
    expect(evaluateFeatureFlagRollout(flag({
      rolloutMode: 'percentage',
      rolloutScope: { percentage: 0 },
    }), input).enabled).toBe(false);
  });
});
