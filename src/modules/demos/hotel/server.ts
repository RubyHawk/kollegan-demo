/**
 * Hotel demo server-side public API.
 *
 * Use this from route handlers, AI tools, and other server-only integration points.
 * The main hotel barrel exports UI components and must not be imported into server routes.
 */

export {
  cancelBooking,
  confirmBooking,
  getAllRooms,
  lockRoom,
  logRoomsQueried,
} from './infrastructure/room-store';

export {
  getAllActivities,
  getAllAmenities,
  getAllRestaurants,
} from './infrastructure/hotel-services-store';

export type { Room, RoomType } from './domain/room.entity';
