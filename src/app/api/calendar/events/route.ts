import { NextResponse } from 'next/server';
import { isCalendarConfigured } from '@infra/calendar/google-calendar';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/calendar/info
 *
 * Returns whether Google Calendar is configured and, if so, the iframe
 * embed URL so the frontend can display the embedded calendar.
 */
export async function GET() {
  const configured = isCalendarConfigured();

  if (!configured) {
    return NextResponse.json({ configured: false, embedUrl: null });
  }

  const calendarId = process.env.GOOGLE_CALENDAR_ID!;
  const embedUrl =
    `https://calendar.google.com/calendar/embed` +
    `?src=${encodeURIComponent(calendarId)}` +
    `&ctz=Europe%2FStockholm` +
    `&showTitle=0&showNav=1&showDate=1&showPrint=0&showTabs=1&showCalendars=0&mode=MONTH`;

  return NextResponse.json({ configured: true, embedUrl });
}
