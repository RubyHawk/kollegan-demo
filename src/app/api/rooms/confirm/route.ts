import { NextRequest, NextResponse } from 'next/server';
import { confirmBooking } from '@features/hotel/rooms/lib/room-store';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { room_id, guest_name, check_in, check_out } = body;

  if (!room_id || !guest_name) {
    return NextResponse.json(
      { success: false, message: 'room_id och guest_name krävs.' },
      { status: 400 }
    );
  }

  const result = await confirmBooking(
    String(room_id),
    String(guest_name),
    check_in ? String(check_in) : undefined,
    check_out ? String(check_out) : undefined
  );
  return NextResponse.json(result, { status: result.success ? 200 : 409 });
}
