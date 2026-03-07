export type AlertSeverity = 'info' | 'warning' | 'error' | 'critical';
export type AlertStatus = 'active' | 'acknowledged' | 'resolved';
export type AlertSource = 'workflow' | 'compliance' | 'system' | 'security';

export interface Alert {
  id: string;
  organizationId: string;
  title: string;
  message: string;
  severity: AlertSeverity;
  status: AlertStatus;
  source: AlertSource;
  sourceId: string | null;
  acknowledgedBy: string | null;
  acknowledgedAt: Date | null;
  resolvedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateAlertInput {
  organizationId: string;
  title: string;
  message: string;
  severity: AlertSeverity;
  source: AlertSource;
  sourceId?: string;
}
