/**
 * Automation module — cross-domain event listeners.
 *
 * Subscribes to domain events published by other modules and reacts to them.
 * This is where domain events become automation triggers.
 *
 * Phase 1 (now):   Log the event. Show the wiring is alive.
 * Phase 2 (next):  Look up active workflows with matching EventTrigger and run them.
 *
 * Called once at startup from instrumentation.ts. Never import this at module
 * scope — it has side effects (attaches listeners to the global event bus).
 */

import { eventBus } from '@core/events';
import { logger }   from '@core/logging/logger';

import {
  ROOM_LOCKED,
  ROOM_BOOKED,
  ROOM_CANCELLED,
  ROOM_QUERIED,
} from '@features/hotel/rooms/events';

import {
  CRM_CONTACT_UPSERTED,
  CRM_RECORD_CREATED,
} from '@features/crm/events';

import type { RoomLockedEvent, RoomBookedEvent, RoomCancelledEvent, RoomQueriedEvent } from '@features/hotel/rooms/events';
import type { CrmContactUpsertedEvent, CrmRecordCreatedEvent } from '@features/crm/events';

const TAG = 'AutomationListeners';

export function registerAutomationListeners(): void {

  // ─── Hotel room events ────────────────────────────────────────────────────────

  eventBus.subscribe<RoomLockedEvent>(ROOM_LOCKED, async (event) => {
    logger.info(TAG, `[${ROOM_LOCKED}] Room ${event.payload.roomId} locked`, {
      orgId: event.orgId,
    });
    // Phase 2: await automationEngine.triggerByEvent(event);
  });

  eventBus.subscribe<RoomBookedEvent>(ROOM_BOOKED, async (event) => {
    logger.info(TAG, `[${ROOM_BOOKED}] Room ${event.payload.roomId} booked for ${event.payload.guestName}`, {
      orgId: event.orgId,
    });
    // Phase 2: trigger confirmation email workflow, upsell workflow, etc.
    // await automationEngine.triggerByEvent(event);
  });

  eventBus.subscribe<RoomCancelledEvent>(ROOM_CANCELLED, async (event) => {
    logger.info(TAG, `[${ROOM_CANCELLED}] Room ${event.payload.roomId} cancelled`, {
      orgId: event.orgId,
    });
    // Phase 2: trigger cancellation email workflow, re-availability notification, etc.
  });

  eventBus.subscribe<RoomQueriedEvent>(ROOM_QUERIED, async (event) => {
    logger.info(TAG, `[${ROOM_QUERIED}] Availability queried — ${event.payload.availableCount} rooms available`, {
      orgId: event.orgId,
    });
  });

  // ─── CRM events ───────────────────────────────────────────────────────────────

  eventBus.subscribe<CrmContactUpsertedEvent>(CRM_CONTACT_UPSERTED, async (event) => {
    logger.info(TAG, `[${CRM_CONTACT_UPSERTED}] Contact ${event.payload.customerId} upserted (isNew=${event.payload.isNew})`, {
      orgId: event.orgId,
    });
    // Phase 2: if event.payload.isNew → trigger welcome workflow, lead scoring, etc.
  });

  eventBus.subscribe<CrmRecordCreatedEvent>(CRM_RECORD_CREATED, async (event) => {
    logger.info(TAG, `[${CRM_RECORD_CREATED}] CRM record ${event.payload.crmRecordId} created`, {
      orgId: event.orgId,
      bookedRooms: event.payload.bookedRooms,
    });
    // Phase 2: trigger post-call workflow:
    //   → send confirmation email
    //   → notify Slack channel
    //   → score lead
    //   → update Google Calendar description
  });

  logger.info(TAG, 'Automation listeners registered');
}
