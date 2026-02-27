import { z } from 'zod';
import { createHandler, ok } from '@core/api';
import { checkCalendarRange } from '@features/voice/ai-tools';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const DateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD');

const Schema = z.object({
  check_in:  DateSchema,
  check_out: DateSchema,
});

const getHandler = createHandler(
  { tag: 'AI:CalendarCheck', auth: 'vapi', rateLimit: { max: 30, windowMs: 60_000 }, query: Schema },
  async ({ query }) => ok(await checkCalendarRange(query.check_in, query.check_out))
);

const postHandler = createHandler(
  { tag: 'AI:CalendarCheck', auth: 'vapi', rateLimit: { max: 30, windowMs: 60_000 }, body: Schema },
  async ({ body }) => ok(await checkCalendarRange(body.check_in, body.check_out))
);

export const GET  = getHandler;
export const POST = postHandler;
