import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { validateVapiAuth } from '@core/auth/vapi-auth';
import { checkRateLimit } from '@core/cache/rate-limiter';
import { logger } from '@core/logging/logger';
import { lookupCustomer, updateCrm, startCallTranscript } from '../../application/crm.service';

// ── Shared Vapi guard ─────────────────────────────────────────────────────────

async function vapiGuard(
  req: NextRequest,
  maxPerMin: number,
): Promise<{ error: NextResponse } | null> {
  const ip = req.headers.get('x-forwarded-for') ?? 'vapi';
  const rl = await checkRateLimit(ip, maxPerMin, 60_000);
  if (!rl.allowed)
    return { error: NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 }) };

  const authError = validateVapiAuth(req);
  if (authError)
    return { error: NextResponse.json({ error: authError.error }, { status: authError.status }) };

  return null;
}

// ── Transcript ────────────────────────────────────────────────────────────────

const TranscriptBodySchema = z.object({
  vapi_call_id: z.string().min(1, 'vapi_call_id is required'),
});

export async function handleStartTranscript(req: NextRequest): Promise<NextResponse> {
  const guard = await vapiGuard(req, 30);
  if (guard) return guard.error;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = TranscriptBodySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  logger.info('AI:TranscriptStart', `Starting transcript for call ${parsed.data.vapi_call_id}`);
  const { transcriptId } = await startCallTranscript(parsed.data.vapi_call_id);
  return NextResponse.json({ success: true, transcriptId }, { status: 200 });
}

// ── CRM Update ────────────────────────────────────────────────────────────────

const CrmUpdateSchema = z.object({
  name:            z.string().min(1).max(100).optional(),
  phone:           z.string().min(1).max(30).optional(),
  email:           z.string().email().optional(),
  company:         z.string().max(100).optional(),
  notes:           z.string().max(1000).optional(),
  summary:         z.string().max(2000).optional(),
  booked_room_ids: z.array(z.string()).optional(),
  vapi_call_id:    z.string().optional(),
});

export async function handleUpdateCrm(req: NextRequest): Promise<NextResponse> {
  const guard = await vapiGuard(req, 30);
  if (guard) return guard.error;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = CrmUpdateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { booked_room_ids, vapi_call_id, ...rest } = parsed.data;
  const result = await updateCrm({
    ...rest,
    bookedRoomIds: booked_room_ids,
    vapiCallId:    vapi_call_id,
  });
  return NextResponse.json(result, { status: result.success ? 200 : 400 });
}

// ── Customer Lookup ───────────────────────────────────────────────────────────

const LookupSchema = z.object({
  phone: z.string().min(1).max(30).optional(),
  name:  z.string().min(1).max(100).optional(),
});

export async function handleGetCustomerGet(req: NextRequest): Promise<NextResponse> {
  const guard = await vapiGuard(req, 30);
  if (guard) return guard.error;

  const { searchParams } = new URL(req.url);
  const parsed = LookupSchema.safeParse({
    phone: searchParams.get('phone') ?? undefined,
    name:  searchParams.get('name')  ?? undefined,
  });
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const result = await lookupCustomer(parsed.data);
  return NextResponse.json(result, { status: 200 });
}

export async function handleGetCustomerPost(req: NextRequest): Promise<NextResponse> {
  const guard = await vapiGuard(req, 30);
  if (guard) return guard.error;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = LookupSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const result = await lookupCustomer(parsed.data);
  return NextResponse.json(result, { status: 200 });
}

// ── N8N CRM Update (no Vapi auth) ─────────────────────────────────────────────

export async function handleN8nCrmUpdate(req: NextRequest): Promise<NextResponse> {
  let body: Record<string, string>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { name, email, phone, company, notes, summary } = body;

  if (!name && !email && !phone) {
    return NextResponse.json(
      { error: 'At least one of name, email, or phone is required' },
      { status: 400 },
    );
  }

  const result = await updateCrm({ name, email, phone, company, notes, summary });
  return NextResponse.json(result, { status: result.success ? 200 : 400 });
}
