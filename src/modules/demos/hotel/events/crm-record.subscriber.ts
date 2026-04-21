import { eventBus } from '@platform/events';
import { logger } from '@platform/logging/logger';
import {
  CRM_RECORD_CREATED,
  type CrmRecordCreatedEvent,
} from '@modules/supporting/crm';
import { logActivity } from '../infrastructure/room-store';

const TAG = 'HotelCrmRecordSubscriber';

let registered = false;

export function registerHotelCrmEventSubscribers(): void {
  if (registered) return;
  registered = true;

  eventBus.subscribe<CrmRecordCreatedEvent>(CRM_RECORD_CREATED, async (event) => {
    const { contact, displayName, summary } = event.payload;
    if (!contact) return;

    logActivity({
      type: 'crm_contact',
      message: summary
        ? `Kundprofil: ${displayName ?? 'Okänd gäst'} - ${summary}`
        : `Kundprofil insamlad för ${displayName ?? 'Okänd gäst'}.`,
      metadata: contact,
    });
  });

  logger.info(TAG, 'Registered hotel CRM event subscribers');
}
