import { logger }    from '@core/logging/logger';
import { eventBus }  from '@core/events';
import { offersRepository } from '../infrastructure/offers.repository';
import type { CreateOfferInput, UpdateOfferInput, ListOffersFilter } from '../infrastructure/offers.repository';
import type { Offer } from '../domain/offer.entity';
import {
  OFFER_CREATED,
  OFFER_SENT,
  OFFER_ACCEPTED,
  OFFER_DECLINED,
} from '../events/offer.events';

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
  const updated = await offersRepository.update(id, orgId, {
    status: 'sent',
    sentAt: new Date(),
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

  logger.info(TAG, `Offer sent: ${id}`, { recipientEmail: updated.recipientEmail });
  return updated;
}

// ─── acceptOffer ──────────────────────────────────────────────────────────────

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

  // Auto-update linked lead to 'won'
  if (updated.leadId) {
    const { updateLead } = await import('@modules/supporting/leads');
    await updateLead(updated.leadId, orgId, { status: 'won' }).catch((err: unknown) =>
      logger.warn(TAG, 'Failed to auto-update lead on offer acceptance', { err })
    );
  }

  logger.info(TAG, `Offer accepted: ${id}`, { totalIncVat: updated.totalIncVat });
  return updated;
}

// ─── declineOffer ─────────────────────────────────────────────────────────────

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
