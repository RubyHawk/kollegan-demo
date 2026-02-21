'use client';

import { ActivityEvent } from '@/lib/types';

interface Props {
  activities: ActivityEvent[];
}

/* ─── Session model ─────────────────────────────────────────── */
interface Session {
  id: string;
  kind: 'call' | 'standalone';
  events: ActivityEvent[];
  startTime: Date;
  endTime?: Date;
  ongoing: boolean;
  confirmed: number;
  cancelled: number;
  locked: number;
  searched: number;
}

function groupSessions(activities: ActivityEvent[]): Session[] {
  const sessions: Session[] = [];
  let current: Session | null = null;
  let idx = 0;

  // activities arrive oldest-first
  for (const evt of activities) {
    if (evt.type === 'call_started') {
      current = {
        id: `s-${idx++}`,
        kind: 'call',
        events: [evt],
        startTime: new Date(evt.timestamp),
        ongoing: true,
        confirmed: 0,
        cancelled: 0,
        locked: 0,
        searched: 0,
      };
    } else if (evt.type === 'call_ended' && current) {
      current.events.push(evt);
      current.endTime = new Date(evt.timestamp);
      current.ongoing = false;
      sessions.push(current);
      current = null;
    } else if (current) {
      current.events.push(evt);
      if (evt.type === 'room_confirmed') current.confirmed++;
      if (evt.type === 'room_cancelled') current.cancelled++;
      if (evt.type === 'room_locked') current.locked++;
      if (evt.type === 'rooms_queried') current.searched++;
    } else {
      // Standalone (outside a call)
      sessions.push({
        id: `s-${idx++}`,
        kind: 'standalone',
        events: [evt],
        startTime: new Date(evt.timestamp),
        ongoing: false,
        confirmed: evt.type === 'room_confirmed' ? 1 : 0,
        cancelled: evt.type === 'room_cancelled' ? 1 : 0,
        locked: evt.type === 'room_locked' ? 1 : 0,
        searched: evt.type === 'rooms_queried' ? 1 : 0,
      });
    }
  }

  // ongoing call that hasn't ended yet
  if (current) sessions.push(current);

  return sessions.reverse(); // newest first
}

/* ─── Helpers ───────────────────────────────────────────────── */
function fmtTime(ts: string | Date) {
  return new Date(ts).toLocaleTimeString('sv-SE', {
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
}

function fmtShortTime(ts: string | Date) {
  return new Date(ts).toLocaleTimeString('sv-SE', {
    hour: '2-digit', minute: '2-digit',
  });
}

function fmtDuration(start: Date, end: Date): string {
  const secs = Math.round((end.getTime() - start.getTime()) / 1000);
  if (secs < 60) return `${secs}s`;
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return s > 0 ? `${m} min ${s}s` : `${m} min`;
}

/* ─── Small icons (10 px, strokeWidth 2) ───────────────────── */
const SmIcon = {
  phone: (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  ),
  phoneOff: (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  ),
  search: (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  lock: (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  ),
  check: (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  x: (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  info: (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" />
    </svg>
  ),
} as const;

/* ─── Per-event-type styling ────────────────────────────────── */
const EVT: Record<ActivityEvent['type'], { icon: typeof SmIcon[keyof typeof SmIcon]; badge: string; label: string }> = {
  call_started:   { icon: SmIcon.phone,    badge: 'bg-[var(--surface-alt)] border border-[var(--border)] text-[var(--text-secondary)]', label: 'Samtal' },
  call_ended:     { icon: SmIcon.phoneOff, badge: 'bg-[var(--surface-alt)] border border-[var(--border)] text-[var(--text-muted)]',     label: 'Avslutat' },
  rooms_queried:  { icon: SmIcon.search,   badge: 'bg-[var(--surface-alt)] border border-[var(--border)] text-[var(--text-secondary)]', label: 'Sökning' },
  room_locked:    { icon: SmIcon.lock,     badge: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400',                label: 'Reserverad' },
  room_confirmed: { icon: SmIcon.check,    badge: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400',        label: 'Bokad' },
  room_cancelled: { icon: SmIcon.x,        badge: 'bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400',                       label: 'Avbokad' },
  info:           { icon: SmIcon.info,     badge: 'bg-[var(--surface-alt)] border border-[var(--border)] text-[var(--text-muted)]',     label: 'Info' },
};

/* ─── Session → card border / status ───────────────────────── */
function sessionMeta(s: Session) {
  if (s.ongoing)
    return {
      border: 'border-l-amber-400',
      statusCls: 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/40',
      statusLabel: 'Pågående',
      pulse: true,
    };
  if (s.confirmed > 0)
    return {
      border: 'border-l-emerald-400',
      statusCls: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/40',
      statusLabel: 'Bekräftad',
      pulse: false,
    };
  if (s.cancelled > 0 && s.confirmed === 0)
    return {
      border: 'border-l-red-400',
      statusCls: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800/40',
      statusLabel: 'Avbokad',
      pulse: false,
    };
  return {
    border: 'border-l-[var(--border)]',
    statusCls: 'bg-[var(--surface-alt)] text-[var(--text-muted)] border-[var(--border)]',
    statusLabel: s.kind === 'call' ? 'Avslutat' : EVT[s.events[0]?.type]?.label ?? 'Händelse',
    pulse: false,
  };
}

/* ─── Component ─────────────────────────────────────────────── */
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

  const sessions = groupSessions(activities);
  const callCount = sessions.filter(s => s.kind === 'call').length;

  return (
    <div>
      {/* ── Board header ── */}
      <div className="flex items-center gap-2 mb-6">
        <span className="relative flex h-2 w-2 shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
        </span>
        <span className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-widest">Live</span>
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-[11px] text-[var(--text-muted)] tabular-nums">{callCount} samtal</span>
          <span className="text-[var(--border)]">·</span>
          <span className="text-[11px] text-[var(--text-muted)] tabular-nums">{activities.length} händelser</span>
        </div>
      </div>

      {/* ── Session cards (kanban) ── */}
      <div className="space-y-3">
        {sessions.map((session, si) => {
          const meta = sessionMeta(session);

          return (
            <div
              key={session.id}
              className={[
                'bg-[var(--surface)] border border-[var(--border)] border-l-[3px] rounded-xl overflow-hidden',
                'activity-item-enter',
                meta.border,
              ].join(' ')}
              style={{ animationDelay: `${Math.min(si * 60, 420)}ms` }}
            >
              {/* ── Card header ── */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border)] bg-[var(--surface-alt)]/50">
                {/* Session type icon */}
                <div className="w-7 h-7 rounded-lg bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center shrink-0 text-[var(--text-secondary)]">
                  {session.kind === 'call' ? SmIcon.phone : (EVT[session.events[0]?.type]?.icon ?? SmIcon.info)}
                </div>

                {/* Title + time range */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-[var(--text-primary)] uppercase tracking-wide">
                      {session.kind === 'call' ? 'Samtal' : (EVT[session.events[0]?.type]?.label ?? 'Händelse')}
                    </span>
                    {session.kind === 'call' && (
                      <span className="text-[11px] text-[var(--text-muted)] tabular-nums">
                        {fmtShortTime(session.startTime)}
                        {session.endTime ? ` – ${fmtShortTime(session.endTime)}` : ''}
                      </span>
                    )}
                    {session.kind === 'standalone' && (
                      <span className="text-[11px] text-[var(--text-muted)] tabular-nums">
                        {fmtShortTime(session.startTime)}
                      </span>
                    )}
                  </div>
                  {session.kind === 'call' && session.endTime && (
                    <span className="text-[10px] text-[var(--text-muted)]">
                      {fmtDuration(session.startTime, session.endTime)}
                    </span>
                  )}
                </div>

                {/* Status badge */}
                <div className={['flex items-center gap-1.5 rounded-full border px-2.5 py-1 shrink-0', meta.statusCls].join(' ')}>
                  {meta.pulse && (
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500" />
                    </span>
                  )}
                  <span className="text-[10px] font-semibold uppercase tracking-wide">{meta.statusLabel}</span>
                </div>
              </div>

              {/* ── Event timeline ── */}
              <div className="divide-y divide-[var(--border)]">
                {session.events.map((evt, ei) => {
                  const ecfg = EVT[evt.type] ?? EVT.info;
                  const isLast = ei === session.events.length - 1;
                  return (
                    <div
                      key={evt.id}
                      className={[
                        'flex items-center gap-3 px-4 py-2.5',
                        isLast ? '' : '',
                        'hover:bg-[var(--surface-alt)] transition-colors',
                      ].join(' ')}
                    >
                      {/* Event icon badge */}
                      <div className={['w-6 h-6 rounded-md flex items-center justify-center shrink-0', ecfg.badge].join(' ')}>
                        {ecfg.icon}
                      </div>

                      {/* Message */}
                      <p className="flex-1 min-w-0 text-xs text-[var(--text-secondary)] leading-snug truncate">
                        {evt.message}
                      </p>

                      {/* Timestamp */}
                      <span className="text-[10px] text-[var(--text-muted)] tabular-nums font-mono shrink-0">
                        {fmtTime(evt.timestamp)}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* ── Footer summary chips (call sessions only) ── */}
              {session.kind === 'call' && (session.confirmed > 0 || session.cancelled > 0 || session.locked > 0 || session.searched > 0) && (
                <div className="flex items-center gap-2 flex-wrap px-4 py-2.5 border-t border-[var(--border)] bg-[var(--surface-alt)]/40">
                  {session.confirmed > 0 && (
                    <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/40 rounded-full px-2 py-0.5">
                      {SmIcon.check}
                      {session.confirmed} {session.confirmed === 1 ? 'bokning' : 'bokningar'}
                    </span>
                  )}
                  {session.cancelled > 0 && (
                    <span className="flex items-center gap-1 text-[10px] font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 rounded-full px-2 py-0.5">
                      {SmIcon.x}
                      {session.cancelled} {session.cancelled === 1 ? 'avbokning' : 'avbokningar'}
                    </span>
                  )}
                  {session.locked > 0 && (
                    <span className="flex items-center gap-1 text-[10px] font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40 rounded-full px-2 py-0.5">
                      {SmIcon.lock}
                      {session.locked} reserverad
                    </span>
                  )}
                  {session.searched > 0 && (
                    <span className="flex items-center gap-1 text-[10px] font-medium text-[var(--text-muted)] bg-[var(--surface-alt)] border border-[var(--border)] rounded-full px-2 py-0.5">
                      {SmIcon.search}
                      {session.searched} sökning
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
