export default function CrmPage() {
  const mockContacts = [
    { name: 'Anna Lindström', email: 'anna.l@example.com', company: 'Lindström AB', status: 'Kund', initials: 'AL', color: 'bg-violet-500' },
    { name: 'Erik Bergström', email: 'erik.b@example.com', company: 'Bergström Bygg', status: 'Lead', initials: 'EB', color: 'bg-blue-500' },
    { name: 'Maria Johansson', email: 'maria.j@example.com', company: 'MJ Consulting', status: 'Kund', initials: 'MJ', color: 'bg-emerald-500' },
    { name: 'Lars Nilsson', email: 'lars.n@example.com', company: 'Nilsson & Co', status: 'Prospect', initials: 'LN', color: 'bg-amber-500' },
  ];

  return (
    <div className="px-8 py-10 max-w-5xl mx-auto">

      {/* Header */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-[var(--text-primary)] mb-1">CRM</h1>
          <p className="text-sm text-[var(--text-muted)]">Kunder, kontakter och ärendehistorik.</p>
        </div>
        <button
          disabled
          className="px-4 py-2 rounded-xl bg-[var(--accent)] text-white text-sm font-medium opacity-40 cursor-not-allowed flex items-center gap-2"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Ny kontakt
        </button>
      </div>

      {/* Search / filter bar */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex-1 relative">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="search"
            placeholder="Sök kund eller kontakt…"
            disabled
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed"
          />
        </div>
        <button
          disabled
          className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-sm text-[var(--text-secondary)] opacity-40 cursor-not-allowed"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <line x1="4" y1="6" x2="20" y2="6" /><line x1="8" y1="12" x2="16" y2="12" /><line x1="11" y1="18" x2="13" y2="18" />
          </svg>
          Filter
        </button>
      </div>

      {/* Preview contacts (skeleton-style with "coming soon" overlay) */}
      <div className="relative rounded-2xl border border-[var(--border)] overflow-hidden">

        {/* Coming soon overlay */}
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[var(--surface)]/80 backdrop-blur-sm">
          <div className="w-12 h-12 rounded-2xl bg-[var(--accent)]/10 flex items-center justify-center mb-3">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <p className="text-sm font-semibold text-[var(--text-primary)] mb-1">Under utveckling</p>
          <p className="text-xs text-[var(--text-muted)] max-w-xs text-center leading-relaxed">
            Kontakter, affärsmöjligheter och ärendehistorik kommer snart.
          </p>
        </div>

        {/* Table header */}
        <div className="flex items-center gap-4 px-5 py-3 border-b border-[var(--border)] bg-[var(--surface-alt)]">
          <span className="w-8" />
          <span className="flex-1 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Namn</span>
          <span className="w-48 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider hidden sm:block">Företag</span>
          <span className="w-24 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider hidden md:block">Status</span>
          <span className="w-8" />
        </div>

        {/* Mock rows (blurred behind overlay) */}
        {mockContacts.map((c, i) => (
          <div
            key={i}
            className="flex items-center gap-4 px-5 py-3.5 border-b border-[var(--border)] last:border-0 bg-[var(--surface)] select-none"
          >
            <div className={`w-8 h-8 rounded-full ${c.color} flex items-center justify-center text-white text-xs font-semibold shrink-0`}>
              {c.initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[var(--text-primary)] truncate">{c.name}</p>
              <p className="text-xs text-[var(--text-muted)] truncate">{c.email}</p>
            </div>
            <span className="w-48 text-sm text-[var(--text-secondary)] hidden sm:block">{c.company}</span>
            <span className="w-24 hidden md:block">
              <span className={[
                'inline-block px-2 py-0.5 rounded-full text-xs font-medium',
                c.status === 'Kund'    ? 'bg-emerald-50 dark:bg-emerald-900/25 text-emerald-700 dark:text-emerald-400' :
                c.status === 'Lead'    ? 'bg-[var(--accent)]/10 text-[var(--accent)]' :
                                         'bg-amber-50 dark:bg-amber-900/25 text-amber-700 dark:text-amber-400',
              ].join(' ')}>
                {c.status}
              </span>
            </span>
            <div className="w-8" />
          </div>
        ))}
      </div>
    </div>
  );
}
