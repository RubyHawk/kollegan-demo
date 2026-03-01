import { isCalendarConfigured } from '@infra/calendar/google-calendar';
import { createHandler, ok } from '@core/api';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/calendar/events
 *
 * Returns whether Google Calendar is configured and, if so, the iframe
 * embed URL so the frontend can display the embedded calendar.
 *
 * Requires JWT auth — GOOGLE_CALENDAR_ID must not be leaked to unauthenticated clients.
 */
export const GET = createHandler(
  { tag: 'Calendar:Events', auth: 'jwt', rateLimit: { max: 30, windowMs: 60_000 } },
  async () => {
    const configured = isCalendarConfigured();

    if (!configured) {
      return ok({ configured: false, embedUrl: null });
    }

    const calendarId = process.env.GOOGLE_CALENDAR_ID!;
    const embedUrl =
      `https://calendar.google.com/calendar/embed` +
      `?src=${encodeURIComponent(calendarId)}` +
      `&ctz=Europe%2FStockholm` +
      `&showTitle=0&showNav=1&showDate=1&showPrint=0&showTabs=1&showCalendars=0&mode=MONTH`;

    return ok({ configured: true, embedUrl });
  },
);
