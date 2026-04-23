export type SharedFeatureFlagRolloutMode = 'off' | 'on' | 'percentage' | 'users';
export type SharedFeatureFlagEvaluationReason = 'missing' | 'disabled' | 'expired' | 'off' | 'on' | 'percentage' | 'users';

export interface SharedFeatureFlagLike {
  key: string;
  enabled: boolean;
  rolloutMode: SharedFeatureFlagRolloutMode;
  rolloutScope: {
    percentage?: number;
    userIds?: string[];
    [key: string]: unknown;
  };
  expiresAt: string | null;
  environment: string;
}

export interface SharedFeatureFlagEvaluationInput {
  organizationId: string;
  key: string;
  environment?: string;
  userId?: string | null;
  contextKey?: string | null;
}

function hashPercentage(input: string): number {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash >>> 0) % 100;
}

export function evaluateSharedFeatureFlagRollout<TFlag extends SharedFeatureFlagLike>(
  flag: TFlag,
  input: SharedFeatureFlagEvaluationInput,
  now = new Date(),
): {
  key: string;
  enabled: boolean;
  reason: SharedFeatureFlagEvaluationReason;
  flag: TFlag;
} {
  if (!flag.enabled) return { key: input.key, enabled: false, reason: 'disabled', flag };
  if (flag.expiresAt && new Date(flag.expiresAt).getTime() <= now.getTime()) {
    return { key: input.key, enabled: false, reason: 'expired', flag };
  }

  if (flag.rolloutMode === 'off') return { key: input.key, enabled: false, reason: 'off', flag };
  if (flag.rolloutMode === 'on') return { key: input.key, enabled: true, reason: 'on', flag };

  if (flag.rolloutMode === 'users') {
    const userIds = Array.isArray(flag.rolloutScope.userIds) ? flag.rolloutScope.userIds : [];
    const enabled = Boolean(input.userId && userIds.includes(input.userId));
    return { key: input.key, enabled, reason: 'users', flag };
  }

  const percentage = typeof flag.rolloutScope.percentage === 'number'
    ? Math.max(0, Math.min(100, flag.rolloutScope.percentage))
    : 0;
  const environment = input.environment ?? flag.environment;
  const bucketKey = input.contextKey ?? input.userId ?? `${input.organizationId}:${input.key}`;

  return {
    key: input.key,
    enabled: hashPercentage(`${environment}:${input.key}:${bucketKey}`) < percentage,
    reason: 'percentage',
    flag,
  };
}
