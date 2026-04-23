'use client';

import { useState, useEffect, useRef } from 'react';
import type { VoiceBrand } from '../../domain/voice-brand.vo';
import { useVapi } from '../hooks/use-vapi';
import { VoiceStrip } from './voice-strip';
import { ConnectingIndicator } from './connecting-indicator';
import { MessageList } from './message-list';
import { ChatInput } from './chat-input';
import { VoiceContactSidebar } from './voice-contact-sidebar';
import { VoiceContactDraggable } from './voice-contact-draggable';
import {
  CHAT_PATH,
  PERSON_SVG,
  PHONE_PATH,
  VoiceAvatarBadge,
  VoiceCallEndedFooter,
  VoiceChatFooterNav,
  VoiceHangupButton,
  VoiceStatusDot,
} from './voice-contact-chrome';


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
  const [draggablePos, setDraggablePos] = useState(() => {
    if (variant !== 'draggable' || typeof window === 'undefined') {
      return { x: 0, y: 0 };
    }

    return {
      x: Math.max(0, window.innerWidth - 448),
      y: 80,
    };
  });
  const [draggableCollapsed, setDraggableCollapsed] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ mx: 0, my: 0, px: 0, py: 0 });

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
              ? 'Receptionist - Grand Hotel Soleria'
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

  if (variant === 'sidebar') {
    return (
      <VoiceContactSidebar
        brand={brand}
        isDark={isDark}
        mode={mode}
        callStatus={callStatus}
        messages={messages}
        setMessages={setMessages}
        activeTranscript={activeTranscript}
        volumeLevel={volumeLevel}
        isSpeaking={isSpeaking}
        chatInput={chatInput}
        setChatInput={setChatInput}
        startCall={startCall}
        endCall={endCall}
        sendChat={sendChat}
        statusText={statusText}
        openChat={openChat}
        resetToIdle={resetToIdle}
      />
    );
  }

  /* ═══════════════════════════════════════════
     DRAGGABLE VARIANT
  ═══════════════════════════════════════════ */
  if (variant === 'draggable') {
    return (
      <VoiceContactDraggable
        brand={brand}
        isDark={isDark}
        mode={mode}
        callStatus={callStatus}
        messages={messages}
        setMessages={setMessages}
        activeTranscript={activeTranscript}
        volumeLevel={volumeLevel}
        isSpeaking={isSpeaking}
        callDuration={callDuration}
        chatInput={chatInput}
        setChatInput={setChatInput}
        startCall={startCall}
        endCall={endCall}
        sendChat={sendChat}
        statusText={statusText}
        openChat={openChat}
        resetToIdle={resetToIdle}
        draggablePos={draggablePos}
        draggableCollapsed={draggableCollapsed}
        setDraggableCollapsed={setDraggableCollapsed}
        isDragging={isDragging}
        handleDragStart={handleDragStart}
      />
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
                  {<VoiceAvatarBadge brand={brand} isDark={isDark} isSpeaking={isSpeaking} size="md" />}
                  <div className={['absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-navy-800', callStatus === 'active' ? 'bg-emerald-500' : 'bg-gold-500'].join(' ')} />
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="text-cream-100 font-heading font-semibold text-sm">{brand.name}</h3>
                  <p className="text-cream-400 text-xs truncate">
                    {callStatus === 'connecting' && 'Ansluter...'}
                    {callStatus === 'active' && (isSpeaking ? 'Talar...' : 'Lyssnar...')}
                    {callStatus === 'ended' && 'Samtalet avslutat'}
                    {callStatus === 'idle' && mode === 'chat' && 'Chatt'}
                    {callStatus === 'idle' && mode === 'idle' && `Receptionist — Grand Hotel Soleria`}
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
                      {<VoiceAvatarBadge brand={brand} isDark={isDark} isSpeaking={isSpeaking} size="lg" />}
                    </div>
                    <h3 className="font-heading text-lg font-bold text-cream-100">Hej, jag &auml;r {brand.name}!</h3>
                    <p className="text-cream-400 text-xs mt-1 leading-relaxed">
                      Receptionist p&aring; Grand Hotel Soleria.<br />
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
                  <VoiceHangupButton isDark={isDark} onEndCall={endCall} />
                </div>
              )}

              {mode === 'chat' && <VoiceChatFooterNav isDark={isDark} onBack={resetToIdle} onStartCall={startCall} />}

              {mode === 'call' && callStatus === 'ended' && <VoiceCallEndedFooter isDark={isDark} onClose={resetToIdle} onCallAgain={() => { setMessages([]); startCall(); }} />}
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
          <div className="relative w-14 h-14 rounded-full bg-purple-700 hover:bg-purple-800 dark:bg-amber-500 dark:hover:bg-amber-600 flex items-center justify-center shadow-lg shadow-purple-700/20 dark:shadow-amber-500/20 group-hover:scale-105 transition-all duration-200 active:scale-95">
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
                {<VoiceAvatarBadge brand={brand} isDark={isDark} isSpeaking={isSpeaking} size="md" />}
                {<VoiceStatusDot callStatus={callStatus} isDark={isDark} size="md" />}
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
                    className="group flex flex-col items-center gap-2.5 bg-[var(--surface-alt)] hover:bg-purple-50 dark:hover:bg-amber-900/10 border border-[var(--border)] hover:border-purple-300 dark:hover:border-amber-700 rounded-xl px-4 py-4 transition-all duration-200 active:scale-[0.97]"
                  >
                    <div className="w-9 h-9 rounded-full bg-purple-100 dark:bg-amber-900/30 group-hover:bg-purple-200 dark:group-hover:bg-amber-900/50 flex items-center justify-center transition-colors">
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-purple-600 dark:text-amber-500">
                        <path d={PHONE_PATH} />
                      </svg>
                    </div>
                    <span className="text-xs font-medium text-[var(--text-secondary)] group-hover:text-purple-700 dark:group-hover:text-amber-400 transition-colors">Ring oss</span>
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
                <VoiceHangupButton isDark={isDark} onEndCall={endCall} />
              </div>
            )}

            {mode === 'chat' && <VoiceChatFooterNav isDark={isDark} onBack={resetToIdle} onStartCall={startCall} />}

            {mode === 'call' && callStatus === 'ended' && <VoiceCallEndedFooter isDark={isDark} onClose={resetToIdle} onCallAgain={() => { setMessages([]); startCall(); }} />}
          </div>
        </div>
      )}
    </>
  );
}
