/**
 * AI bookings tool module.
 *
 * Re-exports room-store functions directly — they already handle:
 *   - SSE broadcast (real-time dashboard updates)
 *   - Activity log entries
 *   - Disk persistence
 *   - Google Calendar event creation/deletion
 *
 * No duplication needed.
 */
export { lockRoom, confirmBooking, cancelBooking } from '@features/rooms/lib/room-store';
