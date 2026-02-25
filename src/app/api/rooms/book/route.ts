import { NextRequest, NextResponse } from "next/server";
import { bookRoom } from "@features/hotel/rooms/lib/room-store";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { room_id, guest_name, check_in, check_out } = body;

  if (!room_id || !guest_name || !check_in || !check_out) {
    return NextResponse.json(
      {
        success: false,
        message: "room_id, guest_name, check_in och check_out krävs.",
      },
      { status: 400 },
    );
  }

  const today = new Date().toISOString().split('T')[0];
  if (String(check_in) < today) {
    return NextResponse.json(
      { success: false, message: 'Incheckning kan inte vara i det förflutna.' },
      { status: 400 },
    );
  }
  if (String(check_out) <= String(check_in)) {
    return NextResponse.json(
      { success: false, message: 'Utcheckning måste vara efter incheckning.' },
      { status: 400 },
    );
  }

  const result = await bookRoom(
    String(room_id),
    String(guest_name),
    String(check_in),
    String(check_out),
  );
  return NextResponse.json(result, { status: result.success ? 200 : 409 });
}
