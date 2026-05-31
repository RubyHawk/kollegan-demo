import { prisma } from '@platform/database/prisma';
import type {
  OfferActivityPoint,
  ProjectStage,
  ProjectStats,
  RecentOffer,
} from '../domain/dashboard-read-model.entity';

export interface DashboardMeetingSnapshot {
  id: string;
  title: string;
  scheduledAt: string;
  endedAt: string | null;
}

export interface DashboardProjectSnapshot {
  id: string;
  name: string;
  stage: ProjectStage;
  totalIncVat: number;
  wishedInstallDate: string | null;
  createdAt: string;
  customerName: string | null;
  customerCompany: string | null;
}

export interface KpiWindowOffer {
  totalIncVat: number;
  status: string;
  sentAt: string | null;
  acceptedAt: string | null;
  declinedAt: string | null;
}

export interface DashboardSnapshot {
  countMap: Record<string, number>;
  valueMap: Record<string, number>;
  total: number;
  recentOffers: RecentOffer[];
  acceptedValue: number;
  pipelineValue: number;
  acceptanceRate: number | null;
  expiringSoon: number;
  activityData: OfferActivityPoint[];
  projectStats: ProjectStats;
  meetingsToday: DashboardMeetingSnapshot[];
  projectHandoffs: DashboardProjectSnapshot[];
  kpiWindow: KpiWindowOffer[];
}

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

function toIso(value: Date | null | undefined): string | null {
  return value ? value.toISOString() : null;
}

export const dashboardReadModelRepository = {
  async getOrganizationIdForUser(userId: string): Promise<string | null> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { organizationId: true },
    });

    return user?.organizationId ?? null;
  },

  async getDashboardSnapshot(
    organizationId: string,
    todayStart: Date,
    tomorrowStart: Date,
  ): Promise<DashboardSnapshot> {
    const in7days = new Date(todayStart.getTime() + 7 * 24 * 60 * 60 * 1000);
    // 63 days = 9 weeks: covers 7 weekly sparkline buckets + 60-day avg-deal trend comparison
    const kpiWindowStart = new Date(todayStart.getTime() - 63 * 24 * 60 * 60 * 1000);

    const [
      counts,
      recentRaw,
      valueRows,
      activityRaw,
      projectRows,
      expiringSoon,
      meetingsRaw,
      handoffRaw,
      kpiWindowRaw,
    ] = await Promise.all([
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
          updatedAt: true,
          validUntil: true,
          sentAt: true,
          viewedAt: true,
          acceptedAt: true,
          declinedAt: true,
          reminderSentAt: true,
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
        orderBy: { updatedAt: 'desc' },
        take: 120,
        select: {
          id: true,
          title: true,
          status: true,
          recipientName: true,
          recipientCompany: true,
          createdAt: true,
          updatedAt: true,
          sentAt: true,
          viewedAt: true,
          acceptedAt: true,
          declinedAt: true,
        },
      }),

      prisma.project.groupBy({
        by: ['stage'],
        where: { organizationId, deletedAt: null },
        _count: { id: true },
      }),

      prisma.offer.count({
        where: {
          organizationId,
          deletedAt: null,
          status: { in: ['sent', 'viewed'] },
          validUntil: { gte: todayStart, lte: in7days },
        },
      }),

      prisma.meeting.findMany({
        where: {
          organizationId,
          deletedAt: null,
          status: { in: ['scheduled', 'in_progress'] },
          scheduledAt: { gte: todayStart, lt: tomorrowStart },
        },
        orderBy: { scheduledAt: 'asc' },
        take: 8,
        select: {
          id: true,
          title: true,
          scheduledAt: true,
          endedAt: true,
        },
      }),

      prisma.project.findMany({
        where: {
          organizationId,
          deletedAt: null,
          stage: { in: ['details', 'ordered', 'arrived', 'in_progress'] },
        },
        orderBy: [{ stage: 'asc' }, { createdAt: 'desc' }],
        take: 6,
        select: {
          id: true,
          name: true,
          stage: true,
          totalIncVat: true,
          wishedInstallDate: true,
          createdAt: true,
          customer: {
            select: {
              name: true,
              company: true,
            },
          },
        },
      }),

      // Dedicated time-window fetch for KPI trend computation.
      // Keyed by sentAt/acceptedAt/declinedAt — not bounded by createdAt order —
      // so trends are accurate regardless of how many total offers exist.
      prisma.offer.findMany({
        where: {
          organizationId,
          deletedAt: null,
          OR: [
            { acceptedAt: { gte: kpiWindowStart } },
            { sentAt: { gte: kpiWindowStart } },
            { declinedAt: { gte: kpiWindowStart } },
          ],
        },
        select: {
          totalIncVat: true,
          status: true,
          sentAt: true,
          acceptedAt: true,
          declinedAt: true,
        },
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
      updatedAt: offer.updatedAt.toISOString(),
      validUntil: toIso(offer.validUntil),
      sentAt: toIso(offer.sentAt),
      viewedAt: toIso(offer.viewedAt),
      acceptedAt: toIso(offer.acceptedAt),
      declinedAt: toIso(offer.declinedAt),
      reminderSentAt: toIso(offer.reminderSentAt),
      project: offer.projects[0]
        ? {
            id: offer.projects[0].id,
            stage: offer.projects[0].stage as ProjectStage,
            completedAt: toIso(offer.projects[0].completedAt),
          }
        : null,
    }));

    const activityData: OfferActivityPoint[] = activityRaw.map((offer) => ({
      createdAt: offer.createdAt.toISOString(),
      status: offer.status,
    }));

    return {
      countMap,
      valueMap,
      total,
      recentOffers,
      acceptedValue,
      pipelineValue,
      acceptanceRate,
      expiringSoon,
      activityData,
      projectStats,
      meetingsToday: meetingsRaw.map((meeting) => ({
        id: meeting.id,
        title: meeting.title,
        scheduledAt: meeting.scheduledAt.toISOString(),
        endedAt: toIso(meeting.endedAt),
      })),
      projectHandoffs: handoffRaw.map((project) => ({
        id: project.id,
        name: project.name,
        stage: project.stage as ProjectStage,
        totalIncVat: Number(project.totalIncVat ?? 0),
        wishedInstallDate: toIso(project.wishedInstallDate),
        createdAt: project.createdAt.toISOString(),
        customerName: project.customer?.name ?? null,
        customerCompany: project.customer?.company ?? null,
      })),
      kpiWindow: kpiWindowRaw.map((o) => ({
        totalIncVat: Number(o.totalIncVat ?? 0),
        status: o.status,
        sentAt: toIso(o.sentAt),
        acceptedAt: toIso(o.acceptedAt),
        declinedAt: toIso(o.declinedAt),
      })),
    };
  },
};
