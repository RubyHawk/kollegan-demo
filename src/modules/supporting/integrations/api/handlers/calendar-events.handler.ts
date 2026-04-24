import { createHandler, ok } from '@platform/api';
import { isCalendarConfigured } from '@platform/calendar/google-calendar';

export const handleCalendarEvents = createHandler(
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
