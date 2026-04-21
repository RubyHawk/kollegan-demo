'use client';

import type { VoiceBrand } from '../../domain/voice-brand.vo';
import type { UseVapiReturn } from '../hooks/use-vapi';
import { VoiceStrip } from './voice-strip';
import { ConnectingIndicator } from './connecting-indicator';
import { MessageList } from './message-list';
import { ChatInput } from './chat-input';
import {
  CHAT_PATH,
  PHONE_PATH,
  VoiceAvatarBadge,
  VoiceCallEndedFooter,
  VoiceHangupButton,
  VoiceStatusDot,
} from './voice-contact-chrome';

interface VoiceContactSidebarProps extends Pick<UseVapiReturn,
  | 'mode'
  | 'callStatus'
  | 'messages'
  | 'setMessages'
  | 'activeTranscript'
  | 'volumeLevel'
  | 'isSpeaking'
  | 'chatInput'
  | 'setChatInput'
  | 'startCall'
  | 'endCall'
  | 'sendChat'
> {
  brand: VoiceBrand;
  isDark: boolean;
  statusText: string;
  openChat: (long?: boolean) => void;
  resetToIdle: () => void;
}

export function VoiceContactSidebar({
  brand,
  isDark,
  mode,
  callStatus,
  messages,
  activeTranscript,
  volumeLevel,
  isSpeaking,
  chatInput,
  setChatInput,
  setMessages,
  startCall,
  endCall,
  sendChat,
  statusText,
  openChat,
  resetToIdle,
}: VoiceContactSidebarProps) {
  if (isDark) {
    return (
        <div className="bg-navy-900 rounded-xl overflow-hidden border border-navy-700">
          {/* Compact header */}
          <div className="bg-gradient-to-r from-navy-800 to-navy-900 px-3 py-2.5 flex items-center gap-2">
            <div className="relative">
              {<VoiceAvatarBadge brand={brand} isDark={isDark} isSpeaking={isSpeaking} size="sm" />}
              {<VoiceStatusDot callStatus={callStatus} isDark={isDark} size="sm" />}
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
              <VoiceHangupButton isDark={isDark} onEndCall={endCall} compact />
            </div>
          )}

          {/* Call ended */}
          {mode === 'call' && callStatus === 'ended' && <VoiceCallEndedFooter isDark={isDark} onClose={resetToIdle} onCallAgain={() => { setMessages([]); startCall(); }} compact />}
        </div>
      );
    }

    /* ── Light sidebar (Kollegan) ── */
  return (
      <div className="rounded-xl border border-[var(--border)] overflow-hidden bg-[var(--surface)]">
        {/* Header */}
        <div className="px-3 py-2.5 flex items-center gap-2.5 bg-[var(--surface)]">
          <div className="relative">
            {<VoiceAvatarBadge brand={brand} isDark={isDark} isSpeaking={isSpeaking} size="sm" />}
            {<VoiceStatusDot callStatus={callStatus} isDark={isDark} size="sm" />}
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
              className="w-full flex items-center justify-center gap-2 bg-purple-700 hover:bg-purple-800 dark:bg-amber-500 dark:hover:bg-amber-600 text-white rounded-lg px-3 py-2 text-xs font-medium transition-all active:scale-[0.98]"
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
            <VoiceHangupButton isDark={isDark} onEndCall={endCall} compact />
          </div>
        )}

        {mode === 'call' && callStatus === 'ended' && <VoiceCallEndedFooter isDark={isDark} onClose={resetToIdle} onCallAgain={() => { setMessages([]); startCall(); }} compact />}
      </div>
    );
}
