'use client';

import type { VoiceBrand } from '../types';

interface VoiceStripProps {
  volumeLevel: number;
  callActive: boolean;
  isSpeaking: boolean;
  brand: VoiceBrand;
  compact?: boolean;
}

export function VoiceStrip({ volumeLevel, callActive, isSpeaking, brand, compact = false }: VoiceStripProps) {
  const isDark = brand.theme === 'dark';

  const volumeBars = Array.from({ length: 5 }, (_, i) => {
    const threshold = i * 0.15;
    const active = volumeLevel > threshold && callActive;

    if (isDark) {
      return (
        <div
          key={i}
          className="maja-voice-bar"
          style={{
            height: active ? `${12 + volumeLevel * 20}px` : '4px',
            opacity: active ? 0.6 + volumeLevel * 0.4 : 0.2,
            animationDelay: `${i * 0.1}s`,
          }}
        />
      );
    }

    return (
      <div
        key={i}
        style={{
          width: '3px',
          borderRadius: '9999px',
          backgroundColor: active ? 'rgb(245 158 11)' : 'var(--border)',
          height: active ? `${6 + volumeLevel * 14}px` : '4px',
          transition: 'height 0.12s ease-out, background-color 0.12s ease-out',
        }}
      />
    );
  });

  if (isDark) {
    return (
      <div
        className={[
          'border-t border-navy-700 flex items-center bg-navy-800/50',
          compact
            ? 'px-3 py-2 justify-center gap-2'
            : 'px-5 py-4 justify-center gap-3',
        ].join(' ')}
      >
        <div className={`flex items-end gap-1 ${compact ? 'h-6' : 'h-8'}`}>{volumeBars}</div>
        {!compact && (
          <div className="flex items-center gap-2">
            <div className={['w-2 h-2 rounded-full', isSpeaking ? 'bg-gold-400 maja-speak-dot' : 'bg-cream-600'].join(' ')} />
          </div>
        )}
        <span className={`${compact ? 'text-[10px]' : 'text-xs'} text-cream-400`}>
          {isSpeaking ? `${brand.name} talar` : 'Din tur'}
          {!compact && !isSpeaking && ' att prata'}
        </span>
      </div>
    );
  }

  return (
    <div
      className={[
        'border-t border-[var(--border)] bg-[var(--surface-alt)] flex items-center justify-between',
        compact ? 'px-3 py-1.5' : 'px-5 py-3',
      ].join(' ')}
    >
      <div className="flex items-end gap-0.5 h-5">{volumeBars}</div>
      <span className="text-[10px] text-[var(--text-muted)]">
        {isSpeaking ? `${brand.name} talar` : 'Din tur'}
      </span>
    </div>
  );
}

/**
 * Inline volume bars for the draggable collapsed header strip.
 * Always uses the light/Kollegan style since draggable is only in Kollegan.
 */
export function InlineVolumeBars({ volumeLevel, callActive }: { volumeLevel: number; callActive: boolean }) {
  return (
    <>
      {Array.from({ length: 5 }, (_, i) => {
        const threshold = i * 0.15;
        const active = volumeLevel > threshold && callActive;
        return (
          <div
            key={i}
            style={{
              width: '3px',
              borderRadius: '9999px',
              backgroundColor: active ? 'rgb(245 158 11)' : 'var(--border)',
              height: active ? `${6 + volumeLevel * 14}px` : '4px',
              transition: 'height 0.12s ease-out, background-color 0.12s ease-out',
            }}
          />
        );
      })}
    </>
  );
}
