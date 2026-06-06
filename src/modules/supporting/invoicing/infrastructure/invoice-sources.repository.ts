/**
 * Source-document repository — reads the data an invoice can be created from:
 * company defaults (currency / VAT rate), an accepted offer's recipient + line
 * items, and a project's billable, unbilled time entries. It also marks time
 * entries as billed by setting their invoiceId.
 *
 * These are direct reads of shared Prisma models (Company, Offer, TimeEntry,
 * Project) — not cross-module imports — so the supporting-module boundary holds.
 * Prisma is allowed only in this layer.
 */

import { prisma } from '@platform/database/prisma';

export interface CompanyDefaults {
  currency: string;
  defaultVatRate: number;
}

export interface OfferSource {
  companyId: string | null;
  customerId: string | null;
  recipientName: string;
  recipientEmail: string | null;
  recipientCompany: string | null;
  lineItems: Array<{
    description: string;
    quantity: number;
    unit: string | null;
    unitPrice: number;
    vatRate: number;
    discount: number | null;
    productId: string | null;
    sortOrder: number;
  }>;
}

export interface TimeEntrySource {
  id: string;
  userId: string;
  hours: number;
  description: string | null;
  billable: boolean;
  invoiceId: string | null;
}

export const invoiceSourcesRepository = {

  /** Company currency + default VAT rate, used to seed blank drafts. */
  async getCompanyDefaults(companyId: string, orgId: string): Promise<CompanyDefaults | null> {
    const row = await prisma.company.findFirst({
      where: { id: companyId, organizationId: orgId, deletedAt: null },
      select: { currency: true, defaultVatRate: true },
    });
    if (!row) return null;
    return {
      currency: row.currency ?? 'SEK',
      defaultVatRate: row.defaultVatRate ?? 0.25,
    };
  },

  /** Loads an offer (org-scoped) with the fields needed to seed an invoice. */
  async getOfferForInvoice(offerId: string, orgId: string): Promise<OfferSource | null> {
    const row = await prisma.offer.findFirst({
      where: { id: offerId, organizationId: orgId, deletedAt: null },
      select: {
        companyId: true,
        customerId: true,
        recipientName: true,
        recipientEmail: true,
        recipientCompany: true,
        lineItems: {
          select: {
            description: true, quantity: true, unit: true, unitPrice: true,
            vatRate: true, discount: true, productId: true, sortOrder: true,
          },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });
    return row as OfferSource | null;
  },

  /** The companyId of a project's source offer — projects link to a company via their offer. */
  async getProjectCompanyId(projectId: string, orgId: string): Promise<string | null> {
    const row = await prisma.project.findFirst({
      where: { id: projectId, organizationId: orgId, deletedAt: null },
      select: { customerId: true, offer: { select: { companyId: true } } },
    });
    if (!row) return null;
    return row.offer?.companyId ?? null;
  },

  async getProjectCustomerId(projectId: string, orgId: string): Promise<string | null> {
    const row = await prisma.project.findFirst({
      where: { id: projectId, organizationId: orgId, deletedAt: null },
      select: { customerId: true },
    });
    return row?.customerId ?? null;
  },

  /**
   * Loads the requested time entries for a project that are billable and not yet
   * billed (invoiceId IS NULL). Org-scoped and soft-delete-aware. Entries that
   * are already billed, non-billable, deleted, or on another project are omitted.
   */
  async getBillableTimeEntries(
    projectId: string,
    orgId: string,
    timeEntryIds: string[],
  ): Promise<TimeEntrySource[]> {
    if (timeEntryIds.length === 0) return [];
    const rows = await prisma.timeEntry.findMany({
      where: {
        id: { in: timeEntryIds },
        organizationId: orgId,
        projectId,
        billable: true,
        invoiceId: null,
        deletedAt: null,
      },
      select: { id: true, userId: true, hours: true, description: true, billable: true, invoiceId: true },
      orderBy: { date: 'asc' },
    });
    return rows as TimeEntrySource[];
  },

  /** Marks the given time entries as billed by linking them to the invoice. Org-scoped. */
  async markTimeEntriesBilled(timeEntryIds: string[], invoiceId: string, orgId: string): Promise<number> {
    if (timeEntryIds.length === 0) return 0;
    const result = await prisma.timeEntry.updateMany({
      where: {
        id: { in: timeEntryIds },
        organizationId: orgId,
        invoiceId: null,
        deletedAt: null,
      },
      data: { invoiceId },
    });
    return result.count;
  },
};
