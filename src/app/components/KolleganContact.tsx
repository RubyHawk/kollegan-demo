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
  variant?: 'floating' | 'sidebar';
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

  const vapiRef = useRef<Vapi | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeTranscript]);

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
      // Fetch hotel info to inject as context before starting the call
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

  const volumeBars = Array.from({ length: 5 }, (_, i) => {
    const threshold = i * 0.15;
    const active = volumeLevel > threshold && callStatus === 'active';
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
  });

  /* ═══════ Messages list (shared between both variants) ═══════ */
  const messagesList = (maxH: string) => (
    <div className={`flex-1 overflow-y-auto px-3 py-2 space-y-2 min-h-[120px] ${maxH}`}>
      {messages.map((msg) => (
        <div
          key={msg.id}
          className={['flex', msg.role === 'user' ? 'justify-end' : 'justify-start'].join(' ')}
        >
          <div
            className={[
              'max-w-[85%] rounded-2xl px-3 py-2 text-xs leading-relaxed',
              msg.role === 'kollegan'
                ? 'bg-navy-800 text-cream-100 rounded-bl-sm'
                : 'bg-gold-900 text-gold-400 rounded-br-sm',
            ].join(' ')}
          >
            {msg.role === 'kollegan' && (
              <span className="block text-gold-500 font-semibold text-[10px] mb-0.5 uppercase tracking-wide">Kollegan</span>
            )}
            {msg.text}
          </div>
        </div>
      ))}

      {activeTranscript && (
        <div className="flex justify-start">
          <div className="max-w-[85%] rounded-2xl px-3 py-2 text-xs leading-relaxed bg-navy-800 text-cream-400 rounded-bl-sm italic opacity-60">
            <span className="block text-gold-500 font-semibold text-[10px] mb-0.5 uppercase tracking-wide not-italic">Kollegan</span>
            {activeTranscript}...
          </div>
        </div>
      )}

      {mode === 'call' && isKolleganSpeaking && (
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

  /* ═══════ SIDEBAR VARIANT ═══════ */
  if (variant === 'sidebar') {
    return (
      <div className="bg-navy-900 rounded-xl overflow-hidden border border-navy-700">
        {/* Compact header */}
        <div className="bg-gradient-to-r from-navy-800 to-navy-900 px-3 py-2.5 flex items-center gap-2">
          <div className="relative">
            <div
              className={[
                'w-8 h-8 rounded-full bg-gradient-to-br from-gold-500 to-gold-600 flex items-center justify-center',
                isKolleganSpeaking ? 'maja-speaking-glow' : '',
              ].join(' ')}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0B1121" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <div className={['absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-[1.5px] border-navy-800', callStatus === 'active' ? 'bg-emerald-500' : 'bg-gold-500'].join(' ')} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-cream-100 font-heading font-semibold text-xs">Kollegan</h3>
            <p className="text-cream-400 text-[10px] truncate">
              {callStatus === 'connecting' && 'Ansluter...'}
              {callStatus === 'active' && (isKolleganSpeaking ? 'Talar...' : 'Lyssnar...')}
              {callStatus === 'ended' && 'Avslutat'}
              {callStatus === 'idle' && mode === 'chat' && 'Chatt'}
              {callStatus === 'idle' && mode === 'idle' && 'Receptionist'}
            </p>
          </div>
          {(mode === 'call' || mode === 'chat') && (
            <button
              onClick={() => {
                if (callStatus === 'active') endCall();
                setMode('idle');
                setMessages([]);
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
          <div className="px-3 py-2 border-t border-navy-700 flex items-center justify-center gap-2 bg-navy-800/50">
            <div className="flex items-end gap-1 h-6">{volumeBars}</div>
            <span className="text-[10px] text-cream-400">
              {isKolleganSpeaking ? 'Kollegan talar' : 'Din tur'}
            </span>
          </div>
        )}

        {/* Connecting */}
        {mode === 'call' && callStatus === 'connecting' && (
          <div className="px-3 py-4 border-t border-navy-700 flex flex-col items-center gap-2 bg-navy-800/50">
            <div className="maja-connecting-rings" style={{ width: 40, height: 40 }}>
              <div className="maja-ring maja-ring-1" />
              <div className="maja-ring maja-ring-2" />
              <div className="w-3 h-3 rounded-full bg-gold-500" />
            </div>
            <span className="text-[10px] text-cream-400">Ansluter...</span>
          </div>
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
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
                <span className="text-[11px] font-medium text-cream-100 group-hover:text-gold-400">Ring</span>
              </button>
              <button
                onClick={() => {
                  setMode('chat');
                  setMessages([
                    {
                      id: crypto.randomUUID(),
                      role: 'kollegan',
                      text: 'Hej! Skriv ditt meddelande så hjälper jag dig.',
                      timestamp: new Date(),
                    },
                  ]);
                }}
                className="group flex items-center justify-center gap-1.5 bg-navy-800 hover:bg-navy-700 border border-navy-700 hover:border-gold-600 rounded-lg px-2 py-2 transition-all"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#60A5FA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                <span className="text-[11px] font-medium text-cream-100 group-hover:text-gold-400">Chatta</span>
              </button>
            </div>
          </div>
        )}

        {/* Messages */}
        {(mode === 'call' || mode === 'chat') && messagesList('max-h-[220px]')}

        {/* Chat input */}
        {mode === 'chat' && (
          <div className="border-t border-navy-700 px-3 py-2">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendChat();
              }}
              className="flex gap-1.5"
            >
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Skriv..."
                className="flex-1 bg-navy-800 border border-navy-700 rounded-lg px-2.5 py-1.5 text-[11px] text-cream-100 placeholder-cream-600 focus:outline-none focus:border-gold-600 transition-colors"
              />
              <button
                type="submit"
                disabled={!chatInput.trim()}
                className="bg-gold-500 hover:bg-gold-400 disabled:bg-navy-700 disabled:text-cream-600 text-navy-950 rounded-lg px-2 py-1.5 transition-colors"
                aria-label="Skicka"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            </form>
          </div>
        )}

        {/* Call end button */}
        {mode === 'call' && callStatus === 'active' && (
          <div className="border-t border-navy-700 px-3 py-2 flex justify-center">
            <button
              onClick={endCall}
              className="flex items-center gap-1.5 bg-burgundy-800 hover:bg-burgundy-400 text-cream-100 rounded-full px-4 py-1.5 transition-colors text-xs maja-hangup-btn"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </svg>
              Avsluta
            </button>
          </div>
        )}

        {/* Call ended */}
        {mode === 'call' && callStatus === 'ended' && (
          <div className="border-t border-navy-700 px-3 py-2 text-center">
            <p className="text-cream-400 text-[10px]">Samtalet avslutat</p>
          </div>
        )}
      </div>
    );
  }

  /* ═══════ FLOATING VARIANT ═══════ */
  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 group"
          aria-label="Kontakta Kollegan"
        >
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-gold-500/20 maja-fab-ping" />
            <div className="absolute inset-0 rounded-full bg-gold-500/10 maja-fab-ping" style={{ animationDelay: '0.5s' }} />
            <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-gold-500 to-gold-600 flex items-center justify-center shadow-lg shadow-gold-500/25 group-hover:shadow-gold-500/40 group-hover:scale-105 transition-all duration-300">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#0B1121" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-emerald-500 border-2 border-[var(--page-bg)]">
                <div className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-75" />
              </div>
            </div>
          </div>
          <div className="absolute -top-8 right-0 bg-stone-800 border border-stone-700 rounded-lg px-3 py-1 text-xs text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none shadow-lg">
            Prata med Kollegan
          </div>
        </button>
      )}

      {open && (
        <div className="fixed bottom-6 right-6 z-50 w-[360px] maja-panel-enter">
          <div className="bg-navy-900 border border-navy-700 rounded-2xl shadow-2xl shadow-black/40 overflow-hidden flex flex-col" style={{ maxHeight: 'calc(100vh - 48px)' }}>
            <div className="bg-gradient-to-r from-navy-800 to-navy-900 border-b border-navy-700 px-5 py-4 flex items-center gap-3 shrink-0">
              <div className="relative">
                <div
                  className={[
                    'w-11 h-11 rounded-full bg-gradient-to-br from-gold-500 to-gold-600 flex items-center justify-center transition-all duration-300',
                    isKolleganSpeaking ? 'maja-speaking-glow' : '',
                  ].join(' ')}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0B1121" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
                <div className={['absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-navy-800', callStatus === 'active' ? 'bg-emerald-500' : 'bg-gold-500'].join(' ')} />
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="text-cream-100 font-heading font-semibold text-sm">Kollegan</h3>
                <p className="text-cream-400 text-xs truncate">
                  {callStatus === 'connecting' && 'Ansluter...'}
                  {callStatus === 'active' && (isKolleganSpeaking ? 'Talar...' : 'Lyssnar...')}
                  {callStatus === 'ended' && 'Samtalet avslutat'}
                  {callStatus === 'idle' && mode === 'chat' && 'Chatt'}
                  {callStatus === 'idle' && mode === 'idle' && 'Receptionist — Grand Hotel Kollegan'}
                </p>
              </div>

              <button
                onClick={() => {
                  if (callStatus === 'active') endCall();
                  setOpen(false);
                  if (mode !== 'call') {
                    setMode('idle');
                    setMessages([]);
                  }
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
              <div className="px-5 py-4 border-b border-navy-700 flex items-center justify-center gap-3 bg-navy-800/50">
                <div className="flex items-end gap-1 h-8">{volumeBars}</div>
                <div className="flex items-center gap-2">
                  <div className={['w-2 h-2 rounded-full', isKolleganSpeaking ? 'bg-gold-400 maja-speak-dot' : 'bg-cream-600'].join(' ')} />
                  <span className="text-xs text-cream-400">{isKolleganSpeaking ? 'Kollegan talar' : 'Din tur att prata'}</span>
                </div>
              </div>
            )}

            {mode === 'call' && callStatus === 'connecting' && (
              <div className="px-5 py-8 border-b border-navy-700 flex flex-col items-center gap-3 bg-navy-800/50">
                <div className="maja-connecting-rings">
                  <div className="maja-ring maja-ring-1" />
                  <div className="maja-ring maja-ring-2" />
                  <div className="maja-ring maja-ring-3" />
                  <div className="w-5 h-5 rounded-full bg-gold-500" />
                </div>
                <span className="text-xs text-cream-400 mt-2">Ansluter till Kollegan...</span>
              </div>
            )}

            {mode === 'idle' && (
              <div className="px-5 py-6 space-y-4">
                <div className="text-center">
                  <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-gold-500 to-gold-600 flex items-center justify-center mb-3 maja-avatar-breathe">
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#0B1121" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </div>
                  <h3 className="font-heading text-lg font-bold text-cream-100">Hej, jag är Kollegan!</h3>
                  <p className="text-cream-400 text-xs mt-1 leading-relaxed">
                    Receptionist på Grand Hotel Kollegan.<br />
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
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                      </svg>
                    </div>
                    <span className="text-xs font-medium text-cream-100 group-hover:text-gold-400 transition-colors">Ring Kollegan</span>
                  </button>

                  <button
                    onClick={() => {
                      setMode('chat');
                      setMessages([
                        {
                          id: crypto.randomUUID(),
                          role: 'kollegan',
                          text: 'Hej! Skriv ditt meddelande så hjälper jag dig. Vill du boka rum rekommenderar jag att ringa mig för snabbast hjälp!',
                          timestamp: new Date(),
                        },
                      ]);
                    }}
                    className="group flex flex-col items-center gap-2 bg-navy-800 hover:bg-navy-700 border border-navy-700 hover:border-gold-600 rounded-xl px-4 py-4 transition-all duration-200"
                  >
                    <div className="w-10 h-10 rounded-full bg-blue-900/60 group-hover:bg-blue-900 flex items-center justify-center transition-colors">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#60A5FA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                      </svg>
                    </div>
                    <span className="text-xs font-medium text-cream-100 group-hover:text-gold-400 transition-colors">Chatta</span>
                  </button>
                </div>
              </div>
            )}

            {(mode === 'call' || mode === 'chat') && messagesList('max-h-[340px]')}

            {mode === 'chat' && (
              <div className="border-t border-navy-700 px-4 py-3 shrink-0">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    sendChat();
                  }}
                  className="flex gap-2"
                >
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Skriv ett meddelande..."
                    className="flex-1 bg-navy-800 border border-navy-700 rounded-lg px-3 py-2 text-xs text-cream-100 placeholder-cream-600 focus:outline-none focus:border-gold-600 transition-colors"
                  />
                  <button
                    type="submit"
                    disabled={!chatInput.trim()}
                    className="bg-gold-500 hover:bg-gold-400 disabled:bg-navy-700 disabled:text-cream-600 text-navy-950 rounded-lg px-3 py-2 transition-colors"
                    aria-label="Skicka"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="22" y1="2" x2="11" y2="13" />
                      <polygon points="22 2 15 22 11 13 2 9 22 2" />
                    </svg>
                  </button>
                </form>
              </div>
            )}

            {mode === 'call' && callStatus === 'active' && (
              <div className="border-t border-navy-700 px-5 py-4 shrink-0 flex justify-center">
                <button
                  onClick={endCall}
                  className="flex items-center gap-2 bg-burgundy-800 hover:bg-burgundy-400 text-cream-100 rounded-full px-6 py-2.5 transition-colors maja-hangup-btn"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                  <span className="text-sm font-medium">Avsluta samtal</span>
                </button>
              </div>
            )}

            {mode === 'chat' && (
              <div className="border-t border-navy-700 px-4 py-2 shrink-0 flex items-center gap-2">
                <button
                  onClick={() => {
                    setMode('idle');
                    setMessages([]);
                  }}
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
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                  Ring istället
                </button>
              </div>
            )}

            {mode === 'call' && callStatus === 'ended' && (
              <div className="border-t border-navy-700 px-5 py-4 shrink-0 text-center">
                <p className="text-cream-400 text-xs">Samtalet har avslutats</p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
