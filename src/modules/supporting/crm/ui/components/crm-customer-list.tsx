import type { CrmEntry } from './crm-tab-model';
import { EmptyState, Icon, avatarPalette, fmtDate, fmtDuration, fmtTime, initials } from './crm-tab-shared';

export function CustomerList({ entries }: { entries: CrmEntry[] }) {
  if (entries.length === 0) {
    return (
      <EmptyState
        icon={Icon.users}
        title="Inga kundprofiler än"
        subtitle="Kundprofiler samlas in automatiskt av Elsa under samtal via POST /api/ai/crm/update"
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
