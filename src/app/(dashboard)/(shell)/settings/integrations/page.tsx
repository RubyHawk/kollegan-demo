/**
 * /settings/integrations
 *
 * Integration hub — connect external services like CRMs, calendar providers,
 * telephony platforms, and automation tools.
 * Placeholder with integration cards; connect to OAuth flows when ready.
 */

export default function IntegrationsPage() {
  const integrations = [
    {
      name: 'Vapi AI',
      desc: 'Röstsamtalsplattform — hanterar inkommande och utgående AI-samtal.',
      logo: '🎙',
      category: 'Röst',
      connected: true,
      connectedLabel: 'Ansluten',
    },
    {
      name: 'n8n',
      desc: 'Arbetsflödesautomation — triggar leads, notiser och datapipelines.',
      logo: '⚙',
      category: 'Automation',
      connected: true,
      connectedLabel: 'Webhook aktiv',
    },
    {
      name: 'Google Calendar',
      desc: 'Synkronisera bokningar och möten med Google Calendar.',
      logo: '📅',
      category: 'Kalender',
      connected: false,
    },
    {
      name: 'Slack',
      desc: 'Skicka notiser och AI-sammanfattningar direkt till Slack.',
      logo: '💬',
      category: 'Kommunikation',
      connected: false,
    },
    {
      name: 'HubSpot',
      desc: 'Synkronisera leads och kontakter med HubSpot CRM.',
      logo: '🔗',
      category: 'CRM',
      connected: false,
    },
    {
      name: 'Stripe',
      desc: 'Betalningar och fakturering för prenumerationer.',
      logo: '💳',
      category: 'Betalning',
      connected: false,
    },
  ];

  return (
    <div className="px-8 py-10 max-w-4xl mx-auto space-y-8">

      {/* Header */}
      <div className="flex items-center gap-2">
        <a href="/settings" className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5" /><path d="m12 19-7-7 7-7" />
          </svg>
        </a>
        <div>
          <h1 className="font-heading text-2xl font-semibold text-[var(--text-primary)]">Integrationer</h1>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">Anslut externa tjänster och automatisera arbetsflöden.</p>
        </div>
      </div>

      {/* Connected */}
      <div>
        <h2 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-widest mb-3">Anslutna</h2>
        <div className="space-y-3">
          {integrations.filter(i => i.connected).map(i => (
            <div key={i.name} className="rounded-2xl border border-emerald-200 dark:border-emerald-800/30 bg-[var(--surface)] p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[var(--surface-alt)] border border-[var(--border)] flex items-center justify-center text-xl shrink-0">
                    {i.logo}
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
          {integrations.filter(i => !i.connected).map(i => (
            <div key={i.name} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-[var(--surface-alt)] border border-[var(--border)] flex items-center justify-center text-xl shrink-0">
                {i.logo}
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
