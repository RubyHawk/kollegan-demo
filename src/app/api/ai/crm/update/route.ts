import { z } from 'zod';
import { createHandler, ok } from '@core/api';
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

const handler = createHandler(
  {
    tag:       'AI:CrmUpdate',
    auth:      'vapi',
    rateLimit: { max: 30, windowMs: 60_000 },
    body:      BodySchema,
  },
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

export const POST = handler;
