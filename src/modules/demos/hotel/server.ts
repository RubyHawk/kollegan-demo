/**
 * Hotel demo server-side public API.
 *
 * Use this from route handlers, AI tools, and other server-only integration points.
 * The main hotel barrel exports UI components and must not be imported into server routes.
 */

export {
  bookRoom,
  cancelBooking,
  confirmBooking,
  getAvailableRooms,
  getAllRooms,
  lockRoom,
  logRoomsQueried,
  resetRooms,
} from './infrastructure/room-store';

export {
  createActivity,
  createAmenity,
  createRestaurant,
  deleteActivity,
  deleteAmenity,
  deleteRestaurant,
  getActivityById,
  getAllActivities,
  getAllAmenities,
  getAllHotelServices,
  getAllRestaurants,
  getAmenityById,
  getRestaurantById,
  updateActivity,
  updateAmenity,
  updateRestaurant,
} from './infrastructure/hotel-services-store';

export {
  DEMO_HOTEL_SEED_ENDPOINT,
  DEMO_HOTEL_SEED_TAG,
  DEMO_HOTEL_STAFF,
} from './domain/seed.entity';

export type { Room, RoomType } from './domain/room.entity';
export type { Amenity, HotelActivity, Restaurant } from './domain/service.entity';
