import { eventBus } from '@platform/events';
import { logger } from '@platform/logging/logger';
import { offerSideEffectsRepository } from '../infrastructure/offer-side-effects.repository';
import { OFFERS_SERVICE_TAG } from './offer-service-support';

const LEAD_STAGE_CHANGED = 'leads.lead.stage_changed' as const;

export async function markLinkedLeadWon(
  leadId: string | undefined,
  organizationId: string,
  actorId = 'system',
): Promise<void> {
  if (!leadId) return;

  try {
    const result = await offerSideEffectsRepository.markLeadWon(leadId, organizationId, actorId);
    if (!result.updated || !result.fromStatus) return;

    eventBus.publish({
      type: LEAD_STAGE_CHANGED,
      orgId: organizationId,
      occurredAt: new Date().toISOString(),
      payload: {
        leadId,
        fromStatus: result.fromStatus,
        toStatus: 'won',
        actorId,
      },
    });
  } catch (err) {
    logger.warn(OFFERS_SERVICE_TAG, 'Failed to auto-update linked lead after offer transition', { err, leadId });
  }
}

export function recordPublicOfferAudit(
  action: 'offer.viewed' | 'offer.signed' | 'offer.declined',
  offerId: string,
  metadata: Record<string, string | undefined>,
): void {
  void offerSideEffectsRepository.appendPublicOfferAudit(action, offerId, metadata).catch((err: unknown) =>
    logger.warn(OFFERS_SERVICE_TAG, `Audit log failed for ${action}`, { err, offerId })
  );
}
