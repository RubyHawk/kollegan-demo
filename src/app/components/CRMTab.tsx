'use client';

import { ActivityEvent, CRMContact } from '@/lib/types';

interface Props {
  activities: ActivityEvent[];
  onCountChange?: (n: number) => void;
}

interface CRMEntry {
  id: string;
  contact: CRMContact;
  timestamp: string;
  bookedRooms: { roomId: string; message: string }[];
  sessionDuration?: number; // seconds
}

/* ─── Build CRM entries from activity stream ─────────────────── */
function buildCRMEntries(activities: ActivityEvent[]): CRMEntry[] {
  const entries: CRMEntry[] = [];
  const ordered = [...activities].reverse(); // walk oldest-first

  let sessionEvts: ActivityEvent[] = [];
  let inSession = false;
  let sessionStart: Date | null = null;

  const flushSession = (endTime?: Date) => {
    const crmEvt = sessionEvts.find(e => e.type === 'crm_contact');
    if (crmEvt?.metadata) {
      const bookedRooms = sessionEvts
        .filter(e => e.type === 'room_confirmed' && e.roomId)
        .map(e => ({ roomId: e.roomId!, message: e.message }));
      const duration =
        sessionStart && endTime
          ? Math.round((endTime.getTime() - sessionStart.getTime()) / 1000)
          : undefined;
      entries.push({
        id: crmEvt.id,
        contact: crmEvt.metadata,
        timestamp: crmEvt.timestamp,
        bookedRooms,
        sessionDuration: duration,
      });
    }
    sessionEvts = [];
    inSession = false;
    sessionStart = null;
  };

  for (const evt of ordered) {
    if (evt.type === 'call_started') {
      if (inSession) flushSession(); // guard: flush any dangling session
      sessionEvts = [evt];
      inSession = true;
      sessionStart = new Date(evt.timestamp);
    } else if (evt.type === 'call_ended') {
      sessionEvts.push(evt);
      flushSession(new Date(evt.timestamp));
    } else if (inSession) {
      sessionEvts.push(evt);
    } else if (evt.type === 'crm_contact' && evt.metadata) {
      // Standalone crm_contact (logged outside a call)
      entries.push({
        id: evt.id,
        contact: evt.metadata,
        timestamp: evt.timestamp,
        bookedRooms: [],
      });
    }
  }

  // Flush ongoing session
  if (inSession) flushSession();

  return entries.reverse(); // newest first
}

/* ─── Helpers ────────────────────────────────────────────────── */
function initials(name?: string): string {
  if (!name) return '?';
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0].toUpperCase())
    .join('');
}

function fmtDate(ts: string) {
  return new Date(ts).toLocaleDateString('sv-SE', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

function fmtTime(ts: string) {
  return new Date(ts).toLocaleTimeString('sv-SE', {
    hour: '2-digit', minute: '2-digit',
  });
}

function fmtDuration(secs: number): string {
  if (secs < 60) return `${secs}s`;
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return s > 0 ? `${m} min ${s}s` : `${m} min`;
}

/* ─── Avatar colors (deterministic per initials) ─────────────── */
const AVATAR_PALETTES = [
  'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300',
  'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300',
  'bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300',
  'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300',
  'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300',
];

function avatarPalette(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_PALETTES[Math.abs(hash) % AVATAR_PALETTES.length];
}

/* ─── Small icons ─────────────────────────────────────────────── */
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
};

/* ─── Component ──────────────────────────────────────────────── */
export default function CRMTab({ activities, onCountChange }: Props) {
  const entries = buildCRMEntries(activities);

  // Report count upward
  if (onCountChange) {
    // Use a ref pattern to avoid calling during render — fire on next tick
    setTimeout(() => onCountChange(entries.length), 0);
  }

  /* ── Empty state ── */
  if (entries.length === 0) {
    return (
      <div className="text-center py-24">
        <div className="w-14 h-14 rounded-2xl bg-[var(--surface-alt)] flex items-center justify-center mx-auto mb-4 float-animation text-[var(--text-muted)]">
          {Icon.users}
        </div>
        <p className="text-[var(--text-secondary)] font-medium text-sm">Inga kundprofiler än</p>
        <p className="text-[var(--text-muted)] text-xs mt-1.5 max-w-xs mx-auto leading-relaxed">
          Kundprofiler samlas in automatiskt via n8n under samtal och visas här.
          <br />
          Skicka data via <code className="font-mono text-[10px] bg-[var(--surface-alt)] border border-[var(--border)] px-1.5 py-0.5 rounded">POST /api/n8n/crm</code>
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* ── Page header ── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-heading text-xl font-semibold text-[var(--text-primary)]">Kundregister</h2>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            Kundprofiler insamlade via Kollegan under samtal
          </p>
        </div>
        <span className="text-xs font-medium text-[var(--text-muted)] bg-[var(--surface-alt)] border border-[var(--border)] rounded-full px-3 py-1.5">
          {entries.length} {entries.length === 1 ? 'kund' : 'kunder'}
        </span>
      </div>

      {/* ── Customer list ── */}
      <div className="space-y-4">
        {entries.map((entry, ei) => {
          const ini = initials(entry.contact.name);
          const palette = avatarPalette(ini);
          const hasContact = entry.contact.email || entry.contact.phone || entry.contact.company;

          return (
            <div
              key={entry.id}
              className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl overflow-hidden activity-item-enter"
              style={{ animationDelay: `${Math.min(ei * 60, 360)}ms` }}
            >
              {/* ── Card header ── */}
              <div className="flex items-start gap-4 px-5 pt-5 pb-4">
                {/* Avatar */}
                <div className={['w-11 h-11 rounded-xl flex items-center justify-center text-sm font-bold shrink-0', palette].join(' ')}>
                  {ini}
                </div>

                {/* Name + meta */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div>
                      <h3 className="font-heading text-base font-semibold text-[var(--text-primary)] leading-tight">
                        {entry.contact.name ?? 'Okänd gäst'}
                      </h3>
                      {hasContact && (
                        <div className="flex items-center gap-3 flex-wrap mt-1.5">
                          {entry.contact.email && (
                            <span className="flex items-center gap-1.5 text-[11px] text-[var(--text-muted)]">
                              <span className="text-[var(--text-muted)]">{Icon.mail}</span>
                              <a
                                href={`mailto:${entry.contact.email}`}
                                className="hover:text-amber-600 dark:hover:text-amber-400 transition-colors hover:underline"
                              >
                                {entry.contact.email}
                              </a>
                            </span>
                          )}
                          {entry.contact.phone && (
                            <span className="flex items-center gap-1.5 text-[11px] text-[var(--text-muted)]">
                              <span className="text-[var(--text-muted)]">{Icon.phone}</span>
                              <a
                                href={`tel:${entry.contact.phone}`}
                                className="hover:text-amber-600 dark:hover:text-amber-400 transition-colors hover:underline"
                              >
                                {entry.contact.phone}
                              </a>
                            </span>
                          )}
                          {entry.contact.company && (
                            <span className="flex items-center gap-1.5 text-[11px] text-[var(--text-muted)]">
                              <span className="text-[var(--text-muted)]">{Icon.building}</span>
                              {entry.contact.company}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Date + duration */}
                    <div className="text-right shrink-0">
                      <p className="text-xs font-medium text-[var(--text-secondary)]">{fmtDate(entry.timestamp)}</p>
                      <p className="text-[11px] text-[var(--text-muted)] mt-0.5">{fmtTime(entry.timestamp)}</p>
                      {entry.sessionDuration !== undefined && (
                        <span className="inline-flex items-center gap-1 mt-1.5 text-[10px] text-[var(--text-muted)] bg-[var(--surface-alt)] border border-[var(--border)] rounded-full px-2 py-0.5">
                          {Icon.clock} {fmtDuration(entry.sessionDuration)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Bookings + Notes ── */}
              {(entry.bookedRooms.length > 0 || entry.contact.notes || entry.contact.summary) && (
                <div className="border-t border-[var(--border)] divide-y divide-[var(--border)]">

                  {/* Bookings row */}
                  {entry.bookedRooms.length > 0 && (
                    <div className="flex items-start gap-3 px-5 py-3">
                      <span className="text-emerald-500 shrink-0 mt-0.5">{Icon.bed}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-1.5">Bokningar</p>
                        <div className="flex flex-wrap gap-2">
                          {entry.bookedRooms.map((b, bi) => (
                            <span
                              key={bi}
                              className="inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/40 rounded-lg px-2.5 py-1"
                            >
                              <span className="font-semibold">Rum {b.roomId}</span>
                            </span>
                          ))}
                        </div>
                        {/* Show booking message for context */}
                        {entry.bookedRooms.map((b, bi) => (
                          <p key={bi} className="text-[11px] text-[var(--text-muted)] mt-1 leading-snug">
                            {b.message}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* AI Summary */}
                  {entry.contact.summary && (
                    <div className="flex items-start gap-3 px-5 py-3">
                      <span className="text-violet-500 shrink-0 mt-0.5">{Icon.sparkle}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-semibold text-violet-700 dark:text-violet-400 uppercase tracking-wide mb-1">AI-sammanfattning</p>
                        <p className="text-xs text-[var(--text-secondary)] leading-relaxed italic">{entry.contact.summary}</p>
                      </div>
                    </div>
                  )}

                  {/* Notes */}
                  {entry.contact.notes && (
                    <div className="flex items-start gap-3 px-5 py-3">
                      <span className="text-[var(--text-muted)] shrink-0 mt-0.5">{Icon.note}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-1">Anteckningar</p>
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
    </div>
  );
}
