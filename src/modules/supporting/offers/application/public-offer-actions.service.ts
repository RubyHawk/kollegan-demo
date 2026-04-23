import { eventBus } from '@platform/events';
import { logger } from '@platform/logging/logger';
import type { Offer } from '../domain/offer.entity';
import { OFFER_ACCEPTED, OFFER_DECLINED } from '../events/offer.events';
import { offerBrandingRepository } from '../infrastructure/offer-branding.repository';
import { offersRepository } from '../infrastructure/offers.repository';
import { buildCreatorNotificationPayload } from './offer-email';
import { dispatchCreatorNotification } from './offer-email-dispatch';
import { enrichOfferLineItemUnits } from './offer-product-units';
import { markLinkedLeadWon, recordPublicOfferAudit } from './offer-side-effects';
import { OFFERS_SERVICE_TAG, persistPublicOfferPdfSnapshot } from './offer-service-support';

function isPublicOfferExpired(offer: Offer): boolean {
  return Boolean(offer.publicTokenExpiresAt && new Date(offer.publicTokenExpiresAt) < new Date());
}

function canCustomerRespondToOffer(offer: Offer): boolean {
  return offer.status === 'sent' || offer.status === 'viewed';
}

export async function viewOffer(
  publicToken: string,
): Promise<Offer | null> {
  const existing = await offersRepository.findByPublicToken(publicToken);
  if (!existing) return null;

  if (isPublicOfferExpired(existing)) {
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

  if (isPublicOfferExpired(existing)) {
    return null;
  }

  let updated = existing;
  if (existing.status === 'sent') {
    updated = (await offersRepository.updateById(existing.id, {
      status: 'viewed',
      viewedAt: new Date(),
    })) ?? existing;
  }

  recordPublicOfferAudit('offer.viewed', existing.id, { ip, userAgent });

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

  if (isPublicOfferExpired(existing)) {
    return null;
  }

  if (!canCustomerRespondToOffer(existing)) {
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

  await markLinkedLeadWon(final.leadId, final.organizationId);

  const org = await offerBrandingRepository.findOrganizationProfile(final.organizationId).catch(() => null);
  await dispatchCreatorNotification(
    buildCreatorNotificationPayload(final, 'signed', {
      senderEmail: org?.senderEmail,
      senderName: org?.senderName,
    }),
  ).catch((err: unknown) =>
    logger.warn(OFFERS_SERVICE_TAG, 'Failed to send creator notification', { err })
  );

  recordPublicOfferAudit('offer.signed', final.id, { ip, userAgent });

  logger.info(OFFERS_SERVICE_TAG, `Offer signed: ${final.id}`);
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

  if (isPublicOfferExpired(existing)) {
    return null;
  }

  if (!canCustomerRespondToOffer(existing)) {
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

  const org = await offerBrandingRepository.findOrganizationProfile(final.organizationId).catch(() => null);
  await dispatchCreatorNotification(
    buildCreatorNotificationPayload(final, 'declined', {
      comment,
      senderEmail: org?.senderEmail,
      senderName: org?.senderName,
    }),
  ).catch((err: unknown) =>
    logger.warn(OFFERS_SERVICE_TAG, 'Failed to send decline notification', { err })
  );

  recordPublicOfferAudit('offer.declined', final.id, { ip, userAgent, comment });

  logger.info(OFFERS_SERVICE_TAG, `Offer declined: ${final.id}`);
  return final;
}
