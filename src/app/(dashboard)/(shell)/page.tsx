import { cookies } from 'next/headers';
import { verifyToken } from '@core/auth/jwt';
import Link from 'next/link';

async function getRole() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) return null;
    const payload = await verifyToken(token);
    return (payload.roles?.[0] ?? payload.role ?? null) as string | null;
  } catch {
    return null;
  }
}

export default async function OverviewPage() {
  const role = await getRole();

  return (
    <div className="px-8 py-10 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-10">
        <h1 className="font-heading text-2xl font-semibold text-[var(--text-primary)] mb-1">
          Översikt
        </h1>
        <p className="text-sm text-[var(--text-muted)]">
          Välkommen till Kollegan. Välj ett område i sidebaren för att komma igång.
        </p>
      </div>

      {/* Quick nav cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
        <Link
          href="/crm"
          className="group rounded-2xl border border-[var(--border)] bg-[var(--surface-0)] p-6 hover:border-[var(--accent)]/40 hover:shadow-md transition-all duration-200"
        >
          <div className="w-10 h-10 rounded-xl bg-[var(--accent)]/10 flex items-center justify-center mb-4">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <h2 className="font-semibold text-[var(--text-primary)] mb-1 text-sm">CRM</h2>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            Hantera kunder, kontakter och ärenden.
          </p>
        </Link>

        <Link
          href="/demos"
          className="group rounded-2xl border border-[var(--border)] bg-[var(--surface-0)] p-6 hover:border-amber-400/40 hover:shadow-md transition-all duration-200"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center mb-4">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="text-amber-600 dark:text-amber-400" aria-hidden="true">
              <path d="M3 21h18" /><path d="M5 21V7l7-4 7 4v14" /><path d="M9 21v-4h6v4" />
              <path d="M9 9h1" /><path d="M14 9h1" /><path d="M9 13h1" /><path d="M14 13h1" />
            </svg>
          </div>
          <h2 className="font-semibold text-[var(--text-primary)] mb-1 text-sm">Demos</h2>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            Prova AI-scenarier med live-simulerade miljöer.
          </p>
        </Link>

        {role === 'admin' && (
          <Link
            href="/admin/compliance"
            className="group rounded-2xl border border-[var(--border)] bg-[var(--surface-0)] p-6 hover:border-emerald-400/40 hover:shadow-md transition-all duration-200"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-4">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600 dark:text-emerald-400" aria-hidden="true">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <h2 className="font-semibold text-[var(--text-primary)] mb-1 text-sm">Compliance</h2>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              ISO 27001 kontroller och riskregister.
            </p>
          </Link>
        )}
      </div>

      {/* Status / placeholder for future widgets */}
      <div className="rounded-2xl border border-dashed border-[var(--border)] p-8 flex flex-col items-center justify-center text-center opacity-60 select-none">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--text-muted)] mb-3" aria-hidden="true">
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
        <p className="text-sm font-medium text-[var(--text-secondary)]">Widgets kommer snart</p>
        <p className="text-xs text-[var(--text-muted)] mt-1">KPI-kort, aktivitetsflöden och snabbåtgärder.</p>
      </div>
    </div>
  );
}
