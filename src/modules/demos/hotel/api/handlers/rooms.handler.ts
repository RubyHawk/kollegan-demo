import { NextRequest, NextResponse } from 'next/server';
import {
  getAllRooms,
  resetRooms,
  bookRoom,
  cancelBooking,
  lockRoom,
  confirmBooking,
  getAvailableRooms,
  logRoomsQueried,
} from '../../server';

export const dynamic = 'force-dynamic';

export async function handleGetRooms(): Promise<NextResponse> {
  return NextResponse.json({ rooms: getAllRooms() });
}

export async function handleResetRooms(): Promise<NextResponse> {
  resetRooms();
  return NextResponse.json({ success: true, message: 'Alla rum återställda.' });
}

export async function handleBookRoom(request: NextRequest): Promise<NextResponse> {
  const body = await request.json();
  const { room_id, guest_name, check_in, check_out } = body;

  if (!room_id || !guest_name || !check_in || !check_out) {
    return NextResponse.json(
      { success: false, message: 'room_id, guest_name, check_in och check_out krävs.' },
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

export async function handleCancelBooking(request: NextRequest): Promise<NextResponse> {
  const body = await request.json();
  const { room_id } = body;

  if (!room_id) {
    return NextResponse.json({ success: false, message: 'room_id krävs.' }, { status: 400 });
  }

  const result = await cancelBooking(String(room_id));
  return NextResponse.json(result, { status: result.success ? 200 : 409 });
}

export async function handleLockRoom(request: NextRequest): Promise<NextResponse> {
  const body = await request.json();
  const { room_id } = body;

  if (!room_id) {
    return NextResponse.json({ success: false, message: 'room_id krävs.' }, { status: 400 });
  }

  const result = lockRoom(String(room_id));
  return NextResponse.json(result, { status: result.success ? 200 : 409 });
}

export async function handleConfirmBooking(request: NextRequest): Promise<NextResponse> {
  const body = await request.json();
  const { room_id, guest_name, check_in, check_out } = body;

  if (!room_id || !guest_name) {
    return NextResponse.json(
      { success: false, message: 'room_id och guest_name krävs.' },
      { status: 400 },
    );
  }

  const result = await confirmBooking(
    String(room_id),
    String(guest_name),
    check_in ? String(check_in) : undefined,
    check_out ? String(check_out) : undefined,
  );
  return NextResponse.json(result, { status: result.success ? 200 : 409 });
}

export async function handleGetAvailableRooms(): Promise<NextResponse> {
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
