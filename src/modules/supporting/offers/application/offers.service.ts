import { logger } from '@platform/logging/logger';
import { eventBus } from '@platform/events';
import { offersRepository } from '../infrastructure/offers.repository';
import type { CreateOfferInput, UpdateOfferInput, ListOffersFilter } from '../infrastructure/offers.repository';
import type { Offer } from '../domain/offer.entity';
import {
  OFFER_CREATED,
  OFFER_SENT,
  OFFER_ACCEPTED,
  OFFER_DECLINED,
} from '../events/offer.events';
import {
  buildCreatorNotificationPayload,
  buildReminderPayload,
  buildSendToRecipientPayload,
} from './offer-email';
import { identityService } from '@modules/supporting/identity';
import { generateDocument, generateFallbackDocument, interpolateEmailText } from './document-generator';
import { templatesRepository } from '../infrastructure/templates.repository';
import { companiesRepository } from '../infrastructure/companies.repository';
import { productsRepository } from '../infrastructure/products.repository';
import { resolveOfferBranding } from './company-branding';
import { dispatchCreatorNotification, dispatchOfferEmail, dispatchReminderEmail } from './offer-email-dispatch';
import { prisma } from '@platform/database/prisma';
import { computeOfferValidUntil } from '../domain/validity';
import { assertOfferReadyForSend } from './publish-validation';
import type { OfferBrandingProfile } from './company-branding';
import { renderPublicOfferPdf, resolvePdfOrigin } from './offer-pdf';
import { sanitizePublicPdfOfferDocument } from './public-offer-document';

export type { CreateOfferInput, UpdateOfferInput, ListOffersFilter };

const TAG = 'OffersService';

function normalizeProductLookupValue(value: string): string {
  return value.trim().replace(/\s+/g, ' ').toLocaleLowerCase('sv-SE');
}

function buildProductFamilyLookupValue(value: string): string {
  return normalizeProductLookupValue(
    value
      .replace(/\d+/g, ' ')
      .replace(/[^a-zA-ZåäöÅÄÖ\s]/g, ' ')
      .replace(/\s+/g, ' '),
  );
}

function getLineItemProductCandidates(description: string): string[] {
  const value = description.trim();
  if (!value) return [];

  const separator = [' — ', ' – ', ' - '].find((candidate) => value.includes(candidate));
  const title = separator ? value.split(separator)[0]?.trim() ?? '' : value;

  return Array.from(new Set([value, title].filter(Boolean).map(normalizeProductLookupValue)));
}

export function applyProductUnitsToOffer(offer: Offer, products: Array<{ name: string; unit?: string }>): Offer {
  if (!offer.lineItems.length || !products.length) return offer;

  const unitByName = new Map<string, string>();
  const unitByFamily = new Map<string, string | null>();
  products.forEach((product) => {
    const unit = product.unit?.trim();
    if (!unit) return;
    const key = normalizeProductLookupValue(product.name);
    if (!unitByName.has(key)) unitByName.set(key, unit);

    const familyKey = buildProductFamilyLookupValue(product.name);
    if (!familyKey) return;

    if (!unitByFamily.has(familyKey)) {
      unitByFamily.set(familyKey, unit);
      return;
    }

    if (unitByFamily.get(familyKey) !== unit) {
      unitByFamily.set(familyKey, null);
    }
  });

  if (!unitByName.size) return offer;

  let didChange = false;
  const lineItems = offer.lineItems.map((item) => {
    if (item.unit?.trim()) return item;

    const matchedUnit = getLineItemProductCandidates(item.description)
      .map((candidate) => unitByName.get(candidate))
      .find((candidate): candidate is string => Boolean(candidate))
      ?? getLineItemProductCandidates(item.description)
        .map((candidate) => unitByFamily.get(buildProductFamilyLookupValue(candidate)) ?? undefined)
        .find((candidate): candidate is string => Boolean(candidate));

    if (!matchedUnit) return item;
    didChange = true;
    return { ...item, unit: matchedUnit };
  });

  return didChange ? { ...offer, lineItems } : offer;
}

async function enrichOfferLineItemUnits(offer: Offer): Promise<Offer> {
  if (!offer.lineItems.length) return offer;

  try {
    const products = await productsRepository.list(
      offer.organizationId,
      undefined,
      undefined,
      true,
      offer.companyId,
    );
    return applyProductUnitsToOffer(offer, products);
  } catch (err) {
    logger.warn(TAG, 'Failed to resolve product units for offer line items', { err, offerId: offer.id });
    return offer;
  }
}

export function resolveGeneratedDocumentForSend(input: {
  existingGeneratedDocument?: string;
  templateContent?: string;
  sendSnapshot: Offer;
  branding: OfferBrandingProfile;
}): { generatedDocument: string; usesCurrentTemplate: boolean } {
  const storedSnapshot = input.existingGeneratedDocument?.trim();
  if (storedSnapshot) {
    return {
      generatedDocument: input.existingGeneratedDocument!,
      usesCurrentTemplate: false,
    };
  }

  if (input.templateContent) {
    return {
      generatedDocument: generateDocument(input.templateContent, input.sendSnapshot, input.branding),
      usesCurrentTemplate: true,
    };
  }

  return {
    generatedDocument: generateFallbackDocument(input.sendSnapshot, input.branding),
    usesCurrentTemplate: false,
  };
}

export function resolveOfferSendWindow(
  existing: Offer,
  now: Date = new Date(),
): {
  sentAt: Date;
  validUntil: Date;
  publicTokenExpiresAt: Date;
} {
  const hasStoredSnapshot = Boolean(existing.generatedDocument?.trim());

  if (hasStoredSnapshot) {
    const sentAt = existing.sentAt ? new Date(existing.sentAt) : now;
    const validUntil = new Date(existing.validUntil);
    return {
      sentAt,
      validUntil,
      publicTokenExpiresAt: existing.publicTokenExpiresAt
        ? new Date(existing.publicTokenExpiresAt)
        : validUntil,
    };
  }

  const sentAt = now;
  const validUntil = computeOfferValidUntil(sentAt, existing.validityDays ?? 30);
  return {
    sentAt,
    validUntil,
    publicTokenExpiresAt: validUntil,
  };
}
async function getOfferResponsibleUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      email: true,
      firstName: true,
      lastName: true,
    },
  });

  if (!user) return null;

  const name = [user.firstName, user.lastName].filter(Boolean).join(' ').trim() || user.email;
  return {
    name,
    email: user.email,
  };
}

async function persistPublicOfferPdfSnapshot(
  offer: Offer,
  branding?: OfferBrandingProfile,
): Promise<void> {
  if (!offer.generatedDocument?.trim()) return;

  try {
    const offerWithUnits = await enrichOfferLineItemUnits(offer);
    const resolvedBranding = branding ?? await resolveOfferBrandingForOfferData(offerWithUnits);
    const sanitizedDocument = sanitizePublicPdfOfferDocument(
      offerWithUnits.generatedDocument!,
      offerWithUnits,
      resolvedBranding,
    );
    const { pdfBytes, fingerprint } = await renderPublicOfferPdf({
      documentHtml: sanitizedDocument,
      origin: resolvePdfOrigin(),
      offer: offerWithUnits,
    });

    await offersRepository.updateById(offerWithUnits.id, {
      generatedPdf: pdfBytes,
      generatedPdfFingerprint: fingerprint,
    });
  } catch (err) {
    logger.warn(TAG, 'Failed to persist public offer PDF snapshot', { offerId: offer.id, err });
  }
}

async function resolveOfferBrandingForOfferData(offer: Offer): Promise<OfferBrandingProfile> {
  const [org, company, responsible] = await Promise.all([
    identityService.getOrg(offer.organizationId),
    offer.companyId ? companiesRepository.getById(offer.companyId, offer.organizationId) : Promise.resolve(null),
    getOfferResponsibleUser(offer.createdBy),
  ]);

  return resolveOfferBranding(company, org, responsible);
}

export async function createOffer(
  input: CreateOfferInput,
  actorId: string,
): Promise<Offer> {
  const offer = await offersRepository.create({ ...input, createdBy: actorId });

  eventBus.publish({
    type: OFFER_CREATED,
    orgId: input.organizationId,
    occurredAt: new Date().toISOString(),
    payload: {
      offerId: offer.id,
      title: offer.title,
      recipientEmail: offer.recipientEmail,
      leadId: offer.leadId,
    },
  });

  logger.info(TAG, `Offer created: ${offer.title}`, { offerId: offer.id, orgId: input.organizationId });
  return offer;
}

export async function getOffer(id: string, orgId: string): Promise<Offer | null> {
  return offersRepository.findById(id, orgId);
}

export async function listOffers(
  orgId: string,
  filter: ListOffersFilter,
): Promise<{ offers: Offer[]; total: number }> {
  return offersRepository.list(orgId, filter);
}

export async function countOffers(orgId: string, search?: string): Promise<Record<string, number>> {
  return offersRepository.counts(orgId, search);
}

export async function updateOffer(
  id: string,
  orgId: string,
  input: UpdateOfferInput,
): Promise<Offer | null> {
  const updated = await offersRepository.update(id, orgId, input);
  if (!updated) return null;

  logger.info(TAG, `Offer updated: ${id}`, { status: input.status });
  return updated;
}

export async function sendOffer(id: string, orgId: string): Promise<Offer | null> {
  const existing = await offersRepository.findById(id, orgId);
  if (!existing) return null;

  const offerNumber = await offersRepository.assignOfferNumber(id, orgId);
  const sendWindow = resolveOfferSendWindow(existing);
  const { sentAt, validUntil, publicTokenExpiresAt } = sendWindow;

  const sendSnapshot: Offer = {
    ...existing,
    offerNumber,
    sentAt: sentAt.toISOString(),
    validUntil: validUntil.toISOString(),
  };

  let generatedDocument: string | undefined = existing.generatedDocument?.trim()
    ? existing.generatedDocument
    : undefined;
  let generatedDocumentUsesCurrentTemplate = false;
  let emailSubject: string | undefined = existing.emailSubject;
  let emailBody: string | undefined = existing.emailBody;
  let emailHeaderConfig: string | undefined = existing.emailHeaderConfig;
  let templateContent: string | undefined;
  const [org, company, responsible] = await Promise.all([
    identityService.getOrg(orgId),
    existing.companyId ? companiesRepository.getById(existing.companyId, orgId) : Promise.resolve(null),
    getOfferResponsibleUser(existing.createdBy),
  ]);
  const branding = resolveOfferBranding(company, org, responsible);

  if (!emailHeaderConfig && branding.emailHeaderConfig) {
    emailHeaderConfig = branding.emailHeaderConfig;
  }

  if (existing.templateId) {
    const template = await templatesRepository.findById(existing.templateId, orgId);
    if (template) {
      templateContent = template.content;
      if (!generatedDocument) {
        const resolvedDocument = resolveGeneratedDocumentForSend({
          existingGeneratedDocument: existing.generatedDocument,
          templateContent: template.content,
          sendSnapshot,
          branding,
        });
        generatedDocument = resolvedDocument.generatedDocument;
        generatedDocumentUsesCurrentTemplate = resolvedDocument.usesCurrentTemplate;
      }
      if (!emailSubject && template.emailSubject) emailSubject = template.emailSubject;
      if (!emailBody && template.emailBody) emailBody = template.emailBody;
      if (!emailHeaderConfig && template.emailHeaderConfig) emailHeaderConfig = template.emailHeaderConfig;
    }
  }

  if (!generatedDocument) {
    const resolvedDocument = resolveGeneratedDocumentForSend({
      existingGeneratedDocument: existing.generatedDocument,
      sendSnapshot,
      branding,
    });
    generatedDocument = resolvedDocument.generatedDocument;
    generatedDocumentUsesCurrentTemplate = resolvedDocument.usesCurrentTemplate;
  }

  assertOfferReadyForSend({
    offer: sendSnapshot,
    branding,
    generatedDocument: generatedDocument ?? existing.generatedDocument ?? '',
    templateContent: generatedDocumentUsesCurrentTemplate ? templateContent : undefined,
    company,
  });

  const interpolatedSubject = emailSubject ? interpolateEmailText(emailSubject, sendSnapshot) : undefined;
  const interpolatedBody = emailBody ? interpolateEmailText(emailBody, sendSnapshot) : undefined;

  const publicUrl = `${process.env.PUBLIC_OFFER_BASE_URL ?? `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/offerter/publik`}/${existing.publicToken}`;
  const sender = { senderEmail: branding.senderEmail, senderName: branding.senderName };

  await dispatchOfferEmail(
    buildSendToRecipientPayload(
      {
        ...sendSnapshot,
        generatedDocument,
        emailSubject: interpolatedSubject,
        emailBody: interpolatedBody,
        emailHeaderConfig,
      },
      publicUrl,
      sender,
    ),
  );

  const updated = await offersRepository.update(id, orgId, {
    status: 'sent',
    sentAt,
    offerNumber,
    validUntil,
    ...(generatedDocument ? { generatedDocument } : {}),
    ...(interpolatedSubject !== undefined ? { emailSubject: interpolatedSubject } : {}),
    ...(interpolatedBody !== undefined ? { emailBody: interpolatedBody } : {}),
    ...(emailHeaderConfig !== undefined ? { emailHeaderConfig } : {}),
    publicTokenExpiresAt,
  });
  if (!updated) return null;

  eventBus.publish({
    type: OFFER_SENT,
    orgId,
    occurredAt: new Date().toISOString(),
    payload: {
      offerId: updated.id,
      recipientEmail: updated.recipientEmail,
      totalIncVat: updated.totalIncVat,
    },
  });

  logger.info(TAG, `Offer sent: ${id}`, { recipientEmail: updated.recipientEmail });
  await persistPublicOfferPdfSnapshot(updated, branding);
  return updated;
}

export async function viewOffer(
  publicToken: string,
): Promise<Offer | null> {
  const existing = await offersRepository.findByPublicToken(publicToken);
  if (!existing) return null;

  if (existing.publicTokenExpiresAt && new Date(existing.publicTokenExpiresAt) < new Date()) {
    return null;
  }

  return enrichOfferLineItemUnits(existing);
}

export async function markOfferViewed(
  publicToken: string,
  ip: string,
  userAgent: string,
): Promise<Offer | null> {
  const existing = await offersRepository.findByPublicToken(publicToken);
  if (!existing) return null;

  if (existing.publicTokenExpiresAt && new Date(existing.publicTokenExpiresAt) < new Date()) {
    return null;
  }

  let updated = existing;
  if (existing.status === 'sent') {
    updated = (await offersRepository.updateById(existing.id, {
      status: 'viewed',
      viewedAt: new Date(),
    })) ?? existing;
  }

  void import('@modules/supporting/audit').then(({ log }) =>
    log({
      action: 'offer.viewed',
      resourceType: 'Offer',
      resourceId: existing.id,
      organizationId: null,
      actorId: null,
      actorType: 'system',
      metadata: { ip, userAgent },
    }).catch((err: unknown) => logger.warn(TAG, 'Audit log failed for offer.viewed', { err }))
  );

  return updated;
}

export async function signOffer(
  publicToken: string,
  signatureImage: string,
  ip: string,
  userAgent: string,
  signerName?: string,
): Promise<Offer | null> {
  const existing = await offersRepository.findByPublicToken(publicToken);
  if (!existing) return null;

  if (existing.publicTokenExpiresAt && new Date(existing.publicTokenExpiresAt) < new Date()) {
    return null;
  }

  if (existing.status !== 'sent' && existing.status !== 'viewed') {
    return null;
  }

  const final = await offersRepository.updateById(existing.id, {
    status: 'accepted',
    acceptedAt: new Date(),
    signatureImage,
    ...(signerName ? { signerName } : {}),
  });
  if (!final) return null;

  eventBus.publish({
    type: OFFER_ACCEPTED,
    orgId: final.organizationId,
    occurredAt: new Date().toISOString(),
    payload: {
      offerId: final.id,
      totalIncVat: final.totalIncVat,
      leadId: final.leadId,
    },
  });

  if (final.leadId) {
    const { updateLead } = await import('@modules/supporting/leads');
    await updateLead(final.leadId, final.organizationId, { status: 'won' }, 'system').catch((err: unknown) =>
      logger.warn(TAG, 'Failed to auto-update lead on offer signature', { err })
    );
  }

  const org = await identityService.getOrg(final.organizationId).catch(() => null);
  await dispatchCreatorNotification(
    buildCreatorNotificationPayload(final, 'signed', {
      senderEmail: org?.senderEmail,
      senderName: org?.senderName,
    }),
  ).catch((err: unknown) =>
    logger.warn(TAG, 'Failed to send creator notification', { err })
  );

  void import('@modules/supporting/audit').then(({ log }) =>
    log({
      action: 'offer.signed',
      resourceType: 'Offer',
      resourceId: final.id,
      organizationId: null,
      actorId: null,
      actorType: 'system',
      metadata: { ip, userAgent },
    }).catch((err: unknown) => logger.warn(TAG, 'Audit log failed for offer.signed', { err }))
  );

  logger.info(TAG, `Offer signed: ${final.id}`);
  void persistPublicOfferPdfSnapshot(final);
  return final;
}

export async function declineOfferByToken(
  publicToken: string,
  comment: string | undefined,
  ip: string,
  userAgent: string,
): Promise<Offer | null> {
  const existing = await offersRepository.findByPublicToken(publicToken);
  if (!existing) return null;

  if (existing.publicTokenExpiresAt && new Date(existing.publicTokenExpiresAt) < new Date()) {
    return null;
  }

  if (existing.status !== 'sent' && existing.status !== 'viewed') {
    return null;
  }

  const final = await offersRepository.updateById(existing.id, {
    status: 'declined',
    declinedAt: new Date(),
  });
  if (!final) return null;

  eventBus.publish({
    type: OFFER_DECLINED,
    orgId: final.organizationId,
    occurredAt: new Date().toISOString(),
    payload: { offerId: final.id },
  });

  const org = await identityService.getOrg(final.organizationId).catch(() => null);
  await dispatchCreatorNotification(
    buildCreatorNotificationPayload(final, 'declined', {
      comment,
      senderEmail: org?.senderEmail,
      senderName: org?.senderName,
    }),
  ).catch((err: unknown) =>
    logger.warn(TAG, 'Failed to send decline notification', { err })
  );

  void import('@modules/supporting/audit').then(({ log }) =>
    log({
      action: 'offer.declined',
      resourceType: 'Offer',
      resourceId: final.id,
      organizationId: null,
      actorId: null,
      actorType: 'system',
      metadata: { ip, userAgent, comment },
    }).catch((err: unknown) => logger.warn(TAG, 'Audit log failed for offer.declined', { err }))
  );

  logger.info(TAG, `Offer declined: ${final.id}`);
  return final;
}

export async function acceptOffer(id: string, orgId: string): Promise<Offer | null> {
  const existing = await offersRepository.findById(id, orgId);
  if (!existing) return null;

  if (existing.status !== 'sent' && existing.status !== 'viewed') {
    return null;
  }

  const updated = await offersRepository.update(id, orgId, {
    status: 'accepted',
    acceptedAt: new Date(),
    signerName: existing.recipientName,
  });
  if (!updated) return null;

  eventBus.publish({
    type: OFFER_ACCEPTED,
    orgId,
    occurredAt: new Date().toISOString(),
    payload: {
      offerId: updated.id,
      totalIncVat: updated.totalIncVat,
      leadId: updated.leadId,
    },
  });

  if (updated.leadId) {
    const { updateLead } = await import('@modules/supporting/leads');
    await updateLead(updated.leadId, orgId, { status: 'won' }, 'system').catch((err: unknown) =>
      logger.warn(TAG, 'Failed to auto-update lead on offer acceptance', { err })
    );
  }

  const org = await identityService.getOrg(orgId).catch(() => null);
  await dispatchCreatorNotification(
    buildCreatorNotificationPayload(updated, 'signed', {
      senderEmail: org?.senderEmail,
      senderName: org?.senderName,
    }),
  ).catch((err: unknown) =>
    logger.warn(TAG, 'Failed to send creator notification for internal acceptance', { err })
  );

  logger.info(TAG, `Offer accepted: ${id}`, { totalIncVat: updated.totalIncVat });
  void persistPublicOfferPdfSnapshot(updated);
  return updated;
}

export async function declineOffer(id: string, orgId: string): Promise<Offer | null> {
  const updated = await offersRepository.update(id, orgId, {
    status: 'declined',
    declinedAt: new Date(),
  });
  if (!updated) return null;

  eventBus.publish({
    type: OFFER_DECLINED,
    orgId,
    occurredAt: new Date().toISOString(),
    payload: { offerId: updated.id },
  });

  logger.info(TAG, `Offer declined: ${id}`);
  return updated;
}

export async function deleteOffer(id: string, orgId: string): Promise<boolean> {
  const deleted = await offersRepository.softDelete(id, orgId);
  if (deleted) logger.info(TAG, `Offer deleted: ${id}`);
  return deleted;
}

export interface BulkSendResult {
  sent: number;
  failed: number;
  errors: Array<{ id: string; error: string }>;
}

export async function bulkSendOffers(
  ids: string[],
  orgId: string,
): Promise<BulkSendResult> {
  const results = await Promise.allSettled(ids.map((currentId) => sendOffer(currentId, orgId)));

  let sent = 0;
  let failed = 0;
  const errors: BulkSendResult['errors'] = [];

  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    if (result.status === 'fulfilled' && result.value) {
      sent++;
    } else {
      failed++;
      const reason = result.status === 'rejected' ? String(result.reason) : 'Offer not found or already sent';
      errors.push({ id: ids[i], error: reason });
    }
  }

  logger.info(TAG, `Bulk send: ${sent} sent, ${failed} failed`, { orgId });
  return { sent, failed, errors };
}

export async function expireStaleOffers(): Promise<number> {
  const count = await offersRepository.bulkExpireOffers();
  if (count > 0) logger.info(TAG, `Expired ${count} stale offers`);
  return count;
}

export async function duplicateOffer(
  id: string,
  orgId: string,
  actorId: string,
): Promise<Offer | null> {
  const existing = await offersRepository.findById(id, orgId);
  if (!existing) return null;

  const copy = await offersRepository.create({
    organizationId: orgId,
    createdBy: actorId,
    title: `${existing.title} (kopia)`,
    priceDisplayMode: existing.priceDisplayMode,
    recipientName: existing.recipientName,
    recipientEmail: existing.recipientEmail,
    recipientCompany: existing.recipientCompany,
    notes: existing.notes,
    validUntil: new Date(existing.validUntil),
    validityDays: existing.validityDays,
    leadId: existing.leadId,
    customerId: existing.customerId,
    companyId: existing.companyId,
    templateId: existing.templateId,
    emailSubject: existing.emailSubject,
    emailBody: existing.emailBody,
    emailHeaderConfig: existing.emailHeaderConfig,
    lineItems: existing.lineItems.map((item, idx) => ({
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      vatRate: item.vatRate,
      discount: item.discount ?? 0,
      productId: item.productId,
      unit: item.unit,
      sortOrder: idx,
    })),
  });

  logger.info(TAG, `Offer duplicated: ${id} -> ${copy.id}`);
  return copy;
}

export async function sendOfferReminder(id: string, orgId: string): Promise<Offer | null> {
  const existing = await offersRepository.findById(id, orgId);
  if (!existing) return null;

  if (existing.status !== 'sent' && existing.status !== 'viewed') return null;

  if (existing.reminderSentAt) {
    const cooldownMs = 3 * 24 * 60 * 60 * 1000;
    if (new Date().getTime() - new Date(existing.reminderSentAt).getTime() < cooldownMs) {
      return null;
    }
  }

  const [org, company] = await Promise.all([
    identityService.getOrg(orgId),
    existing.companyId ? companiesRepository.getById(existing.companyId, orgId) : Promise.resolve(null),
  ]);
  const responsible = await getOfferResponsibleUser(existing.createdBy);
  const branding = resolveOfferBranding(company, org, responsible);
  const senderInfo = { senderEmail: branding.senderEmail, senderName: branding.senderName };

  const publicUrl = `${process.env.PUBLIC_OFFER_BASE_URL ?? `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/offerter/publik`}/${existing.publicToken}`;
  const reminderPayload = buildReminderPayload(
    {
      ...existing,
      reminderCount: (existing.reminderCount ?? 0) + 1,
    },
    publicUrl,
    senderInfo,
  );
  await dispatchReminderEmail(reminderPayload);

  const updated = await offersRepository.update(id, orgId, {
    reminderSentAt: new Date(),
    reminderCount: reminderPayload.reminderCount,
  });
  if (!updated) return null;

  logger.info(TAG, `Reminder sent for offer: ${id}`, { reminderCount: updated.reminderCount });
  return updated;
}
