import { vi } from 'vitest';

// ── Mock Prisma ───────────────────────────────────────────────────────────────
vi.mock('@/lib/prisma', () => ({
  prisma: {
    customer:      { findFirst: vi.fn(), create: vi.fn(), upsert: vi.fn() },
    booking:       { updateMany: vi.fn() },
    callTranscript:{ upsert: vi.fn(), updateMany: vi.fn() },
    crmRecord:     { create: vi.fn() },
  },
}));

// ── Mock Redis ────────────────────────────────────────────────────────────────
vi.mock('@/lib/redis', () => ({
  redis: {
    pipeline: vi.fn(() => ({
      zadd:            vi.fn().mockReturnThis(),
      zremrangebyscore:vi.fn().mockReturnThis(),
      zcard:           vi.fn().mockReturnThis(),
      expire:          vi.fn().mockReturnThis(),
      exec: vi.fn().mockResolvedValue([
        [null, 1],  // zadd
        [null, 0],  // zremrangebyscore
        [null, 1],  // zcard — count = 1 (well within limit)
        [null, 1],  // expire
      ]),
    })),
    get:    vi.fn().mockResolvedValue(null),
    setex:  vi.fn().mockResolvedValue('OK'),
    on:     vi.fn(),
  },
}));

// ── Mock room-store (file I/O + SSE) ─────────────────────────────────────────
vi.mock('@features/rooms/lib/room-store', () => ({
  getAllRooms: vi.fn(() => [
    { id: '101', floor: 1, number: 101, type: 'Enkel',  status: 'available' },
    { id: '102', floor: 1, number: 102, type: 'Enkel',  status: 'available' },
    { id: '103', floor: 1, number: 103, type: 'Dubbel', status: 'available' },
    { id: '201', floor: 2, number: 201, type: 'Svit',   status: 'booked', checkIn: '2026-03-10', checkOut: '2026-03-15' },
    { id: '202', floor: 2, number: 202, type: 'Enkel',  status: 'locked' },
  ]),
  getAvailableRooms: vi.fn(() => [
    { id: '101', floor: 1, number: 101, type: 'Enkel',  status: 'available' },
    { id: '102', floor: 1, number: 102, type: 'Enkel',  status: 'available' },
    { id: '103', floor: 1, number: 103, type: 'Dubbel', status: 'available' },
  ]),
  lockRoom: vi.fn((roomId: string) => ({
    success: true,
    message: `Rum ${roomId} är nu låst för bokning.`,
    room: { id: roomId, status: 'locked' },
  })),
  confirmBooking: vi.fn(async (roomId: string, guestName: string) => ({
    success: true,
    message: `Bokning bekräftad! Rum ${roomId} är bokat för ${guestName}.`,
    room: { id: roomId, status: 'booked', guestName },
  })),
  cancelBooking: vi.fn(async (roomId: string) => ({
    success: true,
    message: `Bokning för rum ${roomId} har avbokats.`,
    room: { id: roomId, status: 'available' },
  })),
  logRoomsQueried: vi.fn(),
  logActivity: vi.fn(),
}));

// ── Mock Google Calendar ──────────────────────────────────────────────────────
vi.mock('@infra/calendar/google-calendar', () => ({
  isCalendarConfigured: vi.fn(() => false),
  createCalendarEvent:  vi.fn().mockResolvedValue('mock-event-id'),
  deleteCalendarEvent:  vi.fn().mockResolvedValue(true),
  updateCalendarEvent:  vi.fn().mockResolvedValue(true),
  listCalendarEvents:   vi.fn().mockResolvedValue([]),
}));

// ── Mock hotel-services-store ─────────────────────────────────────────────────
vi.mock('@features/hotel-services/lib/hotel-services-store', () => ({
  getAllRestaurants: vi.fn(() => []),
  getAllActivities:  vi.fn(() => []),
  getAllAmenities:   vi.fn(() => []),
}));
