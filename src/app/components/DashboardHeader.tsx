'use client';

import CallIndicator from './CallIndicator';
import ThemeToggle from './ThemeToggle';
import AnimatedNumber from './AnimatedNumber';

interface Props {
  onCall: boolean;
  connected: boolean;
  onReset: () => void;
  onToggleMobileMenu: () => void;
  mobileMenuOpen: boolean;
  availableCount: number;
  bookedCount: number;
  lockedCount: number;
  occupancy: number;
  hasData: boolean;
}

function StatBlock({
  value,
  label,
  color,
}: {
  value: number;
  label: string;
  color: 'emerald' | 'amber' | 'indigo';
}) {
  const dot = { emerald: 'bg-emerald-500', amber: 'bg-amber-500', indigo: 'bg-indigo-500' }[color];
  const num = {
    emerald: 'text-emerald-700 dark:text-emerald-400',
    amber: 'text-amber-700 dark:text-amber-400',
    indigo: 'text-indigo-700 dark:text-indigo-400',
  }[color];

  return (
    <div className="flex flex-col items-center px-4 py-2 gap-0.5 min-w-[4.5rem]">
      <div className="flex items-baseline gap-1.5">
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 translate-y-[-1px] ${dot}`} />
        <span className={`text-base font-bold tabular-nums leading-none ${num}`}>
          <AnimatedNumber value={value} />
        </span>
      </div>
      <span className="text-[10px] text-[var(--text-muted)] leading-none tracking-wide">{label}</span>
    </div>
  );
}

export default function DashboardHeader({
  onCall,
  connected,
  onReset,
  onToggleMobileMenu,
  mobileMenuOpen,
  availableCount,
  bookedCount,
  lockedCount,
  occupancy,
  hasData,
}: Props) {
  return (
    <header className="glass-header border-b border-white/40 dark:border-white/8 sticky top-0 z-30">
      <div className="px-5 h-14 flex items-center justify-between gap-4">

        {/* ── Left: hamburger + logo + name ── */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onToggleMobileMenu}
            className="lg:hidden p-1.5 rounded-lg hover:bg-white/40 dark:hover:bg-white/8 transition-colors text-[var(--text-secondary)]"
            aria-label="Meny"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {mobileMenuOpen ? (
                <><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>
              ) : (
                <><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" /></>
              )}
            </svg>
          </button>

          <div className="relative shrink-0">
            <div className="absolute inset-0 rounded-lg bg-amber-400/25 blur-sm" />
            <div className="relative w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-sm">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 21h18" /><path d="M5 21V7l7-4 7 4v14" /><path d="M9 21v-4h6v4" />
                <path d="M9 9h1" /><path d="M14 9h1" /><path d="M9 13h1" /><path d="M14 13h1" />
              </svg>
            </div>
          </div>

          <div className="hidden sm:flex flex-col">
            <span className="font-heading text-[14px] font-semibold tracking-wide text-[var(--text-primary)] leading-tight">
              Grand Hotel Kollegan
            </span>
            <span className="text-[10.5px] text-[var(--text-muted)] leading-tight">Storgatan 1 · Stockholm</span>
          </div>
        </div>

        {/* ── Center: stats strip ── */}
        {hasData && (
          <div className="hidden md:flex items-stretch bg-white/25 dark:bg-white/5 border border-white/40 dark:border-white/10 rounded-xl overflow-hidden divide-x divide-white/30 dark:divide-white/10">
            <StatBlock value={availableCount} label="Lediga" color="emerald" />
            <StatBlock value={lockedCount} label="Reserverade" color="amber" />
            <StatBlock value={bookedCount} label="Bokade" color="indigo" />

            {/* Occupancy */}
            <div className="flex flex-col items-center justify-center px-4 py-2 gap-1.5 min-w-[6rem]">
              <div className="flex items-center gap-2 w-full">
                <div className="flex-1 h-1.5 bg-white/40 dark:bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-600 transition-all duration-700"
                    style={{ width: `${occupancy}%` }}
                  />
                </div>
                <span className="text-xs font-bold text-[var(--text-primary)] tabular-nums shrink-0">
                  <AnimatedNumber value={occupancy} />%
                </span>
              </div>
              <span className="text-[10px] text-[var(--text-muted)] leading-none tracking-wide self-start">Beläggning</span>
            </div>
          </div>
        )}

        {/* ── Right: controls ── */}
        <div className="flex items-center gap-2 shrink-0">
          <CallIndicator onCall={onCall} />

          <div className="hidden sm:flex items-center gap-1.5 bg-white/35 dark:bg-white/5 border border-white/35 dark:border-white/8 rounded-full px-2.5 py-1 text-[11px] text-[var(--text-muted)]">
            <div className={['w-1.5 h-1.5 rounded-full transition-colors duration-300', connected ? 'bg-emerald-500' : 'bg-red-400'].join(' ')} />
            <span className="font-medium">{connected ? 'Live' : 'Offline'}</span>
          </div>

          <div className="hidden sm:block w-px h-4 bg-black/10 dark:bg-white/10" />

          <button
            onClick={onReset}
            title="Återställ data"
            className="flex items-center gap-1.5 text-[11px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-white/35 dark:bg-white/5 border border-white/35 dark:border-white/10 rounded-lg px-2.5 py-1.5 transition-all hover:bg-white/55 dark:hover:bg-white/10 active:scale-95"
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="1 4 1 10 7 10" />
              <path d="M3.51 15a9 9 0 1 0 .49-3.15" />
            </svg>
            <span className="hidden sm:inline">Återställ</span>
          </button>

          <ThemeToggle />
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-400/35 to-transparent" />
    </header>
  );
}
