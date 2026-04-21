import { registerTool } from '@modules/core/automation/tools/registry';
import {
  cancelBooking,
  checkHotelAvailability,
  confirmBooking,
  lockRoom,
} from './application/hotel-ai.service';

export function registerHotelVoiceTools(): void {
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
      return checkHotelAvailability({ checkIn: check_in, checkOut: check_out, type: type as never });
    },
  });

  registerTool({
    name: 'hotel.lock_room',
    description:
      'Lock a specific room to hold it for the guest during an active call. Must be confirmed or cancelled before the call ends.',
    fn: async (args) => {
      const { room_id } = args as { room_id: string };
      return lockRoom(room_id);
    },
  });

  registerTool({
    name: 'hotel.confirm_booking',
    description: 'Confirm a room booking with guest name and optional check-in/check-out dates.',
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

}
