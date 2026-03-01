// ─── Leads repository ─────────────────────────────────────────────────────────
// All Prisma access for the leads module goes through this file.

import { prisma } from '@core/database/prisma';
import type { Lead, LeadActivity, LeadStatus, LeadSource } from '../domain/lead.entity';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CreateLeadInput {
  organizationId: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  status?: LeadStatus;
  source: LeadSource;
  score?: number;
  assignedTo?: string;
  notes?: string;
  estimatedValue?: number;
}

export interface UpdateLeadInput {
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
  status?: LeadStatus;
  score?: number;
  assignedTo?: string;
  notes?: string;
  estimatedValue?: number;
}

export interface ListLeadsFilter {
  status?: LeadStatus;
  assignedTo?: string;
  source?: LeadSource;
  search?: string;         // name / email / company prefix match
  limit?: number;
  offset?: number;
}

export interface CreateActivityInput {
  leadId: string;
  organizationId: string;
  type: LeadActivity['type'];
  content: string;
  createdBy: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function mapLead(row: Record<string, unknown>): Lead {
  return {
    id:             row.id as string,
    organizationId: row.organizationId as string,
    name:           row.name as string,
    email:          (row.email as string | null) ?? undefined,
    phone:          (row.phone as string | null) ?? undefined,
    company:        (row.company as string | null) ?? undefined,
    status:         row.status as LeadStatus,
    source:         row.source as LeadSource,
    score:          (row.score as number | null) ?? undefined,
    assignedTo:     (row.assignedTo as string | null) ?? undefined,
    notes:          (row.notes as string | null) ?? undefined,
    estimatedValue: (row.estimatedValue as number | null) ?? undefined,
    createdAt:      (row.createdAt as Date).toISOString(),
    updatedAt:      (row.updatedAt as Date).toISOString(),
    convertedAt:    row.convertedAt ? (row.convertedAt as Date).toISOString() : undefined,
    customerId:     (row.customerId as string | null) ?? undefined,
  };
}

function mapActivity(row: Record<string, unknown>): LeadActivity {
  return {
    id:        row.id as string,
    leadId:    row.leadId as string,
    type:      row.type as LeadActivity['type'],
    content:   row.content as string,
    createdBy: row.createdBy as string,
    createdAt: (row.createdAt as Date).toISOString(),
  };
}

// ─── Repository ───────────────────────────────────────────────────────────────

export const leadsRepository = {
  async create(input: CreateLeadInput): Promise<Lead> {
    const row = await prisma.lead.create({
      data: {
        organizationId: input.organizationId,
        name:           input.name,
        email:          input.email ?? null,
        phone:          input.phone ?? null,
        company:        input.company ?? null,
        status:         input.status ?? 'new',
        source:         input.source,
        score:          input.score ?? null,
        assignedTo:     input.assignedTo ?? null,
        notes:          input.notes ?? null,
        estimatedValue: input.estimatedValue ?? null,
      },
    });
    return mapLead(row as unknown as Record<string, unknown>);
  },

  async findById(id: string, orgId: string): Promise<Lead | null> {
    const row = await prisma.lead.findFirst({
      where: { id, organizationId: orgId, deletedAt: null },
    });
    return row ? mapLead(row as unknown as Record<string, unknown>) : null;
  },

  async list(orgId: string, filter: ListLeadsFilter): Promise<Lead[]> {
    const where: Record<string, unknown> = {
      organizationId: orgId,
      deletedAt: null,
    };
    if (filter.status)     where.status = filter.status;
    if (filter.assignedTo) where.assignedTo = filter.assignedTo;
    if (filter.source)     where.source = filter.source;
    if (filter.search) {
      (where as { OR?: unknown[] }).OR = [
        { name:    { contains: filter.search, mode: 'insensitive' } },
        { email:   { contains: filter.search, mode: 'insensitive' } },
        { company: { contains: filter.search, mode: 'insensitive' } },
      ];
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rows = await prisma.lead.findMany({
      where: where as any,
      orderBy: { createdAt: 'desc' },
      take:  filter.limit  ?? 50,
      skip:  filter.offset ?? 0,
    });
    return rows.map((r) => mapLead(r as unknown as Record<string, unknown>));
  },

  async update(id: string, orgId: string, input: UpdateLeadInput): Promise<Lead | null> {
    const existing = await prisma.lead.findFirst({ where: { id, organizationId: orgId, deletedAt: null } });
    if (!existing) return null;

    const row = await prisma.lead.update({
      where: { id },
      data: {
        name:           input.name           ?? undefined,
        email:          input.email          !== undefined ? input.email          : undefined,
        phone:          input.phone          !== undefined ? input.phone          : undefined,
        company:        input.company        !== undefined ? input.company        : undefined,
        status:         input.status         ?? undefined,
        score:          input.score          !== undefined ? input.score          : undefined,
        assignedTo:     input.assignedTo     !== undefined ? input.assignedTo     : undefined,
        notes:          input.notes          !== undefined ? input.notes          : undefined,
        estimatedValue: input.estimatedValue !== undefined ? input.estimatedValue : undefined,
      },
    });
    return mapLead(row as unknown as Record<string, unknown>);
  },

  async softDelete(id: string, orgId: string): Promise<boolean> {
    const existing = await prisma.lead.findFirst({ where: { id, organizationId: orgId, deletedAt: null } });
    if (!existing) return false;
    await prisma.lead.update({ where: { id }, data: { deletedAt: new Date() } });
    return true;
  },

  async convert(id: string, orgId: string, customerId: string): Promise<Lead | null> {
    const existing = await prisma.lead.findFirst({ where: { id, organizationId: orgId, deletedAt: null } });
    if (!existing) return null;
    const row = await prisma.lead.update({
      where: { id },
      data: { status: 'won', convertedAt: new Date(), customerId },
    });
    return mapLead(row as unknown as Record<string, unknown>);
  },

  async count(orgId: string, filter: Omit<ListLeadsFilter, 'limit' | 'offset'>): Promise<number> {
    const where: Record<string, unknown> = { organizationId: orgId, deletedAt: null };
    if (filter.status)     where.status = filter.status;
    if (filter.assignedTo) where.assignedTo = filter.assignedTo;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return prisma.lead.count({ where: where as any });
  },

  // ─── Activities ─────────────────────────────────────────────────────────────

  async addActivity(input: CreateActivityInput): Promise<LeadActivity> {
    const row = await prisma.leadActivity.create({
      data: {
        leadId:         input.leadId,
        organizationId: input.organizationId,
        type:           input.type,
        content:        input.content,
        createdBy:      input.createdBy,
      },
    });
    return mapActivity(row as unknown as Record<string, unknown>);
  },

  async listActivities(leadId: string, orgId: string): Promise<LeadActivity[]> {
    const rows = await prisma.leadActivity.findMany({
      where: { leadId, organizationId: orgId, deletedAt: null },
      orderBy: { createdAt: 'asc' },
    });
    return rows.map((r) => mapActivity(r as unknown as Record<string, unknown>));
  },
};
