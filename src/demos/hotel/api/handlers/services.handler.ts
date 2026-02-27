import { NextRequest, NextResponse } from 'next/server';
import {
  getAllActivities,
  createActivity,
  getActivityById,
  updateActivity,
  deleteActivity,
  getAllAmenities,
  createAmenity,
  getAmenityById,
  updateAmenity,
  deleteAmenity,
  getAllRestaurants,
  getRestaurantById,
  createRestaurant,
  updateRestaurant,
  deleteRestaurant,
  getAllHotelServices,
} from '../../infrastructure/hotel-services-store';
import { getAllRooms } from '../../infrastructure/room-store';

export const dynamic = 'force-dynamic';

// ── Activities ────────────────────────────────────────────────────────────────

export async function handleGetActivities(): Promise<NextResponse> {
  const items = getAllActivities();
  return NextResponse.json({ items, count: items.length });
}

export async function handleCreateActivity(req: NextRequest): Promise<NextResponse> {
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

export async function handleGetActivityById(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await params;
  const item = getActivityById(id);
  if (!item) return NextResponse.json({ message: 'Hittades inte.' }, { status: 404 });
  return NextResponse.json(item);
}

export async function handleUpdateActivity(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await params;
  const body = await req.json();
  const updated = updateActivity(id, body);
  if (!updated) return NextResponse.json({ message: 'Hittades inte.' }, { status: 404 });
  return NextResponse.json({ success: true, item: updated });
}

export async function handleDeleteActivity(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await params;
  const result = deleteActivity(id);
  if (!result) return NextResponse.json({ message: 'Hittades inte.' }, { status: 404 });
  return NextResponse.json({ success: true });
}

// ── Amenities ────────────────────────────────────────────────────────────────

export async function handleGetAmenities(): Promise<NextResponse> {
  const items = getAllAmenities();
  return NextResponse.json({ items, count: items.length });
}

export async function handleCreateAmenity(req: NextRequest): Promise<NextResponse> {
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

export async function handleGetAmenityById(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await params;
  const item = getAmenityById(id);
  if (!item) return NextResponse.json({ message: 'Hittades inte.' }, { status: 404 });
  return NextResponse.json(item);
}

export async function handleUpdateAmenity(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await params;
  const body = await req.json();
  const updated = updateAmenity(id, body);
  if (!updated) return NextResponse.json({ message: 'Hittades inte.' }, { status: 404 });
  return NextResponse.json({ success: true, item: updated });
}

export async function handleDeleteAmenity(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await params;
  const result = deleteAmenity(id);
  if (!result) return NextResponse.json({ message: 'Hittades inte.' }, { status: 404 });
  return NextResponse.json({ success: true });
}

// ── Restaurants ───────────────────────────────────────────────────────────────

export async function handleGetRestaurants(): Promise<NextResponse> {
  const items = getAllRestaurants();
  return NextResponse.json({ items, count: items.length });
}

export async function handleCreateRestaurant(req: NextRequest): Promise<NextResponse> {
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

export async function handleGetRestaurantById(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await params;
  const item = getRestaurantById(id);
  if (!item) return NextResponse.json({ message: 'Hittades inte.' }, { status: 404 });
  return NextResponse.json(item);
}

export async function handleUpdateRestaurant(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await params;
  const body = await req.json();
  const updated = updateRestaurant(id, body);
  if (!updated) return NextResponse.json({ message: 'Hittades inte.' }, { status: 404 });
  return NextResponse.json({ success: true, item: updated });
}

export async function handleDeleteRestaurant(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await params;
  const result = deleteRestaurant(id);
  if (!result) return NextResponse.json({ message: 'Hittades inte.' }, { status: 404 });
  return NextResponse.json({ success: true });
}

// ── Hotel Info ────────────────────────────────────────────────────────────────

export async function handleGetHotelInfo(): Promise<NextResponse> {
  const rooms = getAllRooms();
  const services = getAllHotelServices();

  const availableRooms = rooms.filter((r) => r.status === 'available');

  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    rooms: {
      total: rooms.length,
      available: availableRooms.length,
      booked: rooms.filter((r) => r.status === 'booked').length,
      types: {
        Enkel: rooms.filter((r) => r.type === 'Enkel' && r.status === 'available').length,
        Dubbel: rooms.filter((r) => r.type === 'Dubbel' && r.status === 'available').length,
        Svit: rooms.filter((r) => r.type === 'Svit' && r.status === 'available').length,
      },
      priceList: {
        Enkel: '1 495 kr/natt',
        Dubbel: '2 495 kr/natt',
        Svit: '3 995 kr/natt',
      },
    },
    restaurants: services.restaurants.filter((r) => r.isActive),
    activities: services.activities.filter((a) => a.isActive),
    amenities: services.amenities.filter((a) => a.isActive),
  });
}
