'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Vapi from '@vapi-ai/web';

type Mode = 'idle' | 'call' | 'chat';
type CallStatus = 'idle' | 'connecting' | 'active' | 'ended';

interface Message {
  id: string;
  role: 'kollegan' | 'user';
  text: string;
  timestamp: Date;
}

const VAPI_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY || '';
const VAPI_ASSISTANT_ID = process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID || '';

interface KolleganContactProps {
  variant?: 'floating' | 'sidebar' | 'draggable';
}

export default function KolleganContact({ variant = 'floating' }: KolleganContactProps) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>('idle');
  const [callStatus, setCallStatus] = useState<CallStatus>('idle');
  const [isKolleganSpeaking, setIsKolleganSpeaking] = useState(false);
  const [volumeLevel, setVolumeLevel] = useState(0);
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [activeTranscript, setActiveTranscript] = useState('');

  /* ── Draggable-variant state ── */
  const [draggablePos, setDraggablePos] = useState({ x: 0, y: 0 });
  const [draggableCollapsed, setDraggableCollapsed] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ mx: 0, my: 0, px: 0, py: 0 });

  const vapiRef = useRef<Vapi | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeTranscript]);

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
    const onMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      setDraggablePos({
        x: dragStartRef.current.px + (e.clientX - dragStartRef.current.mx),
        y: dragStartRef.current.py + (e.clientY - dragStartRef.current.my),
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

  const getVapi = useCallback(() => {
    if (!vapiRef.current && VAPI_PUBLIC_KEY) {
      vapiRef.current = new Vapi(VAPI_PUBLIC_KEY);

      vapiRef.current.on('call-start', () => {
        setCallStatus('active');
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: 'kollegan',
            text: 'Välkommen till Grand Hotel Kollegan, det är Kollegan i receptionen. Hur kan jag hjälpa dig idag?',
            timestamp: new Date(),
          },
        ]);
      });

      vapiRef.current.on('call-end', () => {
        setCallStatus('ended');
        setIsKolleganSpeaking(false);
        setVolumeLevel(0);
        setTimeout(() => {
          setCallStatus('idle');
          setMode('idle');
        }, 2000);
      });

      vapiRef.current.on('speech-start', () => setIsKolleganSpeaking(true));
      vapiRef.current.on('speech-end', () => setIsKolleganSpeaking(false));
      vapiRef.current.on('volume-level', (level: number) => setVolumeLevel(level));

      vapiRef.current.on('message', (msg: Record<string, unknown>) => {
        if (msg.type === 'transcript') {
          const transcript = msg as {
            type: string;
            role: string;
            transcript: string;
            transcriptType: string;
          };
          if (transcript.transcriptType === 'final') {
            setMessages((prev) => [
              ...prev,
              {
                id: crypto.randomUUID(),
                role: transcript.role === 'assistant' ? 'kollegan' : 'user',
                text: transcript.transcript,
                timestamp: new Date(),
              },
            ]);
            setActiveTranscript('');
          } else if (transcript.transcriptType === 'partial') {
            setActiveTranscript(transcript.transcript);
          }
        }
      });

      vapiRef.current.on('error', (error: unknown) => {
        console.error('Vapi error:', error);
        setCallStatus('idle');
        setMode('idle');
      });
    }
    return vapiRef.current;
  }, []);

  const startCall = useCallback(async () => {
    const vapi = getVapi();
    if (!vapi || !VAPI_ASSISTANT_ID) {
      setMessages([
        {
          id: crypto.randomUUID(),
          role: 'kollegan',
          text: 'Vapi är inte konfigurerat ännu. Lägg till NEXT_PUBLIC_VAPI_PUBLIC_KEY och NEXT_PUBLIC_VAPI_ASSISTANT_ID i din .env.local-fil.',
          timestamp: new Date(),
        },
      ]);
      setMode('chat');
      return;
    }

    setMode('call');
    setCallStatus('connecting');
    setMessages([]);

    try {
      let hotelInfoContext: string | undefined;
      try {
        const res = await fetch('/api/hotel-info');
        if (res.ok) {
          hotelInfoContext = JSON.stringify(await res.json());
        }
      } catch {
        // Non-fatal — proceed without context
      }

      const overrides = hotelInfoContext
        ? { variableValues: { hotel_info: hotelInfoContext } }
        : undefined;

      await vapi.start(VAPI_ASSISTANT_ID, overrides);
    } catch {
      setCallStatus('idle');
      setMode('idle');
      setMessages([
        {
          id: crypto.randomUUID(),
          role: 'kollegan',
          text: 'Kunde inte ansluta samtalet. Kontrollera din Vapi-konfiguration.',
          timestamp: new Date(),
        },
      ]);
    }
  }, [getVapi]);

  const endCall = useCallback(() => {
    vapiRef.current?.stop();
  }, []);

  const sendChat = useCallback(() => {
    if (!chatInput.trim()) return;
    const text = chatInput.trim();
    setChatInput('');
    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), role: 'user', text, timestamp: new Date() },
    ]);

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'kollegan',
          text: 'Tack för ditt meddelande! För att boka rum rekommenderar jag att ringa mig — tryck på telefonikonen ovan så kan jag hjälpa dig direkt.',
          timestamp: new Date(),
        },
      ]);
    }, 1200);
  }, [chatInput]);

  useEffect(() => {
    return () => {
      vapiRef.current?.stop();
    };
  }, []);

  /* ── Voice bars (amber, inline styles) ── */
  const volumeBars = Array.from({ length: 5 }, (_, i) => {
    const threshold = i * 0.15;
    const active = volumeLevel > threshold && callStatus === 'active';
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

  /* ── Shared "K" avatar badge ── */
  const KBadge = ({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) => {
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
          isKolleganSpeaking ? 'ring-2 ring-amber-400 ring-offset-1 ring-offset-[var(--surface)]' : '',
        ].join(' ')}
      >
        K
      </div>
    );
  };

  /* ── Status text ── */
  const statusText =
    callStatus === 'connecting'
      ? 'Ansluter...'
      : callStatus === 'active'
        ? isKolleganSpeaking
          ? 'Talar...'
          : 'Lyssnar...'
        : callStatus === 'ended'
          ? 'Samtalet avslutat'
          : mode === 'chat'
            ? 'Chatt'
            : 'Receptionist';

  /* ── Messages list (shared) ── */
  const messagesList = (maxH: string) => (
    <div className={`flex-1 overflow-y-auto px-3 py-2.5 space-y-2 min-h-[100px] ${maxH}`}>
      {messages.map((msg) => (
        <div
          key={msg.id}
          className={['flex', msg.role === 'user' ? 'justify-end' : 'justify-start'].join(' ')}
        >
          <div
            className={[
              'max-w-[85%] rounded-2xl px-3 py-2 text-xs leading-relaxed',
              msg.role === 'kollegan'
                ? 'bg-[var(--surface-alt)] border border-[var(--border)] text-[var(--text-primary)] rounded-bl-sm'
                : 'bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/30 text-[var(--text-primary)] rounded-br-sm',
            ].join(' ')}
          >
            {msg.role === 'kollegan' && (
              <span className="block text-amber-600 dark:text-amber-400 font-medium text-[10px] mb-0.5 uppercase tracking-wide">
                Kollegan
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
              Kollegan
            </span>
            {activeTranscript}…
          </div>
        </div>
      )}

      {mode === 'call' && isKolleganSpeaking && messages.length === 0 && (
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

  /* ── Connecting indicator (shared) ── */
  const connectingIndicator = (compact = false) => (
    <div className={['flex flex-col items-center gap-2.5 border-t border-[var(--border)] bg-[var(--surface-alt)]', compact ? 'px-3 py-3' : 'px-5 py-7'].join(' ')}>
      <div className="relative flex items-center justify-center w-10 h-10">
        <div className="absolute inset-0 rounded-full bg-amber-500/10 animate-ping" />
        <div className="absolute inset-1.5 rounded-full bg-amber-500/15 animate-ping" style={{ animationDelay: '0.4s' }} />
        <div className="w-4 h-4 rounded-full bg-amber-500" />
      </div>
      <span className={['text-[var(--text-muted)]', compact ? 'text-[10px]' : 'text-xs'].join(' ')}>
        Ansluter till Kollegan…
      </span>
    </div>
  );

  /* ── Voice bar strip (shared) ── */
  const voiceStrip = (compact = false) => (
    <div className={['border-t border-[var(--border)] bg-[var(--surface-alt)] flex items-center justify-between', compact ? 'px-3 py-1.5' : 'px-5 py-3'].join(' ')}>
      <div className="flex items-end gap-0.5 h-5">{volumeBars}</div>
      <span className="text-[10px] text-[var(--text-muted)]">
        {isKolleganSpeaking ? 'Kollegan talar' : 'Din tur'}
      </span>
    </div>
  );

  /* ═══════════════════════════════════════════
     SIDEBAR VARIANT
  ═══════════════════════════════════════════ */
  if (variant === 'sidebar') {
    return (
      <div className="rounded-xl border border-[var(--border)] overflow-hidden bg-[var(--surface)]">

        {/* Header */}
        <div className="px-3 py-2.5 flex items-center gap-2.5 bg-[var(--surface)]">
          <div className="relative">
            <KBadge size="sm" />
            <div
              className={[
                'absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[var(--surface)]',
                callStatus === 'active' ? 'bg-emerald-500' : 'bg-amber-400',
              ].join(' ')}
            />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-heading text-xs font-semibold text-[var(--text-primary)] leading-none">Kollegan</h3>
            <p className="text-[var(--text-muted)] text-[10px] mt-0.5 truncate">{statusText}</p>
          </div>
          {(mode === 'call' || mode === 'chat') && (
            <button
              onClick={() => {
                if (callStatus === 'active') endCall();
                setMode('idle');
                setMessages([]);
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

        {mode === 'call' && callStatus === 'active' && voiceStrip(true)}
        {mode === 'call' && callStatus === 'connecting' && connectingIndicator(true)}

        {mode === 'idle' && (
          <div className="px-3 pb-3 pt-1 space-y-1.5 border-t border-[var(--border)]">
            <button
              onClick={startCall}
              className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg px-3 py-2 text-xs font-medium transition-all active:scale-[0.98]"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
              Ring Kollegan
            </button>
            <button
              onClick={() => {
                setMode('chat');
                setMessages([{ id: crypto.randomUUID(), role: 'kollegan', text: 'Hej! Skriv ditt meddelande så hjälper jag dig.', timestamp: new Date() }]);
              }}
              className="w-full flex items-center justify-center gap-2 bg-[var(--surface-alt)] hover:bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-lg px-3 py-2 text-xs font-medium transition-all active:scale-[0.98]"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              Chatta
            </button>
          </div>
        )}

        {(mode === 'call' || mode === 'chat') && messagesList('max-h-[200px]')}

        {mode === 'chat' && (
          <div className="border-t border-[var(--border)] px-3 py-2">
            <form onSubmit={(e) => { e.preventDefault(); sendChat(); }} className="flex gap-1.5">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Skriv..."
                className="flex-1 bg-[var(--surface-alt)] border border-[var(--border)] rounded-lg px-2.5 py-1.5 text-[11px] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-amber-400 transition-colors"
              />
              <button
                type="submit"
                disabled={!chatInput.trim()}
                className="bg-amber-500 hover:bg-amber-600 disabled:bg-[var(--surface-alt)] disabled:text-[var(--text-muted)] text-white rounded-lg px-2 py-1.5 transition-colors"
                aria-label="Skicka"
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            </form>
          </div>
        )}

        {mode === 'call' && callStatus === 'active' && (
          <div className="border-t border-[var(--border)] px-3 py-2 flex justify-center">
            <button
              onClick={endCall}
              className="flex items-center gap-1.5 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800/50 rounded-full px-4 py-1.5 text-xs font-medium transition-all"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </svg>
              Avsluta
            </button>
          </div>
        )}

        {mode === 'call' && callStatus === 'ended' && (
          <div className="border-t border-[var(--border)] px-3 py-2 text-center">
            <p className="text-[var(--text-muted)] text-[10px]">Samtalet avslutat</p>
          </div>
        )}
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
            className="flex items-center gap-3 px-4 py-3.5 bg-[var(--surface)] border-b border-[var(--border)] shrink-0"
          >
            {/* Grip icon */}
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="text-[var(--text-muted)] shrink-0"
            >
              <circle cx="8"  cy="5"  r="1.6" />
              <circle cx="16" cy="5"  r="1.6" />
              <circle cx="8"  cy="12" r="1.6" />
              <circle cx="16" cy="12" r="1.6" />
              <circle cx="8"  cy="19" r="1.6" />
              <circle cx="16" cy="19" r="1.6" />
            </svg>

            {/* K badge + status */}
            <div className="relative shrink-0">
              <KBadge size="md" />
              <div
                className={[
                  'absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[var(--surface)]',
                  callStatus === 'active' ? 'bg-emerald-500' : 'bg-amber-400',
                ].join(' ')}
              />
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="font-heading text-sm font-semibold text-[var(--text-primary)] leading-none">
                Kollegan
              </h3>
              <p className="text-[var(--text-muted)] text-xs mt-0.5">{statusText}</p>
            </div>

            {/* Active call pill */}
            {callStatus === 'active' && (
              <div className="flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/40 rounded-full px-2.5 py-1 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-medium text-emerald-700 dark:text-emerald-400">Aktivt samtal</span>
              </div>
            )}

            {/* Collapse / expand */}
            <button
              onMouseDown={(e) => e.stopPropagation()}
              onClick={() => setDraggableCollapsed((c) => !c)}
              className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors p-1 rounded-lg hover:bg-[var(--surface-alt)] shrink-0"
              aria-label={draggableCollapsed ? 'Expandera' : 'Minimera'}
            >
              {draggableCollapsed ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="18 15 12 9 6 15" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              )}
            </button>
          </div>

          {/* ── Body (hidden when collapsed) ── */}
          {!draggableCollapsed && (
            <>
              {/* Voice strip */}
              {mode === 'call' && callStatus === 'active' && (
                <div className="border-b border-[var(--border)] bg-[var(--surface-alt)] flex items-center justify-between px-5 py-3">
                  <div className="flex items-end gap-0.5 h-5">{volumeBars}</div>
                  <span className="text-[10px] text-[var(--text-muted)]">
                    {isKolleganSpeaking ? 'Kollegan talar' : 'Din tur'}
                  </span>
                </div>
              )}

              {/* Connecting */}
              {mode === 'call' && callStatus === 'connecting' && connectingIndicator(false)}

              {/* ── Idle: action buttons ── */}
              {mode === 'idle' && (
                <div className="px-5 py-6 space-y-5">
                  <div>
                    <h4 className="font-heading text-base font-semibold text-[var(--text-primary)]">
                      Kontakta receptionen
                    </h4>
                    <p className="text-[var(--text-muted)] text-xs mt-1">
                      Ring Kollegan direkt eller starta en chatt
                    </p>
                  </div>

                  {/* Primary: Ring */}
                  <button
                    onClick={startCall}
                    className="group w-full flex items-center gap-4 bg-amber-500 hover:bg-amber-600 text-white rounded-xl px-5 py-4 transition-all duration-200 active:scale-[0.98] shadow-md shadow-amber-500/20 hover:shadow-amber-500/30"
                  >
                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                      </svg>
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-sm leading-none">Ring Kollegan</p>
                      <p className="text-white/70 text-xs mt-1">Snabbaste sättet att boka rum</p>
                    </div>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-auto opacity-70">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </button>

                  {/* Secondary: Chatta */}
                  <button
                    onClick={() => {
                      setMode('chat');
                      setMessages([{
                        id: crypto.randomUUID(),
                        role: 'kollegan',
                        text: 'Hej! Skriv ditt meddelande så hjälper jag dig. Vill du boka rum rekommenderar jag att ringa mig för snabbast hjälp!',
                        timestamp: new Date(),
                      }]);
                    }}
                    className="group w-full flex items-center gap-4 bg-[var(--surface-alt)] hover:bg-[var(--surface-hover)] border border-[var(--border)] hover:border-[var(--text-muted)]/30 text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-xl px-5 py-4 transition-all duration-200 active:scale-[0.98]"
                  >
                    <div className="w-10 h-10 rounded-full bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center shrink-0">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
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
                    <span className="text-[11px] text-[var(--text-muted)]">Kollegan är online och redo att hjälpa</span>
                  </div>
                </div>
              )}

              {/* Messages */}
              {(mode === 'call' || mode === 'chat') && messagesList('max-h-[340px]')}

              {/* Chat input */}
              {mode === 'chat' && (
                <div className="border-t border-[var(--border)] px-4 py-3 shrink-0">
                  <form onSubmit={(e) => { e.preventDefault(); sendChat(); }} className="flex gap-2">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder="Skriv ett meddelande..."
                      className="flex-1 bg-[var(--surface-alt)] border border-[var(--border)] rounded-lg px-3 py-2 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-amber-400 transition-colors"
                    />
                    <button
                      type="submit"
                      disabled={!chatInput.trim()}
                      className="bg-amber-500 hover:bg-amber-600 disabled:bg-[var(--surface-alt)] disabled:text-[var(--text-muted)] text-white rounded-lg px-3 py-2 transition-colors"
                      aria-label="Skicka"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="22" y1="2" x2="11" y2="13" />
                        <polygon points="22 2 15 22 11 13 2 9 22 2" />
                      </svg>
                    </button>
                  </form>
                </div>
              )}

              {/* End call */}
              {mode === 'call' && callStatus === 'active' && (
                <div className="border-t border-[var(--border)] px-5 py-3 shrink-0 flex justify-center">
                  <button
                    onClick={endCall}
                    className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800/50 rounded-full px-6 py-2 text-xs font-medium transition-all"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                    Avsluta samtal
                  </button>
                </div>
              )}

              {/* Chat footer nav */}
              {mode === 'chat' && (
                <div className="border-t border-[var(--border)] px-4 py-2 shrink-0 flex items-center gap-2">
                  <button
                    onClick={() => { setMode('idle'); setMessages([]); }}
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
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                    </svg>
                    Ring istället
                  </button>
                </div>
              )}

              {/* Call ended */}
              {mode === 'call' && callStatus === 'ended' && (
                <div className="border-t border-[var(--border)] px-5 py-3 shrink-0 text-center">
                  <p className="text-[var(--text-muted)] text-xs">Samtalet har avslutats</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  /* ═══════════════════════════════════════════
     FLOATING VARIANT (FAB)
  ═══════════════════════════════════════════ */
  return (
    <>
      {/* FAB button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 group"
          aria-label="Kontakta Kollegan"
        >
          <div className="relative w-14 h-14 rounded-full bg-amber-500 hover:bg-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20 group-hover:shadow-amber-500/30 group-hover:scale-105 transition-all duration-200 active:scale-95">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
            <div className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white">
              <div className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-75" />
            </div>
          </div>
          <div className="absolute -top-9 right-0 bg-[var(--text-primary)] text-[var(--surface)] rounded-lg px-3 py-1.5 text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none shadow-lg">
            Prata med Kollegan
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
                <KBadge size="md" />
                <div
                  className={[
                    'absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[var(--surface)]',
                    callStatus === 'active' ? 'bg-emerald-500' : 'bg-amber-400',
                  ].join(' ')}
                />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-heading text-sm font-semibold text-[var(--text-primary)] leading-none">Kollegan</h3>
                <p className="text-[var(--text-muted)] text-xs mt-0.5 truncate">{statusText}</p>
              </div>
              <button
                onClick={() => {
                  if (callStatus === 'active') endCall();
                  setOpen(false);
                  if (mode !== 'call') { setMode('idle'); setMessages([]); }
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

            {mode === 'call' && callStatus === 'active' && voiceStrip(false)}
            {mode === 'call' && callStatus === 'connecting' && connectingIndicator(false)}

            {mode === 'idle' && (
              <div className="px-5 py-6 space-y-4">
                <div>
                  <h4 className="font-heading text-base font-semibold text-[var(--text-primary)]">Kontakta receptionen</h4>
                  <p className="text-[var(--text-muted)] text-xs mt-0.5">Välj hur du vill nå oss</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={startCall}
                    className="group flex flex-col items-center gap-2.5 bg-[var(--surface-alt)] hover:bg-amber-50 dark:hover:bg-amber-900/10 border border-[var(--border)] hover:border-amber-300 dark:hover:border-amber-700 rounded-xl px-4 py-4 transition-all duration-200 active:scale-[0.97]"
                  >
                    <div className="w-9 h-9 rounded-full bg-amber-100 dark:bg-amber-900/30 group-hover:bg-amber-200 dark:group-hover:bg-amber-900/50 flex items-center justify-center transition-colors">
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="rgb(217 119 6)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                      </svg>
                    </div>
                    <span className="text-xs font-medium text-[var(--text-secondary)] group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors">Ring oss</span>
                  </button>

                  <button
                    onClick={() => {
                      setMode('chat');
                      setMessages([{
                        id: crypto.randomUUID(),
                        role: 'kollegan',
                        text: 'Hej! Skriv ditt meddelande så hjälper jag dig. Vill du boka rum rekommenderar jag att ringa mig för snabbast hjälp!',
                        timestamp: new Date(),
                      }]);
                    }}
                    className="group flex flex-col items-center gap-2.5 bg-[var(--surface-alt)] hover:bg-[var(--surface-hover)] border border-[var(--border)] rounded-xl px-4 py-4 transition-all duration-200 active:scale-[0.97]"
                  >
                    <div className="w-9 h-9 rounded-full bg-[var(--surface)] border border-[var(--border)] group-hover:bg-[var(--surface-alt)] flex items-center justify-center transition-colors">
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                      </svg>
                    </div>
                    <span className="text-xs font-medium text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors">Chatta</span>
                  </button>
                </div>
              </div>
            )}

            {(mode === 'call' || mode === 'chat') && messagesList('max-h-[320px]')}

            {mode === 'chat' && (
              <div className="border-t border-[var(--border)] px-4 py-3 shrink-0">
                <form onSubmit={(e) => { e.preventDefault(); sendChat(); }} className="flex gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Skriv ett meddelande..."
                    className="flex-1 bg-[var(--surface-alt)] border border-[var(--border)] rounded-lg px-3 py-2 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-amber-400 transition-colors"
                  />
                  <button
                    type="submit"
                    disabled={!chatInput.trim()}
                    className="bg-amber-500 hover:bg-amber-600 disabled:bg-[var(--surface-alt)] disabled:text-[var(--text-muted)] text-white rounded-lg px-3 py-2 transition-colors"
                    aria-label="Skicka"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="22" y1="2" x2="11" y2="13" />
                      <polygon points="22 2 15 22 11 13 2 9 22 2" />
                    </svg>
                  </button>
                </form>
              </div>
            )}

            {mode === 'call' && callStatus === 'active' && (
              <div className="border-t border-[var(--border)] px-5 py-3 shrink-0 flex justify-center">
                <button
                  onClick={endCall}
                  className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800/50 rounded-full px-6 py-2 text-xs font-medium transition-all"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                  Avsluta samtal
                </button>
              </div>
            )}

            {mode === 'chat' && (
              <div className="border-t border-[var(--border)] px-4 py-2 shrink-0 flex items-center gap-2">
                <button
                  onClick={() => { setMode('idle'); setMessages([]); }}
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
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                  Ring istället
                </button>
              </div>
            )}

            {mode === 'call' && callStatus === 'ended' && (
              <div className="border-t border-[var(--border)] px-5 py-3 shrink-0 text-center">
                <p className="text-[var(--text-muted)] text-xs">Samtalet har avslutats</p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
