import { NextRequest, NextResponse } from 'next/server';
import { getAmenityById, updateAmenity, deleteAmenity } from '@features/hotel-services/lib/hotel-services-store';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = getAmenityById(id);
  if (!item) return NextResponse.json({ message: 'Hittades inte.' }, { status: 404 });
  return NextResponse.json(item);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const updated = updateAmenity(id, body);
  if (!updated) return NextResponse.json({ message: 'Hittades inte.' }, { status: 404 });
  return NextResponse.json({ success: true, item: updated });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ok = deleteAmenity(id);
  if (!ok) return NextResponse.json({ message: 'Hittades inte.' }, { status: 404 });
  return NextResponse.json({ success: true });
}
