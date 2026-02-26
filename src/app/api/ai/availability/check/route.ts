import { z } from 'zod';
import { createHandler, ok } from '@core/api';
import { checkAvailability } from '@features/voice/ai-tools';

export const dynamic = 'force-dynamic';

const Schema = z.object({
  check_in:  z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD').optional(),
  check_out: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD').optional(),
  type:      z.enum(['Enkel', 'Dubbel', 'Svit']).optional(),
});

// GET: query params (VAPI tool servers prefer GET)
const getHandler = createHandler(
  { tag: 'AI:AvailabilityCheck', auth: 'vapi', rateLimit: { max: 60, windowMs: 60_000 }, query: Schema },
  async ({ query }) => ok(checkAvailability({
    checkIn:  query.check_in,
    checkOut: query.check_out,
    type:     query.type,
  }))
);

// POST: body params (some VAPI configurations send POST)
const postHandler = createHandler(
  { tag: 'AI:AvailabilityCheck', auth: 'vapi', rateLimit: { max: 60, windowMs: 60_000 }, body: Schema },
  async ({ body }) => ok(checkAvailability({
    checkIn:  body.check_in,
    checkOut: body.check_out,
    type:     body.type,
  }))
);

export const GET  = getHandler;
export const POST = postHandler;
