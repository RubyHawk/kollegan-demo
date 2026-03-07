import { getSessionUser } from '@platform/auth/session';
import Link from 'next/link';

export default async function OverviewPage() {
  const user = await getSessionUser();
  const role = user?.role ?? null;

  return (
    <div className="px-8 py-10 max-w-5xl mx-auto space-y-10">

      {/* Header */}
      <div>
        <h1 className="font-heading text-2xl font-semibold text-[var(--text-primary)] mb-1">
          Översikt
        </h1>
        <p className="text-sm text-[var(--text-muted)]">
          Välkommen till Kollegan — din AI-drivna arbetsassistent.
        </p>
      </div>

      {/* Hero banner */}
      <div className="relative rounded-3xl overflow-hidden border border-[var(--border)] bg-gradient-to-br from-[var(--accent)]/8 via-[var(--surface-alt)] to-[var(--surface-alt)]">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-[var(--accent)]/6 blur-3xl" />
          <div className="absolute -bottom-8 -left-8 w-36 h-36 rounded-full bg-[var(--accent)]/4 blur-2xl" />
        </div>
        <div className="relative px-8 py-8 flex items-center gap-6">
          <div className="w-14 h-14 rounded-2xl bg-[var(--accent)] flex items-center justify-center shrink-0 shadow-lg">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20" />
              <path d="M12 8v4l3 3" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-semibold text-[var(--accent)] uppercase tracking-widest mb-1">Live AI-demo</p>
            <h2 className="font-heading text-lg font-semibold text-[var(--text-primary)] mb-1">
              Grand Hotel Kollegan är redo
            </h2>
            <p className="text-sm text-[var(--text-muted)]">
              Testa AI-receptionisten som svarar på samtal, hanterar bokningar och svarar på gästfrågor i realtid.
            </p>
          </div>
          <Link
            href="/demos/hotel"
            className="ml-auto shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--accent)] text-white text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Öppna demo
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>

      {/* Quick nav cards */}
      <div>
        <h2 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-widest mb-4">Produkter</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link
            href="/crm"
            className="group rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 hover:border-[var(--accent)]/40 hover:shadow-md transition-all duration-200"
          >
            <div className="w-10 h-10 rounded-xl bg-[var(--accent)]/10 flex items-center justify-center mb-4">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <h3 className="font-semibold text-[var(--text-primary)] mb-1 text-sm">CRM</h3>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              Hantera kunder, kontakter och ärendehistorik.
            </p>
            <div className="mt-4 text-xs text-[var(--accent)] font-medium flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              Öppna <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
            </div>
          </Link>

          <Link
            href="/demos"
            className="group rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 hover:border-amber-400/40 hover:shadow-md transition-all duration-200"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center mb-4">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="text-amber-600 dark:text-amber-400">
                <path d="M3 21h18" /><path d="M5 21V7l7-4 7 4v14" /><path d="M9 21v-4h6v4" />
                <path d="M9 9h1" /><path d="M14 9h1" /><path d="M9 13h1" /><path d="M14 13h1" />
              </svg>
            </div>
            <h3 className="font-semibold text-[var(--text-primary)] mb-1 text-sm">Demos</h3>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              Interaktiva AI-scenarier med live-simulerade miljöer.
            </p>
            <div className="mt-4 text-xs text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              Utforska <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
            </div>
          </Link>

          {role === 'admin' && (
            <Link
              href="/admin/compliance"
              className="group rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 hover:border-emerald-400/40 hover:shadow-md transition-all duration-200"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-4">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600 dark:text-emerald-400">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>
              <h3 className="font-semibold text-[var(--text-primary)] mb-1 text-sm">Compliance</h3>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                ISO 27001 kontroller, riskregister och policyer.
              </p>
              <div className="mt-4 text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                Hantera <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
              </div>
            </Link>
          )}
        </div>
      </div>

      {/* Feature highlights */}
      <div>
        <h2 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-widest mb-4">Vad Kollegan kan</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            {
              icon: (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.84 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.77 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 8.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
              ),
              color: 'text-[var(--accent)] bg-[var(--accent)]/10',
              title: 'Röstsamtal i realtid',
              desc: 'Svarar på inkommande samtal, uppfattar avsikt och agerar direkt.',
            },
            {
              icon: (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              ),
              color: 'text-amber-600 dark:text-amber-400 bg-amber-500/10',
              title: 'Bokningshantering',
              desc: 'Låser rum, bekräftar bokningar och uppdaterar systemet automatiskt.',
            },
            {
              icon: (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              ),
              color: 'text-violet-600 dark:text-violet-400 bg-violet-500/10',
              title: 'CRM-integration',
              desc: 'Sparar kontaktinformation och sammanfattar samtal i kundregistret.',
            },
            {
              icon: (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
              ),
              color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10',
              title: 'Realtidsaktivitet',
              desc: 'Alla händelser loggas och synkroniseras direkt i aktivitetsflödet.',
            },
          ].map((f) => (
            <div key={f.title} className="flex items-start gap-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${f.color}`}>
                {f.icon}
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--text-primary)] mb-0.5">{f.title}</p>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
