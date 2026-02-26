import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { validateVapiAuth } from '@core/auth/vapi-auth';
import { checkRateLimit } from '@core/cache/rate-limiter';
import { logger } from '@core/logging/logger';
import { updateCrm } from '@features/voice/ai-tools';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const BodySchema = z.object({
  name:            z.string().min(1).max(100).optional(),
  phone:           z.string().min(1).max(30).optional(),
  email:           z.string().email().optional(),
  company:         z.string().max(100).optional(),
  notes:           z.string().max(1000).optional(),
  summary:         z.string().max(2000).optional(),
  booked_room_ids: z.array(z.string()).optional(),
  vapi_call_id:    z.string().optional(),
});

const TAG = 'AI:CRMUpdate';

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

  const { booked_room_ids, vapi_call_id, ...rest } = parsed.data;

  logger.info(TAG, 'Updating CRM', { name: rest.name, email: rest.email, phone: rest.phone });
  const result = await updateCrm({
    ...rest,
    bookedRoomIds: booked_room_ids,
    vapiCallId:    vapi_call_id,
  });

  return NextResponse.json(result, { status: result.success ? 200 : 400 });
}
