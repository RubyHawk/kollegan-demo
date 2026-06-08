/**
 * Invoice creation use cases — blank draft, from-offer, and from-time.
 *
 * Each builder resolves the source data and produces a CreateInvoiceData payload
 * plus (for the time flow) the time-entry ids to mark billed. The orchestrating
 * createInvoice in invoice.service wires these to the repository.
 */

import { Errors } from '@platform/api/errors';
import type {
  CreateBlankInvoiceInput,
  CreateInvoiceFromOfferInput,
  CreateInvoiceFromTimeInput,
} from '../domain/invoice.entity';
import {
  invoiceSourcesRepository,
  type TimeEntrySource,
} from '../infrastructure/invoice-sources.repository';
import type { CreateInvoiceData } from '../infrastructure/invoice.repository';

const DUE_DAYS_DEFAULT = 30;

function todayDateOnly(): Date {
  return new Date(new Date().toISOString().slice(0, 10));
}

function addDays(base: Date, days: number): Date {
  const d = new Date(base);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

async function resolveCompanyDefaults(companyId: string, orgId: string) {
  const defaults = await invoiceSourcesRepository.getCompanyDefaults(companyId, orgId);
  if (!defaults) throw Errors.validation('companyId does not reference a company in this organization');
  return defaults;
}

/** Blank draft — currency + line-item default VAT come from the company. */
export async function buildBlankInvoice(
  orgId: string,
  actorId: string,
  input: CreateBlankInvoiceInput,
): Promise<CreateInvoiceData> {
  if (!input.companyId) throw Errors.validation('companyId is required to create an invoice');
  const defaults = await resolveCompanyDefaults(input.companyId, orgId);
  const issueDate = todayDateOnly();

  const lineItems = (input.lineItems ?? []).map((item, idx) => ({
    ...item,
    vatRate: item.vatRate ?? defaults.defaultVatRate,
    sortOrder: item.sortOrder ?? idx,
  }));

  return {
    organizationId: orgId,
    companyId: input.companyId,
    customerId: input.customerId ?? null,
    issueDate,
    dueDate: addDays(issueDate, DUE_DAYS_DEFAULT),
    currency: defaults.currency,
    recipientName: input.recipientName ?? '',
    recipientEmail: input.recipientEmail ?? null,
    recipientCompany: input.recipientCompany ?? null,
    notes: input.notes ?? null,
    createdBy: actorId,
    lineItems,
  };
}

/** From an accepted offer — copies recipient + line items, links offer/customer/company. */
export async function buildInvoiceFromOffer(
  orgId: string,
  actorId: string,
  input: CreateInvoiceFromOfferInput,
): Promise<CreateInvoiceData> {
  const offer = await invoiceSourcesRepository.getOfferForInvoice(input.offerId, orgId);
  if (!offer) throw Errors.notFound('Offer');
  if (!offer.companyId) throw Errors.validation('Offer has no company and cannot be invoiced');

  const defaults = await resolveCompanyDefaults(offer.companyId, orgId);
  const issueDate = todayDateOnly();

  return {
    organizationId: orgId,
    companyId: offer.companyId,
    customerId: offer.customerId,
    offerId: input.offerId,
    issueDate,
    dueDate: addDays(issueDate, DUE_DAYS_DEFAULT),
    currency: defaults.currency,
    recipientName: offer.recipientName,
    recipientEmail: offer.recipientEmail,
    recipientCompany: offer.recipientCompany,
    notes: input.notes ?? null,
    createdBy: actorId,
    lineItems: offer.lineItems.map((item, idx) => ({
      description: item.description,
      quantity: item.quantity,
      unit: item.unit,
      unitPrice: item.unitPrice,
      vatRate: item.vatRate,
      discount: item.discount ?? 0,
      productId: item.productId,
      sortOrder: item.sortOrder ?? idx,
    })),
  };
}

/** Groups billable, unbilled time entries into one labour line per description. */
function groupTimeEntries(
  entries: TimeEntrySource[],
  hourlyRate: number,
  defaultVatRate: number,
) {
  const groups = new Map<string, { description: string; hours: number }>();
  for (const entry of entries) {
    const description = entry.description?.trim() || 'Time';
    const key = description.toLowerCase();
    const group = groups.get(key) ?? { description, hours: 0 };
    group.hours += entry.hours;
    groups.set(key, group);
  }

  return [...groups.values()].map((group, idx) => ({
    description: group.description,
    quantity: group.hours,
    unit: 'h',
    unitPrice: hourlyRate,
    vatRate: defaultVatRate,
    discount: 0,
    sortOrder: idx,
    lineType: 'labour',
  }));
}

export interface InvoiceFromTimeResult {
  data: CreateInvoiceData;
  /** The time entries that will be marked billed once the invoice is created. */
  timeEntryIds: string[];
}

/** From a project's billable, unbilled time — links project; caller marks entries billed. */
export async function buildInvoiceFromTime(
  orgId: string,
  actorId: string,
  input: CreateInvoiceFromTimeInput,
): Promise<InvoiceFromTimeResult> {
  const companyId = await invoiceSourcesRepository.getProjectCompanyId(input.projectId, orgId);
  if (!companyId) throw Errors.notFound('Project');

  const customerId = await invoiceSourcesRepository.getProjectCustomerId(input.projectId, orgId);
  const defaults = await resolveCompanyDefaults(companyId, orgId);

  const entries = await invoiceSourcesRepository.getBillableTimeEntries(
    input.projectId,
    orgId,
    input.timeEntryIds,
  );
  if (entries.length === 0) {
    throw Errors.validation('No billable, unbilled time entries found for the given ids on this project');
  }

  const hourlyRate = input.hourlyRate ?? 0;
  const issueDate = todayDateOnly();

  return {
    data: {
      organizationId: orgId,
      companyId,
      customerId,
      projectId: input.projectId,
      issueDate,
      dueDate: addDays(issueDate, DUE_DAYS_DEFAULT),
      currency: defaults.currency,
      recipientName: '',
      notes: input.notes ?? null,
      createdBy: actorId,
      lineItems: groupTimeEntries(entries, hourlyRate, defaults.defaultVatRate),
    },
    timeEntryIds: entries.map((entry) => entry.id),
  };
}
