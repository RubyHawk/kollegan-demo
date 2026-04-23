import { prisma } from '@platform/database/prisma';

type AuthAuditActorType = 'user' | 'system' | 'api_key';

export interface AppendAuthAuditInput {
  organizationId?: string | null;
  actorId?: string | null;
  actorType?: AuthAuditActorType;
  action: string;
  resourceType: string;
  resourceId: string;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
}

export const authAuditRepository = {
  async append(input: AppendAuthAuditInput): Promise<void> {
    await prisma.auditLog.create({
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
  },
};
