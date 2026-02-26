/**
 * Voice module — tool registration.
 *
 * Registers all Vapi AI tools into the central automation tool registry.
 * Once registered, these tools are available to:
 *   1. Vapi voice agent  — called mid-call via /api/ai/* route handlers
 *   2. Workflow engine   — called as 'tool_call' step type in any workflow
 *   3. ReAct LLM loops  — available to any LLM reasoning step
 *
 * Called exactly once at startup from instrumentation.ts.
 */

import { registerTool } from '@features/automation/tools/registry';
import { checkAvailability } from '@features/voice/ai-tools/availability';
import { lockRoom, confirmBooking, cancelBooking } from '@features/hotel/rooms/lib/room-store';
import { lookupCustomer, upsertCustomer } from '@features/voice/ai-tools/customers';
import { updateCRM } from '@features/voice/ai-tools/crm';
import { checkCalendarRange } from '@features/voice/ai-tools/calendar';

export function registerVoiceTools(): void {

  // ─── Hotel tools ──────────────────────────────────────────────────────────────

  registerTool({
    name: 'hotel.check_availability',
    description:
      'Check available hotel rooms. Optionally filter by check-in/check-out date (YYYY-MM-DD) and room type.',
    fn: async (args) => {
      const { check_in, check_out, type } = args as {
        check_in?: string;
        check_out?: string;
        type?: string;
      };
      return checkAvailability({ checkIn: check_in, checkOut: check_out, type: type as never });
    },
  });

  registerTool({
    name: 'hotel.lock_room',
    description:
      'Lock a specific room to hold it for the guest during an active call. ' +
      'Must be confirmed or cancelled before the call ends.',
    fn: async (args) => {
      const { room_id } = args as { room_id: string };
      return lockRoom(room_id);
    },
  });

  registerTool({
    name: 'hotel.confirm_booking',
    description:
      'Confirm a room booking with guest name and optional check-in/check-out dates.',
    fn: async (args) => {
      const { room_id, guest_name, check_in, check_out } = args as {
        room_id: string;
        guest_name: string;
        check_in?: string;
        check_out?: string;
      };
      return confirmBooking(room_id, guest_name, check_in, check_out);
    },
  });

  registerTool({
    name: 'hotel.cancel_booking',
    description: 'Cancel an existing room booking and return the room to available status.',
    fn: async (args) => {
      const { room_id } = args as { room_id: string };
      return cancelBooking(room_id);
    },
  });

  // ─── Calendar tools ───────────────────────────────────────────────────────────

  registerTool({
    name: 'hotel.check_calendar',
    description:
      'Check Google Calendar for events in a date range before confirming a booking. ' +
      'Returns existing events and whether conflicts exist.',
    fn: async (args) => {
      const { check_in, check_out } = args as { check_in: string; check_out: string };
      return checkCalendarRange(check_in, check_out);
    },
  });

  // ─── CRM tools ────────────────────────────────────────────────────────────────

  registerTool({
    name: 'crm.lookup_customer',
    description: 'Look up an existing customer profile by phone number or name.',
    fn: async (args) => {
      const { phone, name } = args as { phone?: string; name?: string };
      return lookupCustomer({ phone, name });
    },
  });

  registerTool({
    name: 'crm.upsert_customer',
    description: 'Create or update a customer profile. Uses phone as the unique key when available.',
    fn: async (args) => {
      return upsertCustomer(
        args as Parameters<typeof upsertCustomer>[0],
      );
    },
  });

  registerTool({
    name: 'crm.update_record',
    description:
      'Create a CRM record for a completed call session, linking booked rooms, ' +
      'the customer profile, and the Vapi transcript.',
    fn: async (args) => {
      return updateCRM(args as Parameters<typeof updateCRM>[0]);
    },
  });
}
