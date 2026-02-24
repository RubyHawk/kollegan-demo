import { NextResponse } from 'next/server';
import { getAvailableRooms, logRoomsQueried } from '@features/rooms/lib/room-store';

export const dynamic = 'force-dynamic';

export async function GET() {
  logRoomsQueried();
  const rooms = getAvailableRooms();

  return NextResponse.json({
    success: true,
    rooms: rooms.map((r) => ({
      id: r.id,
      type: r.type,
      floor: r.floor,
      number: r.number,
    })),
    count: rooms.length,
  });
}
