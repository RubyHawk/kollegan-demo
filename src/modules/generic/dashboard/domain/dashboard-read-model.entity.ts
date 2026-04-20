export interface RecentOffer {
  id: string;
  title: string;
  status: string;
  offerNumber: number | null;
  recipientName: string | null;
  recipientCompany: string | null;
  totalIncVat: number;
  createdAt: string;
  validUntil: string | null;
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
}
