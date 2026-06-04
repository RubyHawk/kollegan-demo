import { Prisma, prisma } from '@platform/database/prisma';
import { coerceFieldConfig, normalizeIntakeAddress } from '../application/lead-intake-parser';
import type {
  LeadIntakeFieldConfig,
  LeadIntakeForwarder,
  LeadIntakeForwarderRecipient,
} from '../domain/lead-intake.entity';

function toJson(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

function mapRecipient(row: Record<string, unknown>): LeadIntakeForwarderRecipient {
  const user = row.user as Record<string, unknown> | undefined;
  return {
    id: row.id as string,
    forwarderId: row.forwarderId as string,
    userId: row.userId as string,
    email: (user?.email as string | undefined) ?? '',
    firstName: (user?.firstName as string | null | undefined) ?? null,
    lastName: (user?.lastName as string | null | undefined) ?? null,
  };
}

function mapForwarder(row: Record<string, unknown>): LeadIntakeForwarder {
  const recipients = Array.isArray(row.recipients) ? row.recipients : [];
  return {
    id: row.id as string,
    organizationId: row.organizationId as string,
    companyId: row.companyId as string,
    name: row.name as string,
    sourceLabel: row.sourceLabel as string,
    provider: row.provider as string,
    intakeAddress: row.intakeAddress as string,
    normalizedIntakeAddress: row.normalizedIntakeAddress as string,
    senderEmail: (row.senderEmail as string | null) ?? null,
    senderName: (row.senderName as string | null) ?? null,
    fieldConfig: coerceFieldConfig(row.fieldConfig),
    isActive: Boolean(row.isActive),
    createdBy: row.createdBy as string,
    createdAt: (row.createdAt as Date).toISOString(),
    updatedAt: (row.updatedAt as Date).toISOString(),
    deletedAt: row.deletedAt ? (row.deletedAt as Date).toISOString() : null,
    recipients: recipients.map((recipient) => mapRecipient(recipient as Record<string, unknown>)),
  };
}

const RECIPIENT_INCLUDE = {
  include: {
    user: {
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
      },
    },
  },
} as const;

const FORWARDER_INCLUDE = {
  recipients: RECIPIENT_INCLUDE,
} as const;

export interface UpsertLeadIntakeForwarderInput {
  organizationId: string;
  companyId: string;
  name: string;
  sourceLabel: string;
  provider?: string;
  intakeAddress: string;
  senderEmail?: string | null;
  senderName?: string | null;
  fieldConfig: LeadIntakeFieldConfig;
  isActive?: boolean;
  createdBy: string;
  recipientUserIds: string[];
}

export interface UpdateLeadIntakeForwarderInput {
  name?: string;
  sourceLabel?: string;
  intakeAddress?: string;
  senderEmail?: string | null;
  senderName?: string | null;
  fieldConfig?: LeadIntakeFieldConfig;
  isActive?: boolean;
  recipientUserIds?: string[];
}

export const leadIntakeRepository = {
  async listForwarders(companyId: string, organizationId: string): Promise<LeadIntakeForwarder[]> {
    const rows = await prisma.leadIntakeForwarder.findMany({
      where: { companyId, organizationId, deletedAt: null },
      include: FORWARDER_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((row: unknown) => mapForwarder(row as Record<string, unknown>));
  },

  async findForwarder(id: string, companyId: string, organizationId: string): Promise<LeadIntakeForwarder | null> {
    const row = await prisma.leadIntakeForwarder.findFirst({
      where: { id, companyId, organizationId, deletedAt: null },
      include: FORWARDER_INCLUDE,
    });
    return row ? mapForwarder(row as unknown as Record<string, unknown>) : null;
  },

  async findActiveForwarderByAddress(provider: string, intakeAddress: string): Promise<LeadIntakeForwarder | null> {
    const row = await prisma.leadIntakeForwarder.findFirst({
      where: {
        provider,
        normalizedIntakeAddress: normalizeIntakeAddress(intakeAddress),
        isActive: true,
        deletedAt: null,
      },
      include: FORWARDER_INCLUDE,
    });
    return row ? mapForwarder(row as unknown as Record<string, unknown>) : null;
  },

  async createForwarder(input: UpsertLeadIntakeForwarderInput): Promise<LeadIntakeForwarder> {
    const row = await prisma.leadIntakeForwarder.create({
      data: {
        organizationId: input.organizationId,
        companyId: input.companyId,
        name: input.name,
        sourceLabel: input.sourceLabel,
        provider: input.provider ?? 'resend',
        intakeAddress: input.intakeAddress,
        normalizedIntakeAddress: normalizeIntakeAddress(input.intakeAddress),
        senderEmail: input.senderEmail ?? null,
        senderName: input.senderName ?? null,
        fieldConfig: toJson(input.fieldConfig),
        isActive: input.isActive ?? true,
        createdBy: input.createdBy,
        recipients: {
          create: input.recipientUserIds.map((userId) => ({ userId })),
        },
      },
      include: FORWARDER_INCLUDE,
    });
    return mapForwarder(row as unknown as Record<string, unknown>);
  },

  async updateForwarder(
    id: string,
    companyId: string,
    organizationId: string,
    input: UpdateLeadIntakeForwarderInput,
  ): Promise<LeadIntakeForwarder | null> {
    const existing = await prisma.leadIntakeForwarder.findFirst({
      where: { id, companyId, organizationId, deletedAt: null },
      select: { id: true },
    });
    if (!existing) return null;

    await prisma.$transaction(async (tx) => {
      await tx.leadIntakeForwarder.update({
        where: { id },
        data: {
          ...(input.name !== undefined ? { name: input.name } : {}),
          ...(input.sourceLabel !== undefined ? { sourceLabel: input.sourceLabel } : {}),
          ...(input.intakeAddress !== undefined ? {
            intakeAddress: input.intakeAddress,
            normalizedIntakeAddress: normalizeIntakeAddress(input.intakeAddress),
          } : {}),
          ...(input.senderEmail !== undefined ? { senderEmail: input.senderEmail } : {}),
          ...(input.senderName !== undefined ? { senderName: input.senderName } : {}),
          ...(input.fieldConfig !== undefined ? { fieldConfig: toJson(input.fieldConfig) } : {}),
          ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
        },
      });

      if (input.recipientUserIds) {
        await tx.leadIntakeForwarderRecipient.deleteMany({ where: { forwarderId: id } });
        if (input.recipientUserIds.length) {
          await tx.leadIntakeForwarderRecipient.createMany({
            data: input.recipientUserIds.map((userId) => ({ forwarderId: id, userId })),
            skipDuplicates: true,
          });
        }
      }
    });

    const row = await prisma.leadIntakeForwarder.findFirst({
      where: { id, companyId, organizationId, deletedAt: null },
      include: FORWARDER_INCLUDE,
    });
    return row ? mapForwarder(row as unknown as Record<string, unknown>) : null;
  },

  async deactivateForwarder(id: string, companyId: string, organizationId: string): Promise<boolean> {
    const existing = await prisma.leadIntakeForwarder.findFirst({
      where: { id, companyId, organizationId, deletedAt: null },
      select: { id: true },
    });
    if (!existing) return false;
    await prisma.leadIntakeForwarder.update({
      where: { id },
      data: { isActive: false, deletedAt: new Date() },
    });
    return true;
  },

  async findMessageByProvider(provider: string, providerEventId?: string | null, providerEmailId?: string | null) {
    if (!providerEventId && !providerEmailId) return null;
    return prisma.leadIntakeMessage.findFirst({
      where: {
        provider,
        OR: [
          ...(providerEventId ? [{ providerEventId }] : []),
          ...(providerEmailId ? [{ providerEmailId }] : []),
        ],
      },
    });
  },

  async createMessage(input: {
    organizationId?: string | null;
    companyId?: string | null;
    forwarderId?: string | null;
    leadId?: string | null;
    customerId?: string | null;
    provider: string;
    providerEventId?: string | null;
    providerEmailId?: string | null;
    messageId?: string | null;
    fromAddress?: string | null;
    toAddresses?: string[];
    subject?: string | null;
    contentHash?: string | null;
    parsedFields?: Record<string, unknown> | null;
    status?: string;
    forwardStatus?: string;
    error?: string | null;
  }) {
    return prisma.leadIntakeMessage.create({
      data: {
        organizationId: input.organizationId ?? null,
        companyId: input.companyId ?? null,
        forwarderId: input.forwarderId ?? null,
        leadId: input.leadId ?? null,
        customerId: input.customerId ?? null,
        provider: input.provider,
        providerEventId: input.providerEventId ?? null,
        providerEmailId: input.providerEmailId ?? null,
        messageId: input.messageId ?? null,
        fromAddress: input.fromAddress ?? null,
        toAddresses: input.toAddresses ?? [],
        subject: input.subject ?? null,
        contentHash: input.contentHash ?? null,
        parsedFields: input.parsedFields === null ? Prisma.JsonNull : input.parsedFields ? toJson(input.parsedFields) : undefined,
        status: input.status ?? 'received',
        forwardStatus: input.forwardStatus ?? 'pending',
        error: input.error ?? null,
      },
    });
  },

  async updateMessage(id: string, input: {
    organizationId?: string | null;
    companyId?: string | null;
    forwarderId?: string | null;
    leadId?: string | null;
    customerId?: string | null;
    parsedFields?: Record<string, unknown> | null;
    status?: string;
    forwardStatus?: string;
    error?: string | null;
  }) {
    return prisma.leadIntakeMessage.update({
      where: { id },
      data: {
        ...(input.organizationId !== undefined ? { organizationId: input.organizationId ?? null } : {}),
        ...(input.companyId !== undefined ? { companyId: input.companyId ?? null } : {}),
        ...(input.forwarderId !== undefined ? { forwarderId: input.forwarderId ?? null } : {}),
        ...(input.leadId !== undefined ? { leadId: input.leadId ?? null } : {}),
        ...(input.customerId !== undefined ? { customerId: input.customerId ?? null } : {}),
        ...(input.parsedFields !== undefined ? { parsedFields: input.parsedFields === null ? Prisma.JsonNull : toJson(input.parsedFields) } : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
        ...(input.forwardStatus !== undefined ? { forwardStatus: input.forwardStatus } : {}),
        ...(input.error !== undefined ? { error: input.error } : {}),
      },
    });
  },
};
