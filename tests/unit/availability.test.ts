import { describe, it, expect, beforeEach, vi } from 'vitest';
import { checkHotelAvailability } from '@demos/hotel/application/hotel-ai.service';
import { logRoomsQueried } from '@demos/hotel/infrastructure/room-store';

describe('checkHotelAvailability', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns only available rooms when no dates provided', () => {
    const result = checkHotelAvailability();
    // Mocked rooms: 101, 102 (available), 103 (available), 201 (booked), 202 (locked)
    expect(result.rooms.every((r: { id: string; type: string }) => ['101', '102', '103'].includes(r.id))).toBe(true);
    expect(result.count).toBe(3);
  });

  it('excludes locked rooms', () => {
    const result = checkHotelAvailability();
    expect(result.rooms.find((r: { id: string; type: string }) => r.id === '202')).toBeUndefined();
  });

  it('excludes booked rooms when no dates provided', () => {
    const result = checkHotelAvailability();
    expect(result.rooms.find((r: { id: string; type: string }) => r.id === '201')).toBeUndefined();
  });

  it('filters by room type', () => {
    const result = checkHotelAvailability({ type: 'Enkel' });
    expect(result.rooms.every((r: { id: string; type: string }) => r.type === 'Enkel')).toBe(true);
    expect(result.count).toBe(2);
  });

  it('includes booked rooms with non-overlapping dates', () => {
    // Booked: 2026-03-10 -> 2026-03-15
    // Query:  2026-03-16 -> 2026-03-20 (no overlap)
    const result = checkHotelAvailability({ checkIn: '2026-03-16', checkOut: '2026-03-20' });
    expect(result.rooms.find((r: { id: string; type: string }) => r.id === '201')).toBeDefined();
  });

  it('excludes booked rooms with overlapping dates', () => {
    // Booked: 2026-03-10 -> 2026-03-15
    // Query:  2026-03-12 -> 2026-03-17 (overlaps)
    const result = checkHotelAvailability({ checkIn: '2026-03-12', checkOut: '2026-03-17' });
    expect(result.rooms.find((r: { id: string; type: string }) => r.id === '201')).toBeUndefined();
  });

  it('calls logRoomsQueried on every invocation', () => {
    checkHotelAvailability();
    expect(logRoomsQueried).toHaveBeenCalledOnce();
  });

  it('returns filters in response', () => {
    const opts = { checkIn: '2026-03-01', checkOut: '2026-03-05', type: 'Dubbel' as const };
    const result = checkHotelAvailability(opts);
    expect(result.filters).toEqual(opts);
  });
});
