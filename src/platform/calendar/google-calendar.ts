import { google, calendar_v3 } from 'googleapis';
import { GoogleAuth } from 'google-auth-library';

const SCOPES = ['https://www.googleapis.com/auth/calendar'];

function getCalendarClient(): calendar_v3.Calendar | null {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const key = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;
  const calendarId = process.env.GOOGLE_CALENDAR_ID;

  if (!email || !key || !calendarId) {
    return null;
  }

  // GoogleAuth with credentials is compatible with Node 18+/OpenSSL 3.
  // google.auth.JWT uses a legacy code path that triggers ERR_OSSL_UNSUPPORTED.
  const auth = new GoogleAuth({
    credentials: {
      client_email: email,
      private_key: key.replace(/\\n/g, '\n'),
    },
    scopes: SCOPES,
  });

  return google.calendar({ version: 'v3', auth });
}

function getCalendarId(): string {
  return process.env.GOOGLE_CALENDAR_ID || '';
}

export interface CalendarEventInput {
  roomId: string;
  roomType: string;
  guestName: string;
  checkIn: string; // ISO date string (YYYY-MM-DD)
  checkOut: string; // ISO date string (YYYY-MM-DD)
}

export async function createCalendarEvent(
  input: CalendarEventInput
): Promise<string | null> {
  const calendar = getCalendarClient();
  if (!calendar) {
    console.warn('[GoogleCalendar] Not configured — skipping event creation');
    return null;
  }

  const event: calendar_v3.Schema$Event = {
    summary: `Rum ${input.roomId} — ${input.guestName}`,
    description: [
      `Gäst: ${input.guestName}`,
      `Rum: ${input.roomId} (${input.roomType})`,
      `Incheckning: ${input.checkIn}`,
      `Utcheckning: ${input.checkOut}`,
    ].join('\n'),
    start: {
      date: input.checkIn,
      timeZone: 'Europe/Stockholm',
    },
    end: {
      date: input.checkOut,
      timeZone: 'Europe/Stockholm',
    },
    colorId: '9', // blueberry
  };

  const res = await calendar.events.insert({
    calendarId: getCalendarId(),
    requestBody: event,
  });

  return res.data.id ?? null;
}

export async function deleteCalendarEvent(eventId: string): Promise<boolean> {
  const calendar = getCalendarClient();
  if (!calendar) {
    console.warn('[GoogleCalendar] Not configured — skipping event deletion');
    return false;
  }

  try {
    await calendar.events.delete({
      calendarId: getCalendarId(),
      eventId,
    });
    return true;
  } catch (err) {
    console.error('[GoogleCalendar] Failed to delete event:', err);
    return false;
  }
}

export async function updateCalendarEvent(
  eventId: string,
  input: CalendarEventInput
): Promise<boolean> {
  const calendar = getCalendarClient();
  if (!calendar) {
    console.warn('[GoogleCalendar] Not configured — skipping event update');
    return false;
  }

  try {
    await calendar.events.patch({
      calendarId: getCalendarId(),
      eventId,
      requestBody: {
        summary: `Rum ${input.roomId} — ${input.guestName}`,
        description: [
          `Gäst: ${input.guestName}`,
          `Rum: ${input.roomId} (${input.roomType})`,
          `Incheckning: ${input.checkIn}`,
          `Utcheckning: ${input.checkOut}`,
        ].join('\n'),
        start: {
          date: input.checkIn,
          timeZone: 'Europe/Stockholm',
        },
        end: {
          date: input.checkOut,
          timeZone: 'Europe/Stockholm',
        },
      },
    });
    return true;
  } catch (err) {
    console.error('[GoogleCalendar] Failed to update event:', err);
    return false;
  }
}

export function isCalendarConfigured(): boolean {
  return !!(
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL &&
    process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY &&
    process.env.GOOGLE_CALENDAR_ID
  );
}

export interface CalendarEventSummary {
  id: string;
  summary: string;
  start: string;
  end: string;
}

/**
 * Lists Google Calendar events within a date range.
 * Returns an empty array if calendar is not configured.
 */
export async function listCalendarEvents(
  checkIn: string,
  checkOut: string
): Promise<CalendarEventSummary[]> {
  const calendar = getCalendarClient();
  if (!calendar) return [];

  try {
    const res = await calendar.events.list({
      calendarId: getCalendarId(),
      timeMin: new Date(checkIn).toISOString(),
      timeMax: new Date(checkOut).toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
    });

    return (res.data.items ?? []).map((e) => ({
      id:      e.id      ?? '',
      summary: e.summary ?? '',
      start:   e.start?.date ?? e.start?.dateTime ?? '',
      end:     e.end?.date   ?? e.end?.dateTime   ?? '',
    }));
  } catch (err) {
    console.error('[GoogleCalendar] Failed to list events:', err);
    return [];
  }
}
