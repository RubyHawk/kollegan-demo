import { z } from 'zod';
import { createHandler, ok } from '@core/api';
import { lookupCustomer } from '@features/voice/ai-tools';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const LookupSchema = z.object({
  phone: z.string().min(1).max(30).optional(),
  name:  z.string().min(1).max(100).optional(),
});

// VAPI sends GET with query params or POST with JSON body — both supported.
// createHandler is called separately to target the correct parse path.

const getHandler = createHandler(
  {
    tag:       'AI:CustomerGet',
    auth:      'vapi',
    rateLimit: { max: 30, windowMs: 60_000 },
    query:     LookupSchema,
  },
  async ({ query }) => ok(await lookupCustomer(query))
);

const postHandler = createHandler(
  {
    tag:       'AI:CustomerGet',
    auth:      'vapi',
    rateLimit: { max: 30, windowMs: 60_000 },
    body:      LookupSchema,
  },
  async ({ body }) => ok(await lookupCustomer(body))
);

export const GET  = getHandler;
export const POST = postHandler;
