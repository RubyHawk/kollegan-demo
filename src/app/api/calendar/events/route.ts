import { NextRequest, NextResponse } from 'next/server';
import { listCalendarEvents, isCalendarConfigured } from '@infra/calendar/google-calendar';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/calendar/events?from=YYYY-MM-DD&to=YYYY-MM-DD
 *
 * Public (dashboard-facing) endpoint that returns Google Calendar events
 * for the requested date range. Used by the calendar toggle UI to show
 * proof that the Google Calendar integration is working.
 */
export async function GET(req: NextRequest) {
  const configured = isCalendarConfigured();

  if (!configured) {
    return NextResponse.json({ configured: false, events: [] });
  }

  const { searchParams } = new URL(req.url);
  const from = searchParams.get('from');
  const to   = searchParams.get('to');

  const dateRe = /^\d{4}-\d{2}-\d{2}$/;
  if (!from || !to || !dateRe.test(from) || !dateRe.test(to)) {
    return NextResponse.json({ error: 'from and to query params (YYYY-MM-DD) are required' }, { status: 400 });
  }

  try {
    const events = await listCalendarEvents(from, to);
    return NextResponse.json({ configured: true, events });
  } catch (err) {
    console.error('[/api/calendar/events]', err);
    return NextResponse.json({ error: 'Failed to fetch calendar events' }, { status: 500 });
  }
}
