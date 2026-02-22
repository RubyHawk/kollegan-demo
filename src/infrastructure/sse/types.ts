import type { Room } from '@features/rooms/types';
import type { ActivityEvent } from '@features/activity/types';

export interface SSEMessage {
  type: 'room_update' | 'activity' | 'call_status' | 'full_state';
  payload:
    | Room
    | ActivityEvent
    | { onCall: boolean }
    | { rooms: Room[]; recentActivity: ActivityEvent[]; onCall: boolean };
}
