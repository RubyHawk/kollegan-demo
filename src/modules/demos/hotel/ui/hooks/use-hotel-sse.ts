'use client';

import { useEffect } from 'react';
import { useRealtimeStore } from '../stores/hotel-realtime-store';
import type { Room } from '../../domain/room.entity';
import type { ActivityEvent } from '../../activity/types';

interface HotelSSEPayload {
  type: 'room_update' | 'activity' | 'call_status' | 'full_state';
  payload: unknown;
}

export function useHotelSSE(enabled = true) {
  const { setFullState, updateRoom, addActivity, setCallStatus, setConnected } =
    useRealtimeStore();

  useEffect(() => {
    if (!enabled) {
      setConnected(false);
      return;
    }

    const es = new EventSource('/api/sse');

    es.onopen = () => setConnected(true);
    es.onerror = () => setConnected(false);

    es.onmessage = (event) => {
      const msg: HotelSSEPayload = JSON.parse(event.data);

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

    return () => {
      setConnected(false);
      es.close();
    };
  }, [enabled, setFullState, updateRoom, addActivity, setCallStatus, setConnected]);
}
