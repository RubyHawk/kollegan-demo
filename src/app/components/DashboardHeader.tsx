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
      <div className="px-6 py-3.5">
        <div className="flex items-center justify-between gap-4">
          {/* Left: hamburger + logo */}
          <div className="flex items-center gap-3">
            <button
              onClick={onToggleMobileMenu}
              className="lg:hidden p-1.5 rounded-lg hover:bg-white/40 dark:hover:bg-white/8 transition-colors"
              aria-label="Meny"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                {mobileMenuOpen ? (
                  <>
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </>
                ) : (
                  <>
                    <line x1="3" y1="12" x2="21" y2="12" />
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <line x1="3" y1="18" x2="21" y2="18" />
                  </>
                )}
              </svg>
            </button>

            {/* Logo */}
            <div className="relative">
              <div className="absolute inset-0 rounded-lg bg-amber-400/30 blur-md" />
              <div className="relative w-9 h-9 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shrink-0 shadow-glow-amber">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 21h18" />
                  <path d="M5 21V7l7-4 7 4v14" />
                  <path d="M9 21v-4h6v4" />
                  <path d="M9 9h1" />
                  <path d="M14 9h1" />
                  <path d="M9 13h1" />
                  <path d="M14 13h1" />
                </svg>
              </div>
            </div>

            <div className="hidden sm:block">
              <h1 className="font-heading text-[17px] font-semibold tracking-wide text-[var(--text-primary)] leading-tight">
                Grand Hotel Kollegan
              </h1>
              <p className="text-[var(--text-muted)] text-[11px] mt-0.5">
                Storgatan 1, Stockholm
              </p>
            </div>
          </div>

          {/* Center: glass stat pills */}
          {hasData && (
            <div className="hidden md:flex items-center gap-2 text-xs">
              <div className="flex items-center gap-1.5 bg-emerald-50/60 dark:bg-emerald-900/20 border border-emerald-200/50 dark:border-emerald-800/30 rounded-full px-3 py-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                  <AnimatedNumber value={availableCount} />
                </span>
                <span className="text-emerald-600/70 dark:text-emerald-500/70">lediga</span>
              </div>

              <div className="flex items-center gap-1.5 bg-amber-50/60 dark:bg-amber-900/20 border border-amber-200/50 dark:border-amber-800/30 rounded-full px-3 py-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                <span className="font-semibold text-amber-700 dark:text-amber-400">
                  <AnimatedNumber value={lockedCount} />
                </span>
                <span className="text-amber-600/70 dark:text-amber-500/70">res.</span>
              </div>

              <div className="flex items-center gap-1.5 bg-indigo-50/60 dark:bg-indigo-900/20 border border-indigo-200/50 dark:border-indigo-800/30 rounded-full px-3 py-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                <span className="font-semibold text-indigo-700 dark:text-indigo-400">
                  <AnimatedNumber value={bookedCount} />
                </span>
                <span className="text-indigo-600/70 dark:text-indigo-500/70">bokade</span>
              </div>

              {/* Occupancy bar pill */}
              <div className="flex items-center gap-2 bg-white/50 dark:bg-white/5 border border-white/40 dark:border-white/10 rounded-full px-3 py-1.5">
                <div className="w-16 h-2 bg-white/50 dark:bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-600 bar-grow"
                    style={{ width: `${occupancy}%` }}
                  />
                </div>
                <span className="font-semibold text-[var(--text-primary)]">
                  <AnimatedNumber value={occupancy} />%
                </span>
              </div>
            </div>
          )}

          {/* Right: call indicator + status + controls */}
          <div className="flex items-center gap-2">
            <CallIndicator onCall={onCall} />

            <div className="hidden sm:flex items-center gap-1.5 bg-white/40 dark:bg-white/5 border border-white/35 dark:border-white/8 rounded-full px-2.5 py-1 text-xs text-[var(--text-muted)]">
              <div
                className={[
                  'w-1.5 h-1.5 rounded-full transition-colors',
                  connected ? 'bg-emerald-500' : 'bg-red-400',
                ].join(' ')}
              />
              <span>{connected ? 'Live' : 'Offline'}</span>
            </div>

            <div className="hidden sm:block w-px h-4 bg-white/30 dark:bg-white/10" />

            <button
              onClick={onReset}
              className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-white/40 dark:bg-white/5 border border-white/35 dark:border-white/10 rounded-lg px-2.5 py-1.5 transition-all hover:bg-white/60 dark:hover:bg-white/10 active:scale-95"
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="1 4 1 10 7 10" />
                <path d="M3.51 15a9 9 0 1 0 .49-3.15" />
              </svg>
              <span className="hidden sm:inline">Återställ</span>
            </button>

            <ThemeToggle />
          </div>
        </div>
      </div>

      {/* Amber gradient accent line */}
      <div className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-amber-400/50 to-transparent" />
    </header>
  );
}
