import { apiDelete, apiGet, apiPatch, apiPost } from '../api-client';

const BASE_URL = '/api/v1/feature-flags';

interface ApiEnvelope<T> {
  data: T;
}

export type FeatureFlagType = 'release' | 'kill_switch' | 'experiment';
export type FeatureFlagRolloutMode = 'off' | 'on' | 'percentage' | 'users';

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

export interface FeatureFlagEvaluation {
  key: string;
  enabled: boolean;
  reason: 'missing' | 'disabled' | 'expired' | 'off' | 'on' | 'percentage' | 'users';
  flag: FeatureFlag | null;
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

export interface ListFeatureFlagsParams {
  environment?: string;
  search?: string;
  includeExpired?: boolean;
  limit?: number;
  offset?: number;
}

export interface CreateFeatureFlagPayload {
  key: string;
  description?: string | null;
  type?: FeatureFlagType;
  owner: string;
  environment?: string;
  enabled?: boolean;
  rolloutMode?: FeatureFlagRolloutMode;
  rolloutScope?: FeatureFlagRolloutScope;
  expiresAt?: string | null;
}

export type UpdateFeatureFlagPayload = Partial<Omit<CreateFeatureFlagPayload, 'key' | 'environment'>>;

function query(params: object): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

export async function listFeatureFlags(params: ListFeatureFlagsParams = {}) {
  const res = await apiGet<ApiEnvelope<{
    flags: FeatureFlag[];
    total: number;
    limit: number;
    offset: number;
  }>>(`${BASE_URL}${query(params)}`);
  return res.data;
}

export async function createFeatureFlag(payload: CreateFeatureFlagPayload): Promise<FeatureFlag> {
  const res = await apiPost<ApiEnvelope<{ flag: FeatureFlag }>>(BASE_URL, payload);
  return res.data.flag;
}

export async function getFeatureFlag(id: string): Promise<FeatureFlag> {
  const res = await apiGet<ApiEnvelope<{ flag: FeatureFlag }>>(`${BASE_URL}/${id}`);
  return res.data.flag;
}

export async function updateFeatureFlag(id: string, payload: UpdateFeatureFlagPayload): Promise<FeatureFlag> {
  const res = await apiPatch<ApiEnvelope<{ flag: FeatureFlag }>>(`${BASE_URL}/${id}`, payload);
  return res.data.flag;
}

export async function deleteFeatureFlag(id: string): Promise<void> {
  await apiDelete(`${BASE_URL}/${id}`);
}

export async function evaluateFeatureFlag(params: {
  key: string;
  environment?: string;
  contextKey?: string;
}): Promise<FeatureFlagEvaluation> {
  const res = await apiGet<ApiEnvelope<{ evaluation: FeatureFlagEvaluation }>>(
    `${BASE_URL}/evaluate${query(params)}`,
  );
  return res.data.evaluation;
}

export async function listFeatureFlagAuditEvents(
  id: string,
  params: { limit?: number; offset?: number } = {},
): Promise<{ events: FeatureFlagAuditEvent[]; limit: number; offset: number }> {
  const res = await apiGet<ApiEnvelope<{
    events: FeatureFlagAuditEvent[];
    limit: number;
    offset: number;
  }>>(`${BASE_URL}/${id}/audit${query(params)}`);
  return res.data;
}
