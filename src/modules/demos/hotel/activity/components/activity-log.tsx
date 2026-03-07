'use client';

import { useState, useEffect } from 'react';
import { ActivityEvent } from '../types';
import type { CrmContact } from '@modules/supporting/crm';

interface Props {
  activities: ActivityEvent[];
  focusEventId?: string | null;
  onFocusConsumed?: () => void;
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
  crmContact?: CrmContact;
}

function groupSessions(activities: ActivityEvent[]): Session[] {
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
function fmtTime(ts: string | Date) {
  return new Date(ts).toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}
function fmtShortTime(ts: string | Date) {
  return new Date(ts).toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' });
}
function fmtDate(ts: string | Date) {
  return new Date(ts).toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' });
}
function fmtDuration(start: Date, end: Date): string {
  const secs = Math.round((end.getTime() - start.getTime()) / 1000);
  if (secs < 60) return `${secs}s`;
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return s > 0 ? `${m} min ${s}s` : `${m} min`;
}

/* ─── Small icons (all keyed to amber accent) ───────────────── */
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
const EVT: Record<ActivityEvent['type'], { icon: typeof SmIcon[keyof typeof SmIcon]; badge: string; label: string }> = {
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
function sessionMeta(s: Session) {
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
function CrmCard({ crm }: { crm: CrmContact }) {
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
function DetailPanel({ session, onClose }: { session: Session; onClose: () => void }) {
  const meta = sessionMeta(session);
  return (
    <div className="flex flex-col h-full min-h-0 activity-item-enter">
      <div className="flex items-center gap-3 px-5 py-4 border-b-2 border-[var(--border)] bg-[var(--surface-alt)] shrink-0">
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-[var(--surface)] border border-transparent hover:border-[var(--border)] transition-all text-[var(--text-muted)] hover:text-[var(--text-primary)] lg:hidden"
          aria-label="Tillbaka"
        >
          {SmIcon.arrowLeft}
        </button>
        <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-amber-900/20 border border-purple-200 dark:border-amber-800/40 flex items-center justify-center shrink-0 text-purple-600 dark:text-amber-500">
          {session.kind === 'call' ? SmIcon.phone : (EVT[session.events[0]?.type]?.icon ?? SmIcon.info)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-[var(--text-primary)]">
              {session.kind === 'call' ? 'Samtal' : (EVT[session.events[0]?.type]?.label ?? 'Händelse')}
            </span>
            <span className="text-xs text-[var(--text-muted)] tabular-nums">
              {fmtDate(session.startTime)} · {fmtShortTime(session.startTime)}
              {session.endTime ? ` – ${fmtShortTime(session.endTime)}` : ''}
            </span>
          </div>
          {session.kind === 'call' && session.endTime && (
            <span className="text-[11px] text-[var(--text-muted)]">
              Varaktighet: {fmtDuration(session.startTime, session.endTime)}
            </span>
          )}
        </div>
        <div className={['flex items-center gap-1.5 rounded-full px-2.5 py-1 shrink-0', meta.statusCls].join(' ')}>
          {meta.pulse && (
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500" />
            </span>
          )}
          <span className="text-[10px] font-semibold uppercase tracking-wide">{meta.statusLabel}</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="p-5 space-y-5">
          {session.crmContact && <CrmCard crm={session.crmContact} />}

          {session.kind === 'call' && (session.confirmed > 0 || session.cancelled > 0 || session.locked > 0 || session.searched > 0) && (
            <div className="flex items-center gap-2 flex-wrap">
              {session.confirmed > 0 && (
                <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/40 rounded-full px-2.5 py-1">
                  {SmIcon.check} {session.confirmed} {session.confirmed === 1 ? 'bokning' : 'bokningar'}
                </span>
              )}
              {session.cancelled > 0 && (
                <span className="flex items-center gap-1 text-[10px] font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 rounded-full px-2.5 py-1">
                  {SmIcon.x} {session.cancelled} {session.cancelled === 1 ? 'avbokning' : 'avbokningar'}
                </span>
              )}
              {session.locked > 0 && (
                <span className="flex items-center gap-1 text-[10px] font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40 rounded-full px-2.5 py-1">
                  {SmIcon.lock} {session.locked} reserverad
                </span>
              )}
              {session.searched > 0 && (
                <span className="flex items-center gap-1 text-[10px] font-medium text-amber-600 dark:text-amber-400 bg-amber-50/60 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-full px-2.5 py-1">
                  {SmIcon.search} {session.searched} sökning
                </span>
              )}
            </div>
          )}

          <div>
            <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-widest mb-3">Händelselogg</p>
            <div className="rounded-xl border-2 border-[var(--border)] overflow-hidden divide-y-2 divide-[var(--border)] shadow-card">
              {session.events.map((evt) => {
                const ecfg = EVT[evt.type] ?? EVT.info;
                return (
                  <div key={evt.id} className="flex items-start gap-3 px-4 py-3 hover:bg-[var(--surface-alt)] transition-colors">
                    <div className={['w-6 h-6 rounded-md flex items-center justify-center shrink-0 mt-0.5', ecfg.badge].join(' ')}>
                      {ecfg.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-[var(--text-secondary)] leading-snug">{evt.message}</p>
                      {evt.type === 'crm_contact' && evt.metadata?.summary && (
                        <p className="text-[11px] text-violet-600 dark:text-violet-400 italic mt-1 leading-relaxed">
                          {evt.metadata.summary}
                        </p>
                      )}
                    </div>
                    <span className="text-[10px] text-[var(--text-muted)] tabular-nums font-mono shrink-0 pt-0.5">
                      {fmtTime(evt.timestamp)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Booking Log (appointment view) ───────────────────────── */
function BookingLog({ activities }: { activities: ActivityEvent[] }) {
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
export default function ActivityLog({ activities, focusEventId, onFocusConsumed }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [logView, setLogView] = useState<'samtal' | 'bokningar'>('samtal');

  const sessions = groupSessions(activities);

  useEffect(() => {
    if (!focusEventId) return;
    for (const s of sessions) {
      if (s.events.some(e => e.id === focusEventId)) {
        setSelectedId(s.id);
        setLogView('samtal');
        break;
      }
    }
    onFocusConsumed?.();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusEventId]);

  const selectedSession = sessions.find(s => s.id === selectedId) ?? null;
  const callCount = sessions.filter(s => s.kind === 'call').length;
  const bookingCount = activities.filter(e => e.type === 'room_confirmed' || e.type === 'room_cancelled').length;

  const pageHeader = (
    <div className="flex items-center justify-between mb-5">
      <div>
        <h2 className="font-heading text-xl font-semibold text-[var(--text-primary)]">Aktivitetslogg</h2>
        <p className="text-xs text-[var(--text-muted)] mt-0.5">Realtidshändelser — samtal, bokningar och sökningar via Kollegan</p>
      </div>
      <span className="text-xs font-medium text-purple-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40 rounded-full px-3 py-1.5">
        {activities.length} händelser
      </span>
    </div>
  );

  if (activities.length === 0) {
    return (
      <div>
        {pageHeader}
        <div className="text-center py-24">
          <div className="w-14 h-14 rounded-2xl bg-[var(--surface-alt)] border border-[var(--border)] flex items-center justify-center mx-auto mb-4 float-animation text-amber-500">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
          </div>
          <p className="text-[var(--text-secondary)] font-medium text-sm">Inga aktiviteter än</p>
          <p className="text-[var(--text-muted)] text-xs mt-1.5 max-w-xs mx-auto leading-relaxed">
            Ring Kollegan eller boka ett rum manuellt för att se aktiviteten loggas här i realtid.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {pageHeader}
    <div
      className="flex gap-0 border-2 border-[var(--border)] rounded-2xl overflow-hidden bg-[var(--surface)] shadow-card"
      style={{ height: 'calc(100vh - 220px)', minHeight: '480px' }}
    >
      {/* ── Left: list pane ── */}
      <div
        className={[
          'flex flex-col border-r-2 border-[var(--border)] bg-[var(--surface)]',
          logView === 'bokningar' ? 'w-full' : (selectedSession ? 'hidden lg:flex' : 'flex'),
          logView === 'bokningar' ? '' : 'w-full lg:w-[360px] xl:w-[400px] shrink-0',
        ].join(' ')}
      >
        {/* List header */}
        <div className="flex items-center gap-2 px-4 py-3.5 border-b-2 border-[var(--border)] bg-[var(--surface-alt)] shrink-0">
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-widest">Live</span>
          <div className="flex items-center gap-2 ml-auto text-[11px] text-[var(--text-muted)] tabular-nums">
            <span>{callCount} samtal</span>
            <span className="text-[var(--border)]">·</span>
            <span>{activities.length} händelser</span>
          </div>
        </div>

        {/* Sub-tabs: Samtalslogg | Bokningslogg — CRM style */}
        <div className="flex items-center gap-1 px-2 py-2 border-b-2 border-[var(--border)] bg-[var(--surface)] shrink-0">
          <button
            onClick={() => setLogView('samtal')}
            className={[
              'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all',
              logView === 'samtal'
                ? 'bg-purple-700 dark:bg-amber-500 text-white shadow-sm'
                : 'text-[var(--text-secondary)] hover:bg-[var(--surface-alt)] border border-transparent hover:border-[var(--border)]',
            ].join(' ')}
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
            Samtalslogg
            <span className={['rounded-full px-1.5 py-0.5 text-[9px] font-bold tabular-nums', logView === 'samtal' ? 'bg-white/25 text-white' : 'bg-[var(--surface-alt)] border border-[var(--border)] text-[var(--text-muted)]'].join(' ')}>
              {callCount}
            </span>
          </button>
          <button
            onClick={() => { setLogView('bokningar'); setSelectedId(null); }}
            className={[
              'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all',
              logView === 'bokningar'
                ? 'bg-purple-700 dark:bg-amber-500 text-white shadow-sm'
                : 'text-[var(--text-secondary)] hover:bg-[var(--surface-alt)] border border-transparent hover:border-[var(--border)]',
            ].join(' ')}
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 20v-8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v8" />
              <path d="M4 10V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4" />
              <path d="M2 18h20" />
            </svg>
            Bokningslogg
            <span className={['rounded-full px-1.5 py-0.5 text-[9px] font-bold tabular-nums', logView === 'bokningar' ? 'bg-white/25 text-white' : 'bg-[var(--surface-alt)] border border-[var(--border)] text-[var(--text-muted)]'].join(' ')}>
              {bookingCount}
            </span>
          </button>
        </div>

        {/* Content: session list or booking log */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {logView === 'bokningar' ? (
            <BookingLog activities={activities} />
          ) : (
            <div className="p-3 space-y-2">
              {sessions.map((session, si) => {
                const meta = sessionMeta(session);
                const isSelected = session.id === selectedId;
                const firstEvt = session.events[0];
                const lastMsg = session.events[session.events.length - 1]?.message ?? '';

                return (
                  <button
                    key={session.id}
                    onClick={() => setSelectedId(isSelected ? null : session.id)}
                    className={[
                      'w-full text-left rounded-xl border-2 border-l-[4px] overflow-hidden',
                      'activity-item-enter transition-all shadow-card',
                      meta.border,
                      isSelected
                        ? 'bg-amber-50/60 dark:bg-amber-900/10 border-[var(--border)] ring-2 ring-amber-400/30'
                        : 'bg-[var(--surface)] border-[var(--border)] hover:bg-[var(--surface-alt)] hover:shadow-card-hover',
                    ].join(' ')}
                    style={{ animationDelay: `${Math.min(si * 40, 320)}ms` }}
                  >
                    <div className="flex items-center gap-3 px-3.5 py-3">
                      <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40 flex items-center justify-center shrink-0 text-amber-500">
                        {session.kind === 'call' ? SmIcon.phone : (EVT[firstEvt?.type]?.icon ?? SmIcon.info)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-[var(--text-primary)]">
                            {session.kind === 'call' ? 'Samtal' : (EVT[firstEvt?.type]?.label ?? 'Händelse')}
                          </span>
                          {session.crmContact?.name && (
                            <span className="text-[10px] text-violet-600 dark:text-violet-400 font-medium truncate max-w-[80px]">
                              {session.crmContact.name}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-[var(--text-muted)] truncate mt-0.5 leading-tight">{lastMsg}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <span className="text-[10px] text-[var(--text-muted)] tabular-nums">{fmtShortTime(session.startTime)}</span>
                        <div className={['flex items-center gap-1 rounded-full px-2 py-0.5', meta.statusCls].join(' ')}>
                          {meta.pulse && (
                            <span className="relative flex h-1.5 w-1.5">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500" />
                            </span>
                          )}
                          <span className="text-[9px] font-semibold uppercase tracking-wide">{meta.statusLabel}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 px-3.5 pb-2.5">
                      <span className="text-[10px] text-[var(--text-muted)]">{session.events.length} händelser</span>
                      {session.kind === 'call' && session.endTime && (
                        <>
                          <span className="text-[var(--border)]">·</span>
                          <span className="text-[10px] text-[var(--text-muted)]">{fmtDuration(session.startTime, session.endTime)}</span>
                        </>
                      )}
                      {session.crmContact && (
                        <>
                          <span className="text-[var(--border)]">·</span>
                          <span className="text-[10px] text-violet-500 dark:text-violet-400 flex items-center gap-1">{SmIcon.crm} CRM</span>
                        </>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Right: Detail panel (only in samtal view) ── */}
      {logView === 'samtal' && (
        <div className={['flex-1 min-w-0', selectedSession ? 'flex flex-col' : 'hidden lg:flex lg:flex-col'].join(' ')}>
          {selectedSession ? (
            <DetailPanel session={selectedSession} onClose={() => setSelectedId(null)} />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center p-8 select-none">
              <div className="w-14 h-14 rounded-2xl bg-[var(--surface-alt)] border border-[var(--border)] flex items-center justify-center mb-4 float-animation text-amber-500">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <polyline points="10 9 9 9 8 9" />
                </svg>
              </div>
              <p className="text-sm font-medium text-[var(--text-secondary)]">Välj en session</p>
              <p className="text-xs text-[var(--text-muted)] mt-1.5 max-w-[200px] leading-relaxed">
                Klicka på en session till vänster för att se detaljerad information.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
    </div>
  );
}
