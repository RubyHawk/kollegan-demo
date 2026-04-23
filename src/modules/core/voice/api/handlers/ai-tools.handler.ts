import { z } from 'zod';
import { createHandler, ok } from '@platform/api';
import { checkCalendarRange } from '../../ai-tools/calendar';

const DateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD');

const CalendarCheckSchema = z.object({
  check_in: DateSchema,
  check_out: DateSchema,
});

export const handleCalendarCheckGet = createHandler(
  { tag: 'AI:CalendarCheck', auth: 'vapi', rateLimit: { max: 30, windowMs: 60_000 }, query: CalendarCheckSchema },
  async ({ query }) => ok(await checkCalendarRange(query.check_in, query.check_out)),
);

export const handleCalendarCheckPost = createHandler(
  { tag: 'AI:CalendarCheck', auth: 'vapi', rateLimit: { max: 30, windowMs: 60_000 }, body: CalendarCheckSchema },
  async ({ body }) => ok(await checkCalendarRange(body.check_in, body.check_out)),
);
