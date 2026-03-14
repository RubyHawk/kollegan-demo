import type { CreateAlertInput } from '../domain/alert.entity';
import { alertRepository } from '../infrastructure/alert.repository';
import { eventBus } from '@platform/events/event-bus';
import { ALERT_CREATED } from '../events/alert.events';

export async function createAlert(input: CreateAlertInput) {
  const alert = await alertRepository.create(input);
  eventBus.publish({
    type: ALERT_CREATED,
    orgId: alert.organizationId,
    occurredAt: new Date().toISOString(),
    payload: {
      alertId: alert.id,
      organizationId: alert.organizationId,
      severity: alert.severity,
      source: alert.source,
    },
  });
  return alert;
}

export async function listAlerts(organizationId: string, opts?: { status?: string; limit?: number; offset?: number }) {
  return alertRepository.list(organizationId, opts);
}

export async function acknowledgeAlert(id: string, organizationId: string, userId: string) {
  return alertRepository.acknowledge(id, organizationId, userId);
}

export async function resolveAlert(id: string, organizationId: string) {
  return alertRepository.resolve(id, organizationId);
}
