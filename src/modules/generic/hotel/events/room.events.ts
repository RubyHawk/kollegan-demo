import type { DomainEvent } from '@core/events';
import { EventTypes } from '@core/events';

// ─── Event type constants ───────────────────────────────────────────────────────
// Format: hotel.room.{verb} — matches EventTypes registry in @core/events

export const ROOM_LOCKED    = EventTypes.ROOM_LOCKED;    // 'hotel.room.locked'
export const ROOM_BOOKED    = EventTypes.ROOM_BOOKED;    // 'hotel.room.booked'
export const ROOM_CANCELLED = EventTypes.ROOM_CANCELLED; // 'hotel.room.cancelled'
export const ROOM_QUERIED   = EventTypes.ROOM_QUERIED;   // 'hotel.room.queried'

// ─── Event interfaces ───────────────────────────────────────────────────────────

export interface RoomLockedEvent extends DomainEvent {
  type: typeof ROOM_LOCKED;
  payload: {
    roomId: string;
    roomType: string;
  };
}

export interface RoomBookedEvent extends DomainEvent {
  type: typeof ROOM_BOOKED;
  payload: {
    roomId: string;
    roomType: string;
    guestName: string;
    checkIn?: string;
    checkOut?: string;
  };
}

export interface RoomCancelledEvent extends DomainEvent {
  type: typeof ROOM_CANCELLED;
  payload: {
    roomId: string;
    prevGuestName?: string;
  };
}

export interface RoomQueriedEvent extends DomainEvent {
  type: typeof ROOM_QUERIED;
  payload: {
    availableCount: number;
  };
}

export type HotelRoomEvent =
  | RoomLockedEvent
  | RoomBookedEvent
  | RoomCancelledEvent
  | RoomQueriedEvent;
