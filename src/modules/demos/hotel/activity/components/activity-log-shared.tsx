'use client';

import type { ActivityEvent } from '../types';
import type { CrmContact } from '@modules/supporting/crm';

export interface Session {
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
  crmContact?: CrmContact;
}

export function groupSessions(activities: ActivityEvent[]): Session[] {
  const sessions: Session[] = [];
  let current: Session | null = null;
  let idx = 0;

  const ordered = [...activities].reverse();

  for (const evt of ordered) {
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
      if (evt.type === 'crm_contact' && evt.metadata) current.crmContact = evt.metadata;
    } else {
      const s: Session = {
        id: `s-${idx++}`,
        kind: 'standalone',
        events: [evt],
        startTime: new Date(evt.timestamp),
        ongoing: false,
        confirmed: evt.type === 'room_confirmed' ? 1 : 0,
        cancelled: evt.type === 'room_cancelled' ? 1 : 0,
        locked: evt.type === 'room_locked' ? 1 : 0,
        searched: evt.type === 'rooms_queried' ? 1 : 0,
      };
      if (evt.type === 'crm_contact' && evt.metadata) s.crmContact = evt.metadata;
      sessions.push(s);
    }
  }

  if (current) sessions.push(current);
  return sessions.reverse();
}

/* ─── Helpers ───────────────────────────────────────────────── */
export function fmtTime(ts: string | Date) {
  return new Date(ts).toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}
export function fmtShortTime(ts: string | Date) {
  return new Date(ts).toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' });
}
export function fmtDate(ts: string | Date) {
  return new Date(ts).toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' });
}
export function fmtDuration(start: Date, end: Date): string {
  const secs = Math.round((end.getTime() - start.getTime()) / 1000);
  if (secs < 60) return `${secs}s`;
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return s > 0 ? `${m} min ${s}s` : `${m} min`;
}

/* ─── Small icons (all keyed to amber accent) ───────────────── */
export const SmIcon = {
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
  user: (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  mail: (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  ),
  phoneSmall: (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  ),
  building: (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
  ),
  crm: (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  bed: (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 20v-8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v8" />
      <path d="M4 10V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4" />
      <path d="M2 18h20" />
    </svg>
  ),
  arrowLeft: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  ),
  calendar: (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
} as const;

/* ─── Per-event-type styling ────────────────────────────────── */
export const EVT: Record<ActivityEvent['type'], { icon: typeof SmIcon[keyof typeof SmIcon]; badge: string; label: string }> = {
  call_started:   { icon: SmIcon.phone,    badge: 'bg-purple-50 dark:bg-amber-900/20 border border-purple-200 dark:border-amber-800/40 text-purple-700 dark:text-amber-400', label: 'Samtal' },
  call_ended:     { icon: SmIcon.phoneOff, badge: 'bg-[var(--surface-alt)] border border-[var(--border)] text-[var(--text-muted)]',     label: 'Avslutat' },
  rooms_queried:  { icon: SmIcon.search,   badge: 'bg-purple-50/60 dark:bg-amber-900/10 border border-purple-100 dark:border-amber-900/30 text-purple-600 dark:text-amber-400', label: 'Sökning' },
  room_locked:    { icon: SmIcon.lock,     badge: 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40 text-amber-600 dark:text-amber-400',   label: 'Reserverad' },
  room_confirmed: { icon: SmIcon.check,    badge: 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/40 text-emerald-600 dark:text-emerald-400', label: 'Bokad' },
  room_cancelled: { icon: SmIcon.x,        badge: 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 text-red-500 dark:text-red-400',               label: 'Avbokad' },
  crm_contact:    { icon: SmIcon.crm,      badge: 'bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800/40 text-violet-600 dark:text-violet-400', label: 'Kundprofil' },
  info:           { icon: SmIcon.info,     badge: 'bg-[var(--surface-alt)] border border-[var(--border)] text-[var(--text-muted)]',     label: 'Info' },
};

/* ─── Session → card status ─────────────────────────────────── */
export function sessionMeta(s: Session) {
  if (s.ongoing)
    return { border: 'border-l-amber-400', statusCls: 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/40', statusLabel: 'Pågående', pulse: true };
  if (s.confirmed > 0)
    return { border: 'border-l-emerald-400', statusCls: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40', statusLabel: 'Bekräftad', pulse: false };
  if (s.cancelled > 0 && s.confirmed === 0)
    return { border: 'border-l-red-400', statusCls: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800/40', statusLabel: 'Avbokad', pulse: false };
  if (s.crmContact)
    return { border: 'border-l-violet-400', statusCls: 'bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-400 border border-violet-200 dark:border-violet-800/40', statusLabel: 'Kundprofil', pulse: false };
  return { border: 'border-l-amber-200 dark:border-l-amber-900/40', statusCls: 'bg-[var(--surface-alt)] text-[var(--text-muted)] border border-[var(--border)]', statusLabel: s.kind === 'call' ? 'Avslutat' : (EVT[s.events[0]?.type]?.label ?? 'Händelse'), pulse: false };
}

/* ─── CRM Contact Card ──────────────────────────────────────── */
export function CrmCard({ crm }: { crm: CrmContact }) {
  const fields = [
    { icon: SmIcon.user,       label: 'Namn',    value: crm.name },
    { icon: SmIcon.mail,       label: 'E-post',  value: crm.email },
    { icon: SmIcon.phoneSmall, label: 'Telefon', value: crm.phone },
    { icon: SmIcon.building,   label: 'Företag', value: crm.company },
  ].filter(f => f.value);

  return (
    <div className="rounded-xl border-2 border-violet-200 dark:border-violet-800/50 bg-violet-50/50 dark:bg-violet-900/10 overflow-hidden shadow-card">
      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-violet-200 dark:border-violet-800/40 bg-violet-100/60 dark:bg-violet-900/20">
        <div className="w-6 h-6 rounded-md bg-violet-200 dark:bg-violet-800/60 flex items-center justify-center text-violet-600 dark:text-violet-400">
          {SmIcon.crm}
        </div>
        <span className="text-xs font-semibold text-violet-800 dark:text-violet-300 uppercase tracking-wide">Kundprofil</span>
      </div>
      {fields.length > 0 && (
        <div className="px-4 py-3 space-y-2">
          {fields.map((f) => (
            <div key={f.label} className="flex items-center gap-2.5">
              <span className="text-violet-500 dark:text-violet-400 shrink-0">{f.icon}</span>
              <span className="text-[11px] text-[var(--text-muted)] w-14 shrink-0">{f.label}</span>
              <span className="text-xs font-medium text-[var(--text-primary)] truncate">{f.value}</span>
            </div>
          ))}
        </div>
      )}
      {crm.notes && (
        <div className="px-4 pb-3 pt-1 border-t border-violet-200/60 dark:border-violet-800/30">
          <p className="text-[10px] font-semibold text-violet-700 dark:text-violet-400 uppercase tracking-wide mb-1">Anteckningar</p>
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{crm.notes}</p>
        </div>
      )}
      {crm.summary && (
        <div className="px-4 pb-3 pt-1 border-t border-violet-200/60 dark:border-violet-800/30">
          <p className="text-[10px] font-semibold text-violet-700 dark:text-violet-400 uppercase tracking-wide mb-1">AI-sammanfattning</p>
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed italic">{crm.summary}</p>
        </div>
      )}
    </div>
  );
}

/* ─── Detail Panel ──────────────────────────────────────────── */
