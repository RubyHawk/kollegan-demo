import { NextRequest, NextResponse } from 'next/server';
import { lockRoom } from '@features/hotel/rooms/lib/room-store';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { room_id } = body;

  if (!room_id) {
    return NextResponse.json({ success: false, message: 'room_id krävs.' }, { status: 400 });
  }

  const result = lockRoom(String(room_id));
  return NextResponse.json(result, { status: result.success ? 200 : 409 });
}
