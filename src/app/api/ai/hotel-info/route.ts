import { NextRequest, NextResponse } from 'next/server';
import { validateVapiAuth } from '@core/auth/vapi-auth';
import { checkRateLimit } from '@core/cache/rate-limiter';
import { logger } from '@core/logging/logger';
import { getHotelInfo } from '@features/voice/ai-tools';

export const dynamic = 'force-dynamic';

const TAG = 'AI:HotelInfo';

async function handle(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? 'vapi';
  const rl = await checkRateLimit(ip, 60, 60_000);
  if (!rl.allowed) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });

  const authError = validateVapiAuth(req);
  if (authError) return NextResponse.json({ error: authError.error }, { status: authError.status });

  logger.info(TAG, 'Fetching hotel info');
  return NextResponse.json(getHotelInfo(), { status: 200 });
}

export const GET  = handle;
export const POST = handle;
