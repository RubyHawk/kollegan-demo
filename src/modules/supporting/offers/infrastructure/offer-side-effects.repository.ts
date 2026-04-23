import { prisma } from '@platform/database/prisma';

export const offerSideEffectsRepository = {
  async markLeadWon(
    leadId: string,
    organizationId: string,
    actorId: string,
  ): Promise<{ updated: boolean; fromStatus?: string }> {
    const existing = await prisma.lead.findFirst({
      where: {
        id: leadId,
        organizationId,
        deletedAt: null,
      },
      select: {
        id: true,
        status: true,
      },
    });

    if (!existing || existing.status === 'won') {
      return {
        updated: false,
        fromStatus: existing?.status,
      };
    }

    await prisma.$transaction([
      prisma.lead.update({
        where: { id: leadId },
        data: { status: 'won' },
      }),
      prisma.leadActivity.create({
        data: {
          leadId,
          organizationId,
          type: 'stage_change',
          content: `Status changed: ${existing.status} -> won`,
          createdBy: actorId,
        },
      }),
    ]);

    return {
      updated: true,
      fromStatus: existing.status,
    };
  },

  async appendPublicOfferAudit(
    action: 'offer.viewed' | 'offer.signed' | 'offer.declined',
    offerId: string,
    metadata: Record<string, string | undefined>,
  ): Promise<void> {
    await prisma.auditLog.create({
      data: {
        action,
        resourceType: 'Offer',
        resourceId: offerId,
        organizationId: null,
        actorId: null,
        actorType: 'system',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        metadata: metadata as any,
      },
    });
  },
};
