/**
 * Hotel-specific realtime state store.
 *
 * Owns the client-side projection of room state and activity feed that is
 * streamed from the server via SSE. Kept in the hotel feature module because
 * this state is inherently hotel-domain state (Room[], ActivityEvent[]).
 *
 * Connection state (connected, onCall) is here for colocation convenience;
 * if other modules need it, extract to @shared/stores/connection-store.ts.
 */

import { create } from 'zustand';
import type { Room } from '../types';

import type { ActivityEvent } from '@features/activity/types';

interface HotelRealtimeStore {
  rooms: Room[];
  activities: ActivityEvent[];
  onCall: boolean;
  connected: boolean;

  // Actions (called by SSE hook only)
  setFullState: (state: { rooms: Room[]; recentActivity: ActivityEvent[]; onCall: boolean }) => void;
  updateRoom: (room: Room) => void;
  addActivity: (activity: ActivityEvent) => void;
  setCallStatus: (onCall: boolean) => void;
  setConnected: (connected: boolean) => void;
}

export const useRealtimeStore = create<HotelRealtimeStore>((set) => ({
  rooms: [],
  activities: [],
  onCall: false,
  connected: false,

  setFullState: (state) =>
    set({
      rooms: state.rooms,
      activities: state.recentActivity,
      onCall: state.onCall,
    }),

  updateRoom: (room) =>
    set((s) => ({
      rooms: s.rooms.map((r) => (r.id === room.id ? room : r)),
    })),

  addActivity: (activity) =>
    set((s) => ({
      activities: [activity, ...s.activities].slice(0, 50),
    })),

  setCallStatus: (onCall) => set({ onCall }),

  setConnected: (connected) => set({ connected }),
}));

// Selectors
export const selectRooms = (s: HotelRealtimeStore) => s.rooms;
export const selectActivities = (s: HotelRealtimeStore) => s.activities;
export const selectOnCall = (s: HotelRealtimeStore) => s.onCall;
export const selectConnected = (s: HotelRealtimeStore) => s.connected;
export const selectAvailableCount = (s: HotelRealtimeStore) =>
  s.rooms.filter((r) => r.status === 'available').length;
export const selectBookedCount = (s: HotelRealtimeStore) =>
  s.rooms.filter((r) => r.status === 'booked').length;
export const selectLockedCount = (s: HotelRealtimeStore) =>
  s.rooms.filter((r) => r.status === 'locked').length;
export const selectOccupancy = (s: HotelRealtimeStore) => {
  if (s.rooms.length === 0) return 0;
  const occupied = s.rooms.filter((r) => r.status !== 'available').length;
  return Math.round((occupied / s.rooms.length) * 100);
};
