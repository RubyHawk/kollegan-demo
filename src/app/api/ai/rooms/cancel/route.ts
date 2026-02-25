import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { validateVapiAuth } from '@core/auth/vapi-auth';
import { checkRateLimit } from '@core/cache/rate-limiter';
import { logger } from '@core/logging/logger';
import { cancelBooking } from '@features/voice/ai-tools';

export const dynamic = 'force-dynamic';

const BodySchema = z.object({
  room_id: z.string().min(1, 'room_id is required'),
});

const TAG = 'AI:CancelBooking';

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

  logger.info(TAG, `Cancelling booking for room ${parsed.data.room_id}`);
  const result = await cancelBooking(parsed.data.room_id);

  return NextResponse.json(result, { status: result.success ? 200 : 409 });
}
