'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Vapi from '@vapi-ai/web';
import type { CallStatus, Message, Mode, VoiceBrand } from '../../domain/voice-brand.vo';

const VAPI_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY || '';

export interface UseVapiReturn {
  mode: Mode;
  setMode: React.Dispatch<React.SetStateAction<Mode>>;
  callStatus: CallStatus;
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  activeTranscript: string;
  volumeLevel: number;
  isSpeaking: boolean;
  callDuration: number;
  chatInput: string;
  setChatInput: React.Dispatch<React.SetStateAction<string>>;
  startCall: () => Promise<void>;
  endCall: () => void;
  sendChat: () => void;
}

export function useVapi(brand: VoiceBrand): UseVapiReturn {
  const [mode, setMode] = useState<Mode>('idle');
  const [callStatus, setCallStatus] = useState<CallStatus>('idle');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [volumeLevel, setVolumeLevel] = useState(0);
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [activeTranscript, setActiveTranscript] = useState('');
  const [callStartedAt, setCallStartedAt] = useState<Date | null>(null);
  const [callDuration, setCallDuration] = useState(0);

  const vapiRef = useRef<Vapi | null>(null);
  const brandRef = useRef(brand);
  brandRef.current = brand;

  /* ── Call duration timer ── */
  useEffect(() => {
    if (callStatus !== 'active' || !callStartedAt) return;
    const id = setInterval(() => {
      setCallDuration(Math.floor((Date.now() - callStartedAt.getTime()) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [callStatus, callStartedAt]);

  /* ── Lazily initialise the Vapi SDK and bind event handlers ── */
  const getVapi = useCallback(() => {
    if (!vapiRef.current && VAPI_PUBLIC_KEY) {
      vapiRef.current = new Vapi(VAPI_PUBLIC_KEY);

      vapiRef.current.on('call-start', () => {
        setCallStatus('active');
        setCallStartedAt(new Date());
        setCallDuration(0);
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: 'assistant',
            text: brandRef.current.callStartMessage,
            timestamp: new Date(),
          },
        ]);
      });

      vapiRef.current.on('call-end', () => {
        setCallStatus('ended');
        setIsSpeaking(false);
        setVolumeLevel(0);
        setCallStartedAt(null);
        setCallDuration(0);
        setTimeout(() => {
          setCallStatus('idle');
          setMode('idle');
        }, 2000);
      });

      vapiRef.current.on('speech-start', () => setIsSpeaking(true));
      vapiRef.current.on('speech-end', () => setIsSpeaking(false));
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
                role: transcript.role === 'assistant' ? 'assistant' : 'user',
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

  /* ── Start a voice call ── */
  const startCall = useCallback(async () => {
    const vapi = getVapi();
    if (!vapi || !brandRef.current.assistantId) {
      setMessages([
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          text: brandRef.current.configErrorMessage,
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
      if (brandRef.current.fetchHotelInfo) {
        try {
          const res = await fetch('/api/ai/hotel-info');
          if (res.ok) {
            hotelInfoContext = JSON.stringify(await res.json());
          }
        } catch {
          // Non-fatal — proceed without context
        }
      }

      const overrides = hotelInfoContext
        ? { variableValues: { hotel_info: hotelInfoContext } }
        : undefined;

      await vapi.start(brandRef.current.assistantId, overrides);
    } catch {
      setCallStatus('idle');
      setMode('idle');
      setMessages([
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          text: brandRef.current.connectErrorMessage,
          timestamp: new Date(),
        },
      ]);
    }
  }, [getVapi]);

  /* ── End the current call ── */
  const endCall = useCallback(() => {
    vapiRef.current?.stop();
  }, []);

  /* ── Send a chat message (offline / non-voice) ── */
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
          role: 'assistant',
          text: brandRef.current.chatAutoReply,
          timestamp: new Date(),
        },
      ]);
    }, 1200);
  }, [chatInput]);

  /* ── Cleanup on unmount ── */
  useEffect(() => {
    return () => {
      vapiRef.current?.stop();
    };
  }, []);

  return {
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
  };
}
