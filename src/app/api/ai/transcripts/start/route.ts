import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { validateVapiAuth } from '@/lib/vapi-auth';
import { checkRateLimit } from '@/lib/rate-limiter';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const BodySchema = z.object({
  vapi_call_id: z.string().min(1, 'vapi_call_id is required'),
});

const TAG = 'AI:TranscriptStart';

/**
 * Called by VAPI at the start of a call to create a transcript record.
 * Returns the transcriptId for use in subsequent CRM update.
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

  logger.info(TAG, `Starting transcript for call ${parsed.data.vapi_call_id}`);

  const transcript = await prisma.callTranscript.upsert({
    where:  { vapiCallId: parsed.data.vapi_call_id },
    create: { vapiCallId: parsed.data.vapi_call_id, startedAt: new Date() },
    update: { startedAt: new Date() },
  });

  return NextResponse.json({ success: true, transcriptId: transcript.id }, { status: 200 });
}
