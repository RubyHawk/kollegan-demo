import { prisma } from '@platform/database/prisma';
import type {
  CreateFeatureFlagInput,
  FeatureFlag,
  FeatureFlagAuditEvent,
  FeatureFlagRolloutScope,
  ListFeatureFlagsFilter,
  UpdateFeatureFlagInput,
} from '../domain/feature-flag.entity';

function iso(value: unknown): string | null {
  return value ? (value as Date).toISOString() : null;
}

function scope(value: unknown): FeatureFlagRolloutScope {
  return (value ?? {}) as FeatureFlagRolloutScope;
}

function record(value: unknown): Record<string, unknown> | null {
  return (value ?? null) as Record<string, unknown> | null;
}

function mapFlag(row: Record<string, unknown>): FeatureFlag {
  return {
    id: row.id as string,
    organizationId: row.organizationId as string,
    key: row.key as string,
    description: (row.description as string | null) ?? null,
    type: row.type as FeatureFlag['type'],
    owner: row.owner as string,
    environment: row.environment as string,
    enabled: row.enabled as boolean,
    rolloutMode: row.rolloutMode as FeatureFlag['rolloutMode'],
    rolloutScope: scope(row.rolloutScope),
    expiresAt: iso(row.expiresAt),
    createdBy: (row.createdBy as string | null) ?? null,
    createdAt: (row.createdAt as Date).toISOString(),
    updatedAt: (row.updatedAt as Date).toISOString(),
  };
}

function mapAuditEvent(row: Record<string, unknown>): FeatureFlagAuditEvent {
  return {
    id: row.id as string,
    organizationId: row.organizationId as string,
    featureFlagId: row.featureFlagId as string,
    actorId: (row.actorId as string | null) ?? null,
    action: row.action as string,
    before: record(row.before),
    after: record(row.after),
    metadata: record(row.metadata),
    createdAt: (row.createdAt as Date).toISOString(),
  };
}

export const featureFlagsRepository = {
  async list(
    organizationId: string,
    filter: ListFeatureFlagsFilter,
  ): Promise<{ flags: FeatureFlag[]; total: number }> {
    const now = new Date();
    const where = {
      organizationId,
      deletedAt: null,
      ...(filter.environment ? { environment: filter.environment } : {}),
      ...(!filter.includeExpired ? { OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] } : {}),
      ...(filter.search ? {
        OR: [
          { key: { contains: filter.search, mode: 'insensitive' as const } },
          { owner: { contains: filter.search, mode: 'insensitive' as const } },
          { description: { contains: filter.search, mode: 'insensitive' as const } },
        ],
      } : {}),
    };

    const [rows, total] = await Promise.all([
      prisma.featureFlag.findMany({
        where,
        orderBy: [{ environment: 'asc' }, { key: 'asc' }],
        take: filter.limit ?? 50,
        skip: filter.offset ?? 0,
      }),
      prisma.featureFlag.count({ where }),
    ]);

    return { flags: (rows as unknown as Record<string, unknown>[]).map(mapFlag), total };
  },

  async findById(id: string, organizationId: string): Promise<FeatureFlag | null> {
    const row = await prisma.featureFlag.findFirst({ where: { id, organizationId, deletedAt: null } });
    return row ? mapFlag(row as unknown as Record<string, unknown>) : null;
  },

  async findByKey(key: string, organizationId: string, environment = 'production'): Promise<FeatureFlag | null> {
    const row = await prisma.featureFlag.findFirst({
      where: { key, organizationId, environment, deletedAt: null },
    });
    return row ? mapFlag(row as unknown as Record<string, unknown>) : null;
  },

  async create(input: CreateFeatureFlagInput): Promise<FeatureFlag> {
    const row = await prisma.featureFlag.create({
      data: {
        organizationId: input.organizationId,
        key: input.key,
        description: input.description ?? null,
        type: input.type,
        owner: input.owner,
        environment: input.environment ?? 'production',
        enabled: input.enabled ?? false,
        rolloutMode: input.rolloutMode ?? 'off',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        rolloutScope: (input.rolloutScope ?? {}) as any,
        expiresAt: input.expiresAt ?? null,
        createdBy: input.createdBy ?? null,
      },
    });
    return mapFlag(row as unknown as Record<string, unknown>);
  },

  async update(id: string, organizationId: string, input: UpdateFeatureFlagInput): Promise<FeatureFlag | null> {
    const existing = await prisma.featureFlag.findFirst({ where: { id, organizationId, deletedAt: null } });
    if (!existing) return null;

    const row = await prisma.featureFlag.update({
      where: { id },
      data: {
        ...(input.description !== undefined ? { description: input.description } : {}),
        ...(input.type !== undefined ? { type: input.type } : {}),
        ...(input.owner !== undefined ? { owner: input.owner } : {}),
        ...(input.enabled !== undefined ? { enabled: input.enabled } : {}),
        ...(input.rolloutMode !== undefined ? { rolloutMode: input.rolloutMode } : {}),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ...(input.rolloutScope !== undefined ? { rolloutScope: input.rolloutScope as any } : {}),
        ...(input.expiresAt !== undefined ? { expiresAt: input.expiresAt } : {}),
      },
    });

    return mapFlag(row as unknown as Record<string, unknown>);
  },

  async softDelete(id: string, organizationId: string): Promise<FeatureFlag | null> {
    const existing = await prisma.featureFlag.findFirst({ where: { id, organizationId, deletedAt: null } });
    if (!existing) return null;

    const row = await prisma.featureFlag.update({
      where: { id },
      data: { deletedAt: new Date(), enabled: false, rolloutMode: 'off' },
    });
    return mapFlag(row as unknown as Record<string, unknown>);
  },

  async appendAuditEvent(input: {
    organizationId: string;
    featureFlagId: string;
    actorId?: string | null;
    action: string;
    before?: Record<string, unknown> | null;
    after?: Record<string, unknown> | null;
    metadata?: Record<string, unknown> | null;
  }): Promise<FeatureFlagAuditEvent> {
    const row = await prisma.featureFlagAuditEvent.create({
      data: {
        organizationId: input.organizationId,
        featureFlagId: input.featureFlagId,
        actorId: input.actorId ?? null,
        action: input.action,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        before: (input.before ?? undefined) as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        after: (input.after ?? undefined) as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        metadata: (input.metadata ?? undefined) as any,
      },
    });
    return mapAuditEvent(row as unknown as Record<string, unknown>);
  },

  async listAuditEvents(
    featureFlagId: string,
    organizationId: string,
    options: { limit?: number; offset?: number } = {},
  ): Promise<FeatureFlagAuditEvent[]> {
    const rows = await prisma.featureFlagAuditEvent.findMany({
      where: { featureFlagId, organizationId },
      orderBy: { createdAt: 'desc' },
      take: options.limit ?? 50,
      skip: options.offset ?? 0,
    });
    return (rows as unknown as Record<string, unknown>[]).map(mapAuditEvent);
  },
};
