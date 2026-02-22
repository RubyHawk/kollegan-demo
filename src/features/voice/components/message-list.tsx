'use client';

import { useEffect, useRef } from 'react';
import type { Message, VoiceBrand, Mode } from '../types';

interface MessageListProps {
  messages: Message[];
  activeTranscript: string;
  mode: Mode;
  isSpeaking: boolean;
  brand: VoiceBrand;
  maxH: string;
}

export function MessageList({
  messages,
  activeTranscript,
  mode,
  isSpeaking,
  brand,
  maxH,
}: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isDark = brand.theme === 'dark';

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeTranscript]);

  if (isDark) {
    return (
      <div className={`flex-1 overflow-y-auto px-3 py-2 space-y-2 min-h-[120px] ${maxH}`}>
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={['flex', msg.role === 'user' ? 'justify-end' : 'justify-start'].join(' ')}
          >
            <div
              className={[
                'max-w-[85%] rounded-2xl px-3 py-2 text-xs leading-relaxed',
                msg.role === 'assistant'
                  ? 'bg-navy-800 text-cream-100 rounded-bl-sm'
                  : 'bg-gold-900 text-gold-400 rounded-br-sm',
              ].join(' ')}
            >
              {msg.role === 'assistant' && (
                <span className="block text-gold-500 font-semibold text-[10px] mb-0.5 uppercase tracking-wide">
                  {brand.name}
                </span>
              )}
              {msg.text}
            </div>
          </div>
        ))}

        {activeTranscript && (
          <div className="flex justify-start">
            <div className="max-w-[85%] rounded-2xl px-3 py-2 text-xs leading-relaxed bg-navy-800 text-cream-400 rounded-bl-sm italic opacity-60">
              <span className="block text-gold-500 font-semibold text-[10px] mb-0.5 uppercase tracking-wide not-italic">
                {brand.name}
              </span>
              {activeTranscript}...
            </div>
          </div>
        )}

        {mode === 'call' && isSpeaking && messages.length === 0 && (
          <div className="flex justify-start">
            <div className="flex gap-1 items-center px-3 py-2.5 bg-navy-800 rounded-2xl rounded-bl-sm">
              <div className="maja-typing-dot" style={{ animationDelay: '0s' }} />
              <div className="maja-typing-dot" style={{ animationDelay: '0.15s' }} />
              <div className="maja-typing-dot" style={{ animationDelay: '0.3s' }} />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>
    );
  }

  /* ── Light theme (Kollegan style) ── */
  return (
    <div className={`flex-1 overflow-y-auto px-3 py-2.5 space-y-2 min-h-[100px] ${maxH}`}>
      {messages.map((msg) => (
        <div
          key={msg.id}
          className={['flex', msg.role === 'user' ? 'justify-end' : 'justify-start'].join(' ')}
        >
          <div
            className={[
              'max-w-[85%] rounded-2xl px-3 py-2 text-xs leading-relaxed',
              msg.role === 'assistant'
                ? 'bg-[var(--surface-alt)] border border-[var(--border)] text-[var(--text-primary)] rounded-bl-sm'
                : 'bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/30 text-[var(--text-primary)] rounded-br-sm',
            ].join(' ')}
          >
            {msg.role === 'assistant' && (
              <span className="block text-amber-600 dark:text-amber-400 font-medium text-[10px] mb-0.5 uppercase tracking-wide">
                {brand.name}
              </span>
            )}
            {msg.text}
          </div>
        </div>
      ))}

      {activeTranscript && (
        <div className="flex justify-start">
          <div className="max-w-[85%] rounded-2xl rounded-bl-sm px-3 py-2 text-xs leading-relaxed bg-[var(--surface-alt)] border border-[var(--border)] text-[var(--text-muted)] italic">
            <span className="block text-amber-600 dark:text-amber-400 font-medium text-[10px] mb-0.5 uppercase tracking-wide not-italic">
              {brand.name}
            </span>
            {activeTranscript}&hellip;
          </div>
        </div>
      )}

      {mode === 'call' && isSpeaking && messages.length === 0 && (
        <div className="flex justify-start">
          <div className="flex gap-1 items-center px-3 py-2.5 bg-[var(--surface-alt)] border border-[var(--border)] rounded-2xl rounded-bl-sm">
            {[0, 0.15, 0.3].map((delay, i) => (
              <div
                key={i}
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: '50%',
                  backgroundColor: 'rgb(245 158 11)',
                  animation: 'maja-typing 1.2s ease-in-out infinite',
                  animationDelay: `${delay}s`,
                }}
              />
            ))}
          </div>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
}
