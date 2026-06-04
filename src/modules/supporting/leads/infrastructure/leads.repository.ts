// ─── Leads repository ─────────────────────────────────────────────────────────
// All Prisma access for the leads module goes through this file.

import { Prisma, prisma } from '@platform/database/prisma';
import type { Lead, LeadActivity, LeadStatus, LeadSource } from '../domain/lead.entity';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CreateLeadInput {
  organizationId: string;
  companyId?: string;
  name: string;
  email?: string;
  normalizedEmail?: string;
  phone?: string;
  normalizedPhone?: string;
  company?: string;
  status?: LeadStatus;
  source: LeadSource;
  sourceLabel?: string;
  address?: string;
  postalCode?: string;
  requestedService?: string;
  referralSource?: string;
  customFields?: Record<string, unknown> | null;
  score?: number;
  assignedTo?: string;
  notes?: string;
  estimatedValue?: number;
}

export interface UpdateLeadInput {
  companyId?: string;
  name?: string;
  email?: string;
  normalizedEmail?: string;
  phone?: string;
  normalizedPhone?: string;
  company?: string;
  status?: LeadStatus;
  sourceLabel?: string;
  address?: string;
  postalCode?: string;
  requestedService?: string;
  referralSource?: string;
  customFields?: Record<string, unknown> | null;
  score?: number;
  assignedTo?: string;
  notes?: string;
  estimatedValue?: number;
}

export interface ListLeadsFilter {
  status?: LeadStatus;
  assignedTo?: string;
  source?: LeadSource;
  companyId?: string;
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
    companyId:      (row.companyId as string | null) ?? undefined,
    name:           row.name as string,
    email:          (row.email as string | null) ?? undefined,
    normalizedEmail: (row.normalizedEmail as string | null) ?? undefined,
    phone:          (row.phone as string | null) ?? undefined,
    normalizedPhone: (row.normalizedPhone as string | null) ?? undefined,
    company:        (row.company as string | null) ?? undefined,
    status:         row.status as LeadStatus,
    source:         row.source as LeadSource,
    sourceLabel:    (row.sourceLabel as string | null) ?? undefined,
    address:        (row.address as string | null) ?? undefined,
    postalCode:     (row.postalCode as string | null) ?? undefined,
    requestedService: (row.requestedService as string | null) ?? undefined,
    referralSource: (row.referralSource as string | null) ?? undefined,
    customFields:   (row.customFields as Record<string, unknown> | null) ?? null,
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

function toJson(value: Record<string, unknown>): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

// ─── Repository ───────────────────────────────────────────────────────────────

export const leadsRepository = {
  async create(input: CreateLeadInput): Promise<Lead> {
    const row = await prisma.lead.create({
      data: {
        organizationId: input.organizationId,
        companyId:      input.companyId ?? null,
        name:           input.name,
        email:          input.email ?? null,
        normalizedEmail: input.normalizedEmail ?? null,
        phone:          input.phone ?? null,
        normalizedPhone: input.normalizedPhone ?? null,
        company:        input.company ?? null,
        status:         input.status ?? 'new',
        source:         input.source,
        sourceLabel:    input.sourceLabel ?? null,
        address:        input.address ?? null,
        postalCode:     input.postalCode ?? null,
        requestedService: input.requestedService ?? null,
        referralSource: input.referralSource ?? null,
        customFields:   input.customFields === null ? Prisma.JsonNull : input.customFields ? toJson(input.customFields) : undefined,
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
    const where: NonNullable<Parameters<typeof prisma.lead.findMany>[0]>['where'] = {
      organizationId: orgId,
      deletedAt: null,
    };
    if (filter.status)     where.status = filter.status;
    if (filter.assignedTo) where.assignedTo = filter.assignedTo;
    if (filter.source)     where.source = filter.source;
    if (filter.companyId)  where.companyId = filter.companyId;
    if (filter.search) {
      where.OR = [
        { name:    { contains: filter.search, mode: 'insensitive' } },
        { email:   { contains: filter.search, mode: 'insensitive' } },
        { company: { contains: filter.search, mode: 'insensitive' } },
      ];
    }

    const rows = await prisma.lead.findMany({
      where,
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
        companyId:      input.companyId      !== undefined ? input.companyId      : undefined,
        email:          input.email          !== undefined ? input.email          : undefined,
        normalizedEmail: input.normalizedEmail !== undefined ? input.normalizedEmail : undefined,
        phone:          input.phone          !== undefined ? input.phone          : undefined,
        normalizedPhone: input.normalizedPhone !== undefined ? input.normalizedPhone : undefined,
        company:        input.company        !== undefined ? input.company        : undefined,
        status:         input.status         ?? undefined,
        sourceLabel:    input.sourceLabel    !== undefined ? input.sourceLabel    : undefined,
        address:        input.address        !== undefined ? input.address        : undefined,
        postalCode:     input.postalCode     !== undefined ? input.postalCode     : undefined,
        requestedService: input.requestedService !== undefined ? input.requestedService : undefined,
        referralSource: input.referralSource !== undefined ? input.referralSource : undefined,
        customFields:   input.customFields   !== undefined ? (input.customFields === null ? Prisma.JsonNull : toJson(input.customFields)) : undefined,
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
    const where: NonNullable<Parameters<typeof prisma.lead.count>[0]>['where'] = { organizationId: orgId, deletedAt: null };
    if (filter.status)     where.status = filter.status;
    if (filter.assignedTo) where.assignedTo = filter.assignedTo;
    if (filter.source)     where.source = filter.source;
    if (filter.companyId)  where.companyId = filter.companyId;
    return prisma.lead.count({ where });
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
