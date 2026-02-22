'use client';

import { useState } from 'react';
import { ActivityEvent } from '@features/activity/types';
import { CRMContact } from '@features/crm/types';

interface Props {
  activities: ActivityEvent[];
  onCountChange?: (n: number) => void;
}

/* ─── Data models ────────────────────────────────────────────── */
interface CRMEntry {
  id: string;
  contact: CRMContact;
  timestamp: string;
  bookedRooms: { roomId: string; message: string }[];
  sessionDuration?: number;
}

interface CallEntry {
  id: string;
  startTime: string;
  endTime?: string;
  duration?: number;
  customerName?: string;
  bookedRooms: string[];
  hasCRM: boolean;
  ongoing: boolean;
  confirmed: number;
  cancelled: number;
}

/* ─── Build CRM entries (customer profiles) ──────────────────── */
function buildCRMEntries(activities: ActivityEvent[]): CRMEntry[] {
  const entries: CRMEntry[] = [];
  const ordered = [...activities].reverse();

  let sessionEvts: ActivityEvent[] = [];
  let inSession = false;
  let sessionStart: Date | null = null;

  const flush = (endTime?: Date) => {
    const crmEvt = sessionEvts.find(e => e.type === 'crm_contact');
    if (crmEvt?.metadata) {
      const bookedRooms = sessionEvts
        .filter(e => e.type === 'room_confirmed' && e.roomId)
        .map(e => ({ roomId: e.roomId!, message: e.message }));
      const duration = sessionStart && endTime
        ? Math.round((endTime.getTime() - sessionStart.getTime()) / 1000)
        : undefined;
      entries.push({ id: crmEvt.id, contact: crmEvt.metadata, timestamp: crmEvt.timestamp, bookedRooms, sessionDuration: duration });
    }
    sessionEvts = []; inSession = false; sessionStart = null;
  };

  for (const evt of ordered) {
    if (evt.type === 'call_started') {
      if (inSession) flush();
      sessionEvts = [evt]; inSession = true; sessionStart = new Date(evt.timestamp);
    } else if (evt.type === 'call_ended') {
      sessionEvts.push(evt); flush(new Date(evt.timestamp));
    } else if (inSession) {
      sessionEvts.push(evt);
    } else if (evt.type === 'crm_contact' && evt.metadata) {
      entries.push({ id: evt.id, contact: evt.metadata, timestamp: evt.timestamp, bookedRooms: [] });
    }
  }
  if (inSession) flush();
  return entries.reverse();
}

/* ─── Build call log ─────────────────────────────────────────── */
function buildCallLog(activities: ActivityEvent[]): CallEntry[] {
  const entries: CallEntry[] = [];
  const ordered = [...activities].reverse();

  let sessionEvts: ActivityEvent[] = [];
  let inSession = false;
  let sessionStart: Date | null = null;
  let idx = 0;

  const flush = (endTime?: Date) => {
    const start = sessionEvts.find(e => e.type === 'call_started');
    if (!start) { sessionEvts = []; inSession = false; sessionStart = null; return; }
    const crmEvt = sessionEvts.find(e => e.type === 'crm_contact');
    const bookedRooms = sessionEvts.filter(e => e.type === 'room_confirmed' && e.roomId).map(e => e.roomId!);
    const confirmed = sessionEvts.filter(e => e.type === 'room_confirmed').length;
    const cancelled = sessionEvts.filter(e => e.type === 'room_cancelled').length;
    const duration = sessionStart && endTime
      ? Math.round((endTime.getTime() - sessionStart.getTime()) / 1000)
      : undefined;
    entries.push({
      id: `call-${idx++}`,
      startTime: start.timestamp,
      endTime: endTime?.toISOString(),
      duration,
      customerName: crmEvt?.metadata?.name,
      bookedRooms,
      hasCRM: !!crmEvt,
      ongoing: !endTime,
      confirmed,
      cancelled,
    });
    sessionEvts = []; inSession = false; sessionStart = null;
  };

  for (const evt of ordered) {
    if (evt.type === 'call_started') {
      if (inSession) flush();
      sessionEvts = [evt]; inSession = true; sessionStart = new Date(evt.timestamp);
    } else if (evt.type === 'call_ended') {
      sessionEvts.push(evt); flush(new Date(evt.timestamp));
    } else if (inSession) {
      sessionEvts.push(evt);
    }
  }
  if (inSession) flush();
  return entries.reverse();
}

/* ─── Helpers ────────────────────────────────────────────────── */
function initials(name?: string): string {
  if (!name) return '?';
  return name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('');
}

function fmtDate(ts: string) {
  return new Date(ts).toLocaleDateString('sv-SE', { day: 'numeric', month: 'short', year: 'numeric' });
}
function fmtShortDate(ts: string) {
  return new Date(ts).toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' });
}
function fmtTime(ts: string) {
  return new Date(ts).toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' });
}
function fmtDuration(secs: number): string {
  if (secs < 60) return `${secs}s`;
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return s > 0 ? `${m} min ${s}s` : `${m} min`;
}

/* ─── Avatar palette ─────────────────────────────────────────── */
const PALETTES = [
  'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300',
  'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300',
  'bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300',
  'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300',
  'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300',
];
function avatarPalette(str: string) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = str.charCodeAt(i) + ((h << 5) - h);
  return PALETTES[Math.abs(h) % PALETTES.length];
}

/* ─── Icons (all amber-tinted) ───────────────────────────────── */
const Icon = {
  mail: (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  ),
  phone: (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  ),
  building: (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
  ),
  bed: (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 20v-8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v8" />
      <path d="M4 10V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4" />
      <path d="M2 18h20" />
    </svg>
  ),
  clock: (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  note: (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  ),
  sparkle: (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
    </svg>
  ),
  users: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
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
};

/* ─── Tab button ─────────────────────────────────────────────── */
function TabBtn({ active, onClick, icon, label, count }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string; count: number }) {
  return (
    <button
      onClick={onClick}
      className={[
        'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all',
        active
          ? 'bg-purple-700 dark:bg-amber-500 text-white shadow-sm'
          : 'text-[var(--text-secondary)] hover:bg-[var(--surface-alt)] border border-transparent hover:border-[var(--border)]',
      ].join(' ')}
    >
      {icon}
      {label}
      <span className={['rounded-full px-1.5 py-0.5 text-[9px] font-bold tabular-nums', active ? 'bg-white/25 text-white' : 'bg-[var(--surface-alt)] border border-[var(--border)] text-[var(--text-muted)]'].join(' ')}>
        {count}
      </span>
    </button>
  );
}

/* ─── Shared empty state ─────────────────────────────────────── */
function EmptyState({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) {
  return (
    <div className="text-center py-20">
      <div className="w-14 h-14 rounded-2xl bg-[var(--surface-alt)] border border-[var(--border)] flex items-center justify-center mx-auto mb-4 float-animation text-[var(--accent)]">
        {icon}
      </div>
      <p className="text-[var(--text-secondary)] font-medium text-sm">{title}</p>
      <p className="text-[var(--text-muted)] text-xs mt-1.5 max-w-xs mx-auto leading-relaxed">{subtitle}</p>
    </div>
  );
}

/* ─── Customer profile cards ─────────────────────────────────── */
function CustomerList({ entries }: { entries: CRMEntry[] }) {
  if (entries.length === 0) {
    return (
      <EmptyState
        icon={Icon.users}
        title="Inga kundprofiler än"
        subtitle="Kundprofiler samlas in automatiskt via n8n under samtal. Skicka data via POST /api/n8n/crm"
      />
    );
  }

  return (
    <div className="space-y-4">
      {entries.map((entry, ei) => {
        const ini = initials(entry.contact.name);
        const palette = avatarPalette(ini);
        const hasContact = entry.contact.email || entry.contact.phone || entry.contact.company;

        return (
          <div
            key={entry.id}
            className="bg-[var(--surface)] border-2 border-[var(--border)] rounded-2xl overflow-hidden activity-item-enter shadow-card hover:shadow-card-hover hover:border-purple-200 dark:hover:border-amber-900/40 transition-all"
            style={{ animationDelay: `${Math.min(ei * 60, 360)}ms` }}
          >
            {/* Card header */}
            <div className="flex items-start gap-4 px-5 pt-5 pb-4">
              <div className={['w-11 h-11 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 border', palette].join(' ')}>
                {ini}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <h3 className="font-heading text-base font-semibold text-[var(--text-primary)] leading-tight">
                      {entry.contact.name ?? 'Okänd gäst'}
                    </h3>
                    {hasContact && (
                      <div className="flex items-center gap-3 flex-wrap mt-1.5">
                        {entry.contact.email && (
                          <span className="flex items-center gap-1.5 text-[11px] text-purple-700 dark:text-amber-400">
                            {Icon.mail}
                            <a href={`mailto:${entry.contact.email}`} className="hover:underline transition-colors">
                              {entry.contact.email}
                            </a>
                          </span>
                        )}
                        {entry.contact.phone && (
                          <span className="flex items-center gap-1.5 text-[11px] text-purple-700 dark:text-amber-400">
                            {Icon.phone}
                            <a href={`tel:${entry.contact.phone}`} className="hover:underline transition-colors">
                              {entry.contact.phone}
                            </a>
                          </span>
                        )}
                        {entry.contact.company && (
                          <span className="flex items-center gap-1.5 text-[11px] text-purple-700 dark:text-amber-400">
                            {Icon.building}
                            {entry.contact.company}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-medium text-[var(--text-secondary)]">{fmtDate(entry.timestamp)}</p>
                    <p className="text-[11px] text-[var(--text-muted)] mt-0.5">{fmtTime(entry.timestamp)}</p>
                    {entry.sessionDuration !== undefined && (
                      <span className="inline-flex items-center gap-1 mt-1.5 text-[10px] text-purple-700 dark:text-amber-400 bg-purple-50 dark:bg-amber-900/20 border border-purple-200 dark:border-amber-800/40 rounded-full px-2 py-0.5">
                        {Icon.clock} {fmtDuration(entry.sessionDuration)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Bookings + Notes */}
            {(entry.bookedRooms.length > 0 || entry.contact.notes || entry.contact.summary) && (
              <div className="border-t-2 border-[var(--border)] divide-y-2 divide-[var(--border)]">
                {entry.bookedRooms.length > 0 && (
                  <div className="flex items-start gap-3 px-5 py-3">
                    <span className="text-[var(--accent)] dark:text-amber-500 shrink-0 mt-0.5">{Icon.bed}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-semibold text-purple-700 dark:text-amber-400 uppercase tracking-wide mb-1.5">Bokningar</p>
                      <div className="flex flex-wrap gap-2">
                        {entry.bookedRooms.map((b, bi) => (
                          <span key={bi} className="inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/40 rounded-lg px-2.5 py-1">
                            <span className="font-semibold">Rum {b.roomId}</span>
                          </span>
                        ))}
                      </div>
                      {entry.bookedRooms.map((b, bi) => (
                        <p key={bi} className="text-[11px] text-[var(--text-muted)] mt-1 leading-snug">{b.message}</p>
                      ))}
                    </div>
                  </div>
                )}
                {entry.contact.summary && (
                  <div className="flex items-start gap-3 px-5 py-3">
                    <span className="text-[var(--accent)] dark:text-amber-500 shrink-0 mt-0.5">{Icon.sparkle}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-semibold text-purple-700 dark:text-amber-400 uppercase tracking-wide mb-1">AI-sammanfattning</p>
                      <p className="text-xs text-[var(--text-secondary)] leading-relaxed italic">{entry.contact.summary}</p>
                    </div>
                  </div>
                )}
                {entry.contact.notes && (
                  <div className="flex items-start gap-3 px-5 py-3">
                    <span className="text-[var(--accent)] dark:text-amber-500 shrink-0 mt-0.5">{Icon.note}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-semibold text-purple-700 dark:text-amber-400 uppercase tracking-wide mb-1">Anteckningar</p>
                      <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{entry.contact.notes}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ─── Booking log tab ────────────────────────────────────────── */
function BookingLogTab({ activities }: { activities: ActivityEvent[] }) {
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
function CallLogTab({ activities }: { activities: ActivityEvent[] }) {
  const calls = buildCallLog(activities);

  if (calls.length === 0) {
    return (
      <EmptyState
        icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>}
        title="Inga samtal loggade"
        subtitle="Samtal med Kollegan visas här efter att de är avslutade."
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
export default function CRMTab({ activities, onCountChange }: Props) {
  const [subTab, setSubTab] = useState<'kunder' | 'bokningar' | 'samtal'>('kunder');

  const entries = buildCRMEntries(activities);
  const bookingCount = activities.filter(e => e.type === 'room_confirmed' || e.type === 'room_cancelled').length;
  const callCount = buildCallLog(activities).length;

  if (onCountChange) setTimeout(() => onCountChange(entries.length), 0);

  return (
    <div>
      {/* ── Page header ── */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="font-heading text-xl font-semibold text-[var(--text-primary)]">Kundregister</h2>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">Kundprofiler, bokningar och samtal via Kollegan</p>
        </div>
        <span className="text-xs font-medium text-purple-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40 rounded-full px-3 py-1.5">
          {entries.length} {entries.length === 1 ? 'kund' : 'kunder'}
        </span>
      </div>

      {/* ── Sub-tab switcher ── */}
      <div className="flex items-center gap-1.5 mb-5 p-1 bg-[var(--surface-alt)] border-2 border-[var(--border)] rounded-xl w-fit shadow-card">
        <TabBtn
          active={subTab === 'kunder'}
          onClick={() => setSubTab('kunder')}
          count={entries.length}
          label="Kunder"
          icon={
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          }
        />
        <TabBtn
          active={subTab === 'bokningar'}
          onClick={() => setSubTab('bokningar')}
          count={bookingCount}
          label="Bokningslogg"
          icon={
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 20v-8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v8" />
              <path d="M4 10V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4" />
              <path d="M2 18h20" />
            </svg>
          }
        />
        <TabBtn
          active={subTab === 'samtal'}
          onClick={() => setSubTab('samtal')}
          count={callCount}
          label="Samtalslogg"
          icon={
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
          }
        />
      </div>

      {/* ── Tab content ── */}
      <div className="tab-content-enter">
        {subTab === 'kunder'    && <CustomerList entries={entries} />}
        {subTab === 'bokningar' && <BookingLogTab activities={activities} />}
        {subTab === 'samtal'    && <CallLogTab activities={activities} />}
      </div>
    </div>
  );
}

