/**
 * AI bookings tool module.
 *
 * Re-exports hotel demo server functions directly. They already handle:
 *   - SSE broadcast (real-time dashboard updates)
 *   - Activity log entries
 *   - Disk persistence
 *   - Google Calendar event creation/deletion
 *
 * No duplication needed.
 */
export { lockRoom, confirmBooking, cancelBooking } from '@demos/hotel/server';
