'use client';

import { useEffect, useState } from 'react';
import { GoogleCalendarIcon } from './calendar-tab-shared';

const FUTURE_INTEGRATIONS = [
  {
    name: 'Outlook',
    desc: 'Microsoft 365',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="2" y="4" width="13" height="16" rx="1.5" fill="#0078d4"/>
        <rect x="9" y="7" width="13" height="13" rx="1.5" fill="#28a8e8"/>
        <rect x="9" y="7" width="13" height="7" rx="1.5" fill="#0078d4"/>
        <circle cx="15.5" cy="13.5" r="3.5" fill="#fff"/>
      </svg>
    ),
  },
  {
    name: 'Apple iCal',
    desc: 'CalDAV-synk',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="2" y="4" width="20" height="18" rx="3" fill="#fff" stroke="#d1d5db" strokeWidth="1"/>
        <rect x="2" y="4" width="20" height="6" rx="3" fill="#f3111b"/>
        <rect x="2" y="8" width="20" height="2" fill="#f3111b"/>
        <line x1="9" y1="13" x2="9" y2="19" stroke="#e5e7eb" strokeWidth="0.75"/>
        <line x1="15" y1="13" x2="15" y2="19" stroke="#e5e7eb" strokeWidth="0.75"/>
        <line x1="2" y1="16" x2="22" y2="16" stroke="#e5e7eb" strokeWidth="0.75"/>
        <rect x="10" y="12.5" width="4" height="3" rx="0.5" fill="#f3111b" opacity="0.9"/>
      </svg>
    ),
  },
  {
    name: 'Booking.com',
    desc: 'Kanalhantering',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="24" height="24" rx="4" fill="#003580"/>
        <rect x="7" y="6" width="2" height="12" rx="0.5" fill="#fff"/>
        <path d="M9 6h3a2.5 2.5 0 0 1 0 5H9V6z" fill="#fff"/>
        <path d="M9 11h3.5a2.5 2.5 0 0 1 0 5H9v-5z" fill="#fff"/>
        <circle cx="18" cy="17" r="1.5" fill="#ffcc00"/>
      </svg>
    ),
  },
];

function ComingSoonBadge() {
  return (
    <span className="text-[9px] font-bold uppercase tracking-wide text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-full px-1.5 py-0.5">
      Snart
    </span>
  );
}

export function GoogleCalendarView() {
  const [loading, setLoading]       = useState(true);
  const [configured, setConfigured] = useState(false);
  const [embedUrl, setEmbedUrl]     = useState<string | null>(null);
  const [hovered, setHovered]       = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/calendar/events')
      .then((r) => r.json())
      .then((data) => { setConfigured(data.configured ?? false); setEmbedUrl(data.embedUrl ?? null); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3" style={{ minHeight: 480 }}>
        <div className="w-9 h-9 rounded-full border-2 border-[var(--border)] border-t-[#4285F4] animate-spin" />
        <p className="text-sm text-[var(--text-muted)]">Ansluter till Google Kalender…</p>
      </div>
    );
  }

  if (!configured) {
    return (
      <div className="space-y-4">
        <div className="bg-[var(--surface)] border-2 border-[var(--border)] rounded-2xl overflow-hidden shadow-card">
          <div className="px-6 py-5 border-b border-[var(--border)] bg-gradient-to-br from-[#4285F4]/5 to-transparent flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-sm flex items-center justify-center shrink-0">
              <GoogleCalendarIcon size={32} />
            </div>
            <div>
              <p className="text-base font-semibold text-[var(--text-primary)]">Anslut Google Kalender</p>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                Bokningar skapas och synkroniseras automatiskt i realtid via Soleria AI.
              </p>
            </div>
          </div>

          <div className="px-6 py-5 space-y-4">
            {[
              { step: '1', title: 'Skapa ett Service Account', body: 'Gå till Google Cloud Console → IAM & Admin → Service Accounts. Skapa ett nytt konto och ladda ner JSON-nyckeln.' },
              { step: '2', title: 'Lägg till miljövariabler', body: null, code: ['GOOGLE_SERVICE_ACCOUNT_EMAIL=namn@projekt.iam.gserviceaccount.com', 'GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\n..."', 'GOOGLE_CALENDAR_ID=din-kalender@group.calendar.google.com'] },
              { step: '3', title: 'Dela kalendern med service account', body: 'Öppna Google Kalender → Inställningar för din kalender → Dela med specifika personer. Lägg till service account-e-posten med rollen "Göra ändringar i händelser".' },
            ].map((item) => (
              <div key={item.step} className="flex gap-3.5">
                <div className="w-6 h-6 rounded-full bg-[#4285F4] text-white flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5">
                  {item.step}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[var(--text-primary)]">{item.title}</p>
                  {item.body && <p className="text-xs text-[var(--text-muted)] mt-0.5 leading-relaxed">{item.body}</p>}
                  {item.code && (
                    <div className="mt-2 bg-[var(--surface-alt)] border border-[var(--border)] rounded-xl p-3 space-y-1">
                      {item.code.map((line) => (
                        <code key={line} className="block text-[10px] font-mono text-[var(--text-secondary)] break-all leading-relaxed">{line}</code>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="px-6 py-4 border-t border-[var(--border)] bg-[var(--surface-alt)] flex items-center gap-2 text-xs text-[var(--text-muted)]">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            Starta om servern med <code className="font-mono mx-1 bg-[var(--surface)] border border-[var(--border)] px-1 py-px rounded text-[10px]">npm run dev</code> efter att du lagt till variabler i <code className="font-mono mx-1 bg-[var(--surface)] border border-[var(--border)] px-1 py-px rounded text-[10px]">.env.local</code>.
          </div>
        </div>

        <div>
          <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-widest mb-2.5 px-0.5">
            Fler integrationer — kommer snart
          </p>
          <div className="grid grid-cols-3 sm:grid-cols-3 gap-2.5">
            {FUTURE_INTEGRATIONS.map((fi) => (
              <button
                key={fi.name}
                onMouseEnter={() => setHovered(fi.name)}
                onMouseLeave={() => setHovered(null)}
                className="relative bg-[var(--surface)] border-2 border-[var(--border)] rounded-2xl p-4 text-left transition-all hover:border-purple-200/60 dark:hover:border-amber-900/30 hover:shadow-card-hover shadow-card active:scale-[0.98] group"
              >
                <div className="flex items-start justify-between mb-2.5">
                  <div className="w-9 h-9 rounded-xl bg-[var(--surface-alt)] border border-[var(--border)] flex items-center justify-center">{fi.icon}</div>
                  <ComingSoonBadge />
                </div>
                <p className="text-xs font-semibold text-[var(--text-primary)] leading-tight">{fi.name}</p>
                <p className="text-[10px] text-[var(--text-muted)] mt-0.5">{fi.desc}</p>
                {hovered === fi.name && (
                  <div className="absolute inset-0 rounded-2xl bg-[var(--surface-alt)]/80 flex items-center justify-center">
                    <span className="text-xs font-semibold text-[var(--text-secondary)]">Kommer snart</span>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Integration header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2.5">
          <GoogleCalendarIcon size={24} />
          <div>
            <p className="text-sm font-semibold text-[var(--text-primary)] leading-tight">Google Kalender</p>
            <p className="text-[10px] text-[var(--text-muted)] leading-tight">Live-synkad · realtidsbokningar</p>
          </div>
          <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 rounded-full px-2 py-0.5 ml-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Ansluten
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-[var(--text-muted)] mr-1">Lägg till:</span>
          {FUTURE_INTEGRATIONS.map((fi) => (
            <button
              key={fi.name}
              onMouseEnter={() => setHovered(fi.name)}
              onMouseLeave={() => setHovered(null)}
              title={`${fi.name} – Kommer snart`}
              className="relative w-8 h-8 rounded-xl bg-[var(--surface-alt)] border border-[var(--border)] flex items-center justify-center transition-all hover:border-[var(--text-muted)] hover:shadow-sm active:scale-95"
            >
              {fi.icon}
              {hovered === fi.name && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 whitespace-nowrap bg-[var(--surface)] border border-[var(--border)] shadow-md rounded-lg px-2 py-1 text-[10px] font-semibold text-[var(--text-primary)] pointer-events-none z-10">
                  {fi.name}
                  <div className="mt-0.5"><ComingSoonBadge /></div>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Embedded Google Calendar — full viewport height, responsive like real Google Calendar */}
      <div
        className="rounded-2xl overflow-hidden border-2 border-[var(--border)] bg-[var(--surface)] shadow-card"
        style={{ height: 'calc(100vh - 300px)', minHeight: 520 }}
      >
        <iframe
          src={embedUrl!}
          style={{ width: '100%', height: '100%', border: 0, display: 'block' }}
          title="Google Kalender"
          allowFullScreen
        />
      </div>

      <p className="text-[10px] text-[var(--text-muted)] text-center">
        Bokningar skapade via Soleria synkroniseras automatiskt · Kalendern måste vara offentlig för iframe-visning
      </p>
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────
