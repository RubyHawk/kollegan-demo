/**
 * Alerting Module — central alert system for workflow failures,
 * compliance events, system incidents, and monitoring alerts.
 */

export type { Alert, AlertSeverity, AlertStatus, AlertSource, CreateAlertInput } from './domain/alert.entity';
export { createAlert, listAlerts, acknowledgeAlert, resolveAlert } from './application/alerting.service';
export { ALERT_CREATED, ALERT_ACKNOWLEDGED, ALERT_RESOLVED } from './events/alert.events';
export type { AlertCreatedEvent, AlertEvent } from './events/alert.events';
