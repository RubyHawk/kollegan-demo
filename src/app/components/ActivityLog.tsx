'use client';

import { ActivityEvent } from '@/lib/types';

interface Props {
  activities: ActivityEvent[];
}

/* ── Icons — strokeWidth 1.5, refined shapes ───────────────────── */
const ICON = {
  phone: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  ),
  phoneOff: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  ),
  search: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  lock: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  ),
  checkCircle: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  ),
  xCircle: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  ),
  info: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
    </svg>
  ),
} as const;

/* ── Per-type config ───────────────────────────────────────────── */
const EVENT_CONFIG: Record<
  ActivityEvent['type'],
  { icon: React.ReactNode; badge: string; label: string; accent: string }
> = {
  call_started: {
    icon: ICON.phone,
    badge: 'bg-[var(--surface-alt)] border border-[var(--border)] text-[var(--text-secondary)]',
    label: 'Samtal',
    accent: '',
  },
  call_ended: {
    icon: ICON.phoneOff,
    badge: 'bg-[var(--surface-alt)] border border-[var(--border)] text-[var(--text-muted)]',
    label: 'Samtal avslutat',
    accent: '',
  },
  rooms_queried: {
    icon: ICON.search,
    badge: 'bg-[var(--surface-alt)] border border-[var(--border)] text-[var(--text-secondary)]',
    label: 'Sökning',
    accent: '',
  },
  room_locked: {
    icon: ICON.lock,
    badge: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400',
    label: 'Reserverad',
    accent: 'border-l-[3px] border-l-amber-400',
  },
  room_confirmed: {
    icon: ICON.checkCircle,
    badge: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400',
    label: 'Bekräftad',
    accent: 'border-l-[3px] border-l-emerald-400',
  },
  room_cancelled: {
    icon: ICON.xCircle,
    badge: 'bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400',
    label: 'Avbokad',
    accent: 'border-l-[3px] border-l-red-400',
  },
  info: {
    icon: ICON.info,
    badge: 'bg-[var(--surface-alt)] border border-[var(--border)] text-[var(--text-muted)]',
    label: 'Info',
    accent: '',
  },
};

/* ── Helpers ───────────────────────────────────────────────────── */
function fmtTime(ts: string | Date) {
  return new Date(ts).toLocaleTimeString('sv-SE', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function fmtDateLabel(ts: string | Date) {
  const d = new Date(ts);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  if (d.toDateString() === today.toDateString()) return 'Idag';
  if (d.toDateString() === yesterday.toDateString()) return 'Igår';
  return d.toLocaleDateString('sv-SE', { month: 'long', day: 'numeric' });
}

type DividerRow = { __divider: true; label: string; key: string };
type Row = ActivityEvent | DividerRow;

function withDividers(events: ActivityEvent[]): Row[] {
  const out: Row[] = [];
  let lastDate = '';
  for (const e of events) {
    const d = new Date(e.timestamp).toDateString();
    if (d !== lastDate) {
      lastDate = d;
      out.push({ __divider: true, label: fmtDateLabel(e.timestamp), key: `div-${d}` });
    }
    out.push(e);
  }
  return out;
}

/* ── Component ─────────────────────────────────────────────────── */
export default function ActivityLog({ activities }: Props) {
  if (activities.length === 0) {
    return (
      <div className="text-center py-24">
        <div className="w-14 h-14 rounded-2xl bg-[var(--surface-alt)] flex items-center justify-center mx-auto mb-4 float-animation">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--text-muted)]">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
        </div>
        <p className="text-[var(--text-secondary)] font-medium text-sm">Inga aktiviteter än</p>
        <p className="text-[var(--text-muted)] text-xs mt-1.5 max-w-xs mx-auto leading-relaxed">
          Ring Kollegan eller boka ett rum manuellt för att se aktiviteten loggas här i realtid.
        </p>
      </div>
    );
  }

  const rows = withDividers(activities);

  return (
    <div>
      {/* Feed header */}
      <div className="flex items-center gap-2 mb-5">
        <span className="relative flex h-2 w-2 shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
        </span>
        <span className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-widest">
          Live-flöde
        </span>
        <span className="ml-auto text-[11px] text-[var(--text-muted)] tabular-nums">
          {activities.length} händelser
        </span>
      </div>

      {/* Event rows */}
      <div className="space-y-1.5">
        {rows.map((row, index) => {
          /* ── Date divider ── */
          if ('__divider' in row) {
            return (
              <div key={row.key} className="flex items-center gap-3 py-1.5">
                <div className="flex-1 h-px bg-[var(--border)]" />
                <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)] px-1">
                  {row.label}
                </span>
                <div className="flex-1 h-px bg-[var(--border)]" />
              </div>
            );
          }

          /* ── Event row ── */
          const event = row as ActivityEvent;
          const cfg = EVENT_CONFIG[event.type] ?? EVENT_CONFIG.info;

          return (
            <div
              key={event.id}
              className={[
                'group flex items-center gap-3',
                'bg-[var(--surface)] border border-[var(--border)] rounded-xl px-4 py-3',
                'hover:bg-[var(--surface-alt)] transition-colors duration-150 cursor-default',
                'activity-item-enter',
                cfg.accent,
              ].join(' ')}
              style={{ animationDelay: `${Math.min(index * 25, 360)}ms` }}
            >
              {/* Icon badge */}
              <div className={['w-8 h-8 rounded-lg flex items-center justify-center shrink-0', cfg.badge].join(' ')}>
                {cfg.icon}
              </div>

              {/* Message + type label */}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-[var(--text-primary)] font-medium leading-snug truncate">
                  {event.message}
                </p>
                <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wide font-medium">
                  {cfg.label}
                </span>
              </div>

              {/* Timestamp */}
              <span className="text-[11px] text-[var(--text-muted)] tabular-nums shrink-0 font-mono opacity-70 group-hover:opacity-100 transition-opacity">
                {fmtTime(event.timestamp)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
