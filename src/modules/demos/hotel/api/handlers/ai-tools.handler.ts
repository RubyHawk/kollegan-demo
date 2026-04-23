import { z } from 'zod';
import { createHandler, Errors, ok } from '@platform/api';
import {
  cancelBooking,
  checkHotelAvailability,
  confirmBooking,
  getHotelInfo,
  lockRoom,
} from '../../application/hotel-ai.service';

const DateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD');

const AvailabilitySchema = z.object({
  check_in: DateSchema.optional(),
  check_out: DateSchema.optional(),
  type: z.enum(['Enkel', 'Dubbel', 'Svit']).optional(),
});

export const handleAvailabilityGet = createHandler(
  { tag: 'AI:AvailabilityCheck', auth: 'vapi', rateLimit: { max: 60, windowMs: 60_000 }, query: AvailabilitySchema },
  async ({ query }) => ok(checkHotelAvailability({
    checkIn: query.check_in,
    checkOut: query.check_out,
    type: query.type,
  })),
);

export const handleAvailabilityPost = createHandler(
  { tag: 'AI:AvailabilityCheck', auth: 'vapi', rateLimit: { max: 60, windowMs: 60_000 }, body: AvailabilitySchema },
  async ({ body }) => ok(checkHotelAvailability({
    checkIn: body.check_in,
    checkOut: body.check_out,
    type: body.type,
  })),
);

const RoomIdSchema = z.object({ room_id: z.string().min(1, 'room_id is required') });

export const handleAiCancelBooking = createHandler(
  { tag: 'AI:CancelBooking', auth: 'vapi', rateLimit: { max: 30, windowMs: 60_000 }, body: RoomIdSchema },
  async ({ body }) => {
    const result = await cancelBooking(body.room_id);
    if (!result.success) {
      throw Errors.conflict(result.message ?? `Cannot cancel booking for room ${body.room_id}`);
    }
    return ok(result);
  },
);

export const handleAiLockRoom = createHandler(
  { tag: 'AI:LockRoom', auth: 'vapi', rateLimit: { max: 30, windowMs: 60_000 }, body: RoomIdSchema },
  async ({ body }) => {
    const result = lockRoom(body.room_id);
    if (!result.success) {
      throw Errors.conflict(result.message ?? `Room ${body.room_id} is not available`);
    }
    return ok(result);
  },
);

const CalendarBookSchema = z.object({
  room_id: z.string().min(1, 'room_id is required'),
  guest_name: z.string().min(1).max(100),
  check_in: DateSchema.optional(),
  check_out: DateSchema.optional(),
});

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
  },
);

export const handleAiHotelInfo = createHandler(
  { tag: 'AI:HotelInfo', auth: 'vapi', rateLimit: { max: 60, windowMs: 60_000 } },
  async () => ok(getHotelInfo()),
);
