import { z } from 'zod';
import { createHandler, Errors, ok } from '@core/api';
import { lockRoom, confirmBooking } from '@features/voice/ai-tools';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const DateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD');

const BodySchema = z.object({
  room_id:    z.string().min(1, 'room_id is required'),
  guest_name: z.string().min(1).max(100),
  check_in:   DateSchema.optional(),
  check_out:  DateSchema.optional(),
});

/**
 * Atomic lock-then-confirm booking.
 * Locks the room then immediately confirms it, optionally creating a Google
 * Calendar event when check_in/check_out are supplied.
 */
export const POST = createHandler(
  { tag: 'AI:CalendarBook', auth: 'vapi', rateLimit: { max: 30, windowMs: 60_000 }, body: BodySchema },
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
