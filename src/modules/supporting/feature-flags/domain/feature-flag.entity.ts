export const FEATURE_FLAG_TYPES = ['release', 'kill_switch', 'experiment'] as const;
export const FEATURE_FLAG_ROLLOUT_MODES = ['off', 'on', 'percentage', 'users'] as const;

export type FeatureFlagType = typeof FEATURE_FLAG_TYPES[number];
export type FeatureFlagRolloutMode = typeof FEATURE_FLAG_ROLLOUT_MODES[number];

export interface FeatureFlagRolloutScope {
  percentage?: number;
  userIds?: string[];
  notes?: string;
  [key: string]: unknown;
}

export interface FeatureFlag {
  id: string;
  organizationId: string;
  key: string;
  description: string | null;
  type: FeatureFlagType;
  owner: string;
  environment: string;
  enabled: boolean;
  rolloutMode: FeatureFlagRolloutMode;
  rolloutScope: FeatureFlagRolloutScope;
  expiresAt: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FeatureFlagAuditEvent {
  id: string;
  organizationId: string;
  featureFlagId: string;
  actorId: string | null;
  action: string;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface CreateFeatureFlagInput {
  organizationId: string;
  key: string;
  description?: string | null;
  type: FeatureFlagType;
  owner: string;
  environment?: string;
  enabled?: boolean;
  rolloutMode?: FeatureFlagRolloutMode;
  rolloutScope?: FeatureFlagRolloutScope;
  expiresAt?: Date | null;
  createdBy?: string | null;
}

export interface UpdateFeatureFlagInput {
  description?: string | null;
  type?: FeatureFlagType;
  owner?: string;
  enabled?: boolean;
  rolloutMode?: FeatureFlagRolloutMode;
  rolloutScope?: FeatureFlagRolloutScope;
  expiresAt?: Date | null;
}

export interface FeatureFlagEvaluationInput {
  organizationId: string;
  key: string;
  environment?: string;
  userId?: string | null;
  contextKey?: string | null;
}

export interface FeatureFlagEvaluation {
  key: string;
  enabled: boolean;
  reason: 'missing' | 'disabled' | 'expired' | 'off' | 'on' | 'percentage' | 'users';
  flag: FeatureFlag | null;
}

export interface ListFeatureFlagsFilter {
  environment?: string;
  search?: string;
  includeExpired?: boolean;
  limit?: number;
  offset?: number;
}

export const FEATURE_FLAG_AUDIT_ACTIONS = {
  CREATED: 'feature_flag.created',
  UPDATED: 'feature_flag.updated',
  DELETED: 'feature_flag.deleted',
  EVALUATED: 'feature_flag.evaluated',
} as const;
