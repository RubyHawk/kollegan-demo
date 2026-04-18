import { eventBus } from '@platform/events';
import { logger } from '@platform/logging/logger';
import { OFFER_ACCEPTED, type OfferAcceptedEvent } from '@modules/supporting/offers';
import { createProjectFromOffer } from '../application/projects.service';

let registered = false;
const TAG = 'ProjectOfferAcceptedSubscriber';

export function registerProjectEventSubscribers(): void {
  if (registered) return;
  registered = true;

  eventBus.subscribe<OfferAcceptedEvent>(OFFER_ACCEPTED, async (event) => {
    await createProjectFromOffer(event.payload.offerId, event.orgId);
    logger.info(TAG, `Handled ${OFFER_ACCEPTED}`, { offerId: event.payload.offerId, orgId: event.orgId });
  });
}
