import type { Offer, OfferLineItem, OfferProjectStage } from '../domain/offer.entity';
import { calculateOfferTotals, DEFAULT_OFFER_PRICE_DISPLAY_MODE } from '../domain/pricing';

export function mapLineItem(r: Record<string, unknown>): OfferLineItem {
  return {
    id:          r.id as string,
    description: r.description as string,
    quantity:    r.quantity as number,
    unitPrice:   r.unitPrice as number,
    vatRate:     r.vatRate as number,
    discount:    (r.discount as number | null) ?? undefined,
    productId:   (r.productId as string | null) ?? undefined,
    unit:        (r.unit as string | null) ?? undefined,
    sortOrder:   (r.sortOrder as number | null) ?? undefined,
  };
}

export function mapOffer(r: Record<string, unknown>): Offer {
  const items = (r.lineItems as Record<string, unknown>[] | undefined) ?? [];
  const projects = (r.projects as Record<string, unknown>[] | undefined) ?? [];
  const project = projects[0] ?? null;
  return {
    id:                   r.id as string,
    organizationId:       r.organizationId as string,
    title:                r.title as string,
    status:               r.status as Offer['status'],
    offerNumber:          (r.offerNumber as number | null) ?? undefined,
    priceDisplayMode:     (r.priceDisplayMode as Offer['priceDisplayMode'] | null) ?? DEFAULT_OFFER_PRICE_DISPLAY_MODE,
    recipientName:        r.recipientName as string,
    recipientEmail:       r.recipientEmail as string,
    recipientCompany:     (r.recipientCompany as string | null) ?? undefined,
    notes:                (r.notes as string | null) ?? undefined,
    validUntil:           (r.validUntil as Date).toISOString(),
    validityDays:         (r.validityDays as number) ?? 30,
    createdBy:            r.createdBy as string,
    createdAt:            (r.createdAt as Date).toISOString(),
    sentAt:               r.sentAt ? (r.sentAt as Date).toISOString() : undefined,
    viewedAt:             r.viewedAt ? (r.viewedAt as Date).toISOString() : undefined,
    acceptedAt:           r.acceptedAt ? (r.acceptedAt as Date).toISOString() : undefined,
    declinedAt:           r.declinedAt ? (r.declinedAt as Date).toISOString() : undefined,
    reminderSentAt:       r.reminderSentAt ? (r.reminderSentAt as Date).toISOString() : undefined,
    reminderCount:        (r.reminderCount as number) ?? 0,
    leadId:               (r.leadId as string | null) ?? undefined,
    customerId:           (r.customerId as string | null) ?? undefined,
    companyId:            (r.companyId as string | null) ?? undefined,
    totalExVat:           r.totalExVat as number,
    totalIncVat:          r.totalIncVat as number,
    templateId:           (r.templateId as string | null) ?? undefined,
    generatedDocument:    (r.generatedDocument as string | null) ?? undefined,
    generatedPdf:         (r.generatedPdf as Uint8Array | null) ?? undefined,
    generatedPdfFingerprint: (r.generatedPdfFingerprint as string | null) ?? undefined,
    emailSubject:         (r.emailSubject as string | null) ?? undefined,
    emailBody:            (r.emailBody as string | null) ?? undefined,
    emailHeaderConfig:    (r.emailHeaderConfig as string | null) ?? undefined,
    signatureImage:       (r.signatureImage as string | null) ?? undefined,
    signerName:           (r.signerName as string | null) ?? undefined,
    signatureMethod:      (r.signatureMethod as string) ?? 'canvas',
    publicToken:          r.publicToken as string,
    publicTokenExpiresAt: r.publicTokenExpiresAt ? (r.publicTokenExpiresAt as Date).toISOString() : undefined,
    customFields:         (r.customFields as Record<string, unknown> | null) ?? undefined,
    lineItems:            items.map(mapLineItem),
    project: project ? {
      id: project.id as string,
      stage: project.stage as OfferProjectStage,
      completedAt: project.completedAt ? (project.completedAt as Date).toISOString() : undefined,
    } : null,
  };
}

// ─── Totals calculation ────────────────────────────────────────────────────────

export function computeTotals(
  lineItems: Array<{ quantity: number; unitPrice: number; vatRate: number; discount?: number | null }>
): { totalExVat: number; totalIncVat: number } {
  const totals = calculateOfferTotals(lineItems);
  return {
    totalExVat: totals.exVat,
    totalIncVat: totals.incVat,
  };
}

export const LINE_ITEM_SELECT = {
  id: true, description: true, quantity: true,
  unitPrice: true, vatRate: true, discount: true, productId: true, unit: true, sortOrder: true,
};

export const OFFER_PROJECT_SELECT = {
  where: { deletedAt: null },
  select: { id: true, stage: true, completedAt: true },
  orderBy: { createdAt: 'desc' as const },
  take: 1,
};

export const OFFER_SELECT = {
  id: true, organizationId: true, title: true, status: true,
  offerNumber: true,
  priceDisplayMode: true,
  recipientName: true, recipientEmail: true, recipientCompany: true,
  notes: true, validUntil: true, validityDays: true, createdBy: true,
  totalExVat: true, totalIncVat: true,
  sentAt: true, viewedAt: true, acceptedAt: true, declinedAt: true,
  reminderSentAt: true, reminderCount: true,
  leadId: true, customerId: true, companyId: true,
  templateId: true, generatedDocument: true, generatedPdf: true, generatedPdfFingerprint: true, emailSubject: true, emailBody: true, emailHeaderConfig: true, signatureImage: true, signerName: true, signatureMethod: true,
  publicToken: true, publicTokenExpiresAt: true,
  customFields: true,
  createdAt: true, updatedAt: true,
  lineItems: { select: LINE_ITEM_SELECT, orderBy: { sortOrder: 'asc' as const } },
  projects: OFFER_PROJECT_SELECT,
};

// Lightweight select for list queries — omits large document/image fields that are
// only needed when viewing a single offer. Reduces payload by ~90% for sent offers.
export const OFFER_LIST_SELECT = {
  id: true, organizationId: true, title: true, status: true,
  offerNumber: true,
  priceDisplayMode: true,
  recipientName: true, recipientEmail: true, recipientCompany: true,
  notes: true, validUntil: true, validityDays: true, createdBy: true,
  totalExVat: true, totalIncVat: true,
  sentAt: true, viewedAt: true, acceptedAt: true, declinedAt: true,
  reminderSentAt: true, reminderCount: true,
  leadId: true, customerId: true, companyId: true, templateId: true,
  publicToken: true, publicTokenExpiresAt: true,
  createdAt: true, updatedAt: true,
  lineItems: { select: LINE_ITEM_SELECT, orderBy: { sortOrder: 'asc' as const } },
  projects: OFFER_PROJECT_SELECT,
};
