export const ALERT_CREATED = 'alerting.alert.created' as const;
export const ALERT_ACKNOWLEDGED = 'alerting.alert.acknowledged' as const;
export const ALERT_RESOLVED = 'alerting.alert.resolved' as const;

export type AlertCreatedEvent = {
  type: typeof ALERT_CREATED;
  payload: { alertId: string; organizationId: string; severity: string; source: string };
};

export type AlertEvent = AlertCreatedEvent;
