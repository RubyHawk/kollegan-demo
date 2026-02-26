import { z } from 'zod';
import { createHandler, ok } from '@core/api';
import { startCallTranscript } from '@features/crm/service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const BodySchema = z.object({
  vapi_call_id: z.string().min(1, 'vapi_call_id is required'),
});

/**
 * Called by VAPI at the start of a call to create a transcript record.
 * Returns the transcriptId for use in the subsequent CRM update call.
 */
export const POST = createHandler(
  { tag: 'AI:TranscriptStart', auth: 'vapi', rateLimit: { max: 30, windowMs: 60_000 }, body: BodySchema },
  async ({ body }) => {
    const { transcriptId } = await startCallTranscript(body.vapi_call_id);
    return ok({ success: true, transcriptId });
  }
);
