import { prisma } from '@platform/database/prisma';
import type {
  DashboardReadModel,
  OfferActivityPoint,
  ProjectStage,
  ProjectStats,
  RecentOffer,
} from '../domain/dashboard-read-model.entity';

const DEFAULT_OFFER_STATUS_COUNTS: Record<string, number> = {
  draft: 0,
  sent: 0,
  viewed: 0,
  accepted: 0,
  declined: 0,
  expired: 0,
};

const DEFAULT_PROJECT_STAGE_COUNTS: Record<ProjectStage, number> = {
  details: 0,
  ordered: 0,
  arrived: 0,
  in_progress: 0,
  completed: 0,
};

export const dashboardReadModelRepository = {
  async getOrganizationIdForUser(userId: string): Promise<string | null> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { organizationId: true },
    });

    return user?.organizationId ?? null;
  },

  async getDashboardReadModel(organizationId: string): Promise<DashboardReadModel> {
    const [counts, recentRaw, valueRows, activityRaw, projectRows] = await Promise.all([
      prisma.offer.groupBy({
        by: ['status'],
        where: { organizationId, deletedAt: null },
        _count: { id: true },
      }),

      prisma.offer.findMany({
        where: { organizationId, deletedAt: null },
        orderBy: { createdAt: 'desc' },
        take: 30,
        select: {
          id: true,
          title: true,
          status: true,
          offerNumber: true,
          recipientName: true,
          recipientCompany: true,
          totalIncVat: true,
          createdAt: true,
          validUntil: true,
          projects: {
            where: { deletedAt: null },
            select: { id: true, stage: true, completedAt: true },
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      }),

      prisma.offer.groupBy({
        by: ['status'],
        where: { organizationId, deletedAt: null },
        _sum: { totalIncVat: true },
      }),

      prisma.offer.findMany({
        where: { organizationId, deletedAt: null },
        select: { createdAt: true, status: true },
      }),

      prisma.project.groupBy({
        by: ['stage'],
        where: { organizationId, deletedAt: null },
        _count: { id: true },
      }),
    ]);

    const countMap = { ...DEFAULT_OFFER_STATUS_COUNTS };
    let total = 0;
    for (const row of counts) {
      countMap[row.status] = row._count.id;
      total += row._count.id;
    }

    const valueMap: Record<string, number> = {};
    for (const row of valueRows) {
      valueMap[row.status] = Number(row._sum.totalIncVat ?? 0);
    }

    const acceptedValue = valueMap.accepted ?? 0;
    const pipelineValue = (valueMap.sent ?? 0) + (valueMap.viewed ?? 0);
    const closedTotal = (countMap.accepted ?? 0) + (countMap.declined ?? 0);
    const acceptanceRate = closedTotal > 0 ? Math.round((countMap.accepted / closedTotal) * 100) : null;

    const in7days = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const expiringSoon = await prisma.offer.count({
      where: {
        organizationId,
        deletedAt: null,
        status: { in: ['sent', 'viewed'] },
        validUntil: { lte: in7days },
      },
    });

    const projectStageCounts = { ...DEFAULT_PROJECT_STAGE_COUNTS };
    let projectTotal = 0;
    for (const row of projectRows) {
      const stage = row.stage as ProjectStage;
      projectStageCounts[stage] = row._count.id;
      projectTotal += row._count.id;
    }

    const projectStats: ProjectStats = {
      total: projectTotal,
      active:
        projectStageCounts.details
        + projectStageCounts.ordered
        + projectStageCounts.arrived
        + projectStageCounts.in_progress,
      completed: projectStageCounts.completed,
      stages: projectStageCounts,
    };

    const recentOffers: RecentOffer[] = recentRaw.map((offer) => ({
      id: offer.id,
      title: offer.title,
      status: offer.status,
      offerNumber: offer.offerNumber,
      recipientName: offer.recipientName,
      recipientCompany: offer.recipientCompany,
      totalIncVat: Number(offer.totalIncVat ?? 0),
      createdAt: offer.createdAt.toISOString(),
      validUntil: offer.validUntil?.toISOString() ?? null,
      project: offer.projects[0]
        ? {
            id: offer.projects[0].id,
            stage: offer.projects[0].stage as ProjectStage,
            completedAt: offer.projects[0].completedAt?.toISOString() ?? null,
          }
        : null,
    }));

    const activityData: OfferActivityPoint[] = activityRaw.map((offer) => ({
      createdAt: offer.createdAt.toISOString(),
      status: offer.status,
    }));

    return {
      countMap,
      total,
      recentOffers,
      acceptedValue,
      pipelineValue,
      acceptanceRate,
      expiringSoon,
      activityData,
      projectStats,
    };
  },
};
