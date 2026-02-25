import { getAllRooms } from '@features/rooms/lib/room-store';
import {
  getAllRestaurants,
  getAllActivities,
  getAllAmenities,
} from '@features/hotel-services/lib/hotel-services-store';

/**
 * Returns a snapshot of hotel information for Elsa to relay to callers.
 * Includes live room availability counts and active services only.
 */
export function getHotelInfo() {
  const rooms = getAllRooms();

  return {
    generatedAt: new Date().toISOString(),
    rooms: {
      total:     rooms.length,
      available: rooms.filter((r) => r.status === 'available').length,
      locked:    rooms.filter((r) => r.status === 'locked').length,
      booked:    rooms.filter((r) => r.status === 'booked').length,
      byType: {
        Enkel:  rooms.filter((r) => r.type === 'Enkel'  && r.status === 'available').length,
        Dubbel: rooms.filter((r) => r.type === 'Dubbel' && r.status === 'available').length,
        Svit:   rooms.filter((r) => r.type === 'Svit'   && r.status === 'available').length,
      },
      priceList: {
        Enkel:  '1 495 kr/natt',
        Dubbel: '2 495 kr/natt',
        Svit:   '3 995 kr/natt',
      },
    },
    restaurants: getAllRestaurants().filter((r) => r.isActive),
    activities:  getAllActivities().filter((a) => a.isActive),
    amenities:   getAllAmenities().filter((a) => a.isActive),
  };
}
