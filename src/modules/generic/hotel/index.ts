/**
 * Hotel Module — public API
 *
 * The hotel vertical is organized into two sub-domains:
 *  - rooms/    Room inventory, availability, bookings, calendar
 *  - services/ Restaurants, amenities, activities (hotel service catalog)
 *
 * Import from sub-domains directly for specificity:
 *   import { Room } from '@features/hotel/rooms/types';
 *   import { HotelInfoTab } from '@features/hotel/services';
 *
 * Or import from here for a broad cross-domain pull:
 *   import { Room, Restaurant } from '@features/hotel';
 */

// Rooms sub-domain
export { default as RoomCard }         from './rooms/components/room-card';
export { default as RoomGrid }         from './rooms/components/room-grid';
export { default as RoomDetailModal }  from './rooms/components/room-detail-modal';
export { default as BookingsCalendar } from './rooms/components/bookings-calendar';
export { default as BookingDialog }    from './rooms/components/booking-dialog';
export * from './rooms/api';
export type { Room, RoomType, RoomStatus } from './rooms/types';

// Services sub-domain
export { default as HotelInfoTab }       from './services/components/hotel-info-tab';
export { default as ServiceCard }        from './services/components/service-card';
export { default as ServiceDetailModal } from './services/components/service-detail-modal';
export { default as ServiceFormModal }   from './services/components/service-form-modal';
export * from './services/api';
export type { Restaurant, HotelActivity, Amenity } from './services/types';
