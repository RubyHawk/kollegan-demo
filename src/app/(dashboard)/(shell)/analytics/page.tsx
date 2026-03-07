/**
 * /analytics
 *
 * Analytics overview — KPI tiles, activity trend, channel breakdown.
 * Currently a rich placeholder; wire up real data from the reporting pipeline
 * once event tracking is in place.
 */

export default function AnalyticsPage() {
  const kpis = [
    { label: 'Samtal totalt',     value: '1 284', delta: '+12%', up: true },
    { label: 'Bokningar',         value: '347',   delta: '+8%',  up: true },
    { label: 'Konverteringsgrad', value: '27%',   delta: '+3pp', up: true },
    { label: 'Avg. samtalstid',   value: '2m 14s', delta: '-4%', up: false },
  ];

  const channels = [
    { label: 'Röstsamtal',   pct: 58, color: 'bg-[var(--accent)]' },
    { label: 'Webbformulär', pct: 24, color: 'bg-violet-500' },
    { label: 'Manuellt',     pct: 11, color: 'bg-amber-400' },
    { label: 'Remiss',       pct: 7,  color: 'bg-emerald-500' },
  ];

  const months = ['Sep', 'Okt', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];
  const bars   = [42, 58, 51, 73, 65, 88, 94];
  const maxBar = Math.max(...bars);

  return (
    <div className="px-8 py-10 max-w-6xl mx-auto space-y-10">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-[var(--text-primary)] mb-1">
            Analytics
          </h1>
          <p className="text-sm text-[var(--text-muted)]">
            Nyckeltal, trender och kanaldistribution — senaste 30 dagarna.
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--surface-alt)] px-3 py-1 text-xs font-medium text-[var(--text-muted)]">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
          Demo-data
        </span>
      </div>

      {/* KPI tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
            <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3">{k.label}</p>
            <p className="text-3xl font-bold text-[var(--text-primary)] mb-1">{k.value}</p>
            <span className={[
              'inline-flex items-center gap-1 text-xs font-semibold rounded-full px-2 py-0.5',
              k.up
                ? 'bg-emerald-50 dark:bg-emerald-900/25 text-emerald-700 dark:text-emerald-400'
                : 'bg-red-50 dark:bg-red-900/25 text-red-600 dark:text-red-400',
            ].join(' ')}>
              {k.up ? '↑' : '↓'} {k.delta} vs förra månaden
            </span>
          </div>
        ))}
      </div>

      {/* Trend chart (bar) */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
        <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-1">Aktivitetstrend</h2>
        <p className="text-xs text-[var(--text-muted)] mb-6">Antal samtal per månad</p>
        <div className="flex items-end gap-3 h-40">
          {bars.map((h, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
              <div
                className="w-full rounded-t-lg bg-[var(--accent)]/20 hover:bg-[var(--accent)]/40 transition-colors relative group"
                style={{ height: `${(h / maxBar) * 130}px` }}
              >
                <div
                  className="absolute bottom-0 left-0 right-0 rounded-t-lg bg-[var(--accent)]"
                  style={{ height: `${(h / maxBar) * 80}%` }}
                />
                <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-semibold text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  {h} samtal
                </span>
              </div>
              <span className="text-[10px] text-[var(--text-muted)]">{months[i]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom row: channels + teaser */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Channel breakdown */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
          <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Kanaldistribution</h2>
          <div className="space-y-3">
            {channels.map((c) => (
              <div key={c.label}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-[var(--text-secondary)]">{c.label}</span>
                  <span className="text-xs font-semibold text-[var(--text-primary)]">{c.pct}%</span>
                </div>
                <div className="h-2 rounded-full bg-[var(--surface-alt)]">
                  <div className={`h-2 rounded-full ${c.color}`} style={{ width: `${c.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Teaser: deeper analytics */}
        <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface)] p-6 flex flex-col items-center justify-center text-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-[var(--accent)]/10 flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
          </div>
          <p className="text-sm font-semibold text-[var(--text-primary)]">Djupare analys</p>
          <p className="text-xs text-[var(--text-muted)] max-w-xs leading-relaxed">
            Kohortanalys, trattvisualisering och AI-genererade insikter kommer i nästa version.
          </p>
        </div>

      </div>
    </div>
  );
}
