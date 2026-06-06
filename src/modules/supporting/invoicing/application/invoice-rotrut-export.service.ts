/**
 * ROT/RUT HUS export use case — builds the Skatteverket "Begäran om utbetalning
 * – Husarbete" payment-request XML for an invoice's ROT/RUT deduction.
 *
 * The performer (Utförare) is the selling company; the buyer (Köpare) fields and
 * the amounts come from the invoice: `paidByBuyer` is what the household actually
 * paid (totalIncVat − the granted deduction) and `requestedAmount` is the
 * deduction the company now reclaims from Skatteverket (rotRutDeductionAmount).
 * The XML builder itself is pure (`domain/hus-xml`); this layer only resolves the
 * org-scoped invoice + company and assembles the claim view.
 */

import { logger } from '@platform/logging/logger';
import { invoiceRepository } from '../infrastructure/invoice.repository';
import { invoiceSourcesRepository } from '../infrastructure/invoice-sources.repository';
import { normalizeRotRutType, type RotRutType } from '../domain/rot-rut';
import { buildHusXml, type HusClaim } from '../domain/hus-xml';

const TAG = 'InvoiceRotRutExportService';

/**
 * Builds the HUS payment-request XML for an invoice's ROT/RUT deduction.
 * Org-scoped. Returns null when the invoice is not found, has no ROT/RUT
 * deduction set, or the selling company cannot be resolved.
 */
export async function buildRotRutExport(id: string, orgId: string): Promise<string | null> {
  const invoice = await invoiceRepository.findById(id, orgId);
  if (!invoice) return null;

  const rotRutType = normalizeRotRutType(invoice.rotRutType);
  if (!rotRutType) return null;

  const company = await invoiceSourcesRepository.getInvoiceCompany(invoice.companyId, orgId);
  if (!company) {
    logger.warn(TAG, `Company not found for ROT/RUT export of invoice ${id}`, { orgId });
    return null;
  }

  const claim: HusClaim = {
    rotRutType: rotRutType as RotRutType,
    invoiceNumber: invoice.invoiceNumber,
    performerName: company.name,
    performerOrgNumber: company.orgNumber ?? undefined,
    buyerPersonalNumber: invoice.buyerPersonalNumber ?? '',
    propertyDesignation: invoice.propertyDesignation ?? undefined,
    housingSocietyOrgNumber: invoice.housingSocietyOrgNumber ?? undefined,
    paidByBuyer: invoice.totalIncVat - invoice.rotRutDeductionAmount,
    requestedAmount: invoice.rotRutDeductionAmount,
    currency: invoice.currency,
  };

  return buildHusXml(claim);
}
