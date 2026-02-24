import { NextRequest, NextResponse } from 'next/server';
import { getAllActivities, createActivity } from '@features/hotel-services/lib/hotel-services-store';

export const dynamic = 'force-dynamic';

export async function GET() {
  const items = getAllActivities();
  return NextResponse.json({ items, count: items.length });
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  if (!body.name?.trim()) {
    return NextResponse.json({ success: false, message: 'Namn krävs.' }, { status: 400 });
  }

  const activity = createActivity({
    name: body.name.trim(),
    description: body.description ?? '',
    category: body.category ?? 'övrigt',
    openingHours: body.openingHours ?? {},
    price: body.price ?? '',
    bookingRequired: body.bookingRequired === true,
    isActive: body.isActive !== false,
  });

  return NextResponse.json({ success: true, item: activity }, { status: 201 });
}
