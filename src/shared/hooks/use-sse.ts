'use client';

import { useEffect } from 'react';
import { useRealtimeStore } from '@features/hotel/rooms/lib/hotel-realtime-store';
import type { Room } from '@features/hotel/rooms/types';
import type { ActivityEvent } from '@features/activity/types';

interface SSEPayload {
  type: 'room_update' | 'activity' | 'call_status' | 'full_state';
  payload: unknown;
}

export function useSSE() {
  const { setFullState, updateRoom, addActivity, setCallStatus, setConnected } =
    useRealtimeStore();

  useEffect(() => {
    const es = new EventSource('/api/sse');

    es.onopen = () => setConnected(true);
    es.onerror = () => setConnected(false);

    es.onmessage = (event) => {
      const msg: SSEPayload = JSON.parse(event.data);

      switch (msg.type) {
        case 'full_state': {
          const state = msg.payload as {
            rooms: Room[];
            recentActivity: ActivityEvent[];
            onCall: boolean;
          };
          setFullState(state);
          break;
        }
        case 'room_update':
          updateRoom(msg.payload as Room);
          break;
        case 'activity':
          addActivity(msg.payload as ActivityEvent);
          break;
        case 'call_status': {
          const { onCall } = msg.payload as { onCall: boolean };
          setCallStatus(onCall);
          break;
        }
      }
    };

    return () => es.close();
  }, [setFullState, updateRoom, addActivity, setCallStatus, setConnected]);
}
