'use client';

import { useRouter } from 'next/navigation';
import { logout } from '@shared/lib/api/auth-account.api';

interface Props {
  userRole: string | null;
}

const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin',
  manager: 'Manager',
  receptionist: 'Receptionist',
};

export default function DemoGrid({ userRole }: Props) {
  const router = useRouter();

  async function handleLogout() {
    await logout();
    router.push('/logga-in');
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-[var(--page-bg)] flex flex-col">
      {/* Top bar */}
      <header className="glass-header border-b border-[var(--border)] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-sm">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M3 21h18" /><path d="M5 21V7l7-4 7 4v14" /><path d="M9 21v-4h6v4" />
            </svg>
          </div>
          <span className="font-heading text-base font-semibold text-[var(--text-primary)]">
          Soleria
          </span>
        </div>

        <div className="flex items-center gap-3">
          {userRole && (
            <span className="text-xs text-[var(--text-muted)] bg-[var(--surface-1)] border border-[var(--border)] rounded-full px-3 py-1">
              {ROLE_LABELS[userRole] ?? userRole}
            </span>
          )}
          <button
            onClick={handleLogout}
            className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors px-3 py-1.5 rounded-lg hover:bg-[var(--surface-1)] border border-transparent hover:border-[var(--border)]"
          >
            Logga ut
          </button>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-16">
        <div className="max-w-2xl w-full">
          <h1 className="font-heading text-3xl font-semibold text-[var(--text-primary)] mb-2">
            Välj en demo
          </h1>
          <p className="text-sm text-[var(--text-muted)] mb-10">
            Klicka på en demo för att starta.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Hotel demo card */}
            <button
              onClick={() => router.push('/demos/hotel')}
              className="group text-left rounded-2xl border border-[var(--border)] bg-[var(--surface-0)] p-6 hover:border-amber-400/60 hover:shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center mb-4 shadow-sm group-hover:scale-105 transition-transform duration-200">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M3 21h18" /><path d="M5 21V7l7-4 7 4v14" /><path d="M9 21v-4h6v4" />
                  <path d="M9 9h1" /><path d="M14 9h1" /><path d="M9 13h1" /><path d="M14 13h1" />
                </svg>
              </div>

              <h2 className="font-semibold text-[var(--text-primary)] mb-1">
            Grand Hotel Soleria
              </h2>
              <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                AI-receptionist som hanterar rum, bokningar och gästfrågor i realtid.
              </p>

              <div className="mt-5 flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 font-medium">
                Öppna demo
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
                </svg>
              </div>
            </button>

            {/* Placeholder for future demos */}
            <div className="rounded-2xl border border-dashed border-[var(--border)] p-6 flex flex-col items-start justify-center opacity-50 select-none">
              <div className="w-12 h-12 rounded-xl bg-[var(--surface-1)] flex items-center justify-center mb-4">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--text-muted)]" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" /><path d="M12 8v4m0 4h.01" />
                </svg>
              </div>
              <h2 className="font-semibold text-[var(--text-secondary)] mb-1">Fler demos</h2>
              <p className="text-sm text-[var(--text-muted)]">Kommer snart.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
