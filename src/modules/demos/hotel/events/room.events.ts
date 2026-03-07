import type { DomainEvent } from '@platform/events';

// ─── Event type constants ────────────────────────────────────────────────────
// Hotel is a demo module — these strings are NOT registered in the core
// EventTypes registry. Format follows the platform convention:
//   {domain}.{aggregate}.{past-tense-verb}

export const ROOM_LOCKED    = 'hotel.room.locked'    as const;
export const ROOM_BOOKED    = 'hotel.room.booked'    as const;
export const ROOM_CANCELLED = 'hotel.room.cancelled' as const;
export const ROOM_QUERIED   = 'hotel.room.queried'   as const;

// ─── Event interfaces ────────────────────────────────────────────────────────

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
