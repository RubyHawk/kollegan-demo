import { create } from 'zustand';
import type { Room } from '@features/hotel/rooms/types';
import type { ActivityEvent } from '@features/activity/types';

interface RealtimeStore {
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

export const useRealtimeStore = create<RealtimeStore>((set) => ({
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
export const selectRooms = (s: RealtimeStore) => s.rooms;
export const selectActivities = (s: RealtimeStore) => s.activities;
export const selectOnCall = (s: RealtimeStore) => s.onCall;
export const selectConnected = (s: RealtimeStore) => s.connected;
export const selectAvailableCount = (s: RealtimeStore) =>
  s.rooms.filter((r) => r.status === 'available').length;
export const selectBookedCount = (s: RealtimeStore) =>
  s.rooms.filter((r) => r.status === 'booked').length;
export const selectLockedCount = (s: RealtimeStore) =>
  s.rooms.filter((r) => r.status === 'locked').length;
export const selectOccupancy = (s: RealtimeStore) => {
  if (s.rooms.length === 0) return 0;
  const occupied = s.rooms.filter((r) => r.status !== 'available').length;
  return Math.round((occupied / s.rooms.length) * 100);
};
