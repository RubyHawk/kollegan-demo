'use client';

import { useState, useEffect } from 'react';
import type { ActivityEvent } from '../types';
import { BookingLog } from './activity-log-booking-log';
import { DetailPanel } from './activity-log-detail-panel';
import { EVT, SmIcon, fmtDuration, fmtShortTime, groupSessions, sessionMeta } from './activity-log-shared';

interface Props {
  activities: ActivityEvent[];
  focusEventId?: string | null;
  onFocusConsumed?: () => void;
}

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
        <p className="text-xs text-[var(--text-muted)] mt-0.5">Realtidshändelser — samtal, bokningar och sökningar via Soleria</p>
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
            Ring Soleria eller boka ett rum manuellt för att se aktiviteten loggas här i realtid.
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
