/**
 * Voice AI tool handlers — colocated with the voice module.
 *
 * All handlers use createHandler from @platform/api which provides:
 *   - Vapi JWT authentication
 *   - Rate limiting
 *   - Zod validation (body or query)
 *   - RFC 9110 / 9457 compliant error responses
 *   - Observability headers (X-Request-Id, X-Duration-Ms)
 *
 * app/api/ routes are thin re-export wrappers that point here.
 */

import { z } from 'zod';
import { createHandler, Errors, ok } from '@platform/api';
import {
  checkAvailability,
  cancelBooking,
  lockRoom,
  confirmBooking,
  checkCalendarRange,
  getHotelInfo,
} from '../../ai-tools';

const DateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD');

// ── Availability ──────────────────────────────────────────────────────────────

const AvailabilitySchema = z.object({
  check_in:  DateSchema.optional(),
  check_out: DateSchema.optional(),
  type:      z.enum(['Enkel', 'Dubbel', 'Svit']).optional(),
});

/** GET /api/ai/availability/check — query params */
export const handleAvailabilityGet = createHandler(
  { tag: 'AI:AvailabilityCheck', auth: 'vapi', rateLimit: { max: 60, windowMs: 60_000 }, query: AvailabilitySchema },
  async ({ query }) => ok(checkAvailability({
    checkIn:  query.check_in,
    checkOut: query.check_out,
    type:     query.type,
  }))
);

/** POST /api/ai/availability/check — body params (some VAPI tool configs use POST) */
export const handleAvailabilityPost = createHandler(
  { tag: 'AI:AvailabilityCheck', auth: 'vapi', rateLimit: { max: 60, windowMs: 60_000 }, body: AvailabilitySchema },
  async ({ body }) => ok(checkAvailability({
    checkIn:  body.check_in,
    checkOut: body.check_out,
    type:     body.type,
  }))
);

// ── AI Rooms: cancel + lock ───────────────────────────────────────────────────

const RoomIdSchema = z.object({ room_id: z.string().min(1, 'room_id is required') });

/** POST /api/ai/rooms/cancel */
export const handleAiCancelBooking = createHandler(
  { tag: 'AI:CancelBooking', auth: 'vapi', rateLimit: { max: 30, windowMs: 60_000 }, body: RoomIdSchema },
  async ({ body }) => {
    const result = await cancelBooking(body.room_id);
    if (!result.success) {
      throw Errors.conflict(result.message ?? `Cannot cancel booking for room ${body.room_id}`);
    }
    return ok(result);
  }
);

/** POST /api/ai/rooms/lock */
export const handleAiLockRoom = createHandler(
  { tag: 'AI:LockRoom', auth: 'vapi', rateLimit: { max: 30, windowMs: 60_000 }, body: RoomIdSchema },
  async ({ body }) => {
    const result = lockRoom(body.room_id);
    if (!result.success) {
      throw Errors.conflict(result.message ?? `Room ${body.room_id} is not available`);
    }
    return ok(result);
  }
);

// ── Calendar: book + check ────────────────────────────────────────────────────

const CalendarBookSchema = z.object({
  room_id:    z.string().min(1, 'room_id is required'),
  guest_name: z.string().min(1).max(100),
  check_in:   DateSchema.optional(),
  check_out:  DateSchema.optional(),
});

/**
 * POST /api/ai/calendar/book
 *
 * Atomic lock-then-confirm booking.
 * Locks the room then immediately confirms it, optionally creating a Google
 * Calendar event when check_in/check_out are supplied.
 */
export const handleCalendarBook = createHandler(
  { tag: 'AI:CalendarBook', auth: 'vapi', rateLimit: { max: 30, windowMs: 60_000 }, body: CalendarBookSchema },
  async ({ body }) => {
    const { room_id, guest_name, check_in, check_out } = body;

    const lockResult = lockRoom(room_id);
    if (!lockResult.success) {
      throw Errors.conflict(lockResult.message ?? `Room ${room_id} is not available`);
    }

    const confirmResult = await confirmBooking(room_id, guest_name, check_in, check_out);
    if (!confirmResult.success) {
      throw Errors.conflict(confirmResult.message ?? `Booking for room ${room_id} could not be confirmed`);
    }

    return ok(confirmResult);
  }
);

const CalendarCheckSchema = z.object({
  check_in:  DateSchema,
  check_out: DateSchema,
});

/** GET /api/ai/calendar/check — query params */
export const handleCalendarCheckGet = createHandler(
  { tag: 'AI:CalendarCheck', auth: 'vapi', rateLimit: { max: 30, windowMs: 60_000 }, query: CalendarCheckSchema },
  async ({ query }) => ok(await checkCalendarRange(query.check_in, query.check_out))
);

/** POST /api/ai/calendar/check — body params */
export const handleCalendarCheckPost = createHandler(
  { tag: 'AI:CalendarCheck', auth: 'vapi', rateLimit: { max: 30, windowMs: 60_000 }, body: CalendarCheckSchema },
  async ({ body }) => ok(await checkCalendarRange(body.check_in, body.check_out))
);

// ── Hotel Info ────────────────────────────────────────────────────────────────

/** GET /api/ai/hotel-info, POST /api/ai/hotel-info */
export const handleAiHotelInfo = createHandler(
  { tag: 'AI:HotelInfo', auth: 'vapi', rateLimit: { max: 60, windowMs: 60_000 } },
  async () => ok(getHotelInfo())
);
