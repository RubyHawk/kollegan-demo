import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { validateVapiAuth } from '@core/auth/vapi-auth';
import { checkRateLimit } from '@core/cache/rate-limiter';
import { logger } from '@core/logging/logger';
import { lockRoom } from '@features/voice/ai-tools';

export const dynamic = 'force-dynamic';

const BodySchema = z.object({
  room_id: z.string().min(1, 'room_id is required'),
});

const TAG = 'AI:LockRoom';

export async function POST(req: NextRequest) {
  // 1. Rate limit
  const ip = req.headers.get('x-forwarded-for') ?? 'vapi';
  const rl = await checkRateLimit(ip, 30, 60_000);
  if (!rl.allowed) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });

  // 2. Auth
  const authError = validateVapiAuth(req);
  if (authError) return NextResponse.json({ error: authError.error }, { status: authError.status });

  // 3. Parse body
  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  // 4. Validate
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  // 5. Execute
  logger.info(TAG, `Locking room ${parsed.data.room_id}`);
  const result = lockRoom(parsed.data.room_id);

  return NextResponse.json(result, { status: result.success ? 200 : 409 });
}
