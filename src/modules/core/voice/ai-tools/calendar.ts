import {
  createCalendarEvent,
  deleteCalendarEvent,
  updateCalendarEvent,
  listCalendarEvents,
  isCalendarConfigured,
} from '@platform/calendar/google-calendar';
import type { CalendarEventInput, CalendarEventSummary } from '@platform/calendar/google-calendar';
import { withRetry } from '@platform/resilience/with-retry';

export type { CalendarEventInput, CalendarEventSummary };

export interface CalendarCheckResult {
  events: CalendarEventSummary[];
  hasConflicts: boolean;
}

/**
 * Checks Google Calendar for events in a date range.
 * Used before confirming a booking to detect external conflicts.
 * Wraps the API call with retry + backoff.
 */
export async function checkCalendarRange(
  checkIn: string,
  checkOut: string
): Promise<CalendarCheckResult> {
  if (!isCalendarConfigured()) {
    return { events: [], hasConflicts: false };
  }

  const events = await withRetry(
    () => listCalendarEvents(checkIn, checkOut),
    'CalendarCheck'
  );

  return { events, hasConflicts: events.length > 0 };
}

/**
 * Creates a Google Calendar booking event with retry.
 */
export const createCalendarEventWithRetry = (input: CalendarEventInput): Promise<string | null> =>
  withRetry(() => createCalendarEvent(input), 'CalendarCreate');

/**
 * Deletes a Google Calendar event with retry.
 */
export const deleteCalendarEventWithRetry = (eventId: string): Promise<boolean> =>
  withRetry(() => deleteCalendarEvent(eventId), 'CalendarDelete');

/**
 * Updates a Google Calendar event with retry.
 * Note: updateCalendarEvent requires all fields — no partial updates.
 */
export const updateCalendarEventWithRetry = (
  eventId: string,
  input: CalendarEventInput
): Promise<boolean> => withRetry(() => updateCalendarEvent(eventId, input), 'CalendarUpdate');
