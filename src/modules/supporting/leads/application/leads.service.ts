/**
 * Leads service — Phase 3 CRM + Leads.
 *
 * Lead lifecycle:
 *   new → contacted → qualified → proposal → won (converted to customer) / lost
 *
 * Every status transition publishes a domain event for the automation module.
 * Lead conversion creates a Customer record in the CRM module.
 */

import { eventBus } from '@platform/events';
import { logger } from '@platform/logging/logger';
import { leadsRepository } from '../infrastructure/leads.repository';
import type { CreateLeadInput, UpdateLeadInput, ListLeadsFilter } from '../infrastructure/leads.repository';
import type { Lead, LeadActivity, LeadStatus } from '../domain/lead.entity';
import {
  LEAD_CREATED,
  LEAD_STAGE_CHANGED,
  LEAD_CONVERTED,
  LEAD_ASSIGNED,
} from '../events/lead.events';
import { normalizeEmail, normalizePhone } from './lead-intake-parser';

export type { Lead, LeadActivity, LeadStatus };
export type { CreateLeadInput, UpdateLeadInput, ListLeadsFilter };

const TAG = 'LeadsService';

// ─── Create ───────────────────────────────────────────────────────────────────

export async function createLead(input: CreateLeadInput, actorId = 'system'): Promise<Lead> {
  const lead = await leadsRepository.create({
    ...input,
    normalizedEmail: input.normalizedEmail ?? normalizeEmail(input.email) ?? undefined,
    normalizedPhone: input.normalizedPhone ?? normalizePhone(input.phone) ?? undefined,
  });

  // Log creation as first activity
  await leadsRepository.addActivity({
    leadId:         lead.id,
    organizationId: lead.organizationId,
    type:           'note',
    content:        `Lead created from ${lead.source}.`,
    createdBy:      actorId,
  });

  eventBus.publish({
    type:       LEAD_CREATED,
    orgId:      lead.organizationId,
    occurredAt: new Date().toISOString(),
    payload:    { leadId: lead.id, name: lead.name, source: lead.source, assignedTo: lead.assignedTo ?? null },
  });

  logger.info(TAG, `Lead created: ${lead.name}`, { leadId: lead.id, source: lead.source });
  return lead;
}

// ─── Read ─────────────────────────────────────────────────────────────────────

export async function getLead(id: string, orgId: string): Promise<Lead | null> {
  return leadsRepository.findById(id, orgId);
}

export async function listLeads(
  orgId: string,
  filter: ListLeadsFilter = {},
): Promise<{ leads: Lead[]; total: number }> {
  const [leads, total] = await Promise.all([
    leadsRepository.list(orgId, filter),
    leadsRepository.count(orgId, filter),
  ]);
  return { leads, total };
}

// ─── Update ───────────────────────────────────────────────────────────────────

export async function updateLead(
  id: string,
  orgId: string,
  input: UpdateLeadInput,
  actorId: string,
): Promise<Lead | null> {
  const existing = await leadsRepository.findById(id, orgId);
  if (!existing) return null;

  const updated = await leadsRepository.update(id, orgId, {
    ...input,
    ...(input.email !== undefined ? { normalizedEmail: normalizeEmail(input.email) ?? undefined } : {}),
    ...(input.phone !== undefined ? { normalizedPhone: normalizePhone(input.phone) ?? undefined } : {}),
  });
  if (!updated) return null;

  // Log status transitions as dedicated activities
  if (input.status && input.status !== existing.status) {
    await leadsRepository.addActivity({
      leadId:         id,
      organizationId: orgId,
      type:           'stage_change',
      content:        `Status changed: ${existing.status} → ${input.status}`,
      createdBy:      actorId,
    });

    eventBus.publish({
      type:       LEAD_STAGE_CHANGED,
      orgId,
      occurredAt: new Date().toISOString(),
      payload:    { leadId: id, fromStatus: existing.status, toStatus: input.status, actorId },
    });
  }

  // Log assignment changes
  if (input.assignedTo !== undefined && input.assignedTo !== existing.assignedTo) {
    await leadsRepository.addActivity({
      leadId:         id,
      organizationId: orgId,
      type:           'note',
      content:        `Assigned to ${input.assignedTo ?? 'unassigned'}.`,
      createdBy:      actorId,
    });

    if (input.assignedTo) {
      eventBus.publish({
        type:       LEAD_ASSIGNED,
        orgId,
        occurredAt: new Date().toISOString(),
        payload:    { leadId: id, assignedTo: input.assignedTo, actorId },
      });
    }
  }

  logger.info(TAG, `Lead updated: ${id}`, { actorId });
  return updated;
}

// ─── Convert ──────────────────────────────────────────────────────────────────

/**
 * Convert a lead to a customer.
 * Marks the lead as 'won', sets convertedAt, and links the customerId.
 * The caller is responsible for creating the Customer record in the CRM module
 * before calling this.
 */
export async function convertLead(
  id: string,
  orgId: string,
  customerId: string,
  actorId: string,
): Promise<Lead | null> {
  const existing = await leadsRepository.findById(id, orgId);
  if (!existing) return null;
  if (existing.status === 'won') {
    throw Object.assign(new Error('Lead is already converted'), { code: 'ALREADY_CONVERTED' });
  }

  const converted = await leadsRepository.convert(id, orgId, customerId);
  if (!converted) return null;

  await leadsRepository.addActivity({
    leadId:         id,
    organizationId: orgId,
    type:           'stage_change',
    content:        `Lead converted to customer (ID: ${customerId}).`,
    createdBy:      actorId,
  });

  eventBus.publish({
    type:       LEAD_CONVERTED,
    orgId,
    occurredAt: new Date().toISOString(),
    payload:    { leadId: id, customerId, actorId },
  });

  logger.info(TAG, `Lead converted: ${id} → customer ${customerId}`, { actorId });
  return converted;
}

// ─── Delete ───────────────────────────────────────────────────────────────────

export async function deleteLead(id: string, orgId: string): Promise<boolean> {
  const deleted = await leadsRepository.softDelete(id, orgId);
  if (deleted) logger.info(TAG, `Lead soft-deleted: ${id}`);
  return deleted;
}

// ─── Activities ───────────────────────────────────────────────────────────────

export async function addLeadActivity(
  leadId: string,
  orgId: string,
  type: LeadActivity['type'],
  content: string,
  actorId: string,
): Promise<LeadActivity> {
  const lead = await leadsRepository.findById(leadId, orgId);
  if (!lead) throw Object.assign(new Error('Lead not found'), { code: 'NOT_FOUND' });

  return leadsRepository.addActivity({ leadId, organizationId: orgId, type, content, createdBy: actorId });
}

export async function getLeadActivities(leadId: string, orgId: string): Promise<LeadActivity[]> {
  return leadsRepository.listActivities(leadId, orgId);
}
