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

export interface CRMContact {
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
  notes?: string;
  summary?: string;
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
    | 'crm_contact'
    | 'info';
  message: string;
  roomId?: string;
  metadata?: CRMContact;
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

/* ───── Hotel Services ───── */

export interface OpeningHours {
  default?: string;   // "Mån–Fre 18–22, Lör–Sön 11–14 & 18–22"
  weekdays?: string;
  weekends?: string;
}

export interface MenuHighlight {
  name: string;
  price: number;
}

export type RestaurantService = 'frukost' | 'lunch' | 'middag' | 'bar' | 'rumsservice';

export interface Restaurant {
  id: string;
  name: string;
  description: string;
  cuisineType: string;
  openingHours: OpeningHours;
  services: RestaurantService[];
  menuHighlights: MenuHighlight[];
  isActive: boolean;
}

export type ActivityCategory = 'wellness' | 'fitness' | 'transport' | 'konferens' | 'kultur' | 'övrigt';

export interface HotelActivity {
  id: string;
  name: string;
  description: string;
  category: ActivityCategory;
  openingHours: OpeningHours;
  price: string;
  bookingRequired: boolean;
  isActive: boolean;
}

export type AmenityType = 'kiosk' | 'parkering' | 'service' | 'övrigt';

export interface Amenity {
  id: string;
  name: string;
  type: AmenityType;
  description: string;
  openingHours: OpeningHours;
  pricing: string;
  isActive: boolean;
}
