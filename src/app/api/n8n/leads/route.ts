/**
 * POST /api/n8n/leads
 *
 * n8n webhook — automated lead ingestion from Vapi call transcripts or
 * any external workflow trigger.
 *
 * Auth: x-n8n-secret header (same pattern as Vapi webhook auth).
 * Call from n8n when a call transcript analysis identifies a potential lead.
 *
 * Body: lead fields + optional orgId override for multi-org n8n setups.
 */

import { z } from 'zod';
import { NextRequest, NextResponse } from 'next/server';
import { createLead } from '@modules/supporting/leads';
import { logger } from '@core/logging/logger';

const TAG = 'N8nLeadsWebhook';
const DEMO_ORG_ID = process.env.DEMO_ORG_ID ?? 'demo';

const BodySchema = z.object({
  orgId:          z.string().optional(),
  name:           z.string().min(1).max(200),
  email:          z.string().email().optional(),
  phone:          z.string().max(30).optional(),
  company:        z.string().max(200).optional(),
  notes:          z.string().max(2000).optional(),
  estimatedValue: z.number().min(0).optional(),
  score:          z.number().int().min(0).max(100).optional(),
  assignedTo:     z.string().optional(),
  vapiCallId:     z.string().optional(),   // for cross-referencing with CRM records
});

export async function POST(req: NextRequest): Promise<NextResponse> {
  // Verify n8n shared secret
  const n8nSecret = process.env.N8N_WEBHOOK_SECRET;
  if (n8nSecret) {
    const incoming = req.headers.get('x-n8n-secret') ?? '';
    if (incoming !== n8nSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = BodySchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation error', issues: parsed.error.issues }, { status: 422 });
  }

  const { orgId, vapiCallId, ...leadFields } = parsed.data;

  try {
    const lead = await createLead(
      {
        ...leadFields,
        organizationId: orgId ?? DEMO_ORG_ID,
        source:         'n8n_webhook',
        notes:          vapiCallId
          ? `${leadFields.notes ? leadFields.notes + '\n' : ''}Vapi call ID: ${vapiCallId}`
          : leadFields.notes,
      },
      'system',
    );

    logger.info(TAG, `Lead created via n8n webhook: ${lead.name}`, { leadId: lead.id, vapiCallId });
    return NextResponse.json({ success: true, leadId: lead.id }, { status: 201 });
  } catch (err) {
    logger.error(TAG, 'Failed to create lead from n8n webhook', { error: err });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
