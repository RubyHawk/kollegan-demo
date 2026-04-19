import { log as logAudit } from '@modules/supporting/audit';
import { featureFlagsRepository } from '../infrastructure/feature-flags.repository';
import type {
  CreateFeatureFlagInput,
  FeatureFlag,
  FeatureFlagAuditEvent,
  FeatureFlagEvaluation,
  FeatureFlagEvaluationInput,
  ListFeatureFlagsFilter,
  UpdateFeatureFlagInput,
} from '../domain/feature-flag.entity';
import { FEATURE_FLAG_AUDIT_ACTIONS } from '../domain/feature-flag.entity';
import { evaluateFeatureFlagRollout } from '../domain/rollout';

function serializeFlag(flag: FeatureFlag): Record<string, unknown> {
  return {
    id: flag.id,
    key: flag.key,
    description: flag.description,
    type: flag.type,
    owner: flag.owner,
    environment: flag.environment,
    enabled: flag.enabled,
    rolloutMode: flag.rolloutMode,
    rolloutScope: flag.rolloutScope,
    expiresAt: flag.expiresAt,
  };
}

function assertReleaseExpiry(input: Pick<CreateFeatureFlagInput, 'type' | 'expiresAt'>): void {
  if (input.type === 'release' && !input.expiresAt) {
    throw Object.assign(new Error('Release flags require an expiry date'), { code: 'RELEASE_FLAG_REQUIRES_EXPIRY' });
  }
}

async function appendAudit(
  flag: FeatureFlag,
  action: string,
  actorId: string | null | undefined,
  before: Record<string, unknown> | null,
  after: Record<string, unknown> | null,
  metadata?: Record<string, unknown> | null,
): Promise<void> {
  await featureFlagsRepository.appendAuditEvent({
    organizationId: flag.organizationId,
    featureFlagId: flag.id,
    actorId: actorId ?? null,
    action,
    before,
    after,
    metadata: metadata ?? null,
  });

  await logAudit({
    organizationId: flag.organizationId,
    actorId: actorId ?? null,
    action,
    resourceType: 'FeatureFlag',
    resourceId: flag.id,
    before,
    after,
    metadata: metadata ?? null,
  });
}

export async function listFeatureFlags(
  organizationId: string,
  filter: ListFeatureFlagsFilter,
): Promise<{ flags: FeatureFlag[]; total: number }> {
  return featureFlagsRepository.list(organizationId, filter);
}

export async function getFeatureFlag(id: string, organizationId: string): Promise<FeatureFlag | null> {
  return featureFlagsRepository.findById(id, organizationId);
}

export async function createFeatureFlag(
  input: CreateFeatureFlagInput,
  actorId?: string | null,
): Promise<FeatureFlag> {
  assertReleaseExpiry(input);
  const flag = await featureFlagsRepository.create(input);
  await appendAudit(
    flag,
    FEATURE_FLAG_AUDIT_ACTIONS.CREATED,
    actorId,
    null,
    serializeFlag(flag),
    { environment: flag.environment },
  );
  return flag;
}

export async function updateFeatureFlag(
  id: string,
  organizationId: string,
  input: UpdateFeatureFlagInput,
  actorId?: string | null,
): Promise<FeatureFlag | null> {
  const existing = await featureFlagsRepository.findById(id, organizationId);
  if (!existing) return null;

  const nextType = input.type ?? existing.type;
  const nextExpiresAt = input.expiresAt === undefined
    ? existing.expiresAt ? new Date(existing.expiresAt) : null
    : input.expiresAt;
  assertReleaseExpiry({ type: nextType, expiresAt: nextExpiresAt });

  const flag = await featureFlagsRepository.update(id, organizationId, input);
  if (!flag) return null;

  await appendAudit(
    flag,
    FEATURE_FLAG_AUDIT_ACTIONS.UPDATED,
    actorId,
    serializeFlag(existing),
    serializeFlag(flag),
    { environment: flag.environment },
  );
  return flag;
}

export async function deleteFeatureFlag(
  id: string,
  organizationId: string,
  actorId?: string | null,
): Promise<boolean> {
  const existing = await featureFlagsRepository.findById(id, organizationId);
  if (!existing) return false;

  const deleted = await featureFlagsRepository.softDelete(id, organizationId);
  if (!deleted) return false;

  await appendAudit(
    deleted,
    FEATURE_FLAG_AUDIT_ACTIONS.DELETED,
    actorId,
    serializeFlag(existing),
    serializeFlag(deleted),
    { environment: deleted.environment },
  );
  return true;
}

export async function evaluateFeatureFlag(input: FeatureFlagEvaluationInput): Promise<FeatureFlagEvaluation> {
  const environment = input.environment ?? 'production';
  const flag = await featureFlagsRepository.findByKey(input.key, input.organizationId, environment);

  if (!flag) return { key: input.key, enabled: false, reason: 'missing', flag: null };
  return evaluateFeatureFlagRollout(flag, { ...input, environment });
}

export async function listFeatureFlagAuditEvents(
  featureFlagId: string,
  organizationId: string,
  options: { limit?: number; offset?: number } = {},
): Promise<FeatureFlagAuditEvent[]> {
  return featureFlagsRepository.listAuditEvents(featureFlagId, organizationId, options);
}
