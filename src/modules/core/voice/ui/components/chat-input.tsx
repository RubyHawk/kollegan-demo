'use client';

import type { VoiceBrand } from '../../domain/voice-brand.vo';

interface ChatInputProps {
  chatInput: string;
  setChatInput: (value: string) => void;
  sendChat: () => void;
  brand: VoiceBrand;
  compact?: boolean;
}

export function ChatInput({ chatInput, setChatInput, sendChat, brand, compact = false }: ChatInputProps) {
  const isDark = brand.theme === 'dark';

  if (isDark) {
    return (
      <div className={`border-t border-navy-700 ${compact ? 'px-3 py-2' : 'px-4 py-3'} shrink-0`}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendChat();
          }}
          className={`flex ${compact ? 'gap-1.5' : 'gap-2'}`}
        >
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder={compact ? 'Skriv...' : 'Skriv ett meddelande...'}
            className={`flex-1 bg-navy-800 border border-navy-700 rounded-lg ${compact ? 'px-2.5 py-1.5 text-[11px]' : 'px-3 py-2 text-xs'} text-cream-100 placeholder-cream-600 focus:outline-none focus:border-gold-600 transition-colors`}
          />
          <button
            type="submit"
            disabled={!chatInput.trim()}
            className={`bg-gold-500 hover:bg-gold-400 disabled:bg-navy-700 disabled:text-cream-600 text-navy-950 rounded-lg ${compact ? 'px-2 py-1.5' : 'px-3 py-2'} transition-colors`}
            aria-label="Skicka"
          >
            <svg width={compact ? 12 : 16} height={compact ? 12 : 16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </form>
      </div>
    );
  }

  /* ── Light theme (Kollegan style) ── */
  return (
    <div className={`border-t border-[var(--border)] ${compact ? 'px-3 py-2' : 'px-4 py-3'} shrink-0`}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          sendChat();
        }}
        className={`flex ${compact ? 'gap-1.5' : 'gap-2'}`}
      >
        <input
          type="text"
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          placeholder={compact ? 'Skriv...' : 'Skriv ett meddelande...'}
          className={`flex-1 bg-[var(--surface-alt)] border border-[var(--border)] rounded-lg ${compact ? 'px-2.5 py-1.5 text-[11px]' : 'px-3 py-2 text-xs'} text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-amber-400 transition-colors`}
        />
        <button
          type="submit"
          disabled={!chatInput.trim()}
          className={`bg-amber-500 hover:bg-amber-600 disabled:bg-[var(--surface-alt)] disabled:text-[var(--text-muted)] text-white rounded-lg ${compact ? 'px-2 py-1.5' : 'px-3 py-2'} transition-colors`}
          aria-label="Skicka"
        >
          <svg width={compact ? 11 : 14} height={compact ? 11 : 14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </form>
    </div>
  );
}
