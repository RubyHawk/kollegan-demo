import { NextResponse } from 'next/server';
import { getAllRooms, resetRooms } from '@/lib/roomStore';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({ rooms: getAllRooms() });
}

export async function DELETE() {
  resetRooms();
  return NextResponse.json({ success: true, message: 'Alla rum återställda.' });
}
