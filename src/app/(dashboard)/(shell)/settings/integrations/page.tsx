/**
 * /settings/integrations
 *
 * Integration hub — connect external services like CRMs, calendar providers,
 * telephony platforms, and automation tools.
 * Placeholder with integration cards; connect to OAuth flows when ready.
 */

function IconMic() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="2" width="6" height="12" rx="3" />
      <path d="M5 10a7 7 0 0 0 14 0" />
      <line x1="12" y1="19" x2="12" y2="22" />
      <line x1="9" y1="22" x2="15" y2="22" />
    </svg>
  );
}

function IconGear() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

function IconCalendar() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function IconChat() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function IconLink() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}

function IconCard() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
      <line x1="1" y1="10" x2="23" y2="10" />
    </svg>
  );
}

export default function IntegrationsPage() {
  const integrations = [
    {
      name: 'Vapi AI',
      desc: 'Röstsamtalsplattform — hanterar inkommande och utgående AI-samtal.',
      Icon: IconMic,
      category: 'Röst',
      connected: true,
      connectedLabel: 'Ansluten',
    },
    {
      name: 'n8n',
      desc: 'Arbetsflödesautomation — triggar leads, notiser och datapipelines.',
      Icon: IconGear,
      category: 'Automation',
      connected: true,
      connectedLabel: 'Webhook aktiv',
    },
    {
      name: 'Google Calendar',
      desc: 'Synkronisera bokningar och möten med Google Calendar.',
      Icon: IconCalendar,
      category: 'Kalender',
      connected: false,
    },
    {
      name: 'Slack',
      desc: 'Skicka notiser och AI-sammanfattningar direkt till Slack.',
      Icon: IconChat,
      category: 'Kommunikation',
      connected: false,
    },
    {
      name: 'HubSpot',
      desc: 'Synkronisera leads och kontakter med HubSpot CRM.',
      Icon: IconLink,
      category: 'CRM',
      connected: false,
    },
    {
      name: 'Stripe',
      desc: 'Betalningar och fakturering för prenumerationer.',
      Icon: IconCard,
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
          {integrations.filter(i => !i.connected).map(i => (
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
