'use client';

import CallIndicator from './CallIndicator';
import AnimatedNumber from './AnimatedNumber';

interface Props {
  onCall: boolean;
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
      <div className="px-5 h-11 flex items-center justify-between gap-4 py-2">

        {/* ── Left: hamburger + logo + name ── */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onToggleMobileMenu}
            className="lg:hidden p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/8 transition-colors text-[var(--text-secondary)]"
            aria-label="Meny"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {mobileMenuOpen
                ? <><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>
                : <><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" /></>
              }
            </svg>
          </button>

          <div className="relative shrink-0">
            <div className="absolute inset-0 rounded-lg bg-amber-400/20 blur-sm" />
            <div className="relative w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-sm">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 21h18" /><path d="M5 21V7l7-4 7 4v14" /><path d="M9 21v-4h6v4" />
                <path d="M9 9h1" /><path d="M14 9h1" /><path d="M9 13h1" /><path d="M14 13h1" />
              </svg>
            </div>
          </div>

          <div className="hidden sm:flex flex-col justify-center">
            <span className="font-heading text-[14px] font-semibold tracking-wide text-[var(--text-primary)] leading-tight">
              Grand Hotel Kollegan
            </span>
            <span className="text-[10.5px] text-[var(--text-muted)] leading-tight">Storgatan 1 · Stockholm</span>
          </div>
        </div>

        {/* ── Center: stat chips ── */}
        {hasData && (
          <div className="hidden md:flex items-center gap-2">
            <StatChip value={availableCount} label="lediga" dot="bg-emerald-500" />
            <StatChip value={lockedCount}    label="res."   dot="bg-amber-400" />
            <StatChip value={bookedCount}    label="bokade" dot="bg-indigo-400" />
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--surface-alt)] border border-[var(--border-light)]">
              <div className="w-10 h-1 bg-[var(--border)] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-amber-500 transition-all duration-700"
                  style={{ width: `${occupancy}%` }}
                />
              </div>
              <span className="text-[11px] font-semibold text-[var(--text-primary)] tabular-nums">
                <AnimatedNumber value={occupancy} />%
              </span>
            </div>
          </div>
        )}

        {/* ── Right: call indicator ── */}
        <div className="shrink-0">
          <CallIndicator onCall={onCall} />
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-400/30 to-transparent" />
    </header>
  );
}

function StatChip({
  value, label, dot,
}: {
  value: number;
  label: string;
  dot: string;
}) {
  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--surface-alt)] border border-[var(--border-light)]">
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dot}`} />
      <span className="text-[11px] font-semibold text-[var(--text-primary)] tabular-nums">
        <AnimatedNumber value={value} />
      </span>
      <span className="text-[11px] text-[var(--text-muted)]">{label}</span>
    </div>
  );
}
