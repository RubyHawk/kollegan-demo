'use client';

import type { Dispatch, SetStateAction } from 'react';
import type { VoiceBrand } from '../../domain/voice-brand.vo';
import type { UseVapiReturn } from '../hooks/use-vapi';
import { InlineVolumeBars } from './voice-strip';
import { ConnectingIndicator } from './connecting-indicator';
import { MessageList } from './message-list';
import { ChatInput } from './chat-input';
import {
  CHAT_PATH,
  HANGUP_PATH,
  PHONE_PATH,
  VoiceAvatarBadge,
  VoiceCallEndedFooter,
  VoiceChatFooterNav,
  VoiceHangupButton,
  VoiceStatusDot,
  formatVoiceDuration,
} from './voice-contact-chrome';

interface VoiceContactDraggableProps extends Pick<UseVapiReturn,
  | 'mode'
  | 'callStatus'
  | 'messages'
  | 'setMessages'
  | 'activeTranscript'
  | 'volumeLevel'
  | 'isSpeaking'
  | 'callDuration'
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
  draggablePos: { x: number; y: number };
  draggableCollapsed: boolean;
  setDraggableCollapsed: Dispatch<SetStateAction<boolean>>;
  isDragging: boolean;
  handleDragStart: (event: { preventDefault(): void; clientX: number; clientY: number }) => void;
}

export function VoiceContactDraggable({
  brand,
  isDark,
  mode,
  callStatus,
  messages,
  activeTranscript,
  volumeLevel,
  isSpeaking,
  callDuration,
  chatInput,
  setChatInput,
  setMessages,
  startCall,
  endCall,
  sendChat,
  statusText,
  openChat,
  resetToIdle,
  draggablePos,
  draggableCollapsed,
  setDraggableCollapsed,
  isDragging,
  handleDragStart,
}: VoiceContactDraggableProps) {
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
              'bg-[var(--surface-alt)] border-b border-[var(--border)]',
              draggableCollapsed ? 'py-2' : 'py-3',
            ].join(' ')}
          >
            {/* Grip icon — label hidden when collapsed to save space */}
            <div className={[
              'flex items-center shrink-0 bg-[var(--surface)] border border-[var(--border)] rounded-lg',
              draggableCollapsed ? 'p-1.5' : 'gap-1.5 px-2 py-1',
            ].join(' ')}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="text-[var(--text-muted)] shrink-0">
                <circle cx="8" cy="5" r="2" /><circle cx="16" cy="5" r="2" />
                <circle cx="8" cy="12" r="2" /><circle cx="16" cy="12" r="2" />
                <circle cx="8" cy="19" r="2" /><circle cx="16" cy="19" r="2" />
              </svg>
              {!draggableCollapsed && (
                <span className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider select-none">Dra</span>
              )}
            </div>

            {/* Avatar badge */}
            <div className="relative shrink-0">
                  {<VoiceAvatarBadge brand={brand} isDark={isDark} isSpeaking={isSpeaking} size={draggableCollapsed ? 'sm' : 'md'} />}
                  {<VoiceStatusDot callStatus={callStatus} isDark={isDark} size={draggableCollapsed ? 'sm' : 'md'} />}
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
                    className="flex items-center gap-1 bg-purple-700 hover:bg-purple-800 dark:bg-amber-500 dark:hover:bg-amber-600 text-white rounded-lg px-2 py-1.5 text-[11px] font-semibold transition-all active:scale-95"
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
                  <div className="flex items-center gap-1 bg-[var(--surface-alt)] border border-[var(--border)] rounded-lg px-2 py-1.5">
                    <div className="w-2.5 h-2.5 rounded-full border-[1.5px] border-[var(--accent)] border-t-transparent animate-spin shrink-0" />
                    <span className="text-[10px] text-[var(--text-secondary)] font-medium">Ansluter</span>
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
                        {formatVoiceDuration(callDuration)}
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

            {/* Expand / collapse */}
            <button
              onMouseDown={(e) => e.stopPropagation()}
              onClick={() => setDraggableCollapsed((c) => !c)}
              className={[
                'flex items-center gap-1.5 shrink-0 rounded-xl border transition-all font-medium',
                draggableCollapsed
                  ? 'px-3 py-2 text-sm bg-[var(--accent)] border-[var(--accent)] text-white hover:opacity-90'
                  : 'px-2.5 py-1.5 text-xs text-[var(--text-secondary)] border-[var(--border)] bg-[var(--surface-alt)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]',
              ].join(' ')}
              aria-label={draggableCollapsed ? 'Expandera' : 'Minimera'}
            >
              <svg width={draggableCollapsed ? 15 : 13} height={draggableCollapsed ? 15 : 13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                {draggableCollapsed
                  ? <polyline points="18 15 12 9 6 15" />
                  : <polyline points="6 9 12 15 18 9" />}
              </svg>
              <span>{draggableCollapsed ? 'Expandera' : 'Minimera'}</span>
            </button>
          </div>

          {/* ── Body (hidden when collapsed) ── */}
          {!draggableCollapsed && (
            <>
              {/* Active call banner */}
              {mode === 'call' && callStatus === 'active' && (
                <div className={[
                  'border-b px-5 py-3.5 shrink-0 flex items-center gap-3 transition-colors duration-300',
                  isSpeaking
                    ? 'bg-emerald-50/70 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800/30'
                    : 'bg-[var(--surface-alt)] border-[var(--border)]',
                ].join(' ')}>
                  <div className="relative shrink-0">
                        {<VoiceAvatarBadge brand={brand} isDark={isDark} isSpeaking={isSpeaking} size="sm" />}
                    <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-[1.5px] border-[var(--surface)]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={['text-xs font-semibold leading-none truncate', isSpeaking ? 'text-emerald-700 dark:text-emerald-400' : 'text-[var(--text-primary)]'].join(' ')}>
                      {isSpeaking ? `${brand.name} talar` : 'Din tur att prata'}
                    </p>
                    <div className="flex items-end gap-0.5 h-3.5 mt-1.5">
                      <InlineVolumeBars volumeLevel={volumeLevel} callActive />
                    </div>
                  </div>
                  <span className="font-mono text-xs font-semibold tabular-nums shrink-0 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-md px-2 py-0.5 border border-emerald-200 dark:border-emerald-800/50">
                    {formatVoiceDuration(callDuration)}
                  </span>
                </div>
              )}

              {/* Connecting */}
              {mode === 'call' && callStatus === 'connecting' && (
                <ConnectingIndicator brand={brand} />
              )}
              {mode === 'call' && callStatus === 'connecting' && (
                <div className="px-5 pb-3 shrink-0 flex justify-center">
                  <button
                    onClick={endCall}
                    className="text-xs text-[var(--text-muted)] hover:text-red-500 dark:hover:text-red-400 transition-colors flex items-center gap-1.5"
                  >
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d={HANGUP_PATH} /><line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                    Avbryt
                  </button>
                </div>
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
                    className="group w-full flex items-center gap-4 bg-purple-700 hover:bg-purple-800 dark:bg-amber-500 dark:hover:bg-amber-600 text-white rounded-xl px-5 py-4 transition-all duration-200 active:scale-[0.98] shadow-md shadow-purple-700/20 dark:shadow-amber-500/20"
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
                  <VoiceHangupButton isDark={isDark} onEndCall={endCall} />
                </div>
              )}

              {/* Chat footer nav */}
              {mode === 'chat' && <VoiceChatFooterNav isDark={isDark} onBack={resetToIdle} onStartCall={startCall} />}

              {/* Call ended */}
              {mode === 'call' && callStatus === 'ended' && <VoiceCallEndedFooter isDark={isDark} onClose={resetToIdle} onCallAgain={() => { setMessages([]); startCall(); }} />}
            </>
          )}
        </div>
      </div>
    );
}
