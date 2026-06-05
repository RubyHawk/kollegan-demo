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
import { interpolateEmailText, sanitizeGeneratedOfferDocument } from './document-generator';
import { templatesRepository } from '../infrastructure/templates.repository';
import { companiesRepository } from '../infrastructure/companies.repository';
import { offerBrandingRepository } from '../infrastructure/offer-branding.repository';
import { resolveOfferBranding } from './company-branding';
import { dispatchCreatorNotification, dispatchOfferEmail, dispatchReminderEmail } from './offer-email-dispatch';
import { summarizeOfferPricing, type OfferPricingSummary } from '../domain/pricing';
import { assertOfferReadyForSend } from './publish-validation';
import { markLinkedLeadWon } from './offer-side-effects';
import { resolveGeneratedDocumentForSend, resolveOfferSendWindow } from './offer-send-window';
import { validateOfferCustomFields } from './custom-fields-validation';
import {
  getActorOrganizationId,
  getOfferResponsibleUser,
  OFFERS_SERVICE_TAG,
  persistPublicOfferPdfSnapshot,
  resolveOfferBrandingForOfferData,
} from './offer-service-support';

export type { CreateOfferInput, UpdateOfferInput, ListOffersFilter };
export { applyProductUnitsToOffer } from './offer-product-units';
export { resolveGeneratedDocumentForSend, resolveOfferSendWindow } from './offer-send-window';
export {
  declineOfferByToken,
  markOfferViewed,
  signOffer,
  viewOffer,
} from './public-offer-actions.service';

export interface StaffOfferDetail {
  offer: Offer;
  renderedDocument: string | null;
  pricing: OfferPricingSummary;
}

export type StaffOfferAcceptResult = 'accepted' | 'no_org' | 'not_accepted';

const TAG = OFFERS_SERVICE_TAG;

export async function createOffer(
  input: CreateOfferInput,
  actorId: string,
): Promise<Offer> {
  await validateOfferCustomFields(input.organizationId, input.customFields);

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

export async function getStaffOfferDetail(offerId: string, actorUserId: string): Promise<StaffOfferDetail | null> {
  const orgId = await getActorOrganizationId(actorUserId);
  if (!orgId) return null;

  const offer = await getOffer(offerId, orgId);
  if (!offer) return null;

  const branding = await resolveOfferBrandingForOfferData(offer);
  const renderedDocument = offer.generatedDocument
    ? sanitizeGeneratedOfferDocument(offer.generatedDocument, offer, branding)
    : null;

  return {
    offer,
    renderedDocument,
    pricing: summarizeOfferPricing(offer.lineItems, offer.priceDisplayMode),
  };
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
  await validateOfferCustomFields(orgId, input.customFields);

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
    offerBrandingRepository.findOrganizationProfile(orgId),
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

  await markLinkedLeadWon(updated.leadId, orgId);

  const org = await offerBrandingRepository.findOrganizationProfile(orgId).catch(() => null);
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

export async function acceptOfferOnBehalfForStaff(
  id: string,
  actorUserId: string,
): Promise<StaffOfferAcceptResult> {
  const orgId = await getActorOrganizationId(actorUserId);
  if (!orgId) return 'no_org';

  const accepted = await acceptOffer(id, orgId);
  return accepted ? 'accepted' : 'not_accepted';
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
    offerBrandingRepository.findOrganizationProfile(orgId),
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
