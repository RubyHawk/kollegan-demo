import { NextRequest, NextResponse } from 'next/server';
import { getAllRestaurants, createRestaurant } from '@features/hotel/services/lib/hotel-services-store';

export const dynamic = 'force-dynamic';

export async function GET() {
  const items = getAllRestaurants();
  return NextResponse.json({ items, count: items.length });
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  if (!body.name?.trim()) {
    return NextResponse.json({ success: false, message: 'Namn krävs.' }, { status: 400 });
  }

  const restaurant = createRestaurant({
    name: body.name.trim(),
    description: body.description ?? '',
    cuisineType: body.cuisineType ?? '',
    openingHours: body.openingHours ?? {},
    services: body.services ?? [],
    menuHighlights: body.menuHighlights ?? [],
    isActive: body.isActive !== false,
  });

  return NextResponse.json({ success: true, item: restaurant }, { status: 201 });
}
