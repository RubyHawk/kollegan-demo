/**
 * /settings/integrations
 *
 * Integration hub — connect external services like CRMs, calendar providers,
 * telephony platforms, and automation tools.
 * Placeholder with integration cards; connect to OAuth flows when ready.
 */

import { INTEGRATIONS } from './_data';

export default function IntegrationsPage() {
  const connected = INTEGRATIONS.filter((i) => i.connected);
  const available = INTEGRATIONS.filter((i) => !i.connected);

  return (
    <div className="space-y-6">

      {/* Connected */}
      <div>
        <h2 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-widest mb-3">Anslutna</h2>
        <div className="space-y-3">
          {connected.map((i) => (
            <div key={i.name} className="rounded-xl border border-emerald-200 dark:border-emerald-800/30 bg-[var(--surface)] p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[var(--surface-alt)] border border-[var(--border)] flex items-center justify-center text-[var(--text-secondary)] shrink-0">
                    <i.Icon />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-semibold text-[var(--text-primary)]">{i.name}</p>
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] bg-[var(--surface-alt)] border border-[var(--border)] rounded-full px-1.5 py-0.5">
                        {i.category}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--text-muted)] leading-relaxed">{i.desc}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="flex items-center gap-1 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    {i.connectedLabel}
                  </span>
                  <button disabled className="rounded-lg border border-[var(--border)] bg-[var(--surface-alt)] px-3 py-1 text-xs text-[var(--text-secondary)] opacity-50 cursor-not-allowed">
                    Hantera
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Available */}
      <div>
        <h2 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-widest mb-3">Tillgängliga</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {available.map((i) => (
            <div key={i.name} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-[var(--surface-alt)] border border-[var(--border)] flex items-center justify-center text-[var(--text-secondary)] shrink-0">
                <i.Icon />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-sm font-semibold text-[var(--text-primary)]">{i.name}</p>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] bg-[var(--surface-alt)] border border-[var(--border)] rounded-full px-1.5 py-0.5">
                    {i.category}
                  </span>
                </div>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed mb-3">{i.desc}</p>
                <button disabled className="rounded-lg bg-[var(--accent)] px-3 py-1.5 text-xs font-medium text-white opacity-40 cursor-not-allowed">
                  Anslut
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
