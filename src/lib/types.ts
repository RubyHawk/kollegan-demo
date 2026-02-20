export type RoomStatus = 'available' | 'locked' | 'booked';

export type RoomType = 'Enkel' | 'Dubbel' | 'Svit';

export interface Room {
  id: string;
  floor: number;
  number: number;
  type: RoomType;
  status: RoomStatus;
  guestName?: string;
  lockedAt?: string;
  bookedAt?: string;
}

export interface ActivityEvent {
  id: string;
  timestamp: string;
  type:
    | 'call_started'
    | 'call_ended'
    | 'rooms_queried'
    | 'room_locked'
    | 'room_confirmed'
    | 'room_cancelled'
    | 'info';
  message: string;
  roomId?: string;
}

export interface SSEMessage {
  type: 'room_update' | 'activity' | 'call_status' | 'full_state';
  payload:
    | Room
    | ActivityEvent
    | { onCall: boolean }
    | { rooms: Room[]; recentActivity: ActivityEvent[]; onCall: boolean };
}

export interface RoomStore {
  rooms: Room[];
  recentActivity: ActivityEvent[];
  onCall: boolean;
}
