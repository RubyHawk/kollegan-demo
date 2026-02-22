// Re-export all types from their new feature locations
export type { RoomStatus, RoomType, Room } from '@features/rooms/types';
export type { RoomStoreState as RoomStore } from '@features/rooms/types';
export type { ActivityEvent } from '@features/activity/types';
export type { CRMContact } from '@features/crm/types';
export type { SSEMessage } from '@infra/sse/types';
export type {
  OpeningHours,
  MenuHighlight,
  RestaurantService,
  Restaurant,
  ActivityCategory,
  HotelActivity,
  AmenityType,
  Amenity,
} from '@features/hotel-services/types';
