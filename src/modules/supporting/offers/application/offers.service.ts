import { logger }    from '@platform/logging/logger';
import { eventBus }  from '@platform/events';
import { offersRepository } from '../infrastructure/offers.repository';
import type { CreateOfferInput, UpdateOfferInput, ListOffersFilter } from '../infrastructure/offers.repository';
import type { Offer } from '../domain/offer.entity';
import {
  OFFER_CREATED,
  OFFER_SENT,
  OFFER_ACCEPTED,
  OFFER_DECLINED,
} from '../events/offer.events';
import { enqueueOfferEmail, enqueueCreatorNotification, enqueueReminderEmail } from './offer-email';
import { generateDocument, generateFallbackDocument, interpolateEmailText } from './document-generator';
import { templatesRepository } from '../infrastructure/templates.repository';

export type { CreateOfferInput, UpdateOfferInput, ListOffersFilter };

const TAG = 'OffersService';

// ─── createOffer ──────────────────────────────────────────────────────────────

export async function createOffer(
  input: CreateOfferInput,
  actorId: string,
): Promise<Offer> {
  const offer = await offersRepository.create({ ...input, createdBy: actorId });

  eventBus.publish({
    type:       OFFER_CREATED,
    orgId:      input.organizationId,
    occurredAt: new Date().toISOString(),
    payload: {
      offerId:        offer.id,
      title:          offer.title,
      recipientEmail: offer.recipientEmail,
      leadId:         offer.leadId,
    },
  });

  logger.info(TAG, `Offer created: ${offer.title}`, { offerId: offer.id, orgId: input.organizationId });
  return offer;
}

// ─── getOffer ─────────────────────────────────────────────────────────────────

export async function getOffer(id: string, orgId: string): Promise<Offer | null> {
  return offersRepository.findById(id, orgId);
}

// ─── listOffers ───────────────────────────────────────────────────────────────

export async function listOffers(
  orgId: string,
  filter: ListOffersFilter,
): Promise<{ offers: Offer[]; total: number }> {
  return offersRepository.list(orgId, filter);
}

// ─── updateOffer ──────────────────────────────────────────────────────────────

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

// ─── sendOffer ────────────────────────────────────────────────────────────────

export async function sendOffer(id: string, orgId: string): Promise<Offer | null> {
  const existing = await offersRepository.findById(id, orgId);
  if (!existing) return null;

  // Generate document snapshot (always, if not already set)
  let generatedDocument: string | undefined;
  let emailSubject: string | undefined = existing.emailSubject;
  let emailBody: string | undefined = existing.emailBody;

  if (!existing.generatedDocument) {
    if (existing.templateId) {
      const template = await templatesRepository.findById(existing.templateId, orgId);
      if (template) {
        generatedDocument = generateDocument(template.content, existing);
        // Inherit email fields from template if not already set on the offer
        if (!emailSubject && template.emailSubject) emailSubject = template.emailSubject;
        if (!emailBody && template.emailBody)       emailBody    = template.emailBody;
      }
    }
    // No template (or template not found) → generate a clean fallback document
    if (!generatedDocument) {
      generatedDocument = generateFallbackDocument(existing);
    }
  }

  // Assign sequential offer number on first send
  let offerNumber = existing.offerNumber;
  if (!offerNumber) {
    offerNumber = await offersRepository.getNextOfferNumber(orgId);
  }

  const sentAt = new Date();
  // Recompute validUntil from sentAt so the period is always measured from send time
  const validUntil = new Date(sentAt.getTime() + (existing.validityDays ?? 30) * 24 * 60 * 60 * 1000);
  // Public token expires at the same time as the offer validity
  const publicTokenExpiresAt = validUntil;

  // Interpolate email fields with offer data (placeholders → actual values)
  const interpolatedSubject = emailSubject ? interpolateEmailText(emailSubject, existing) : undefined;
  const interpolatedBody    = emailBody    ? interpolateEmailText(emailBody, existing)    : undefined;

  const updated = await offersRepository.update(id, orgId, {
    status: 'sent',
    sentAt,
    offerNumber,
    validUntil,
    ...(generatedDocument ? { generatedDocument } : {}),
    ...(interpolatedSubject !== undefined ? { emailSubject: interpolatedSubject } : {}),
    ...(interpolatedBody    !== undefined ? { emailBody: interpolatedBody }       : {}),
    publicTokenExpiresAt,
  });
  if (!updated) return null;

  eventBus.publish({
    type:       OFFER_SENT,
    orgId,
    occurredAt: new Date().toISOString(),
    payload: {
      offerId:        updated.id,
      recipientEmail: updated.recipientEmail,
      totalIncVat:    updated.totalIncVat,
    },
  });

  // Enqueue email (non-blocking)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const publicUrl = `${appUrl}/offers/public/${updated.publicToken}`;
  await enqueueOfferEmail(updated, publicUrl).catch((err: unknown) =>
    logger.warn(TAG, 'Failed to enqueue offer email', { err })
  );

  logger.info(TAG, `Offer sent: ${id}`, { recipientEmail: updated.recipientEmail });
  return updated;
}

// ─── viewOffer (public — triggered when recipient opens the offer) ─────────────

export async function viewOffer(
  publicToken: string,
  ip: string,
  userAgent: string,
): Promise<Offer | null> {
  const existing = await offersRepository.findByPublicToken(publicToken);
  if (!existing) return null;

  // Check token expiration
  if (existing.publicTokenExpiresAt && new Date(existing.publicTokenExpiresAt) < new Date()) {
    return null; // caller should return 410 Gone
  }

  // Mark as viewed if currently in 'sent' state
  let updated = existing;
  if (existing.status === 'sent') {
    updated = (await offersRepository.updateById(existing.id, {
      status:   'viewed',
      viewedAt: new Date(),
    })) ?? existing;
  }

  // Audit log (fire-and-forget — compliance but non-blocking)
  void import('@modules/supporting/audit').then(({ log }) =>
    log({
      action:        'offer.viewed',
      resourceType:  'Offer',
      resourceId:    existing.id,
      organizationId: null,
      actorId:       null,
      actorType:     'system',
      metadata:      { ip, userAgent },
    }).catch((err: unknown) => logger.warn(TAG, 'Audit log failed for offer.viewed', { err }))
  );

  return updated;
}

// ─── signOffer (public — recipient submits signature) ─────────────────────────

/**
 * e-Signature legal status:
 * - Under eIDAS Article 25, canvas-drawn signatures are "simple electronic
 *   signatures" (SES). They are legally admissible in Swedish courts and
 *   sufficient for most B2B contracts under avtalslagen (1915:218).
 * - SES is NOT sufficient for: real estate, certain financial instruments,
 *   or contracts requiring "qualified electronic signatures" (QES).
 * - For higher assurance, integrate BankID (Swedish e-ID) for advanced
 *   electronic signatures (AdES) — see signatureMethod field.
 */
export async function signOffer(
  publicToken: string,
  signatureImage: string,
  ip: string,
  userAgent: string,
  signerName?: string,
): Promise<Offer | null> {
  const existing = await offersRepository.findByPublicToken(publicToken);
  if (!existing) return null;

  // Check expiration
  if (existing.publicTokenExpiresAt && new Date(existing.publicTokenExpiresAt) < new Date()) {
    return null;
  }

  // Only allow signing if status is sent or viewed
  if (existing.status !== 'sent' && existing.status !== 'viewed') {
    return null;
  }

  const final = await offersRepository.updateById(existing.id, {
    status:         'accepted',
    acceptedAt:     new Date(),
    signatureImage,
    ...(signerName ? { signerName } : {}),
  });
  if (!final) return null;

  eventBus.publish({
    type:       OFFER_ACCEPTED,
    orgId:      '', // orgId not available in public context; subscribers handle gracefully
    occurredAt: new Date().toISOString(),
    payload: {
      offerId:     final.id,
      totalIncVat: final.totalIncVat,
      leadId:      final.leadId,
    },
  });

  // Auto-update linked lead to 'won'
  if (final.leadId) {
    const { updateLead } = await import('@modules/supporting/leads');
    await updateLead(final.leadId, '', { status: 'won' }, 'system').catch((err: unknown) =>
      logger.warn(TAG, 'Failed to auto-update lead on offer signature', { err })
    );
  }

  // Notify creator
  await enqueueCreatorNotification(final, 'signed').catch((err: unknown) =>
    logger.warn(TAG, 'Failed to enqueue creator notification', { err })
  );

  // Audit log
  void import('@modules/supporting/audit').then(({ log }) =>
    log({
      action:        'offer.signed',
      resourceType:  'Offer',
      resourceId:    final.id,
      organizationId: null,
      actorId:       null,
      actorType:     'system',
      metadata:      { ip, userAgent },
    }).catch((err: unknown) => logger.warn(TAG, 'Audit log failed for offer.signed', { err }))
  );

  logger.info(TAG, `Offer signed: ${final.id}`);
  return final;
}

// ─── declineOfferByToken (public) ─────────────────────────────────────────────

export async function declineOfferByToken(
  publicToken: string,
  comment: string | undefined,
  ip: string,
  userAgent: string,
): Promise<Offer | null> {
  const existing = await offersRepository.findByPublicToken(publicToken);
  if (!existing) return null;

  // Check expiration
  if (existing.publicTokenExpiresAt && new Date(existing.publicTokenExpiresAt) < new Date()) {
    return null;
  }

  if (existing.status !== 'sent' && existing.status !== 'viewed') {
    return null;
  }

  const final = await offersRepository.updateById(existing.id, {
    status:     'declined',
    declinedAt: new Date(),
  });
  if (!final) return null;

  eventBus.publish({
    type:       OFFER_DECLINED,
    orgId:      '',
    occurredAt: new Date().toISOString(),
    payload:    { offerId: final.id },
  });

  await enqueueCreatorNotification(final, 'declined', { comment }).catch((err: unknown) =>
    logger.warn(TAG, 'Failed to enqueue decline notification', { err })
  );

  // Audit log
  void import('@modules/supporting/audit').then(({ log }) =>
    log({
      action:        'offer.declined',
      resourceType:  'Offer',
      resourceId:    final.id,
      organizationId: null,
      actorId:       null,
      actorType:     'system',
      metadata:      { ip, userAgent, comment },
    }).catch((err: unknown) => logger.warn(TAG, 'Audit log failed for offer.declined', { err }))
  );

  logger.info(TAG, `Offer declined: ${final.id}`);
  return final;
}

// ─── acceptOffer (internal — staff action) ────────────────────────────────────

export async function acceptOffer(id: string, orgId: string): Promise<Offer | null> {
  const updated = await offersRepository.update(id, orgId, {
    status: 'accepted',
    acceptedAt: new Date(),
  });
  if (!updated) return null;

  eventBus.publish({
    type:       OFFER_ACCEPTED,
    orgId,
    occurredAt: new Date().toISOString(),
    payload: {
      offerId:     updated.id,
      totalIncVat: updated.totalIncVat,
      leadId:      updated.leadId,
    },
  });

  if (updated.leadId) {
    const { updateLead } = await import('@modules/supporting/leads');
    await updateLead(updated.leadId, orgId, { status: 'won' }, 'system').catch((err: unknown) =>
      logger.warn(TAG, 'Failed to auto-update lead on offer acceptance', { err })
    );
  }

  logger.info(TAG, `Offer accepted: ${id}`, { totalIncVat: updated.totalIncVat });
  return updated;
}

// ─── declineOffer (internal — staff action) ───────────────────────────────────

export async function declineOffer(id: string, orgId: string): Promise<Offer | null> {
  const updated = await offersRepository.update(id, orgId, {
    status: 'declined',
    declinedAt: new Date(),
  });
  if (!updated) return null;

  eventBus.publish({
    type:       OFFER_DECLINED,
    orgId,
    occurredAt: new Date().toISOString(),
    payload: { offerId: updated.id },
  });

  logger.info(TAG, `Offer declined: ${id}`);
  return updated;
}

// ─── deleteOffer ──────────────────────────────────────────────────────────────

export async function deleteOffer(id: string, orgId: string): Promise<boolean> {
  const deleted = await offersRepository.softDelete(id, orgId);
  if (deleted) logger.info(TAG, `Offer deleted: ${id}`);
  return deleted;
}

// ─── bulkSendOffers ───────────────────────────────────────────────────────────

export interface BulkSendResult {
  sent:   number;
  failed: number;
  errors: Array<{ id: string; error: string }>;
}

export async function bulkSendOffers(
  ids: string[],
  orgId: string,
): Promise<BulkSendResult> {
  const results = await Promise.allSettled(ids.map((id) => sendOffer(id, orgId)));

  let sent   = 0;
  let failed = 0;
  const errors: BulkSendResult['errors'] = [];

  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    if (r.status === 'fulfilled' && r.value) {
      sent++;
    } else {
      failed++;
      const reason = r.status === 'rejected' ? String(r.reason) : 'Offer not found or already sent';
      errors.push({ id: ids[i], error: reason });
    }
  }

  logger.info(TAG, `Bulk send: ${sent} sent, ${failed} failed`, { orgId });
  return { sent, failed, errors };
}

// ─── expireStaleOffers (cron) ─────────────────────────────────────────────────

export async function expireStaleOffers(): Promise<number> {
  const count = await offersRepository.bulkExpireOffers();
  if (count > 0) logger.info(TAG, `Expired ${count} stale offers`);
  return count;
}

// ─── duplicateOffer ───────────────────────────────────────────────────────────

export async function duplicateOffer(
  id: string,
  orgId: string,
  actorId: string,
): Promise<Offer | null> {
  const existing = await offersRepository.findById(id, orgId);
  if (!existing) return null;

  const copy = await offersRepository.create({
    organizationId:   orgId,
    createdBy:        actorId,
    title:            `${existing.title} (kopia)`,
    recipientName:    existing.recipientName,
    recipientEmail:   existing.recipientEmail,
    recipientCompany: existing.recipientCompany,
    notes:            existing.notes,
    validUntil:       new Date(existing.validUntil),
    validityDays:     existing.validityDays,
    leadId:           existing.leadId,
    customerId:       existing.customerId,
    templateId:       existing.templateId,
    emailSubject:     existing.emailSubject,
    emailBody:        existing.emailBody,
    lineItems:        existing.lineItems.map((item, idx) => ({
      description: item.description,
      quantity:    item.quantity,
      unitPrice:   item.unitPrice,
      vatRate:     item.vatRate,
      discount:    item.discount ?? 0,
      sortOrder:   idx,
    })),
  });

  logger.info(TAG, `Offer duplicated: ${id} → ${copy.id}`);
  return copy;
}

// ─── sendOfferReminder ────────────────────────────────────────────────────────

export async function sendOfferReminder(id: string, orgId: string): Promise<Offer | null> {
  const existing = await offersRepository.findById(id, orgId);
  if (!existing) return null;

  // Only remind on sent/viewed offers
  if (existing.status !== 'sent' && existing.status !== 'viewed') return null;

  // Enforce 3-day cooldown between reminders
  if (existing.reminderSentAt) {
    const cooldownMs = 3 * 24 * 60 * 60 * 1000;
    if (new Date().getTime() - new Date(existing.reminderSentAt).getTime() < cooldownMs) {
      return null; // too soon
    }
  }

  const updated = await offersRepository.update(id, orgId, {
    reminderSentAt: new Date(),
    reminderCount:  (existing.reminderCount ?? 0) + 1,
  });
  if (!updated) return null;

  const appUrl   = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const publicUrl = `${appUrl}/offers/public/${updated.publicToken}`;
  await enqueueReminderEmail(updated, publicUrl).catch((err: unknown) =>
    logger.warn(TAG, 'Failed to enqueue reminder email', { err })
  );

  logger.info(TAG, `Reminder sent for offer: ${id}`, { reminderCount: updated.reminderCount });
  return updated;
}
