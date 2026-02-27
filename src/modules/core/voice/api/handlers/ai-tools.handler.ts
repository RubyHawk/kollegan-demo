import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { validateVapiAuth } from '@core/auth/vapi-auth';
import { checkRateLimit } from '@core/cache/rate-limiter';
import { logger } from '@core/logging/logger';
import {
  checkAvailability,
  cancelBooking,
  lockRoom,
  confirmBooking,
  checkCalendarRange,
  getHotelInfo,
} from '../../ai-tools';

const DateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD');

// ── Shared Vapi auth + rate-limit ─────────────────────────────────────────────

async function vapiGuard(
  req: NextRequest,
  maxPerMin: number,
): Promise<{ error: NextResponse } | null> {
  const ip = req.headers.get('x-forwarded-for') ?? 'vapi';
  const rl = await checkRateLimit(ip, maxPerMin, 60_000);
  if (!rl.allowed) return { error: NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 }) };

  const authError = validateVapiAuth(req);
  if (authError) return { error: NextResponse.json({ error: authError.error }, { status: authError.status }) };

  return null;
}

// ── Availability ──────────────────────────────────────────────────────────────

const AvailabilitySchema = z.object({
  check_in:  DateSchema.optional(),
  check_out: DateSchema.optional(),
  type:      z.enum(['Enkel', 'Dubbel', 'Svit']).optional(),
});

const TAG_AVAIL = 'AI:AvailabilityCheck';

export async function handleAvailabilityGet(req: NextRequest): Promise<NextResponse> {
  const guard = await vapiGuard(req, 60);
  if (guard) return guard.error;

  const { searchParams } = new URL(req.url);
  const parsed = AvailabilitySchema.safeParse({
    check_in:  searchParams.get('check_in')  ?? undefined,
    check_out: searchParams.get('check_out') ?? undefined,
    type:      searchParams.get('type')      ?? undefined,
  });
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  logger.info(TAG_AVAIL, 'Checking room availability', parsed.data);
  return NextResponse.json(checkAvailability({
    checkIn:  parsed.data.check_in,
    checkOut: parsed.data.check_out,
    type:     parsed.data.type,
  }), { status: 200 });
}

export async function handleAvailabilityPost(req: NextRequest): Promise<NextResponse> {
  const guard = await vapiGuard(req, 60);
  if (guard) return guard.error;

  let body: unknown;
  try { body = await req.json(); } catch { body = {}; }

  const parsed = AvailabilitySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  logger.info(TAG_AVAIL, 'Checking room availability (POST)', parsed.data);
  return NextResponse.json(checkAvailability({
    checkIn:  parsed.data.check_in,
    checkOut: parsed.data.check_out,
    type:     parsed.data.type,
  }), { status: 200 });
}

// ── AI Rooms: cancel + lock ───────────────────────────────────────────────────

const RoomIdSchema = z.object({ room_id: z.string().min(1, 'room_id is required') });

export async function handleAiCancelBooking(req: NextRequest): Promise<NextResponse> {
  const guard = await vapiGuard(req, 30);
  if (guard) return guard.error;

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = RoomIdSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  logger.info('AI:CancelBooking', `Cancelling booking for room ${parsed.data.room_id}`);
  const result = await cancelBooking(parsed.data.room_id);
  return NextResponse.json(result, { status: result.success ? 200 : 409 });
}

export async function handleAiLockRoom(req: NextRequest): Promise<NextResponse> {
  const guard = await vapiGuard(req, 30);
  if (guard) return guard.error;

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = RoomIdSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  logger.info('AI:LockRoom', `Locking room ${parsed.data.room_id}`);
  const result = lockRoom(parsed.data.room_id);
  return NextResponse.json(result, { status: result.success ? 200 : 409 });
}

// ── Calendar: book + check ────────────────────────────────────────────────────

const CalendarBookSchema = z.object({
  room_id:    z.string().min(1, 'room_id is required'),
  guest_name: z.string().min(1).max(100),
  check_in:   DateSchema.optional(),
  check_out:  DateSchema.optional(),
});

export async function handleCalendarBook(req: NextRequest): Promise<NextResponse> {
  const guard = await vapiGuard(req, 30);
  if (guard) return guard.error;

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = CalendarBookSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { room_id, guest_name, check_in, check_out } = parsed.data;
  logger.info('AI:CalendarBook', `Booking room ${room_id} for ${guest_name}`, { check_in, check_out });

  const lockResult = lockRoom(room_id);
  if (!lockResult.success) return NextResponse.json(lockResult, { status: 409 });

  const confirmResult = await confirmBooking(room_id, guest_name, check_in, check_out);
  return NextResponse.json(confirmResult, { status: confirmResult.success ? 200 : 409 });
}

const CalendarCheckSchema = z.object({
  check_in:  DateSchema,
  check_out: DateSchema,
});

export async function handleCalendarCheckGet(req: NextRequest): Promise<NextResponse> {
  const guard = await vapiGuard(req, 30);
  if (guard) return guard.error;

  const { searchParams } = new URL(req.url);
  const parsed = CalendarCheckSchema.safeParse({
    check_in:  searchParams.get('check_in'),
    check_out: searchParams.get('check_out'),
  });
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  logger.info('AI:CalendarCheck', `Checking calendar range ${parsed.data.check_in} → ${parsed.data.check_out}`);
  return NextResponse.json(await checkCalendarRange(parsed.data.check_in, parsed.data.check_out));
}

export async function handleCalendarCheckPost(req: NextRequest): Promise<NextResponse> {
  const guard = await vapiGuard(req, 30);
  if (guard) return guard.error;

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = CalendarCheckSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  logger.info('AI:CalendarCheck', `Checking calendar range ${parsed.data.check_in} → ${parsed.data.check_out}`);
  return NextResponse.json(await checkCalendarRange(parsed.data.check_in, parsed.data.check_out));
}

// ── Hotel Info ────────────────────────────────────────────────────────────────

export async function handleAiHotelInfo(req: NextRequest): Promise<NextResponse> {
  const guard = await vapiGuard(req, 60);
  if (guard) return guard.error;

  logger.info('AI:HotelInfo', 'Fetching hotel info');
  return NextResponse.json(getHotelInfo(), { status: 200 });
}
