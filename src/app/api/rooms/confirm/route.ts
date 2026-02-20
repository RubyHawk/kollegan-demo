import { NextRequest, NextResponse } from 'next/server';
import { confirmBooking } from '@/lib/roomStore';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { room_id, guest_name } = body;

  if (!room_id || !guest_name) {
    return NextResponse.json(
      { success: false, message: 'room_id och guest_name krävs.' },
      { status: 400 }
    );
  }

  const result = confirmBooking(String(room_id), String(guest_name));
  return NextResponse.json(result, { status: result.success ? 200 : 409 });
}
