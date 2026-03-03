'use client';

import { useRouter } from 'next/navigation';

export default function DemosPage() {
  const router = useRouter();

  return (
    <div className="px-8 py-10 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="font-heading text-2xl font-semibold text-[var(--text-primary)] mb-1">
          Demos
        </h1>
        <p className="text-sm text-[var(--text-muted)]">
          Interaktiva AI-scenarier med live-simulerade miljöer.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Hotel demo */}
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
          <h2 className="font-semibold text-[var(--text-primary)] mb-1">Grand Hotel Kollegan</h2>
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

        {/* Placeholder */}
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
  );
}
