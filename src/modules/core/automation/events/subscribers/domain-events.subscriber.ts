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
 *
 * ARCHITECTURE NOTE: This file must NEVER import from other feature modules
 * (hotel, crm, leads, etc.). Automation is a core domain — it depends on
 * zero supporting or generic modules. Subscribe by event type string only;
 * use DomainEvent and EventTypes from @core/events for typing.
 */

import { eventBus, EventTypes } from '@core/events';
import { logger }               from '@core/logging/logger';
import type { DomainEvent }     from '@core/events';

const TAG = 'AutomationListeners';

export function registerAutomationListeners(): void {

  // ─── Hotel room events ────────────────────────────────────────────────────────

  eventBus.subscribe(EventTypes.ROOM_LOCKED, async (event: DomainEvent) => {
    const { roomId } = event.payload as { roomId: string };
    logger.info(TAG, `[${EventTypes.ROOM_LOCKED}] Room ${roomId} locked`, { orgId: event.orgId });
    // Phase 2: await automationEngine.triggerByEvent(event);
  });

  eventBus.subscribe(EventTypes.ROOM_BOOKED, async (event: DomainEvent) => {
    const { roomId, guestName } = event.payload as { roomId: string; guestName: string };
    logger.info(TAG, `[${EventTypes.ROOM_BOOKED}] Room ${roomId} booked for ${guestName}`, { orgId: event.orgId });
    // Phase 2: trigger confirmation email workflow, upsell workflow, etc.
  });

  eventBus.subscribe(EventTypes.ROOM_CANCELLED, async (event: DomainEvent) => {
    const { roomId } = event.payload as { roomId: string };
    logger.info(TAG, `[${EventTypes.ROOM_CANCELLED}] Room ${roomId} cancelled`, { orgId: event.orgId });
    // Phase 2: trigger cancellation workflow, re-availability notification, etc.
  });

  eventBus.subscribe(EventTypes.ROOM_QUERIED, async (event: DomainEvent) => {
    const { availableCount } = event.payload as { availableCount: number };
    logger.info(TAG, `[${EventTypes.ROOM_QUERIED}] Availability queried — ${availableCount} rooms available`, { orgId: event.orgId });
  });

  // ─── CRM events ───────────────────────────────────────────────────────────────

  eventBus.subscribe(EventTypes.CONTACT_UPSERTED, async (event: DomainEvent) => {
    const { customerId, isNew } = event.payload as { customerId: string; isNew: boolean };
    logger.info(TAG, `[${EventTypes.CONTACT_UPSERTED}] Contact ${customerId} upserted (isNew=${isNew})`, { orgId: event.orgId });
    // Phase 2: if isNew → trigger welcome workflow, lead scoring, etc.
  });

  eventBus.subscribe(EventTypes.RECORD_CREATED, async (event: DomainEvent) => {
    const { crmRecordId, bookedRooms } = event.payload as { crmRecordId: string; bookedRooms: string[] };
    logger.info(TAG, `[${EventTypes.RECORD_CREATED}] CRM record ${crmRecordId} created`, { orgId: event.orgId, bookedRooms });
    // Phase 2: trigger post-call workflow:
    //   → send confirmation email
    //   → notify Slack channel
    //   → score lead
    //   → update Google Calendar description
  });

  logger.info(TAG, 'Automation listeners registered');
}
