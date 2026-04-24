import { apiGet } from '../api-client';

const BASE_URL = '/api/v1/calendar/events';

interface CalendarEventsEnvelope {
  data: {
    configured: boolean;
    embedUrl: string | null;
  };
}

export async function getCalendarEventsConfig() {
  const response = await apiGet<CalendarEventsEnvelope>(BASE_URL);
  return response.data;
}
