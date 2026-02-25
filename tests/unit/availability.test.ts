import { describe, it, expect, beforeEach, vi } from 'vitest';
import { checkAvailability } from '@/lib/ai-tools/availability';
import { getAllRooms, logRoomsQueried } from '@features/rooms/lib/room-store';

describe('checkAvailability', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns only available rooms when no dates provided', () => {
    const result = checkAvailability();
    // Mocked rooms: 101, 102 (available), 103 (available), 201 (booked), 202 (locked)
    expect(result.rooms.every((r) => ['101', '102', '103'].includes(r.id))).toBe(true);
    expect(result.count).toBe(3);
  });

  it('excludes locked rooms', () => {
    const result = checkAvailability();
    expect(result.rooms.find((r) => r.id === '202')).toBeUndefined();
  });

  it('excludes booked rooms when no dates provided', () => {
    const result = checkAvailability();
    expect(result.rooms.find((r) => r.id === '201')).toBeUndefined();
  });

  it('filters by room type', () => {
    const result = checkAvailability({ type: 'Enkel' });
    expect(result.rooms.every((r) => r.type === 'Enkel')).toBe(true);
    expect(result.count).toBe(2);
  });

  it('includes booked rooms with non-overlapping dates', () => {
    // Booked: 2026-03-10 → 2026-03-15
    // Query:  2026-03-16 → 2026-03-20 (no overlap)
    const result = checkAvailability({ checkIn: '2026-03-16', checkOut: '2026-03-20' });
    expect(result.rooms.find((r) => r.id === '201')).toBeDefined();
  });

  it('excludes booked rooms with overlapping dates', () => {
    // Booked: 2026-03-10 → 2026-03-15
    // Query:  2026-03-12 → 2026-03-17 (overlaps)
    const result = checkAvailability({ checkIn: '2026-03-12', checkOut: '2026-03-17' });
    expect(result.rooms.find((r) => r.id === '201')).toBeUndefined();
  });

  it('calls logRoomsQueried on every invocation', () => {
    checkAvailability();
    expect(logRoomsQueried).toHaveBeenCalledOnce();
  });

  it('returns filters in response', () => {
    const opts = { checkIn: '2026-03-01', checkOut: '2026-03-05', type: 'Dubbel' as const };
    const result = checkAvailability(opts);
    expect(result.filters).toEqual(opts);
  });
});
