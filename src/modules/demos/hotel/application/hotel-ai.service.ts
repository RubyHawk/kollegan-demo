import {
  cancelBooking,
  confirmBooking,
  getAllRooms,
  lockRoom,
  logRoomsQueried,
} from '../infrastructure/room-store';
import {
  getAllActivities,
  getAllAmenities,
  getAllRestaurants,
} from '../infrastructure/hotel-services-store';
import type { RoomType } from '../domain/room.entity';

export interface AvailabilityOptions {
  checkIn?: string;
  checkOut?: string;
  type?: RoomType;
}

export interface AvailableRoom {
  id: string;
  type: RoomType;
  floor: number;
  number: number;
}

export function checkHotelAvailability(options: AvailabilityOptions = {}): {
  rooms: AvailableRoom[];
  count: number;
  filters: AvailabilityOptions;
} {
  logRoomsQueried();
  const allRooms = getAllRooms();

  let filtered = allRooms.filter((room) => {
    if (room.status === 'locked') return false;

    if (room.status === 'booked') {
      if (!options.checkIn || !options.checkOut) return false;
      if (!room.checkIn || !room.checkOut) return false;

      const qIn = new Date(options.checkIn).getTime();
      const qOut = new Date(options.checkOut).getTime();
      const bIn = new Date(room.checkIn).getTime();
      const bOut = new Date(room.checkOut).getTime();

      return !(qIn < bOut && qOut > bIn);
    }

    return true;
  });

  if (options.type) {
    filtered = filtered.filter((room) => room.type === options.type);
  }

  return {
    rooms: filtered.map(({ id, type, floor, number }) => ({ id, type, floor, number })),
    count: filtered.length,
    filters: options,
  };
}

export function getHotelInfo() {
  const rooms = getAllRooms();

  return {
    generatedAt: new Date().toISOString(),
    rooms: {
      total: rooms.length,
      available: rooms.filter((room) => room.status === 'available').length,
      locked: rooms.filter((room) => room.status === 'locked').length,
      booked: rooms.filter((room) => room.status === 'booked').length,
      byType: {
        Enkel: rooms.filter((room) => room.type === 'Enkel' && room.status === 'available').length,
        Dubbel: rooms.filter((room) => room.type === 'Dubbel' && room.status === 'available').length,
        Svit: rooms.filter((room) => room.type === 'Svit' && room.status === 'available').length,
      },
      priceList: {
        Enkel: '1 495 kr/natt',
        Dubbel: '2 495 kr/natt',
        Svit: '3 995 kr/natt',
      },
    },
    restaurants: getAllRestaurants().filter((restaurant) => restaurant.isActive),
    activities: getAllActivities().filter((activity) => activity.isActive),
    amenities: getAllAmenities().filter((amenity) => amenity.isActive),
  };
}

export { cancelBooking, confirmBooking, lockRoom };
