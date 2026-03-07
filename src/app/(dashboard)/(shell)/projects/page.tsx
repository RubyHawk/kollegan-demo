/**
 * /projects
 *
 * Project workspace — track ongoing AI implementation projects, milestones
 * and deliverables. Placeholder with visible project cards and status board.
 */

export default function ProjectsPage() {
  const projects = [
    {
      name: 'Grand Hotel Kollegan — AI-reception',
      status: 'active',
      progress: 85,
      owner: 'Erik B.',
      due: '2026-04-01',
      tags: ['Röst-AI', 'Hotel', 'Live'],
    },
    {
      name: 'CRM-integration Leads pipeline',
      status: 'active',
      progress: 60,
      owner: 'Anna L.',
      due: '2026-05-15',
      tags: ['CRM', 'n8n', 'Leads'],
    },
    {
      name: 'ISO 27001 — Compliance-automation',
      status: 'review',
      progress: 40,
      owner: 'Maria J.',
      due: '2026-06-30',
      tags: ['Compliance', 'Säkerhet'],
    },
    {
      name: 'Klinik-demo — Bokningsassistent',
      status: 'planned',
      progress: 10,
      owner: '—',
      due: '2026-08-01',
      tags: ['Röst-AI', 'Klinik'],
    },
  ];

  const STATUS_LABEL: Record<string, string> = {
    active:  'Aktiv',
    review:  'Granskning',
    planned: 'Planerad',
    done:    'Klar',
  };

  const STATUS_STYLE: Record<string, string> = {
    active:  'bg-emerald-50 dark:bg-emerald-900/25 text-emerald-700 dark:text-emerald-400',
    review:  'bg-amber-50 dark:bg-amber-900/25 text-amber-700 dark:text-amber-400',
    planned: 'bg-[var(--surface-alt)] text-[var(--text-muted)]',
    done:    'bg-[var(--accent)]/10 text-[var(--accent)]',
  };

  return (
    <div className="px-8 py-10 max-w-5xl mx-auto space-y-8">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-[var(--text-primary)] mb-1">
            Projekt
          </h1>
          <p className="text-sm text-[var(--text-muted)]">
            AI-implementationer, milstolpar och leveranser.
          </p>
        </div>
        <button
          disabled
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--accent)] text-white text-sm font-medium opacity-40 cursor-not-allowed"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Nytt projekt
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Aktiva',   value: projects.filter(p => p.status === 'active').length,  color: 'text-emerald-700 dark:text-emerald-400' },
          { label: 'Granskning', value: projects.filter(p => p.status === 'review').length, color: 'text-amber-700 dark:text-amber-400' },
          { label: 'Planerade', value: projects.filter(p => p.status === 'planned').length, color: 'text-[var(--text-muted)]' },
          { label: 'Klara',    value: projects.filter(p => p.status === 'done').length,    color: 'text-[var(--accent)]' },
        ].map(s => (
          <div key={s.label} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 text-center">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-[var(--text-muted)] mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Project cards */}
      <div className="relative">
        {/* Coming soon overlay */}
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[var(--surface)]/75 backdrop-blur-sm rounded-2xl">
          <div className="w-12 h-12 rounded-2xl bg-[var(--accent)]/10 flex items-center justify-center mb-3">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <p className="text-sm font-semibold text-[var(--text-primary)] mb-1">Under utveckling</p>
          <p className="text-xs text-[var(--text-muted)] max-w-xs text-center leading-relaxed">
            Projekthantering med milstolpar, uppgifter och tidslinje kommer snart.
          </p>
        </div>

        <div className="space-y-3">
          {projects.map((p) => (
            <div key={p.name} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 select-none">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{p.name}</p>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">Ägare: {p.owner} · Förfall: {p.due}</p>
                </div>
                <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLE[p.status]}`}>
                  {STATUS_LABEL[p.status]}
                </span>
              </div>

              {/* Progress */}
              <div className="mb-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-[var(--text-muted)]">Framsteg</span>
                  <span className="text-xs font-semibold text-[var(--text-secondary)]">{p.progress}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-[var(--surface-alt)]">
                  <div
                    className="h-1.5 rounded-full bg-[var(--accent)]"
                    style={{ width: `${p.progress}%` }}
                  />
                </div>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-1.5">
                {p.tags.map(t => (
                  <span key={t} className="px-2 py-0.5 rounded-full bg-[var(--surface-alt)] border border-[var(--border)] text-[10px] text-[var(--text-secondary)] font-medium">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
