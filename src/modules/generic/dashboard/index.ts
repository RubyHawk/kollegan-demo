export { default as DashboardHeader } from './components/dashboard-header';
export { default as DashboardSidebar } from './components/dashboard-sidebar';
export { default as SetupTab } from './components/setup-tab';
export { default as SplashScreen } from './components/splash-screen';
export { default as CallIndicator } from './components/call-indicator';
export { default as StatSummaryCards } from './components/stat-summary-cards';
export { getDashboardOrganizationIdForUser, getDashboardReadModel } from './application/dashboard-read-model.service';
export type {
  DashboardReadModel,
  OfferActivityPoint,
  OfferProjectSummary,
  ProjectStage,
  ProjectStats,
  RecentOffer,
} from './domain/dashboard-read-model.entity';
