/**
 * /settings/billing
 *
 * Billing & subscription management — plan overview, usage, and invoices.
 * Placeholder with mock subscription data; connect to Stripe/billing service
 * when payment infrastructure is in place.
 */

export default function BillingPage() {
  const invoices = [
    { id: 'INV-2026-03', date: '2026-03-01', amount: '4 990 kr', status: 'Betald' },
    { id: 'INV-2026-02', date: '2026-02-01', amount: '4 990 kr', status: 'Betald' },
    { id: 'INV-2026-01', date: '2026-01-01', amount: '4 990 kr', status: 'Betald' },
    { id: 'INV-2025-12', date: '2025-12-01', amount: '4 990 kr', status: 'Betald' },
  ];

  return (
    <div className="space-y-6">

      {/* Current plan */}
      <div className="rounded-2xl border border-[var(--accent)]/30 bg-[var(--accent)]/5 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold text-[var(--accent)] uppercase tracking-widest">Nuvarande plan</span>
              <span className="rounded-full bg-emerald-50 dark:bg-emerald-900/25 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 text-[10px] font-semibold">Aktiv</span>
            </div>
            <h2 className="font-heading text-xl font-bold text-[var(--text-primary)] mb-1">Soleria Pro</h2>
            <p className="text-sm text-[var(--text-muted)]">4 990 kr / månad · Faktureras månadsvis</p>
          </div>
          <button disabled className="shrink-0 px-4 py-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-sm font-medium text-[var(--text-secondary)] opacity-50 cursor-not-allowed">
            Byt plan
          </button>
        </div>

        {/* Usage */}
        <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { label: 'AI-samtal',   used: 1284, limit: 2000 },
            { label: 'Aktiva demo', used: 1,    limit: 3    },
            { label: 'Användare',   used: 4,    limit: 10   },
          ].map(u => (
            <div key={u.label} className="bg-[var(--surface)] rounded-xl border border-[var(--border)] p-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-[var(--text-muted)]">{u.label}</span>
                <span className="text-xs font-semibold text-[var(--text-secondary)]">{u.used}/{u.limit}</span>
              </div>
              <div className="h-1.5 rounded-full bg-[var(--surface-alt)]">
                <div className="h-1.5 rounded-full bg-[var(--accent)]" style={{ width: `${Math.min(100, (u.used / u.limit) * 100)}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Payment method */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">Betalningsmetod</h2>
          <button disabled className="text-xs text-[var(--accent)] font-medium opacity-50 cursor-not-allowed">Byt kort</button>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-10 h-7 rounded-md bg-[var(--surface-alt)] border border-[var(--border)] flex items-center justify-center">
            <svg width="22" height="14" viewBox="0 0 38 24" fill="none" className="text-[var(--text-muted)]">
              <rect width="38" height="24" rx="4" fill="currentColor" opacity="0.08"/>
              <rect x="3" y="8" width="10" height="8" rx="2" fill="currentColor" opacity="0.3"/>
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-[var(--text-primary)]">•••• •••• •••• 4242</p>
            <p className="text-xs text-[var(--text-muted)]">Utgår 12/28</p>
          </div>
        </div>
      </div>

      {/* Invoices */}
      <div className="rounded-2xl border border-[var(--border)] overflow-hidden">
        <div className="px-5 py-4 border-b border-[var(--border)] bg-[var(--surface-alt)]">
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">Fakturahistorik</h2>
        </div>
        <table className="min-w-full divide-y divide-[var(--border)] text-sm">
          <thead className="bg-[var(--surface-alt)]">
            <tr>
              {['Faktura', 'Datum', 'Belopp', 'Status', ''].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)] bg-[var(--surface)]">
            {invoices.map(inv => (
              <tr key={inv.id} className="hover:bg-[var(--surface-alt)] transition-colors">
                <td className="px-4 py-3.5 font-mono text-xs text-[var(--text-secondary)]">{inv.id}</td>
                <td className="px-4 py-3.5 text-[var(--text-secondary)]">{inv.date}</td>
                <td className="px-4 py-3.5 font-medium text-[var(--text-primary)]">{inv.amount}</td>
                <td className="px-4 py-3.5">
                  <span className="rounded-full bg-emerald-50 dark:bg-emerald-900/25 text-emerald-700 dark:text-emerald-400 px-2.5 py-0.5 text-xs font-medium">
                    {inv.status}
                  </span>
                </td>
                <td className="px-4 py-3.5">
                  <button disabled className="text-xs text-[var(--accent)] font-medium opacity-50 cursor-not-allowed">
                    Ladda ner PDF
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Danger zone */}
      <div className="rounded-2xl border border-red-200 dark:border-red-800/40 p-6">
        <h2 className="text-sm font-semibold text-red-600 dark:text-red-400 mb-1">Farlig zon</h2>
        <p className="text-xs text-[var(--text-muted)] mb-4">Avsluta prenumerationen och radera all data permanent.</p>
        <button disabled className="rounded-xl border border-red-200 dark:border-red-800/50 bg-red-50 dark:bg-red-900/20 px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 opacity-50 cursor-not-allowed">
          Avsluta prenumeration
        </button>
      </div>

    </div>
  );
}
