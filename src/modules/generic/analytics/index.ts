/**
 * Analytics Module — dashboards, reports, and data aggregation.
 *
 * Currently a scaffold. Will aggregate data from workflow executions,
 * CRM activities, offer conversions, and system health metrics.
 */

export type AnalyticsPeriod = 'day' | 'week' | 'month' | 'quarter' | 'year';

export interface AnalyticsQuery {
  organizationId: string;
  period: AnalyticsPeriod;
  startDate?: Date;
  endDate?: Date;
}
