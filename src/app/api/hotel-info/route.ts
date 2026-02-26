import { NextResponse } from 'next/server';
import { getAllRooms } from '@features/hotel/rooms/lib/room-store';
import { getAllHotelServices } from '@features/hotel/services/lib/hotel-services-store';

export const dynamic = 'force-dynamic';

export async function GET() {
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
