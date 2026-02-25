import { NextRequest, NextResponse } from 'next/server';
import { getAllAmenities, createAmenity } from '@features/hotel/services/lib/hotel-services-store';

export const dynamic = 'force-dynamic';

export async function GET() {
  const items = getAllAmenities();
  return NextResponse.json({ items, count: items.length });
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  if (!body.name?.trim()) {
    return NextResponse.json({ success: false, message: 'Namn krävs.' }, { status: 400 });
  }

  const amenity = createAmenity({
    name: body.name.trim(),
    type: body.type ?? 'övrigt',
    description: body.description ?? '',
    openingHours: body.openingHours ?? {},
    pricing: body.pricing ?? '',
    isActive: body.isActive !== false,
  });

  return NextResponse.json({ success: true, item: amenity }, { status: 201 });
}
