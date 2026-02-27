/**
 * Hotel Module — public interface.
 *
 * Other modules ONLY import from this file.
 *
 * Layer structure:
 *   domain/         — room.entity.ts, service.entity.ts, room-meta.ts, activity/
 *   infrastructure/ — room-store.ts, hotel-services-store.ts
 *   api/            — rooms.ts, services.ts (client-side fetch helpers)
 *   ui/             — components/, stores/, pages/
 *   events/         — room.events.ts + publishers/room.publisher.ts
 *   activity/       — ActivityEvent types + ActivityLog component (hotel domain)
 */

// ── UI — Room components ───────────────────────────────────────────────────
export { default as RoomCard }         from './ui/components/room-card';
export { default as RoomGrid }         from './ui/components/room-grid';
export { default as RoomDetailModal }  from './ui/components/room-detail-modal';
export { default as BookingsCalendar } from './ui/components/bookings-calendar';
export { default as BookingDialog }    from './ui/components/booking-dialog';

// ── UI — Service components ────────────────────────────────────────────────
export { default as HotelInfoTab }       from './ui/components/hotel-info-tab';
export { default as ServiceCard }        from './ui/components/service-card';
export { default as ServiceDetailModal } from './ui/components/service-detail-modal';
export { default as ServiceFormModal }   from './ui/components/service-form-modal';

// ── Activity — hotel activity log ──────────────────────────────────────────
export { default as ActivityLog } from './activity/components/activity-log';
export type { ActivityEvent, Session } from './activity/types';

// ── API client helpers ─────────────────────────────────────────────────────
export * from './api/rooms';
export * from './api/services';

// ── Domain types ───────────────────────────────────────────────────────────
export type { Room, RoomType, RoomStatus, RoomStoreState } from './domain/room.entity';
export type { Restaurant, HotelActivity, Amenity } from './domain/service.entity';

// ── Domain events ──────────────────────────────────────────────────────────
export {
  ROOM_LOCKED,
  ROOM_BOOKED,
  ROOM_CANCELLED,
  ROOM_QUERIED,
} from './events/room.events';
export type {
  RoomLockedEvent,
  RoomBookedEvent,
  RoomCancelledEvent,
  RoomQueriedEvent,
  HotelRoomEvent,
} from './events/room.events';
