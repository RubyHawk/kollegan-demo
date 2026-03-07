/**
 * /crm/contacts
 *
 * Contact book — individual contacts linked to customers and leads.
 * Placeholder with visible table preview; full CRUD coming once the
 * contacts service is wired up.
 */

export default function ContactsPage() {
  const mock = [
    { name: 'Anna Lindström',   email: 'anna.l@lindstrom.se',  phone: '070-111 22 33', company: 'Lindström AB',  title: 'VD',              initials: 'AL', color: 'bg-violet-500' },
    { name: 'Erik Bergström',   email: 'erik@bergbygg.se',     phone: '073-444 55 66', company: 'Bergström Bygg', title: 'Inköpschef',      initials: 'EB', color: 'bg-blue-500' },
    { name: 'Maria Johansson',  email: 'maria@mjconsult.se',   phone: '072-777 88 99', company: 'MJ Consulting',  title: 'Konsultchef',     initials: 'MJ', color: 'bg-emerald-500' },
    { name: 'Lars Nilsson',     email: 'lars@nilssonco.se',    phone: '076-000 11 22', company: 'Nilsson & Co',   title: 'Säljare',         initials: 'LN', color: 'bg-amber-500' },
    { name: 'Sofia Karlsson',   email: 'sofia@karlsson.se',    phone: '070-333 44 55', company: 'Karlsson Tech',  title: 'CTO',             initials: 'SK', color: 'bg-rose-500' },
    { name: 'Johan Persson',    email: 'johan@persson.se',     phone: '073-666 77 88', company: 'Persson Invest', title: 'Investerare',     initials: 'JP', color: 'bg-sky-500' },
  ];

  return (
    <div className="px-8 py-10 max-w-6xl mx-auto">

      {/* Header */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <a href="/crm" className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5" /><path d="m12 19-7-7 7-7" />
              </svg>
            </a>
            <h1 className="font-heading text-2xl font-semibold text-[var(--text-primary)]">Kontakter</h1>
          </div>
          <p className="text-sm text-[var(--text-muted)]">
            Individer kopplade till kunder och leads.
          </p>
        </div>
        <button disabled className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--accent)] text-white text-sm font-medium opacity-40 cursor-not-allowed">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Ny kontakt
        </button>
      </div>

      {/* Search bar */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex-1 relative max-w-sm">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input disabled type="search" placeholder="Sök kontakt…"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-sm placeholder:text-[var(--text-muted)] opacity-40 cursor-not-allowed focus:outline-none" />
        </div>
      </div>

      {/* Table with overlay */}
      <div className="relative rounded-2xl border border-[var(--border)] overflow-hidden">

        {/* Coming soon overlay */}
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[var(--surface)]/80 backdrop-blur-sm">
          <div className="w-12 h-12 rounded-2xl bg-[var(--accent)]/10 flex items-center justify-center mb-3">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <p className="text-sm font-semibold text-[var(--text-primary)] mb-1">Under utveckling</p>
          <p className="text-xs text-[var(--text-muted)] max-w-xs text-center leading-relaxed">
            Kontakthantering med kopplingar till leads och kunder kommer snart.
          </p>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[var(--border)] text-sm">
            <thead className="bg-[var(--surface-alt)]">
              <tr>
                {['Namn', 'Titel', 'Företag', 'E-post', 'Telefon'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)] bg-[var(--surface)]">
              {mock.map((c) => (
                <tr key={c.name} className="hover:bg-[var(--surface-alt)] transition-colors select-none">
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-7 h-7 rounded-full ${c.color} flex items-center justify-center text-white text-[10px] font-bold shrink-0`}>
                        {c.initials}
                      </div>
                      <span className="font-medium text-[var(--text-primary)]">{c.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-[var(--text-secondary)]">{c.title}</td>
                  <td className="px-4 py-3.5 text-[var(--text-secondary)]">{c.company}</td>
                  <td className="px-4 py-3.5 text-[var(--text-muted)] text-xs">{c.email}</td>
                  <td className="px-4 py-3.5 text-[var(--text-muted)] text-xs">{c.phone}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
