import {
  isCalendarConfigured,
  listCalendarEventsInRange,
} from '@platform/calendar/google-calendar';
import { getDashboardWeather, unavailableWeather } from '@platform/weather/smhi';
import { dashboardReadModelRepository } from '../infrastructure/dashboard-read-model.repository';
import type { DashboardSnapshot } from '../infrastructure/dashboard-read-model.repository';
import type {
  DashboardActionItem,
  DashboardActivityFeedItem,
  DashboardCalendar,
  DashboardCalendarEvent,
  DashboardOfferTableRow,
  DashboardPipelineOverview,
  DashboardPipelineStage,
  DashboardProjectHandoff,
  DashboardReadModel,
  DashboardTone,
  DashboardWeather,
  OfferStatus,
  ProjectStage,
  RecentOffer,
} from '../domain/dashboard-read-model.entity';

const OPEN_OFFER_STATUSES = ['sent', 'viewed'] as const;
const ACTIONABLE_OFFER_STATUSES = ['draft', 'sent', 'viewed', 'accepted'] as const;

const STATUS_LABELS: Record<string, string> = {
  draft: 'Utkast',
  sent: 'Skickad',
  viewed: 'Visad',
  accepted: 'Accepterad',
  declined: 'Avvisad',
  expired: 'Utgången',
};

const PROJECT_STAGE_LABELS: Record<ProjectStage, string> = {
  details: 'Klar för överlämning',
  ordered: 'Beställt',
  arrived: 'Material ankommet',
  in_progress: 'Pågår',
  completed: 'Klart',
};

const PIPELINE_STAGES: Array<{ id: OfferStatus; label: string; tone: DashboardTone }> = [
  { id: 'draft', label: 'Utkast', tone: 'neutral' },
  { id: 'sent', label: 'Skickad', tone: 'accent' },
  { id: 'viewed', label: 'Visad', tone: 'info' },
  { id: 'accepted', label: 'Accepterad', tone: 'success' },
];

export async function getDashboardOrganizationIdForUser(userId: string): Promise<string | null> {
  return dashboardReadModelRepository.getOrganizationIdForUser(userId);
}

export async function getDashboardReadModel(organizationId: string) {
  const now = new Date();
  const { start, end } = getLocalDayBounds(now);
  const [snapshot, calendar, weather] = await Promise.all([
    dashboardReadModelRepository.getDashboardSnapshot(organizationId, start, end),
    getDashboardCalendar(start, end),
    getDashboardWeather() as Promise<DashboardWeather>,
  ]);

  return buildDashboardReadModel(snapshot, { calendar, weather }, now);
}

export function buildDashboardReadModel(
  snapshot: DashboardSnapshot,
  integrations: { calendar: DashboardCalendar; weather?: DashboardWeather },
  now = new Date(),
): DashboardReadModel {
  const todayStart = getLocalDayBounds(now).start;
  const actionItems = buildActionItems(snapshot.recentOffers, todayStart);
  const offerTable = buildOfferTable(snapshot.recentOffers, todayStart);
  const calendarEvents = integrations.calendar.events;
  const localMeetingEvents = snapshot.meetingsToday.map(toLocalCalendarEvent);
  const allCalendarEvents = [...calendarEvents, ...localMeetingEvents]
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
    .slice(0, 8);

  const calendar: DashboardCalendar = {
    ...integrations.calendar,
    events: allCalendarEvents,
  };

  const overdue = snapshot.recentOffers.filter((offer) => isOverdue(offer, todayStart)).length;
  const dueSoon = snapshot.expiringSoon;
  const missingFollowUp = snapshot.recentOffers.filter((offer) => needsFollowUp(offer, todayStart)).length;

  return {
    countMap: snapshot.countMap,
    total: snapshot.total,
    recentOffers: snapshot.recentOffers,
    acceptedValue: snapshot.acceptedValue,
    pipelineValue: snapshot.pipelineValue,
    acceptanceRate: snapshot.acceptanceRate,
    expiringSoon: snapshot.expiringSoon,
    activityData: snapshot.activityData,
    projectStats: snapshot.projectStats,
    today: {
      dateLabel: formatDateLong(now),
      nextMeeting: allCalendarEvents.find((event) => new Date(event.end).getTime() >= now.getTime()) ?? null,
      focusLabel: actionItems.length > 0 ? `${actionItems.length} saker kräver handling` : 'Läget är under kontroll',
    },
    focusMetrics: {
      overdue,
      dueSoon,
      missingFollowUp,
      meetingsToday: allCalendarEvents.length,
    },
    actionItems,
    offerTable,
    pipelineOverview: buildPipelineOverview(snapshot),
    projectHandoffs: buildProjectHandoffs(snapshot),
    activityFeed: buildActivityFeed(snapshot),
    calendar,
    weather: integrations.weather ?? unavailableWeather('Örebro'),
  };
}

async function getDashboardCalendar(start: Date, end: Date): Promise<DashboardCalendar> {
  if (!isCalendarConfigured()) {
    return { configured: false, events: [], error: null };
  }

  try {
    const events = await listCalendarEventsInRange(start, end, 8);
    return {
      configured: true,
      error: null,
      events: events.map((event) => ({
        id: `google-${event.id}`,
        title: event.summary || 'Kalenderhändelse',
        start: event.start,
        end: event.end,
        allDay: event.allDay ?? !event.start.includes('T'),
        source: 'google',
      })),
    };
  } catch {
    return { configured: true, events: [], error: 'Kalendern kunde inte hämtas' };
  }
}

function buildActionItems(offers: RecentOffer[], todayStart: Date): DashboardActionItem[] {
  const items: DashboardActionItem[] = [];

  for (const offer of offers) {
    if (!ACTIONABLE_OFFER_STATUSES.includes(offer.status as never)) continue;

    if (offer.status === 'accepted' && !offer.project) {
      items.push({
        id: `project-${offer.id}`,
        tone: 'neutral',
        label: 'Skapa projekt',
        detail: `${offerRef(offer)} accepterad · ${customerLabel(offer)} · ${formatSEKCompact(offer.totalIncVat)}`,
        href: `/offerter/${offer.id}`,
        actionLabel: 'Redo för projekt',
      });
      continue;
    }

    if (isOverdue(offer, todayStart) || isDraftStale(offer, todayStart)) {
      items.push({
        id: `${offer.status === 'draft' ? 'draft' : 'overdue'}-${offer.id}`,
        tone: offer.status === 'draft' ? 'warning' : 'danger',
        label: offer.status === 'draft' ? 'Skicka offert' : `Ring ${customerLabel(offer)}`,
        detail: offer.status === 'draft'
          ? `Utkast klart · väntar på attest · ${formatSEKCompact(offer.totalIncVat)}`
          : `${offerRef(offer)} · över deadline · ${formatSEKCompact(offer.totalIncVat)}`,
        href: `/offerter/${offer.id}`,
        actionLabel: offer.status === 'draft' ? 'Skicka offert' : 'Ring nu',
      });
      continue;
    }

    const daysLeft = daysUntil(offer.validUntil, todayStart);
    if (daysLeft !== null && daysLeft <= 1) {
      items.push({
        id: `soon-${offer.id}`,
        tone: 'warning',
        label: `Förläng ${customerLabel(offer)}`,
        detail: `${offerRef(offer)} · löper ut ${daysLeft <= 0 ? 'idag' : 'i morgon'} · ${formatSEKCompact(offer.totalIncVat)}`,
        href: `/offerter/${offer.id}`,
        actionLabel: 'Förläng',
      });
      continue;
    }

    if (needsFollowUp(offer, todayStart)) {
      items.push({
        id: `followup-${offer.id}`,
        tone: 'info',
        label: `Följ upp ${customerLabel(offer)}`,
        detail: `${offerRef(offer)} · ${offer.status === 'viewed' ? 'visad' : 'skickad'} utan uppföljning`,
        href: `/offerter/${offer.id}`,
        actionLabel: 'Följ upp',
      });
    }
  }

  return items
    .sort((a, b) => priorityScore(b.tone) - priorityScore(a.tone))
    .slice(0, 4);
}

function buildOfferTable(offers: RecentOffer[], todayStart: Date): DashboardOfferTableRow[] {
  const active = offers.filter((offer) => ['draft', 'sent', 'viewed', 'accepted'].includes(offer.status));

  return active.slice(0, 5).map((offer) => {
    const daysLeft = daysUntil(offer.validUntil, todayStart);
    const offerNumber = offer.offerNumber ? `#${offer.offerNumber}` : 'Utkast';
    const riskLabel = deadlineLabel(daysLeft, offer.status);
    const nextStep = nextOfferStep(offer, daysLeft);
    return {
      id: offer.id,
      status: offer.status,
      statusLabel: STATUS_LABELS[offer.status] ?? offer.status,
      customer: customerLabel(offer),
      offerNumber,
      amount: offer.totalIncVat,
      deadlineLabel: riskLabel,
      deadlineTone: deadlineTone(daysLeft, offer.status),
      nextStep,
      displayCustomerName: customerLabel(offer),
      displayOfferTitle: offerRef(offer),
      displaySubtitle: offerNumber === 'Utkast' ? 'Utkast · väntar på attest' : `${offerRef(offer)} · ${STATUS_LABELS[offer.status] ?? offer.status}`,
      displayAmount: formatSEKCompact(offer.totalIncVat),
      displayRiskLabel: riskLabel,
      displayNextAction: nextStep,
      href: `/offerter/${offer.id}`,
    };
  });
}

function buildPipelineOverview(snapshot: DashboardSnapshot): DashboardPipelineOverview {
  const totalValue = PIPELINE_STAGES.reduce((sum, stage) => sum + (snapshot.valueMap[stage.id] ?? 0), 0);
  const stages: DashboardPipelineStage[] = PIPELINE_STAGES.map((stage) => {
    const value = snapshot.valueMap[stage.id] ?? 0;
    return {
      ...stage,
      count: snapshot.countMap[stage.id] ?? 0,
      value,
      percent: totalValue > 0 ? Math.round((value / totalValue) * 100) : 0,
    };
  });

  return {
    totalValue,
    averageWonValue: (snapshot.countMap.accepted ?? 0) > 0
      ? Math.round(snapshot.acceptedValue / snapshot.countMap.accepted)
      : 0,
    stages,
  };
}

function buildProjectHandoffs(snapshot: DashboardSnapshot): DashboardProjectHandoff[] {
  return snapshot.projectHandoffs.map((project) => ({
    id: project.id,
    name: project.name,
    customer: [project.customerName, project.customerCompany].filter(Boolean).join(' · ') || 'Kund saknas',
    stage: project.stage,
    stageLabel: PROJECT_STAGE_LABELS[project.stage],
    value: project.totalIncVat,
    handoffLabel: project.wishedInstallDate ? formatDateShort(new Date(project.wishedInstallDate)) : 'Planera datum',
    href: `/projekt/${project.id}`,
  }));
}

function buildActivityFeed(snapshot: DashboardSnapshot): DashboardActivityFeedItem[] {
  const items: DashboardActivityFeedItem[] = [];

  for (const offer of snapshot.recentOffers.slice(0, 20)) {
    const customer = customerLabel(offer);
    if (offer.acceptedAt) {
      items.push({
        id: `accepted-${offer.id}`,
        tone: 'success',
        label: 'Offert accepterad',
        detail: `${customer} · ${offerRef(offer)}`,
        occurredAt: offer.acceptedAt,
        href: `/offerter/${offer.id}`,
      });
    } else if (offer.viewedAt) {
      items.push({
        id: `viewed-${offer.id}`,
        tone: 'info',
        label: 'Offert visad',
        detail: `${customer} · ${offerRef(offer)}`,
        occurredAt: offer.viewedAt,
        href: `/offerter/${offer.id}`,
      });
    } else if (offer.sentAt) {
      items.push({
        id: `sent-${offer.id}`,
        tone: 'accent',
        label: 'Offert skickad',
        detail: `${customer} · ${offerRef(offer)}`,
        occurredAt: offer.sentAt,
        href: `/offerter/${offer.id}`,
      });
    } else {
      items.push({
        id: `created-${offer.id}`,
        tone: 'neutral',
        label: 'Offert skapad',
        detail: `${customer} · ${offerRef(offer)}`,
        occurredAt: offer.createdAt,
        href: `/offerter/${offer.id}`,
      });
    }
  }

  return items
    .sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime())
    .slice(0, 5);
}

function toLocalCalendarEvent(meeting: DashboardSnapshot['meetingsToday'][number]): DashboardCalendarEvent {
  return {
    id: `local-${meeting.id}`,
    title: meeting.title,
    start: meeting.scheduledAt,
    end: meeting.endedAt ?? meeting.scheduledAt,
    allDay: false,
    source: 'local',
  };
}

function nextOfferStep(offer: RecentOffer, daysLeft: number | null): string {
  if (offer.status === 'draft') return 'Skicka offert';
  if (offer.status === 'accepted') return offer.project ? 'Överförd till projekt' : 'Redo för projekt';
  if (daysLeft !== null && daysLeft < 0) return 'Följ upp idag';
  if (daysLeft !== null && daysLeft <= 1) return 'Förläng giltighet';
  if (offer.status === 'viewed') return 'Inväntar feedback';
  return 'Följ upp';
}

function customerLabel(offer: RecentOffer): string {
  return offer.recipientCompany || offer.recipientName || 'Ingen mottagare';
}

function offerRef(offer: RecentOffer): string {
  return offer.offerNumber ? `Offert #${offer.offerNumber}` : 'Utkast';
}

function formatSEKCompact(value: number): string {
  if (value >= 1_000_000) return `${Math.round(value / 100_000) / 10} mkr`;
  if (value >= 10_000) return `${Math.round(value / 1000)} tkr`;
  return `${new Intl.NumberFormat('sv-SE').format(value)} kr`;
}

function priorityScore(tone: DashboardActionItem['tone']): number {
  if (tone === 'danger') return 4;
  if (tone === 'warning') return 3;
  if (tone === 'info') return 2;
  return 1;
}

function isOverdue(offer: RecentOffer, todayStart: Date): boolean {
  if (!OPEN_OFFER_STATUSES.includes(offer.status as never) || !offer.validUntil) return false;
  return stockholmDayOrdinal(new Date(offer.validUntil)) < stockholmDayOrdinal(todayStart);
}

function needsFollowUp(offer: RecentOffer, todayStart: Date): boolean {
  if (!OPEN_OFFER_STATUSES.includes(offer.status as never)) return false;
  if (offer.reminderSentAt) return false;
  const reference = offer.viewedAt ?? offer.sentAt ?? offer.updatedAt;
  const ageDays = Math.floor((todayStart.getTime() - new Date(reference).getTime()) / 86400000);
  return offer.status === 'viewed' ? ageDays >= 3 : ageDays >= 5;
}

function isDraftStale(offer: RecentOffer, todayStart: Date): boolean {
  if (offer.status !== 'draft') return false;
  const ageDays = Math.floor((todayStart.getTime() - new Date(offer.updatedAt).getTime()) / 86400000);
  return ageDays >= 1;
}

function daysUntil(iso: string | null, todayStart: Date): number | null {
  if (!iso) return null;
  return stockholmDayOrdinal(new Date(iso)) - stockholmDayOrdinal(todayStart);
}

function deadlineLabel(daysLeft: number | null, status: string): string {
  if (status === 'accepted') return 'Accepterad';
  if (daysLeft === null) return 'Ingen deadline';
  if (daysLeft < 0) return 'Över deadline';
  if (daysLeft === 0) return 'Idag';
  if (daysLeft === 1) return '1 dag kvar';
  return `${daysLeft} dagar kvar`;
}

function deadlineTone(daysLeft: number | null, status: string): DashboardTone {
  if (status === 'accepted') return 'success';
  if (daysLeft === null) return 'neutral';
  if (daysLeft < 0) return 'danger';
  if (daysLeft <= 1) return 'warning';
  return 'neutral';
}

const DASHBOARD_TZ = 'Europe/Stockholm';

function getLocalDayBounds(now: Date): { start: Date; end: Date } {
  const { year, month, day } = stockholmDateParts(now);
  return {
    start: stockholmDateStart(year, month, day),
    end: stockholmDateStart(year, month, day + 1),
  };
}

function stockholmDateParts(date: Date): { year: number; month: number; day: number } {
  const localDate = date.toLocaleDateString('sv-SE', { timeZone: DASHBOARD_TZ }); // "YYYY-MM-DD"
  const [year, month, day] = localDate.split('-').map(Number);
  return { year, month, day };
}

function stockholmDateStart(year: number, month: number, day: number): Date {
  const offsetMs = stockholmUtcOffsetMs(new Date(Date.UTC(year, month - 1, day, 12, 0, 0)));
  return new Date(Date.UTC(year, month - 1, day, 0, 0, 0) - offsetMs);
}

function stockholmDayOrdinal(date: Date): number {
  const { year, month, day } = stockholmDateParts(date);
  return Math.floor(Date.UTC(year, month - 1, day) / 86_400_000);
}

function stockholmUtcOffsetMs(ref: Date): number {
  // Returns ms that DASHBOARD_TZ is ahead of UTC at the given UTC instant
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: DASHBOARD_TZ,
    year: 'numeric', month: 'numeric', day: 'numeric',
    hour: 'numeric', minute: 'numeric', second: 'numeric',
    hour12: false,
  }).formatToParts(ref);
  const v = (t: string) => Number(parts.find((p) => p.type === t)!.value);
  return Date.UTC(v('year'), v('month') - 1, v('day'), v('hour') % 24, v('minute'), v('second'))
    - ref.getTime();
}

function formatDateLong(date: Date): string {
  const formatted = new Intl.DateTimeFormat('sv-SE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'Europe/Stockholm',
  }).format(date);

  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

function formatDateShort(date: Date): string {
  return new Intl.DateTimeFormat('sv-SE', {
    day: 'numeric',
    month: 'short',
    timeZone: 'Europe/Stockholm',
  }).format(date);
}
