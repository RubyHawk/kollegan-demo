import { registerTool } from '@modules/core/automation/tools/registry';
import { checkCalendarRange } from './ai-tools/calendar';

export function registerVoiceTools(): void {
  registerTool({
    name: 'hotel.check_calendar',
    description:
      'Check Google Calendar for events in a date range before confirming a booking. Returns existing events and whether conflicts exist.',
    fn: async (args) => {
      const { check_in, check_out } = args as { check_in: string; check_out: string };
      return checkCalendarRange(check_in, check_out);
    },
  });
}
