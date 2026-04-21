import type { ActivityEvent } from '@demos/hotel/activity/types';
import { buildCallLog } from './crm-tab-model';
import { EmptyState, Icon, fmtDuration, fmtShortDate, fmtTime } from './crm-tab-shared';

export function CallLogTab({ activities }: { activities: ActivityEvent[] }) {
  const calls = buildCallLog(activities);

  if (calls.length === 0) {
    return (
      <EmptyState
        icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>}
        title="Inga samtal loggade"
        subtitle="Samtal med Soleria visas här efter att de är avslutade."
      />
    );
  }

  return (
    <div className="space-y-2.5">
      {calls.map((call, i) => (
        <div
          key={call.id}
          className="flex items-center gap-3.5 rounded-xl border-2 border-[var(--border)] bg-[var(--surface)] px-4 py-3.5 shadow-card activity-item-enter hover:shadow-card-hover hover:border-purple-200/60 dark:hover:border-amber-900/30 transition-all"
          style={{ animationDelay: `${Math.min(i * 40, 240)}ms` }}
        >
          {/* Icon */}
          <div className={[
            'w-9 h-9 rounded-xl flex items-center justify-center shrink-0',
            call.ongoing
              ? 'bg-amber-50 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-700/60 text-purple-700 dark:text-amber-400'
              : 'bg-purple-50 dark:bg-amber-900/20 border border-purple-200 dark:border-amber-800/40 text-purple-600 dark:text-amber-400',
          ].join(' ')}>
            {call.ongoing ? (
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500" />
              </span>
            ) : Icon.phone}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              {call.customerName ? (
                <span className="text-xs font-semibold text-[var(--text-primary)]">{call.customerName}</span>
              ) : (
                <span className="text-xs font-semibold text-[var(--text-secondary)]">Samtal</span>
              )}
              {call.hasCRM && (
                <span className="text-[10px] font-semibold text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800/40 rounded-full px-1.5 py-0.5">CRM</span>
              )}
              {call.ongoing && (
                <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40 rounded-full px-1.5 py-0.5">Pågående</span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              {call.duration !== undefined && (
                <span className="text-[11px] text-purple-700 dark:text-amber-400 flex items-center gap-1">
                  {Icon.clock} {fmtDuration(call.duration)}
                </span>
              )}
              {call.confirmed > 0 && (
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  {Icon.check} {call.confirmed} bokning{call.confirmed > 1 ? 'ar' : ''}
                </span>
              )}
              {call.cancelled > 0 && (
                <span className="text-[11px] text-red-500 dark:text-red-400 flex items-center gap-1">
                  {Icon.x} {call.cancelled} avbokning{call.cancelled > 1 ? 'ar' : ''}
                </span>
              )}
              {call.bookedRooms.length > 0 && (
                <span className="text-[11px] text-purple-700 dark:text-amber-400 flex items-center gap-1">
                  {Icon.bed} Rum {call.bookedRooms.join(', ')}
                </span>
              )}
            </div>
          </div>

          {/* Date/time */}
          <div className="text-right shrink-0">
            <p className="text-[11px] font-medium text-[var(--text-secondary)]">{fmtShortDate(call.startTime)}</p>
            <p className="text-[10px] text-[var(--text-muted)] tabular-nums">{fmtTime(call.startTime)}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Main component ─────────────────────────────────────────── */
