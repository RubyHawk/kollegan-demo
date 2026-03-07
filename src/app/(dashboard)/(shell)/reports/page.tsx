/**
 * /reports
 *
 * Report library — browse, generate, and download pre-built reports.
 * Placeholder with visible report cards; generation wired up when the
 * reporting pipeline is ready.
 */

export default function ReportsPage() {
  const reports = [
    {
      id: 'call-summary',
      name: 'Samtalssammanfattning',
      desc: 'Daglig/veckovis översikt av AI-samtal, bokningar och avbokningar.',
      category: 'Aktivitet',
      color: 'text-[var(--accent)] bg-[var(--accent)]/10',
    },
    {
      id: 'lead-conversion',
      name: 'Leadkonvertering',
      desc: 'Tratt från inkommande samtal till stängd affär, per kanal och period.',
      category: 'CRM',
      color: 'text-violet-600 dark:text-violet-400 bg-violet-500/10',
    },
    {
      id: 'occupancy',
      name: 'Beläggningsrapport',
      desc: 'Rumsbeläggning, intäkt per tillgänglig natt och nyckeltal.',
      category: 'Hotel',
      color: 'text-amber-600 dark:text-amber-400 bg-amber-500/10',
    },
    {
      id: 'compliance',
      name: 'Efterlevnadsöversikt',
      desc: 'ISO 27001-kontroller, öppna risker och policystatus.',
      category: 'Compliance',
      color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10',
    },
    {
      id: 'access-review',
      name: 'Åtkomstgranskning',
      desc: 'Kvartalsvis SOC 2 CC6.3 — användare, roller och MFA-efterlevnad.',
      category: 'Säkerhet',
      color: 'text-rose-600 dark:text-rose-400 bg-rose-500/10',
    },
    {
      id: 'activity-log',
      name: 'Aktivitetslogg',
      desc: 'Fullständig revisionsspår för alla händelser i systemet.',
      category: 'Aktivitet',
      color: 'text-sky-600 dark:text-sky-400 bg-sky-500/10',
    },
  ];

  return (
    <div className="px-8 py-10 max-w-5xl mx-auto space-y-8">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-[var(--text-primary)] mb-1">
            Rapporter
          </h1>
          <p className="text-sm text-[var(--text-muted)]">
            Generera och ladda ner strukturerade rapporter för analys och revision.
          </p>
        </div>
        <button
          disabled
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--accent)] text-white text-sm font-medium opacity-40 cursor-not-allowed"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Ny rapport
        </button>
      </div>

      {/* Report grid */}
      <div className="relative">
        {/* Coming soon overlay */}
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[var(--surface)]/75 backdrop-blur-sm rounded-2xl">
          <div className="w-12 h-12 rounded-2xl bg-[var(--accent)]/10 flex items-center justify-center mb-3">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
          </div>
          <p className="text-sm font-semibold text-[var(--text-primary)] mb-1">Under utveckling</p>
          <p className="text-xs text-[var(--text-muted)] max-w-xs text-center leading-relaxed">
            Rapportgenerering och schemalagd export kommer snart.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {reports.map((r) => (
            <div
              key={r.id}
              className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 flex flex-col gap-3 select-none"
            >
              <div className="flex items-start justify-between gap-2">
                <span className={`text-[10px] font-semibold uppercase tracking-wider rounded-full px-2 py-0.5 ${r.color}`}>
                  {r.category}
                </span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--text-muted)] shrink-0 mt-0.5">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--text-primary)] mb-1">{r.name}</p>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed">{r.desc}</p>
              </div>
              <button disabled className="mt-auto text-xs text-[var(--accent)] font-medium opacity-50 text-left">
                Generera rapport →
              </button>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
