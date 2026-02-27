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
export { lockRoom, confirmBooking, cancelBooking } from '@demos/hotel/infrastructure/room-store';
