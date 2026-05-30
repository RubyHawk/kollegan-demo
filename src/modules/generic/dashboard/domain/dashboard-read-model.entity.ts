export type OfferStatus = 'draft' | 'sent' | 'viewed' | 'accepted' | 'declined' | 'expired';

export type DashboardTone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger' | 'info';

export interface RecentOffer {
  id: string;
  title: string;
  status: string;
  offerNumber: number | null;
  recipientName: string | null;
  recipientCompany: string | null;
  totalIncVat: number;
  createdAt: string;
  updatedAt: string;
  validUntil: string | null;
  sentAt: string | null;
  viewedAt: string | null;
  acceptedAt: string | null;
  declinedAt: string | null;
  reminderSentAt: string | null;
  project: OfferProjectSummary | null;
}

export interface OfferActivityPoint {
  createdAt: string;
  status: string;
}

export type ProjectStage = 'details' | 'ordered' | 'arrived' | 'in_progress' | 'completed';

export interface OfferProjectSummary {
  id: string;
  stage: ProjectStage;
  completedAt: string | null;
}

export interface ProjectStats {
  total: number;
  active: number;
  completed: number;
  stages: Record<ProjectStage, number>;
}

export interface DashboardCalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  allDay: boolean;
  source: 'google' | 'local';
}

export interface DashboardCalendar {
  configured: boolean;
  events: DashboardCalendarEvent[];
  error: string | null;
}

export interface DashboardWeatherForecast {
  label: string;
  time: string;
  temperatureC: number | null;
  symbolCode: number | null;
  conditionLabel: string;
}

export interface DashboardWeather {
  status: 'ok' | 'unavailable';
  locationName: string;
  temperatureC: number | null;
  windSpeed: number | null;
  humidity: number | null;
  symbolCode: number | null;
  conditionLabel: string;
  updatedAt: string | null;
  forecast: DashboardWeatherForecast[];
}

export interface DashboardFocusMetrics {
  overdue: number;
  dueSoon: number;
  missingFollowUp: number;
  meetingsToday: number;
}

export interface DashboardActionItem {
  id: string;
  tone: Exclude<DashboardTone, 'accent' | 'success'>;
  label: string;
  detail: string;
  href: string;
  actionLabel: string;
}

export interface DashboardOfferTableRow {
  id: string;
  status: string;
  statusLabel: string;
  customer: string;
  offerNumber: string;
  amount: number;
  deadlineLabel: string;
  deadlineTone: DashboardTone;
  nextStep: string;
  displayCustomerName: string;
  displayOfferTitle: string;
  displaySubtitle: string;
  displayAmount: string;
  displayRiskLabel: string;
  displayNextAction: string;
  href: string;
}

export interface DashboardPipelineStage {
  id: OfferStatus;
  label: string;
  count: number;
  value: number;
  percent: number;
  tone: DashboardTone;
}

export interface DashboardPipelineOverview {
  totalValue: number;
  averageWonValue: number;
  stages: DashboardPipelineStage[];
}

export interface DashboardProjectHandoff {
  id: string;
  name: string;
  customer: string;
  stage: ProjectStage;
  stageLabel: string;
  value: number;
  handoffLabel: string;
  href: string;
}

export interface DashboardActivityFeedItem {
  id: string;
  tone: DashboardTone;
  label: string;
  detail: string;
  occurredAt: string;
  href: string | null;
}

export interface DashboardToday {
  dateLabel: string;
  nextMeeting: DashboardCalendarEvent | null;
  focusLabel: string;
}

export interface DashboardReadModel {
  countMap: Record<string, number>;
  total: number;
  recentOffers: RecentOffer[];
  acceptedValue: number;
  pipelineValue: number;
  acceptanceRate: number | null;
  expiringSoon: number;
  activityData: OfferActivityPoint[];
  projectStats: ProjectStats;
  today: DashboardToday;
  focusMetrics: DashboardFocusMetrics;
  actionItems: DashboardActionItem[];
  offerTable: DashboardOfferTableRow[];
  pipelineOverview: DashboardPipelineOverview;
  projectHandoffs: DashboardProjectHandoff[];
  activityFeed: DashboardActivityFeedItem[];
  calendar: DashboardCalendar;
  weather: DashboardWeather;
}
