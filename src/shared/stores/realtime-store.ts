/**
 * @deprecated Use @features/hotel/rooms/lib/hotel-realtime-store instead.
 *
 * This file is kept as a re-export shim during the Phase 1→Phase 5 migration.
 * Once all consumers have been updated to import from the hotel module directly,
 * this file will be deleted and replaced with connection-store.ts (minimal
 * connection state only).
 *
 * Do NOT add domain-specific state here. This file will eventually contain
 * only { connected: boolean } as the shared SSE connection status.
 */

export {
  useRealtimeStore,
  selectRooms,
  selectActivities,
  selectOnCall,
  selectConnected,
  selectAvailableCount,
  selectBookedCount,
  selectLockedCount,
  selectOccupancy,
} from '@features/hotel/rooms/lib/hotel-realtime-store';
