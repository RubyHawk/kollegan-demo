import { getAllRooms, logRoomsQueried } from '@features/rooms/lib/room-store';
import type { RoomType } from '@features/rooms/types';

export interface AvailabilityOptions {
  checkIn?: string;   // YYYY-MM-DD
  checkOut?: string;  // YYYY-MM-DD
  type?: RoomType;
}

export interface AvailableRoom {
  id: string;
  type: RoomType;
  floor: number;
  number: number;
}

/**
 * Returns available rooms with optional date-overlap and type filtering.
 *
 * Without dates: returns only rooms with status='available' (locked and booked excluded).
 * With dates: also includes 'booked' rooms whose check-in/check-out do NOT overlap
 *             with the requested window — enabling date-aware availability.
 *
 * Overlap condition: requestedIn < bookedOut AND requestedOut > bookedIn
 */
export function checkAvailability(options: AvailabilityOptions = {}): {
  rooms: AvailableRoom[];
  count: number;
  filters: AvailabilityOptions;
} {
  logRoomsQueried();
  const allRooms = getAllRooms();

  let filtered = allRooms.filter((room) => {
    // Locked rooms are held by an active call — never show as available
    if (room.status === 'locked') return false;

    if (room.status === 'booked') {
      // Without query dates, exclude all booked rooms
      if (!options.checkIn || !options.checkOut) return false;
      // Without stored dates on the booking, we can't determine overlap — exclude
      if (!room.checkIn || !room.checkOut) return false;

      const qIn  = new Date(options.checkIn).getTime();
      const qOut = new Date(options.checkOut).getTime();
      const bIn  = new Date(room.checkIn).getTime();
      const bOut = new Date(room.checkOut).getTime();

      // Overlap: query window intersects booked window
      const overlaps = qIn < bOut && qOut > bIn;
      return !overlaps; // available if NO overlap
    }

    // status === 'available'
    return true;
  });

  // Filter by room type if specified
  if (options.type) {
    filtered = filtered.filter((r) => r.type === options.type);
  }

  return {
    rooms: filtered.map(({ id, type, floor, number }) => ({ id, type, floor, number })),
    count: filtered.length,
    filters: options,
  };
}
