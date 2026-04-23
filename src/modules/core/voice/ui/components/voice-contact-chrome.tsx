'use client';

import type { VoiceBrand } from '../../domain/voice-brand.vo';

export const PHONE_PATH =
  'M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z';

export const HANGUP_PATH =
  'M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91';

export const CHAT_PATH = 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z';

export const PERSON_SVG = (
  <>
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </>
);

export function formatVoiceDuration(secs: number) {
  const m = Math.floor(secs / 60).toString().padStart(2, '0');
  const s = (secs % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export function VoiceAvatarBadge({
  brand,
  isDark,
  isSpeaking,
  size = 'md',
}: {
  brand: VoiceBrand;
  isDark: boolean;
  isSpeaking: boolean;
  size?: 'sm' | 'md' | 'lg';
}) {
  if (isDark) {
    const sizeMap = {
      sm: 'w-8 h-8',
      md: 'w-11 h-11',
      lg: 'w-20 h-20',
    };
    const iconSize = size === 'sm' ? 14 : size === 'lg' ? 36 : 20;

    return (
      <div
        className={[
          sizeMap[size],
          'rounded-full bg-gradient-to-br from-gold-500 to-gold-600 flex items-center justify-center transition-all duration-300',
          isSpeaking ? 'maja-speaking-glow' : '',
        ].join(' ')}
      >
        <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke="#0B1121" strokeWidth={size === 'lg' ? '1.5' : '2'} strokeLinecap="round" strokeLinejoin="round">
          {PERSON_SVG}
        </svg>
      </div>
    );
  }

  const cls =
    size === 'sm'
      ? 'w-7 h-7 rounded-lg text-xs'
      : size === 'lg'
        ? 'w-12 h-12 rounded-xl text-base'
        : 'w-9 h-9 rounded-lg text-sm';

  return (
    <div
      className={[
        cls,
        'bg-amber-500 flex items-center justify-center font-heading font-semibold text-white shrink-0 transition-all duration-300',
        isSpeaking ? 'ring-2 ring-amber-400 ring-offset-1 ring-offset-[var(--surface)]' : '',
      ].join(' ')}
    >
      {brand.name.charAt(0).toUpperCase()}
    </div>
  );
}

export function VoiceStatusDot({
  callStatus,
  isDark,
  size = 'md',
}: {
  callStatus: string;
  isDark: boolean;
  size?: 'sm' | 'md';
}) {
  const sizeClass = size === 'sm' ? 'w-2.5 h-2.5' : 'w-3 h-3';
  const borderColor = isDark ? 'border-navy-800' : 'border-[var(--surface)]';
  const borderWidth = size === 'sm' ? 'border-[1.5px]' : 'border-2';

  return (
    <div
      className={[
        'absolute -bottom-0.5 -right-0.5 rounded-full',
        sizeClass,
        borderWidth,
        borderColor,
        callStatus === 'active' ? 'bg-emerald-500' : isDark ? 'bg-gold-500' : 'bg-amber-400',
      ].join(' ')}
    />
  );
}

export function VoiceHangupButton({
  compact = false,
  isDark,
  onEndCall,
}: {
  compact?: boolean;
  isDark: boolean;
  onEndCall: () => void;
}) {
  if (isDark) {
    return (
      <button
        onClick={onEndCall}
        className={[
          'flex items-center gap-1.5 bg-burgundy-800 hover:bg-burgundy-400 text-cream-100 rounded-full transition-colors maja-hangup-btn',
          compact ? 'px-4 py-1.5 text-xs' : 'px-6 py-2.5',
        ].join(' ')}
      >
        <svg width={compact ? 14 : 18} height={compact ? 14 : 18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d={HANGUP_PATH} />
          <line x1="1" y1="1" x2="23" y2="23" />
        </svg>
        {compact ? 'Avsluta' : <span className="text-sm font-medium">Avsluta samtal</span>}
      </button>
    );
  }

  return (
    <button
      onClick={onEndCall}
      className={[
        'flex items-center bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800/50 rounded-full font-medium transition-all',
        compact ? 'gap-1.5 px-4 py-1.5 text-xs' : 'gap-2 px-6 py-2 text-xs',
      ].join(' ')}
    >
      <svg width={compact ? 13 : 15} height={compact ? 13 : 15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={compact ? '2' : '1.8'} strokeLinecap="round" strokeLinejoin="round">
        <path d={HANGUP_PATH} />
        <line x1="1" y1="1" x2="23" y2="23" />
      </svg>
      {compact ? 'Avsluta' : 'Avsluta samtal'}
    </button>
  );
}

export function VoiceChatFooterNav({
  compact = false,
  isDark,
  onBack,
  onStartCall,
}: {
  compact?: boolean;
  isDark: boolean;
  onBack: () => void;
  onStartCall: () => void;
}) {
  if (isDark) {
    return (
      <div className={`border-t border-navy-700 ${compact ? 'px-3' : 'px-4'} py-2 shrink-0 flex items-center gap-2`}>
        <button
          onClick={onBack}
          className="text-cream-600 hover:text-cream-100 text-xs flex items-center gap-1 transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          Tillbaka
        </button>
        <button
          onClick={onStartCall}
          className="ml-auto text-emerald-400 hover:text-emerald-500 text-xs flex items-center gap-1 transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d={PHONE_PATH} />
          </svg>
          Ring istället
        </button>
      </div>
    );
  }

  return (
    <div className={`border-t border-[var(--border)] ${compact ? 'px-3' : 'px-4'} py-2 shrink-0 flex items-center gap-2`}>
      <button
        onClick={onBack}
        className="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-xs flex items-center gap-1 transition-colors"
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="19" y1="12" x2="5" y2="12" />
          <polyline points="12 19 5 12 12 5" />
        </svg>
        Tillbaka
      </button>
      <button
        onClick={onStartCall}
        className="ml-auto text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 text-xs flex items-center gap-1 transition-colors"
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d={PHONE_PATH} />
        </svg>
        Ring istället
      </button>
    </div>
  );
}

export function VoiceCallEndedFooter({
  compact = false,
  isDark,
  onCallAgain,
  onClose,
}: {
  compact?: boolean;
  isDark: boolean;
  onCallAgain: () => void;
  onClose: () => void;
}) {
  if (isDark) {
    return (
      <div className={`border-t border-navy-700 ${compact ? 'px-3 py-2' : 'px-5 py-4'} shrink-0 text-center`}>
        <p className={`text-cream-400 ${compact ? 'text-[10px]' : 'text-xs'}`}>
          Samtalet {compact ? 'avslutat' : 'har avslutats'}
        </p>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="border-t border-[var(--border)] px-3 py-2 shrink-0 text-center">
        <p className="text-[10px] text-[var(--text-muted)]">Samtalet avslutat</p>
      </div>
    );
  }

  return (
    <div className="border-t border-[var(--border)] px-5 py-4 shrink-0 space-y-2">
      <p className="text-xs text-[var(--text-muted)] text-center">Samtalet har avslutats</p>
      <button
        onClick={onCallAgain}
        className="w-full flex items-center justify-center gap-2 text-xs font-semibold text-white bg-purple-700 hover:bg-purple-800 dark:bg-amber-500 dark:hover:bg-amber-600 rounded-xl py-2.5 transition-all active:scale-95"
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d={PHONE_PATH} />
        </svg>
        Ring igen
      </button>
      <button
        onClick={onClose}
        className="w-full text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] py-1 transition-colors"
      >
        Stäng
      </button>
    </div>
  );
}
