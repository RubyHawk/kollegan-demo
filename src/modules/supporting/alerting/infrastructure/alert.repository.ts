import type { Alert, CreateAlertInput } from '../domain/alert.entity';

// Alerting tables are not yet in the Prisma schema.
// This repository is ready to wire up once the migration is created.
// For now, it provides the interface that services and handlers depend on.

const alerts: Alert[] = [];

export const alertRepository = {
  async create(input: CreateAlertInput): Promise<Alert> {
    const alert: Alert = {
      id: crypto.randomUUID(),
      organizationId: input.organizationId,
      title: input.title,
      message: input.message,
      severity: input.severity,
      status: 'active',
      source: input.source,
      sourceId: input.sourceId ?? null,
      acknowledgedBy: null,
      acknowledgedAt: null,
      resolvedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    alerts.push(alert);
    return alert;
  },

  async list(organizationId: string, opts?: { status?: string; limit?: number; offset?: number }) {
    let filtered = alerts.filter(a => a.organizationId === organizationId);
    if (opts?.status) filtered = filtered.filter(a => a.status === opts.status);
    const total = filtered.length;
    const offset = opts?.offset ?? 0;
    const limit = opts?.limit ?? 50;
    return { items: filtered.slice(offset, offset + limit), total };
  },

  async acknowledge(id: string, organizationId: string, userId: string): Promise<Alert | null> {
    const alert = alerts.find(a => a.id === id && a.organizationId === organizationId);
    if (!alert) return null;
    alert.status = 'acknowledged';
    alert.acknowledgedBy = userId;
    alert.acknowledgedAt = new Date();
    alert.updatedAt = new Date();
    return alert;
  },

  async resolve(id: string, organizationId: string): Promise<Alert | null> {
    const alert = alerts.find(a => a.id === id && a.organizationId === organizationId);
    if (!alert) return null;
    alert.status = 'resolved';
    alert.resolvedAt = new Date();
    alert.updatedAt = new Date();
    return alert;
  },
};
