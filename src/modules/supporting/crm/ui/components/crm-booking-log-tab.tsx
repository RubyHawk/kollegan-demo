import type { ActivityEvent } from '@demos/hotel/activity/types';
import { EmptyState, Icon, fmtShortDate, fmtTime } from './crm-tab-shared';

export function BookingLogTab({ activities }: { activities: ActivityEvent[] }) {
  const bookings = [...activities]
    .filter(e => e.type === 'room_confirmed' || e.type === 'room_cancelled')
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  if (bookings.length === 0) {
    return (
      <EmptyState
        icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 20v-8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v8" /><path d="M4 10V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4" /><path d="M2 18h20" /></svg>}
        title="Inga bokningar än"
        subtitle="Bekräftade och avbokade rum visas här."
      />
    );
  }

  return (
    <div className="space-y-2.5">
      {bookings.map((evt, i) => {
        const isConfirmed = evt.type === 'room_confirmed';
        return (
          <div
            key={evt.id}
            className="flex items-center gap-3.5 rounded-xl border-2 border-[var(--border)] bg-[var(--surface)] px-4 py-3.5 shadow-card activity-item-enter hover:shadow-card-hover hover:border-purple-200/60 dark:hover:border-amber-900/30 transition-all"
            style={{ animationDelay: `${Math.min(i * 40, 240)}ms` }}
          >
            <div className={[
              'w-9 h-9 rounded-xl flex items-center justify-center shrink-0',
              isConfirmed
                ? 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/40 text-emerald-600 dark:text-emerald-400'
                : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 text-red-500 dark:text-red-400',
            ].join(' ')}>
              {isConfirmed ? Icon.check : Icon.x}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                {evt.roomId && (
                  <span className={['text-xs font-bold', isConfirmed ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'].join(' ')}>
                    Rum {evt.roomId}
                  </span>
                )}
                <span className={[
                  'text-[10px] font-semibold uppercase tracking-wide rounded-full px-2 py-0.5 border',
                  isConfirmed
                    ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800/40 text-emerald-600 dark:text-emerald-400'
                    : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800/40 text-red-500 dark:text-red-400',
                ].join(' ')}>
                  {isConfirmed ? 'Bekräftad' : 'Avbokad'}
                </span>
              </div>
              <p className="text-[11px] text-[var(--text-muted)] mt-0.5 leading-snug">{evt.message}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-[11px] font-medium text-[var(--text-secondary)]">{fmtShortDate(evt.timestamp)}</p>
              <p className="text-[10px] text-[var(--text-muted)] tabular-nums">{fmtTime(evt.timestamp)}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ─── Call log tab ───────────────────────────────────────────── */
