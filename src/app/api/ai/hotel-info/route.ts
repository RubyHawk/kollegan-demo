import { createHandler, ok } from '@core/api';
import { getHotelInfo } from '@features/voice/ai-tools';

export const dynamic = 'force-dynamic';

const handler = createHandler(
  { tag: 'AI:HotelInfo', auth: 'vapi', rateLimit: { max: 60, windowMs: 60_000 } },
  async () => ok(getHotelInfo())
);

export const GET  = handler;
export const POST = handler;
