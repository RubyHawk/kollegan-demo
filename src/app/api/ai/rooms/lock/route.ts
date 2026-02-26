import { z } from 'zod';
import { createHandler, Errors, ok } from '@core/api';
import { lockRoom } from '@features/voice/ai-tools';

export const dynamic = 'force-dynamic';

const BodySchema = z.object({
  room_id: z.string().min(1, 'room_id is required'),
});

export const POST = createHandler(
  { tag: 'AI:LockRoom', auth: 'vapi', rateLimit: { max: 30, windowMs: 60_000 }, body: BodySchema },
  async ({ body }) => {
    const result = lockRoom(body.room_id);
    if (!result.success) {
      throw Errors.conflict(result.message ?? `Room ${body.room_id} is not available`);
    }
    return ok(result);
  }
);
