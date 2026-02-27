'use client';

interface Props {
  onCall: boolean;
}

export default function CallIndicator({ onCall }: Props) {
  return (
    <div className="transition-all duration-500">
      {onCall ? (
        <div className="flex items-center gap-2.5 bg-red-50/80 dark:bg-red-900/20 backdrop-blur-sm border border-red-200 dark:border-red-700/60 shadow-glow-red rounded-full px-4 py-2 call-indicator">
          {/* Animated voice bars */}
          <div className="flex items-end gap-[3px] h-4">
            <div className="w-[3px] bg-red-500 rounded-full vb vb-1" style={{ height: '100%' }} />
            <div className="w-[3px] bg-red-500 rounded-full vb vb-2" style={{ height: '100%' }} />
            <div className="w-[3px] bg-red-500 rounded-full vb vb-3" style={{ height: '100%' }} />
            <div className="w-[3px] bg-red-500 rounded-full vb vb-4" style={{ height: '100%' }} />
          </div>
          <span className="text-red-600 dark:text-red-400 text-xs font-semibold tracking-wide">
            Pågående samtal
          </span>
        </div>
      ) : (
        <div className="flex items-center gap-1.5 bg-white/50 dark:bg-white/5 backdrop-blur-sm border border-white/40 dark:border-white/10 rounded-full px-3 py-1.5 text-xs text-[var(--text-muted)]">
          <div className="w-1.5 h-1.5 rounded-full bg-[var(--text-muted)] opacity-40" />
          <span>Väntar på samtal</span>
        </div>
      )}
    </div>
  );
}
