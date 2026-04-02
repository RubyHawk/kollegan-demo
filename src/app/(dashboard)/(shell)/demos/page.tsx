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

        {/* Hotel demo — featured card */}
        <button
          onClick={() => router.push('/demos/hotel')}
          className="group text-left rounded-2xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden hover:border-amber-400/60 hover:shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2"
        >
          {/* Gradient top strip */}
          <div className="h-28 bg-gradient-to-br from-amber-400 via-amber-500 to-orange-600 relative overflow-hidden">
            <div className="absolute inset-0 opacity-20">
              <div className="absolute top-2 left-6 w-32 h-32 rounded-full bg-white/30 blur-2xl" />
              <div className="absolute bottom-0 right-4 w-20 h-20 rounded-full bg-white/20 blur-xl" />
            </div>
            {/* Hotel icon */}
            <div className="absolute bottom-4 left-6 w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 21h18" /><path d="M5 21V7l7-4 7 4v14" /><path d="M9 21v-4h6v4" />
                <path d="M9 9h1" /><path d="M14 9h1" /><path d="M9 13h1" /><path d="M14 13h1" />
              </svg>
            </div>
            {/* Live badge */}
            <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-black/25 backdrop-blur-sm text-white text-[10px] font-semibold px-2.5 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              LIVE
            </div>
          </div>

          {/* Content */}
          <div className="p-5">
            <h2 className="font-semibold text-[var(--text-primary)] mb-1">Grand Hotel Soleria</h2>
            <p className="text-sm text-[var(--text-muted)] leading-relaxed mb-4">
              AI-receptionist som hanterar rum, bokningar och gästfrågor i realtid via röstsamtal.
            </p>

            {/* Tags */}
            <div className="flex flex-wrap gap-1.5 mb-4">
              {['Röst-AI', 'Bokningar', 'CRM', 'Realtid'].map(tag => (
                <span key={tag} className="px-2 py-0.5 rounded-full bg-[var(--surface-alt)] border border-[var(--border)] text-xs text-[var(--text-secondary)] font-medium">
                  {tag}
                </span>
              ))}
            </div>

            <div className="flex items-center gap-1.5 text-sm text-amber-600 dark:text-amber-400 font-medium">
              Öppna demo
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:translate-x-0.5 transition-transform">
                <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
              </svg>
            </div>
          </div>
        </button>

        {/* Coming soon */}
        <div className="rounded-2xl border border-dashed border-[var(--border)] overflow-hidden flex flex-col">
          <div className="h-28 bg-[var(--surface-alt)] flex items-center justify-center">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--text-muted)]">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4m0 4h.01" />
            </svg>
          </div>
          <div className="p-5 flex flex-col gap-2">
            <h2 className="font-semibold text-[var(--text-secondary)]">Fler demos</h2>
            <p className="text-sm text-[var(--text-muted)]">Nya branscher och AI-scenarier är på väg.</p>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {['Klinik', 'Restaurang', 'E-handel'].map(tag => (
                <span key={tag} className="px-2 py-0.5 rounded-full border border-dashed border-[var(--border)] text-xs text-[var(--text-muted)]">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
