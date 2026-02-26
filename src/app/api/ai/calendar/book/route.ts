import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { validateVapiAuth } from '@core/auth/vapi-auth';
import { checkRateLimit } from '@core/cache/rate-limiter';
import { logger } from '@core/logging/logger';
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

const TAG = 'AI:CalendarBook';

/**
 * Atomic lock-then-confirm booking.
 * Used when Elsa wants to complete a booking in a single tool call.
 * Locks the room, then immediately confirms it with calendar event creation.
 */
export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? 'vapi';
  const rl = await checkRateLimit(ip, 30, 60_000);
  if (!rl.allowed) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });

  const authError = validateVapiAuth(req);
  if (authError) return NextResponse.json({ error: authError.error }, { status: authError.status });

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { room_id, guest_name, check_in, check_out } = parsed.data;
  logger.info(TAG, `Booking room ${room_id} for ${guest_name}`, { check_in, check_out });

  // Lock first
  const lockResult = lockRoom(room_id);
  if (!lockResult.success) {
    return NextResponse.json(lockResult, { status: 409 });
  }

  // Then confirm (creates Google Calendar event if dates provided)
  const confirmResult = await confirmBooking(room_id, guest_name, check_in, check_out);
  return NextResponse.json(confirmResult, { status: confirmResult.success ? 200 : 409 });
}
