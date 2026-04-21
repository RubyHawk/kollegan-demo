'use client';

import { CrmCard, EVT, SmIcon, fmtDate, fmtDuration, fmtShortTime, fmtTime, sessionMeta, type Session } from './activity-log-shared';

export function DetailPanel({ session, onClose }: { session: Session; onClose: () => void }) {
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
