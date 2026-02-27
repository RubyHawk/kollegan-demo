/**
 * Minimal shared connection state.
 *
 * Contains ONLY the SSE connection status and active call indicator.
 * These are cross-cutting concerns needed by the dashboard shell (header,
 * sidebar status indicators) — not hotel-domain state.
 *
 * Domain-specific state (rooms, activities) lives in each module:
 *   Hotel realtime state → @demos/hotel/ui/stores/hotel-realtime-store
 */

import { create } from 'zustand';

interface ConnectionStore {
  /** Whether the SSE connection to /api/sse is currently open */
  connected: boolean;
  /** Whether a voice call is currently active */
  onCall: boolean;

  setConnected: (connected: boolean) => void;
  setOnCall: (onCall: boolean) => void;
}

export const useConnectionStore = create<ConnectionStore>((set) => ({
  connected: false,
  onCall: false,
  setConnected: (connected) => set({ connected }),
  setOnCall: (onCall) => set({ onCall }),
}));

export const selectConnected = (s: ConnectionStore) => s.connected;
export const selectOnCall    = (s: ConnectionStore) => s.onCall;
