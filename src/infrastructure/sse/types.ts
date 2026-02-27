import type { Room } from '@demos/hotel/domain/room.entity';
import type { ActivityEvent } from '@demos/hotel/activity/types';

export interface SSEMessage {
  type: 'room_update' | 'activity' | 'call_status' | 'full_state';
  payload:
    | Room
    | ActivityEvent
    | { onCall: boolean }
    | { rooms: Room[]; recentActivity: ActivityEvent[]; onCall: boolean };
}
