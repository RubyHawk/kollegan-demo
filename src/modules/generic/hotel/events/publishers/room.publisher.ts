/**
 * Room Publisher.
 *
 * Centralises all eventBus.publish calls for hotel room domain events.
 * The inline publish calls in infrastructure/room-store.ts will be extracted
 * here in the next refactor iteration.
 */

import { eventBus } from '@core/events';
import {
  ROOM_BOOKED,
  ROOM_LOCKED,
  ROOM_CANCELLED,
  ROOM_QUERIED,
} from '../room.events';
import type {
  RoomBookedEvent,
  RoomLockedEvent,
  RoomCancelledEvent,
  RoomQueriedEvent,
} from '../room.events';

const DEMO_ORG_ID = process.env.DEMO_ORG_ID ?? 'demo';

export async function publishRoomLocked(payload: { roomId: string; roomType: string }): Promise<void> {
  await eventBus.publish<RoomLockedEvent>({
    type:        ROOM_LOCKED,
    orgId:       DEMO_ORG_ID,
    occurredAt:  new Date().toISOString(),
    aggregateId: payload.roomId,
    payload,
  });
}

export async function publishRoomBooked(payload: {
  roomId: string;
  roomType: string;
  guestName: string;
  checkIn?: string;
  checkOut?: string;
}): Promise<void> {
  await eventBus.publish<RoomBookedEvent>({
    type:        ROOM_BOOKED,
    orgId:       DEMO_ORG_ID,
    occurredAt:  new Date().toISOString(),
    aggregateId: payload.roomId,
    payload,
  });
}

export async function publishRoomCancelled(payload: {
  roomId: string;
  prevGuestName?: string;
}): Promise<void> {
  await eventBus.publish<RoomCancelledEvent>({
    type:        ROOM_CANCELLED,
    orgId:       DEMO_ORG_ID,
    occurredAt:  new Date().toISOString(),
    aggregateId: payload.roomId,
    payload,
  });
}

export async function publishRoomQueried(payload: { availableCount: number }): Promise<void> {
  await eventBus.publish<RoomQueriedEvent>({
    type:       ROOM_QUERIED,
    orgId:      DEMO_ORG_ID,
    occurredAt: new Date().toISOString(),
    payload,
  });
}
