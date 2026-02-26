import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { validateVapiAuth } from '@core/auth/vapi-auth';
import { checkRateLimit } from '@core/cache/rate-limiter';
import { logger } from '@core/logging/logger';
import { checkAvailability } from '@features/voice/ai-tools';

export const dynamic = 'force-dynamic';

const QuerySchema = z.object({
  check_in:  z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD').optional(),
  check_out: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD').optional(),
  type:      z.enum(['Enkel', 'Dubbel', 'Svit']).optional(),
});

const TAG = 'AI:AvailabilityCheck';

export async function GET(req: NextRequest) {
  // 1. Rate limit
  const ip = req.headers.get('x-forwarded-for') ?? 'vapi';
  const rl = await checkRateLimit(ip, 60, 60_000);
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
  }

  // 2. Auth
  const authError = validateVapiAuth(req);
  if (authError) {
    return NextResponse.json({ error: authError.error }, { status: authError.status });
  }

  // 3. Parse query params
  const { searchParams } = new URL(req.url);
  const raw = {
    check_in:  searchParams.get('check_in')  ?? undefined,
    check_out: searchParams.get('check_out') ?? undefined,
    type:      searchParams.get('type')      ?? undefined,
  };

  // 4. Zod validate
  const parsed = QuerySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  // 5. Execute tool
  logger.info(TAG, 'Checking room availability', parsed.data);
  const result = checkAvailability({
    checkIn:  parsed.data.check_in,
    checkOut: parsed.data.check_out,
    type:     parsed.data.type,
  });

  return NextResponse.json(result, { status: 200 });
}

// VAPI also sends POST for some tool configurations
export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? 'vapi';
  const rl = await checkRateLimit(ip, 60, 60_000);
  if (!rl.allowed) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });

  const authError = validateVapiAuth(req);
  if (authError) return NextResponse.json({ error: authError.error }, { status: authError.status });

  let body: unknown;
  try { body = await req.json(); } catch {
    body = {};
  }

  const parsed = QuerySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  logger.info(TAG, 'Checking room availability (POST)', parsed.data);
  const result = checkAvailability({
    checkIn:  parsed.data.check_in,
    checkOut: parsed.data.check_out,
    type:     parsed.data.type,
  });

  return NextResponse.json(result, { status: 200 });
}
