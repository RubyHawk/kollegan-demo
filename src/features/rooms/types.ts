import type { ActivityEvent } from '@features/activity/types';

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
  checkIn?: string;
  checkOut?: string;
  calendarEventId?: string;
}

export interface RoomStoreState {
  rooms: Room[];
  recentActivity: ActivityEvent[];
  onCall: boolean;
}
