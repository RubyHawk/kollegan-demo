'use client';

import type { ActivityEvent } from '../types';
import { SmIcon, fmtDate, fmtShortTime } from './activity-log-shared';

export function BookingLog({ activities }: { activities: ActivityEvent[] }) {
  const bookings = [...activities]
    .filter(e => e.type === 'room_confirmed' || e.type === 'room_cancelled')
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  if (bookings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center p-8">
        <div className="w-12 h-12 rounded-2xl bg-[var(--surface-alt)] border border-[var(--border)] flex items-center justify-center mb-3 float-animation text-amber-500">
          {SmIcon.bed}
        </div>
        <p className="text-sm font-medium text-[var(--text-secondary)]">Inga bokningar än</p>
        <p className="text-xs text-[var(--text-muted)] mt-1.5">Bokningar och avbokningar visas här.</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-2.5">
      {bookings.map((evt, i) => {
        const isConfirmed = evt.type === 'room_confirmed';
        return (
          <div
            key={evt.id}
            className="flex items-center gap-3 rounded-xl border-2 border-[var(--border)] bg-[var(--surface)] px-4 py-3.5 shadow-card activity-item-enter hover:border-[var(--text-muted)]/30 transition-colors"
            style={{ animationDelay: `${Math.min(i * 40, 240)}ms` }}
          >
            {/* Status icon */}
            <div className={[
              'w-9 h-9 rounded-xl flex items-center justify-center shrink-0',
              isConfirmed
                ? 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/40 text-emerald-600 dark:text-emerald-400'
                : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 text-red-500 dark:text-red-400',
            ].join(' ')}>
              {isConfirmed ? SmIcon.check : SmIcon.x}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                {evt.roomId && (
                  <span className={[
                    'text-xs font-bold',
                    isConfirmed ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-600 dark:text-red-400',
                  ].join(' ')}>
                    Rum {evt.roomId}
                  </span>
                )}
                <span className={[
                  'text-[10px] font-semibold uppercase tracking-wide rounded-full px-2 py-0.5',
                  isConfirmed
                    ? 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/40 text-emerald-600 dark:text-emerald-400'
                    : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 text-red-500 dark:text-red-400',
                ].join(' ')}>
                  {isConfirmed ? 'Bekräftad' : 'Avbokad'}
                </span>
              </div>
              <p className="text-[11px] text-[var(--text-muted)] mt-0.5 leading-snug truncate">{evt.message}</p>
            </div>

            {/* Date/time */}
            <div className="text-right shrink-0">
              <p className="text-[11px] font-medium text-[var(--text-secondary)]">{fmtDate(evt.timestamp)}</p>
              <p className="text-[10px] text-[var(--text-muted)] tabular-nums">{fmtShortTime(evt.timestamp)}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ─── Component ─────────────────────────────────────────────── */
