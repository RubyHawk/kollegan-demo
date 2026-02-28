'use client';

import { useState, useEffect, useRef } from 'react';
import type { VoiceBrand } from '../../domain/voice-brand.vo';
import { useVapi } from '../hooks/use-vapi';
import { VoiceStrip, InlineVolumeBars } from './voice-strip';
import { ConnectingIndicator } from './connecting-indicator';
import { MessageList } from './message-list';
import { ChatInput } from './chat-input';

/* ────────────────────────────────────────────────────────────
   Shared SVG icon paths (kept as constants to avoid repetition)
   ──────────────────────────────────────────────────────────── */

const PHONE_PATH =
  'M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z';

const HANGUP_PATH =
  'M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91';

const CHAT_PATH = 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z';

const PERSON_SVG = (
  <>
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </>
);

/* ────────────────────────────────────────────────────────────
   Public component interface
   ──────────────────────────────────────────────────────────── */

export interface VoiceContactProps {
  variant?: 'floating' | 'sidebar' | 'draggable';
  brand: VoiceBrand;
}

export default function VoiceContact({ variant = 'floating', brand }: VoiceContactProps) {
  const {
    mode,
    setMode,
    callStatus,
    messages,
    setMessages,
    activeTranscript,
    volumeLevel,
    isSpeaking,
    callDuration,
    chatInput,
    setChatInput,
    startCall,
    endCall,
    sendChat,
  } = useVapi(brand);

  const isDark = brand.theme === 'dark';

  /* ── Floating panel open/close state ── */
  const [open, setOpen] = useState(false);

  /* ── Draggable-variant state ── */
  const [draggablePos, setDraggablePos] = useState({ x: 0, y: 0 });
  const [draggableCollapsed, setDraggableCollapsed] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ mx: 0, my: 0, px: 0, py: 0 });

  /* ── Initialise draggable position (client-side only) ── */
  useEffect(() => {
    if (variant !== 'draggable') return;
    setDraggablePos({
      x: Math.max(0, window.innerWidth - 448),
      y: 80,
    });
  }, [variant]);

  /* ── Drag mouse listeners ── */
  useEffect(() => {
    if (variant !== 'draggable') return;
    const PANEL_W = 400;
    const HEADER_H = 60;
    const onMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const rawX = dragStartRef.current.px + (e.clientX - dragStartRef.current.mx);
      const rawY = dragStartRef.current.py + (e.clientY - dragStartRef.current.my);
      setDraggablePos({
        x: Math.max(0, Math.min(window.innerWidth - PANEL_W, rawX)),
        y: Math.max(0, Math.min(window.innerHeight - HEADER_H, rawY)),
      });
    };
    const onUp = () => {
      isDraggingRef.current = false;
      setIsDragging(false);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
  }, [variant]);

  const handleDragStart = (e: { preventDefault(): void; clientX: number; clientY: number }) => {
    e.preventDefault();
    isDraggingRef.current = true;
    setIsDragging(true);
    dragStartRef.current = {
      mx: e.clientX,
      my: e.clientY,
      px: draggablePos.x,
      py: draggablePos.y,
    };
  };

  /* ── Call duration formatter ── */
  const fmtDur = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  /* ── Status text ── */
  const statusText =
    callStatus === 'connecting'
      ? 'Ansluter...'
      : callStatus === 'active'
        ? isSpeaking
          ? 'Talar...'
          : 'Lyssnar...'
        : callStatus === 'ended'
          ? 'Samtalet avslutat'
          : mode === 'chat'
            ? 'Chatt'
            : isDark
              ? `Receptionist — Grand Hotel Kollegan`
              : 'Receptionist';

  /* ── Helper: open chat mode ── */
  const openChat = (long = false) => {
    setMode('chat');
    setMessages([
      {
        id: crypto.randomUUID(),
        role: 'assistant',
        text: long ? brand.chatWelcomeMessageLong : brand.chatWelcomeMessage,
        timestamp: new Date(),
      },
    ]);
  };

  /* ── Helper: close / reset ── */
  const resetToIdle = () => {
    setMode('idle');
    setMessages([]);
  };

  /* ──────────────────────────────────────────
     Shared branded avatar badge
  ────────────────────────────────────────── */
  const AvatarBadge = ({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) => {
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

    /* Light theme: letter badge */
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
  };

  /* ── Status indicator dot ── */
  const StatusDot = ({ size = 'md' }: { size?: 'sm' | 'md' }) => {
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
  };

  /* ── Hangup button (shared across variants) ── */
  const HangupButton = ({ compact = false }: { compact?: boolean }) => {
    if (isDark) {
      return (
        <button
          onClick={endCall}
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
        onClick={endCall}
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
  };

  /* ── Chat footer nav (back + "Ring istallet") ── */
  const ChatFooterNav = ({ compact = false }: { compact?: boolean }) => {
    if (isDark) {
      return (
        <div className={`border-t border-navy-700 ${compact ? 'px-3' : 'px-4'} py-2 shrink-0 flex items-center gap-2`}>
          <button
            onClick={resetToIdle}
            className="text-cream-600 hover:text-cream-100 text-xs flex items-center gap-1 transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            Tillbaka
          </button>
          <button
            onClick={startCall}
            className="ml-auto text-emerald-400 hover:text-emerald-500 text-xs flex items-center gap-1 transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d={PHONE_PATH} />
            </svg>
            Ring ist&auml;llet
          </button>
        </div>
      );
    }

    return (
      <div className={`border-t border-[var(--border)] ${compact ? 'px-3' : 'px-4'} py-2 shrink-0 flex items-center gap-2`}>
        <button
          onClick={resetToIdle}
          className="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-xs flex items-center gap-1 transition-colors"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          Tillbaka
        </button>
        <button
          onClick={startCall}
          className="ml-auto text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 text-xs flex items-center gap-1 transition-colors"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d={PHONE_PATH} />
          </svg>
          Ring ist&auml;llet
        </button>
      </div>
    );
  };

  /* ── Call-ended footer ── */
  const CallEndedFooter = ({ compact = false }: { compact?: boolean }) => {
    if (isDark) {
      return (
        <div className={`border-t border-navy-700 ${compact ? 'px-3 py-2' : 'px-5 py-4'} shrink-0 text-center`}>
          <p className={`text-cream-400 ${compact ? 'text-[10px]' : 'text-xs'}`}>
            Samtalet {compact ? 'avslutat' : 'har avslutats'}
          </p>
        </div>
      );
    }

    return (
      <div className={`border-t border-[var(--border)] ${compact ? 'px-3 py-2' : 'px-5 py-3'} shrink-0 text-center`}>
        <p className={`text-[var(--text-muted)] ${compact ? 'text-[10px]' : 'text-xs'}`}>
          Samtalet {compact ? 'avslutat' : 'har avslutats'}
        </p>
      </div>
    );
  };

  /* ═══════════════════════════════════════════
     SIDEBAR VARIANT
  ═══════════════════════════════════════════ */
  if (variant === 'sidebar') {
    if (isDark) {
      return (
        <div className="bg-navy-900 rounded-xl overflow-hidden border border-navy-700">
          {/* Compact header */}
          <div className="bg-gradient-to-r from-navy-800 to-navy-900 px-3 py-2.5 flex items-center gap-2">
            <div className="relative">
              <AvatarBadge size="sm" />
              <StatusDot size="sm" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-cream-100 font-heading font-semibold text-xs">{brand.name}</h3>
              <p className="text-cream-400 text-[10px] truncate">
                {callStatus === 'connecting' && 'Ansluter...'}
                {callStatus === 'active' && (isSpeaking ? 'Talar...' : 'Lyssnar...')}
                {callStatus === 'ended' && 'Avslutat'}
                {callStatus === 'idle' && mode === 'chat' && 'Chatt'}
                {callStatus === 'idle' && mode === 'idle' && 'Receptionist'}
              </p>
            </div>
            {(mode === 'call' || mode === 'chat') && (
              <button
                onClick={() => {
                  if (callStatus === 'active') endCall();
                  resetToIdle();
                }}
                className="text-cream-600 hover:text-cream-100 transition-colors p-0.5"
                aria-label="Stäng"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}
          </div>

          {/* Voice visualization */}
          {mode === 'call' && callStatus === 'active' && (
            <VoiceStrip volumeLevel={volumeLevel} callActive isSpeaking={isSpeaking} brand={brand} compact />
          )}

          {/* Connecting */}
          {mode === 'call' && callStatus === 'connecting' && (
            <ConnectingIndicator brand={brand} compact />
          )}

          {/* Idle: action buttons */}
          {mode === 'idle' && (
            <div className="px-3 py-3 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={startCall}
                  className="group flex items-center justify-center gap-1.5 bg-navy-800 hover:bg-navy-700 border border-navy-700 hover:border-gold-600 rounded-lg px-2 py-2 transition-all"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6EE7A0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d={PHONE_PATH} />
                  </svg>
                  <span className="text-[11px] font-medium text-cream-100 group-hover:text-gold-400">Ring</span>
                </button>
                <button
                  onClick={() => openChat(false)}
                  className="group flex items-center justify-center gap-1.5 bg-navy-800 hover:bg-navy-700 border border-navy-700 hover:border-gold-600 rounded-lg px-2 py-2 transition-all"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#60A5FA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d={CHAT_PATH} />
                  </svg>
                  <span className="text-[11px] font-medium text-cream-100 group-hover:text-gold-400">Chatta</span>
                </button>
              </div>
            </div>
          )}

          {/* Messages */}
          {(mode === 'call' || mode === 'chat') && (
            <MessageList messages={messages} activeTranscript={activeTranscript} mode={mode} isSpeaking={isSpeaking} brand={brand} maxH="max-h-[220px]" />
          )}

          {/* Chat input */}
          {mode === 'chat' && (
            <ChatInput chatInput={chatInput} setChatInput={setChatInput} sendChat={sendChat} brand={brand} compact />
          )}

          {/* Call end button */}
          {mode === 'call' && callStatus === 'active' && (
            <div className="border-t border-navy-700 px-3 py-2 flex justify-center">
              <HangupButton compact />
            </div>
          )}

          {/* Call ended */}
          {mode === 'call' && callStatus === 'ended' && <CallEndedFooter compact />}
        </div>
      );
    }

    /* ── Light sidebar (Kollegan) ── */
    return (
      <div className="rounded-xl border border-[var(--border)] overflow-hidden bg-[var(--surface)]">
        {/* Header */}
        <div className="px-3 py-2.5 flex items-center gap-2.5 bg-[var(--surface)]">
          <div className="relative">
            <AvatarBadge size="sm" />
            <StatusDot size="sm" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-heading text-xs font-semibold text-[var(--text-primary)] leading-none">{brand.name}</h3>
            <p className="text-[var(--text-muted)] text-[10px] mt-0.5 truncate">{statusText}</p>
          </div>
          {(mode === 'call' || mode === 'chat') && (
            <button
              onClick={() => {
                if (callStatus === 'active') endCall();
                resetToIdle();
              }}
              className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors p-0.5"
              aria-label="Stäng"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>

        {mode === 'call' && callStatus === 'active' && (
          <VoiceStrip volumeLevel={volumeLevel} callActive isSpeaking={isSpeaking} brand={brand} compact />
        )}
        {mode === 'call' && callStatus === 'connecting' && (
          <ConnectingIndicator brand={brand} compact />
        )}

        {mode === 'idle' && (
          <div className="px-3 pb-3 pt-1 space-y-1.5 border-t border-[var(--border)]">
            <button
              onClick={startCall}
              className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg px-3 py-2 text-xs font-medium transition-all active:scale-[0.98]"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d={PHONE_PATH} />
              </svg>
              Ring {brand.name}
            </button>
            <button
              onClick={() => openChat(false)}
              className="w-full flex items-center justify-center gap-2 bg-[var(--surface-alt)] hover:bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-lg px-3 py-2 text-xs font-medium transition-all active:scale-[0.98]"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d={CHAT_PATH} />
              </svg>
              Chatta
            </button>
          </div>
        )}

        {(mode === 'call' || mode === 'chat') && (
          <MessageList messages={messages} activeTranscript={activeTranscript} mode={mode} isSpeaking={isSpeaking} brand={brand} maxH="max-h-[200px]" />
        )}

        {mode === 'chat' && (
          <ChatInput chatInput={chatInput} setChatInput={setChatInput} sendChat={sendChat} brand={brand} compact />
        )}

        {mode === 'call' && callStatus === 'active' && (
          <div className="border-t border-[var(--border)] px-3 py-2 flex justify-center">
            <HangupButton compact />
          </div>
        )}

        {mode === 'call' && callStatus === 'ended' && <CallEndedFooter compact />}
      </div>
    );
  }

  /* ═══════════════════════════════════════════
     DRAGGABLE VARIANT
  ═══════════════════════════════════════════ */
  if (variant === 'draggable') {
    return (
      <div
        style={{
          position: 'fixed',
          left: draggablePos.x,
          top: draggablePos.y,
          width: 400,
          zIndex: 50,
        }}
        className="maja-panel-enter"
      >
        <div
          className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-2xl shadow-black/10 overflow-hidden flex flex-col"
          style={{ maxHeight: draggableCollapsed ? 'auto' : 'calc(100vh - 120px)' }}
        >
          {/* ── Drag handle / header ── */}
          <div
            onMouseDown={handleDragStart}
            style={{ cursor: isDragging ? 'grabbing' : 'grab', userSelect: 'none' }}
            className={[
              'flex items-center gap-2.5 px-3.5 shrink-0',
              'bg-amber-50/60 dark:bg-amber-900/10 border-b-2 border-amber-200 dark:border-amber-800/60',
              draggableCollapsed ? 'py-2' : 'py-3',
            ].join(' ')}
          >
            {/* Grip icon — label hidden when collapsed to save space */}
            <div className={[
              'flex items-center shrink-0 bg-amber-100 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800/50 rounded-lg',
              draggableCollapsed ? 'p-1.5' : 'gap-1.5 px-2 py-1',
            ].join(' ')}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="text-amber-500 shrink-0">
                <circle cx="8" cy="5" r="2" /><circle cx="16" cy="5" r="2" />
                <circle cx="8" cy="12" r="2" /><circle cx="16" cy="12" r="2" />
                <circle cx="8" cy="19" r="2" /><circle cx="16" cy="19" r="2" />
              </svg>
              {!draggableCollapsed && (
                <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider select-none">Dra</span>
              )}
            </div>

            {/* Avatar badge */}
            <div className="relative shrink-0">
              <AvatarBadge size={draggableCollapsed ? 'sm' : 'md'} />
              <StatusDot size={draggableCollapsed ? 'sm' : 'md'} />
            </div>

            {/* Name + status — always truncated */}
            <div className="flex-1 min-w-0">
              <h3 className={['font-heading font-semibold text-[var(--text-primary)] leading-none truncate', draggableCollapsed ? 'text-xs' : 'text-sm'].join(' ')}>{brand.name}</h3>
              {!draggableCollapsed && (
                <p className="text-[var(--text-muted)] text-xs mt-0.5 truncate">{statusText}</p>
              )}
            </div>

            {/* ── Collapsed contextual strip — compact, icon-first ── */}
            {draggableCollapsed && (
              <div
                onMouseDown={(e) => e.stopPropagation()}
                className="flex items-center gap-1.5 shrink-0"
              >
                {/* Idle / ended: compact ring btn */}
                {(callStatus === 'idle' || callStatus === 'ended') && (
                  <button
                    onClick={startCall}
                    className="flex items-center gap-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg px-2 py-1.5 text-[11px] font-semibold transition-all active:scale-95"
                    aria-label="Ring"
                  >
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d={PHONE_PATH} />
                    </svg>
                    Ring
                  </button>
                )}

                {/* Connecting: compact spinner */}
                {callStatus === 'connecting' && (
                  <div className="flex items-center gap-1 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40 rounded-lg px-2 py-1.5">
                    <div className="w-2.5 h-2.5 rounded-full border-[1.5px] border-amber-500 border-t-transparent animate-spin shrink-0" />
                    <span className="text-[10px] text-amber-700 dark:text-amber-400 font-medium">Ansluter</span>
                  </div>
                )}

                {/* Active: timer badge + icon-only end call — fits 400px */}
                {callStatus === 'active' && (
                  <>
                    <div className="flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/40 rounded-lg px-2 py-1.5">
                      <span className="relative flex h-1.5 w-1.5 shrink-0">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                      </span>
                      <span className="text-[11px] font-mono font-semibold text-emerald-700 dark:text-emerald-400 tabular-nums">
                        {fmtDur(callDuration)}
                      </span>
                    </div>
                    <button
                      onClick={endCall}
                      className="w-7 h-7 flex items-center justify-center bg-red-500 hover:bg-red-600 text-white rounded-lg transition-all active:scale-95 shrink-0"
                      aria-label="Avsluta samtal"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d={HANGUP_PATH} /><line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    </button>
                  </>
                )}
              </div>
            )}

            {/* Expand / collapse — icon-only when collapsed */}
            <button
              onMouseDown={(e) => e.stopPropagation()}
              onClick={() => setDraggableCollapsed((c) => !c)}
              className={[
                'flex items-center shrink-0 rounded-lg border transition-all',
                'text-[var(--text-secondary)] border-[var(--border)] bg-[var(--surface-alt)]',
                'hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)] hover:border-[var(--text-muted)]/40',
                draggableCollapsed ? 'p-1.5' : 'gap-1.5 px-2.5 py-1.5 text-xs font-medium',
              ].join(' ')}
              aria-label={draggableCollapsed ? 'Expandera' : 'Minimera'}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {draggableCollapsed
                  ? <polyline points="18 15 12 9 6 15" />
                  : <polyline points="6 9 12 15 18 9" />}
              </svg>
              {!draggableCollapsed && <span>Minimera</span>}
            </button>
          </div>

          {/* ── Body (hidden when collapsed) ── */}
          {!draggableCollapsed && (
            <>
              {/* Voice strip */}
              {mode === 'call' && callStatus === 'active' && (
                <div className="border-b border-[var(--border)] bg-[var(--surface-alt)] flex items-center justify-between px-5 py-3">
                  <div className="flex items-end gap-0.5 h-5">
                    <InlineVolumeBars volumeLevel={volumeLevel} callActive={callStatus === 'active'} />
                  </div>
                  <span className="text-[10px] text-[var(--text-muted)]">
                    {isSpeaking ? `${brand.name} talar` : 'Din tur'}
                  </span>
                </div>
              )}

              {/* Connecting */}
              {mode === 'call' && callStatus === 'connecting' && (
                <ConnectingIndicator brand={brand} />
              )}

              {/* ── Idle: action buttons ── */}
              {mode === 'idle' && (
                <div className="px-5 py-6 space-y-5">
                  <div>
                    <h4 className="font-heading text-base font-semibold text-[var(--text-primary)]">
                      Kontakta receptionen
                    </h4>
                    <p className="text-[var(--text-muted)] text-xs mt-1">
                      Ring {brand.name} direkt eller starta en chatt
                    </p>
                  </div>

                  {/* Primary: Ring */}
                  <button
                    onClick={startCall}
                    className="group w-full flex items-center gap-4 bg-amber-500 hover:bg-amber-600 text-white rounded-xl px-5 py-4 transition-all duration-200 active:scale-[0.98] shadow-md shadow-amber-500/20 hover:shadow-amber-500/30"
                  >
                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d={PHONE_PATH} />
                      </svg>
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-sm leading-none">Ring {brand.name}</p>
                      <p className="text-white/70 text-xs mt-1">Snabbaste s&auml;ttet att boka rum</p>
                    </div>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-auto opacity-70">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </button>

                  {/* Secondary: Chatta */}
                  <button
                    onClick={() => openChat(true)}
                    className="group w-full flex items-center gap-4 bg-[var(--surface-alt)] hover:bg-[var(--surface-hover)] border border-[var(--border)] hover:border-[var(--text-muted)]/30 text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-xl px-5 py-4 transition-all duration-200 active:scale-[0.98]"
                  >
                    <div className="w-10 h-10 rounded-full bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center shrink-0">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d={CHAT_PATH} />
                      </svg>
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-sm leading-none">Chatta</p>
                      <p className="text-[var(--text-muted)] text-xs mt-1">Skriv ett meddelande</p>
                    </div>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-auto opacity-40">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </button>

                  {/* Info strip */}
                  <div className="flex items-center gap-2 px-1">
                    <span className="relative flex h-2 w-2 shrink-0">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                    </span>
                    <span className="text-[11px] text-[var(--text-muted)]">{brand.name} &auml;r online och redo att hj&auml;lpa</span>
                  </div>
                </div>
              )}

              {/* Messages */}
              {(mode === 'call' || mode === 'chat') && (
                <MessageList messages={messages} activeTranscript={activeTranscript} mode={mode} isSpeaking={isSpeaking} brand={brand} maxH="max-h-[340px]" />
              )}

              {/* Chat input */}
              {mode === 'chat' && (
                <ChatInput chatInput={chatInput} setChatInput={setChatInput} sendChat={sendChat} brand={brand} />
              )}

              {/* End call */}
              {mode === 'call' && callStatus === 'active' && (
                <div className="border-t border-[var(--border)] px-5 py-3 shrink-0 flex justify-center">
                  <HangupButton />
                </div>
              )}

              {/* Chat footer nav */}
              {mode === 'chat' && <ChatFooterNav />}

              {/* Call ended */}
              {mode === 'call' && callStatus === 'ended' && <CallEndedFooter />}
            </>
          )}
        </div>
      </div>
    );
  }

  /* ═══════════════════════════════════════════
     FLOATING VARIANT (FAB)
  ═══════════════════════════════════════════ */
  if (isDark) {
    return (
      <>
        {!open && (
          <button
            onClick={() => setOpen(true)}
            className="fixed bottom-6 right-6 z-50 group"
            aria-label={`Kontakta ${brand.name}`}
          >
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-gold-500/20 maja-fab-ping" />
              <div className="absolute inset-0 rounded-full bg-gold-500/10 maja-fab-ping" style={{ animationDelay: '0.5s' }} />
              <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-gold-500 to-gold-600 flex items-center justify-center shadow-lg shadow-gold-500/25 group-hover:shadow-gold-500/40 group-hover:scale-105 transition-all duration-300">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#0B1121" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  {PERSON_SVG}
                </svg>
                <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-emerald-500 border-2 border-[var(--page-bg)]">
                  <div className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-75" />
                </div>
              </div>
            </div>
            <div className="absolute -top-8 right-0 bg-stone-800 border border-stone-700 rounded-lg px-3 py-1 text-xs text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none shadow-lg">
              Prata med {brand.name}
            </div>
          </button>
        )}

        {open && (
          <div className="fixed bottom-6 right-6 z-50 w-[360px] maja-panel-enter">
            <div className="bg-navy-900 border border-navy-700 rounded-2xl shadow-2xl shadow-black/40 overflow-hidden flex flex-col" style={{ maxHeight: 'calc(100vh - 48px)' }}>
              <div className="bg-gradient-to-r from-navy-800 to-navy-900 border-b border-navy-700 px-5 py-4 flex items-center gap-3 shrink-0">
                <div className="relative">
                  <AvatarBadge size="md" />
                  <div className={['absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-navy-800', callStatus === 'active' ? 'bg-emerald-500' : 'bg-gold-500'].join(' ')} />
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="text-cream-100 font-heading font-semibold text-sm">{brand.name}</h3>
                  <p className="text-cream-400 text-xs truncate">
                    {callStatus === 'connecting' && 'Ansluter...'}
                    {callStatus === 'active' && (isSpeaking ? 'Talar...' : 'Lyssnar...')}
                    {callStatus === 'ended' && 'Samtalet avslutat'}
                    {callStatus === 'idle' && mode === 'chat' && 'Chatt'}
                    {callStatus === 'idle' && mode === 'idle' && `Receptionist — Grand Hotel Kollegan`}
                  </p>
                </div>

                <button
                  onClick={() => {
                    if (callStatus === 'active') endCall();
                    setOpen(false);
                    if (mode !== 'call') resetToIdle();
                  }}
                  className="text-cream-600 hover:text-cream-100 transition-colors p-1"
                  aria-label="Stäng"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              {mode === 'call' && callStatus === 'active' && (
                <VoiceStrip volumeLevel={volumeLevel} callActive isSpeaking={isSpeaking} brand={brand} />
              )}

              {mode === 'call' && callStatus === 'connecting' && (
                <ConnectingIndicator brand={brand} />
              )}

              {mode === 'idle' && (
                <div className="px-5 py-6 space-y-4">
                  <div className="text-center">
                    <div className="mx-auto mb-3 maja-avatar-breathe">
                      <AvatarBadge size="lg" />
                    </div>
                    <h3 className="font-heading text-lg font-bold text-cream-100">Hej, jag &auml;r {brand.name}!</h3>
                    <p className="text-cream-400 text-xs mt-1 leading-relaxed">
                      Receptionist p&aring; Grand Hotel Kollegan.<br />
                      Hur vill du kontakta mig?
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={startCall}
                      className="group flex flex-col items-center gap-2 bg-navy-800 hover:bg-navy-700 border border-navy-700 hover:border-gold-600 rounded-xl px-4 py-4 transition-all duration-200"
                    >
                      <div className="w-10 h-10 rounded-full bg-emerald-800/60 group-hover:bg-emerald-800 flex items-center justify-center transition-colors">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6EE7A0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d={PHONE_PATH} />
                        </svg>
                      </div>
                      <span className="text-xs font-medium text-cream-100 group-hover:text-gold-400 transition-colors">Ring {brand.name}</span>
                    </button>

                    <button
                      onClick={() => openChat(true)}
                      className="group flex flex-col items-center gap-2 bg-navy-800 hover:bg-navy-700 border border-navy-700 hover:border-gold-600 rounded-xl px-4 py-4 transition-all duration-200"
                    >
                      <div className="w-10 h-10 rounded-full bg-blue-900/60 group-hover:bg-blue-900 flex items-center justify-center transition-colors">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#60A5FA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d={CHAT_PATH} />
                        </svg>
                      </div>
                      <span className="text-xs font-medium text-cream-100 group-hover:text-gold-400 transition-colors">Chatta</span>
                    </button>
                  </div>
                </div>
              )}

              {(mode === 'call' || mode === 'chat') && (
                <MessageList messages={messages} activeTranscript={activeTranscript} mode={mode} isSpeaking={isSpeaking} brand={brand} maxH="max-h-[340px]" />
              )}

              {mode === 'chat' && (
                <ChatInput chatInput={chatInput} setChatInput={setChatInput} sendChat={sendChat} brand={brand} />
              )}

              {mode === 'call' && callStatus === 'active' && (
                <div className="border-t border-navy-700 px-5 py-4 shrink-0 flex justify-center">
                  <HangupButton />
                </div>
              )}

              {mode === 'chat' && <ChatFooterNav />}

              {mode === 'call' && callStatus === 'ended' && <CallEndedFooter />}
            </div>
          </div>
        )}
      </>
    );
  }

  /* ── Light floating (Kollegan) ── */
  return (
    <>
      {/* FAB button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 group"
          aria-label={`Kontakta ${brand.name}`}
        >
          <div className="relative w-14 h-14 rounded-full bg-amber-500 hover:bg-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20 group-hover:shadow-amber-500/30 group-hover:scale-105 transition-all duration-200 active:scale-95">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d={PHONE_PATH} />
            </svg>
            <div className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white">
              <div className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-75" />
            </div>
          </div>
          <div className="absolute -top-9 right-0 bg-[var(--text-primary)] text-[var(--surface)] rounded-lg px-3 py-1.5 text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none shadow-lg">
            Prata med {brand.name}
          </div>
        </button>
      )}

      {/* Floating panel */}
      {open && (
        <div className="fixed bottom-6 right-6 z-50 w-[360px] maja-panel-enter">
          <div
            className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-xl shadow-black/10 overflow-hidden flex flex-col"
            style={{ maxHeight: 'calc(100vh - 48px)' }}
          >
            <div className="px-5 py-4 flex items-center gap-3 shrink-0 border-b border-[var(--border)]">
              <div className="relative">
                <AvatarBadge size="md" />
                <StatusDot size="md" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-heading text-sm font-semibold text-[var(--text-primary)] leading-none">{brand.name}</h3>
                <p className="text-[var(--text-muted)] text-xs mt-0.5 truncate">{statusText}</p>
              </div>
              <button
                onClick={() => {
                  if (callStatus === 'active') endCall();
                  setOpen(false);
                  if (mode !== 'call') resetToIdle();
                }}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors p-1 rounded-lg hover:bg-[var(--surface-alt)]"
                aria-label="Stäng"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {mode === 'call' && callStatus === 'active' && (
              <VoiceStrip volumeLevel={volumeLevel} callActive isSpeaking={isSpeaking} brand={brand} />
            )}
            {mode === 'call' && callStatus === 'connecting' && (
              <ConnectingIndicator brand={brand} />
            )}

            {mode === 'idle' && (
              <div className="px-5 py-6 space-y-4">
                <div>
                  <h4 className="font-heading text-base font-semibold text-[var(--text-primary)]">Kontakta receptionen</h4>
                  <p className="text-[var(--text-muted)] text-xs mt-0.5">V&auml;lj hur du vill n&aring; oss</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={startCall}
                    className="group flex flex-col items-center gap-2.5 bg-[var(--surface-alt)] hover:bg-amber-50 dark:hover:bg-amber-900/10 border border-[var(--border)] hover:border-amber-300 dark:hover:border-amber-700 rounded-xl px-4 py-4 transition-all duration-200 active:scale-[0.97]"
                  >
                    <div className="w-9 h-9 rounded-full bg-amber-100 dark:bg-amber-900/30 group-hover:bg-amber-200 dark:group-hover:bg-amber-900/50 flex items-center justify-center transition-colors">
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="rgb(217 119 6)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d={PHONE_PATH} />
                      </svg>
                    </div>
                    <span className="text-xs font-medium text-[var(--text-secondary)] group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors">Ring oss</span>
                  </button>

                  <button
                    onClick={() => openChat(true)}
                    className="group flex flex-col items-center gap-2.5 bg-[var(--surface-alt)] hover:bg-[var(--surface-hover)] border border-[var(--border)] rounded-xl px-4 py-4 transition-all duration-200 active:scale-[0.97]"
                  >
                    <div className="w-9 h-9 rounded-full bg-[var(--surface)] border border-[var(--border)] group-hover:bg-[var(--surface-alt)] flex items-center justify-center transition-colors">
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d={CHAT_PATH} />
                      </svg>
                    </div>
                    <span className="text-xs font-medium text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors">Chatta</span>
                  </button>
                </div>
              </div>
            )}

            {(mode === 'call' || mode === 'chat') && (
              <MessageList messages={messages} activeTranscript={activeTranscript} mode={mode} isSpeaking={isSpeaking} brand={brand} maxH="max-h-[320px]" />
            )}

            {mode === 'chat' && (
              <ChatInput chatInput={chatInput} setChatInput={setChatInput} sendChat={sendChat} brand={brand} />
            )}

            {mode === 'call' && callStatus === 'active' && (
              <div className="border-t border-[var(--border)] px-5 py-3 shrink-0 flex justify-center">
                <HangupButton />
              </div>
            )}

            {mode === 'chat' && <ChatFooterNav />}

            {mode === 'call' && callStatus === 'ended' && <CallEndedFooter />}
          </div>
        </div>
      )}
    </>
  );
}
