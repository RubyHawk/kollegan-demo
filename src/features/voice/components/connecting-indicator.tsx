'use client';

import type { VoiceBrand } from '../types';

interface ConnectingIndicatorProps {
  brand: VoiceBrand;
  compact?: boolean;
}

export function ConnectingIndicator({ brand, compact = false }: ConnectingIndicatorProps) {
  const isDark = brand.theme === 'dark';

  if (isDark) {
    return (
      <div
        className={[
          'border-t border-navy-700 flex flex-col items-center gap-2 bg-navy-800/50',
          compact ? 'px-3 py-4' : 'px-5 py-8',
        ].join(' ')}
      >
        <div className="maja-connecting-rings" style={compact ? { width: 40, height: 40 } : undefined}>
          <div className="maja-ring maja-ring-1" />
          <div className="maja-ring maja-ring-2" />
          {!compact && <div className="maja-ring maja-ring-3" />}
          <div className={`${compact ? 'w-3 h-3' : 'w-5 h-5'} rounded-full bg-gold-500`} />
        </div>
        <span className={`${compact ? 'text-[10px]' : 'text-xs'} text-cream-400 ${compact ? '' : 'mt-2'}`}>
          Ansluter{compact ? '...' : ` till ${brand.name}...`}
        </span>
      </div>
    );
  }

  return (
    <div
      className={[
        'flex flex-col items-center gap-2.5 border-t border-[var(--border)] bg-[var(--surface-alt)]',
        compact ? 'px-3 py-3' : 'px-5 py-7',
      ].join(' ')}
    >
      <div className="relative flex items-center justify-center w-10 h-10">
        <div className="absolute inset-0 rounded-full bg-amber-500/10 animate-ping" />
        <div
          className="absolute inset-1.5 rounded-full bg-amber-500/15 animate-ping"
          style={{ animationDelay: '0.4s' }}
        />
        <div className="w-4 h-4 rounded-full bg-amber-500" />
      </div>
      <span className={['text-[var(--text-muted)]', compact ? 'text-[10px]' : 'text-xs'].join(' ')}>
        Ansluter till {brand.name}…
      </span>
    </div>
  );
}
