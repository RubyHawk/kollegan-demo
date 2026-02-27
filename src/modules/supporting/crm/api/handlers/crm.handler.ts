/**
 * CRM API handlers — colocated with the CRM module.
 *
 * All Vapi-facing handlers use createHandler from @core/api which provides:
 *   - Vapi JWT authentication
 *   - Rate limiting
 *   - Zod validation
 *   - RFC 9110 / 9457 compliant error responses
 *
 * app/api/ routes are thin re-export wrappers that point here.
 */

import { z } from 'zod';
import { createHandler, ok } from '@core/api';
import { NextRequest, NextResponse } from 'next/server';
import { lookupCustomer, updateCrm, startCallTranscript } from '../../application/crm.service';

// ── Transcript ────────────────────────────────────────────────────────────────

const TranscriptBodySchema = z.object({
  vapi_call_id: z.string().min(1, 'vapi_call_id is required'),
});

export const handleStartTranscript = createHandler(
  { tag: 'AI:TranscriptStart', auth: 'vapi', rateLimit: { max: 30, windowMs: 60_000 }, body: TranscriptBodySchema },
  async ({ body }) => {
    const { transcriptId } = await startCallTranscript(body.vapi_call_id);
    return ok({ success: true, transcriptId });
  }
);

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

export const handleUpdateCrm = createHandler(
  { tag: 'AI:CrmUpdate', auth: 'vapi', rateLimit: { max: 30, windowMs: 60_000 }, body: CrmUpdateSchema },
  async ({ body }) => {
    const { booked_room_ids, vapi_call_id, ...rest } = body;
    const result = await updateCrm({
      ...rest,
      bookedRoomIds: booked_room_ids,
      vapiCallId:    vapi_call_id,
    });
    return ok(result);
  }
);

// ── Customer Lookup ───────────────────────────────────────────────────────────

const LookupSchema = z.object({
  phone: z.string().min(1).max(30).optional(),
  name:  z.string().min(1).max(100).optional(),
});

export const handleGetCustomerGet = createHandler(
  { tag: 'AI:CustomerGet', auth: 'vapi', rateLimit: { max: 30, windowMs: 60_000 }, query: LookupSchema },
  async ({ query }) => ok(await lookupCustomer(query))
);

export const handleGetCustomerPost = createHandler(
  { tag: 'AI:CustomerGet', auth: 'vapi', rateLimit: { max: 30, windowMs: 60_000 }, body: LookupSchema },
  async ({ body }) => ok(await lookupCustomer(body))
);

// ── N8N CRM Update (no Vapi auth — called by n8n webhook) ─────────────────────

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
