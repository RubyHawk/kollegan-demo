export { default as RoomCard } from './components/room-card';
export { default as RoomGrid } from './components/room-grid';
export { default as RoomDetailModal } from './components/room-detail-modal';
export { default as BookingsCalendar } from './components/bookings-calendar';
export { default as BookingDialog } from './components/booking-dialog';
export * from './api';
export type { Room, RoomType, RoomStatus } from './types';

// Domain events — import these when subscribing or publishing room events
export {
  ROOM_LOCKED,
  ROOM_BOOKED,
  ROOM_CANCELLED,
  ROOM_QUERIED,
} from './events';
export type {
  RoomLockedEvent,
  RoomBookedEvent,
  RoomCancelledEvent,
  RoomQueriedEvent,
  HotelRoomEvent,
} from './events';
