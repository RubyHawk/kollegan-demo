export default function CrmPage() {
  return (
    <div className="px-8 py-10 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-[var(--text-primary)] mb-1">CRM</h1>
          <p className="text-sm text-[var(--text-muted)]">Kunder, kontakter och ärenden.</p>
        </div>
        <button
          disabled
          className="px-4 py-2 rounded-xl bg-[var(--accent)] text-white text-sm font-medium opacity-40 cursor-not-allowed"
        >
          + Ny kontakt
        </button>
      </div>

      {/* Search / filter bar — placeholder */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex-1 relative">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" aria-hidden="true">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="search"
            placeholder="Sök kund eller kontakt…"
            disabled
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-[var(--border)] bg-[var(--surface-0)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>
        <button
          disabled
          className="flex items-center gap-2 px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--surface-0)] text-sm text-[var(--text-secondary)] opacity-50 cursor-not-allowed"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="4" y1="6" x2="20" y2="6" /><line x1="8" y1="12" x2="16" y2="12" /><line x1="11" y1="18" x2="13" y2="18" />
          </svg>
          Filter
        </button>
      </div>

      {/* Empty state */}
      <div className="rounded-2xl border border-dashed border-[var(--border)] py-20 flex flex-col items-center justify-center text-center">
        <div className="w-14 h-14 rounded-2xl bg-[var(--accent)]/8 flex items-center justify-center mb-4">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        </div>
        <p className="text-sm font-medium text-[var(--text-secondary)] mb-1">Inga kunder ännu</p>
        <p className="text-xs text-[var(--text-muted)] max-w-xs leading-relaxed">
          CRM-modulen är under utveckling. Kontakter, affärsmöjligheter och ärendehistorik visas här.
        </p>
      </div>
    </div>
  );
}
