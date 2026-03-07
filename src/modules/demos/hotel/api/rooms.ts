import { apiPost, apiDelete } from '@shared/lib/api-client';
import type { Room } from '../domain/room.entity';

interface BookingResult {
  success: boolean;
  message: string;
  room?: Room;
}

export async function bookRoom(params: {
  room_id: string;
  guest_name: string;
  check_in: string;
  check_out: string;
}): Promise<BookingResult> {
  return apiPost('/api/demos/hotel/rooms/book', params);
}

export async function cancelBooking(roomId: string): Promise<BookingResult> {
  return apiPost('/api/demos/hotel/rooms/cancel', { room_id: roomId });
}

export async function resetRooms(): Promise<void> {
  await apiDelete('/api/demos/hotel/rooms');
}
