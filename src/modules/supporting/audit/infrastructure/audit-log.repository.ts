// ─── Audit log repository ─────────────────────────────────────────────────────
// CRITICAL: append-only. This repository must NEVER expose update or delete methods.

import { prisma } from '@platform/database/prisma';
import type { AuditLogEntry, CreateAuditLogInput } from '../domain/audit-log.entity';

export const auditLogRepository = {
  async append(input: CreateAuditLogInput): Promise<AuditLogEntry> {
    const raw = await prisma.auditLog.create({
      data: {
        organizationId: input.organizationId ?? null,
        actorId: input.actorId ?? null,
        actorType: input.actorType ?? 'system',
        action: input.action,
        resourceType: input.resourceType,
        resourceId: input.resourceId,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        before: (input.before ?? undefined) as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        after: (input.after ?? undefined) as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        metadata: (input.metadata ?? undefined) as any,
      },
    });

    return {
      id: raw.id,
      organizationId: raw.organizationId,
      actorId: raw.actorId,
      actorType: raw.actorType as 'user' | 'system' | 'api_key',
      action: raw.action,
      resourceType: raw.resourceType,
      resourceId: raw.resourceId,
      before: raw.before as Record<string, unknown> | null,
      after: raw.after as Record<string, unknown> | null,
      metadata: raw.metadata as Record<string, unknown> | null,
      occurredAt: raw.occurredAt,
    };
  },

  async listForOrg(
    organizationId: string,
    options: { limit?: number; offset?: number; action?: string } = {}
  ): Promise<AuditLogEntry[]> {
    const rows = await prisma.auditLog.findMany({
      where: {
        organizationId,
        ...(options.action ? { action: options.action } : {}),
      },
      orderBy: { occurredAt: 'desc' },
      take: options.limit ?? 50,
      skip: options.offset ?? 0,
    });

    type AuditRow = {
      id: string; organizationId: string | null; actorId: string | null;
      actorType: string; action: string; resourceType: string; resourceId: string;
      before: unknown; after: unknown; metadata: unknown; occurredAt: Date;
    };
    return (rows as AuditRow[]).map((r) => ({
      id: r.id,
      organizationId: r.organizationId,
      actorId: r.actorId,
      actorType: r.actorType as 'user' | 'system' | 'api_key',
      action: r.action,
      resourceType: r.resourceType,
      resourceId: r.resourceId,
      before: r.before as Record<string, unknown> | null,
      after: r.after as Record<string, unknown> | null,
      metadata: r.metadata as Record<string, unknown> | null,
      occurredAt: r.occurredAt,
    }));
  },
};
