'use client';

/**
 * /messages
 *
 * Messaging hub — internal team conversations and AI-call transcript references.
 * Full CRUD: list conversations, create new one, send messages.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { cn } from '@shared/lib/utils';
import {
  createConversation as createConversationRequest,
  listConversations,
  listMessages,
  sendMessage as sendMessageRequest,
  type Conversation,
  type Message,
} from '@shared/lib/api/messages.api';

// ─── Types ────────────────────────────────────────────────────────────────────

const AVATAR_COLORS = ['bg-violet-500','bg-blue-500','bg-emerald-500','bg-amber-500','bg-rose-500','bg-sky-500'];
const avatarColor = (str: string) => AVATAR_COLORS[str.charCodeAt(0) % AVATAR_COLORS.length];
const initials    = (name: string) => name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days  = Math.floor(diff / 86_400_000);
  if (mins   < 1)   return 'Nu';
  if (mins   < 60)  return `${mins}m`;
  if (hours  < 24)  return `${hours}h`;
  if (days   < 7)   return `${days}d`;
  return new Date(iso).toLocaleDateString('sv-SE', { day: '2-digit', month: 'short' });
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function MessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selected,      setSelected]      = useState<Conversation | null>(null);
  const [messages,      setMessages]      = useState<Message[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [msgLoading,    setMsgLoading]    = useState(false);
  const [error,         setError]         = useState<string | null>(null);
  const [newMsg,        setNewMsg]        = useState('');
  const [sending,       setSending]       = useState(false);
  const [search,        setSearch]        = useState('');
  const [showNewForm,   setShowNewForm]   = useState(false);
  const [newTitle,      setNewTitle]      = useState('');
  const [newInitMsg,    setNewInitMsg]    = useState('');
  const [creating,      setCreating]      = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const loadConversations = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const result = await listConversations({ limit: 50, offset: 0 });
      setConversations(result.conversations);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadConversations(); }, [loadConversations]);

  const loadMessages = useCallback(async (convId: string) => {
    setMsgLoading(true);
    try {
      const result = await listMessages(convId, { limit: 100, offset: 0 });
      setMessages(result.messages);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    } catch {
      setMessages([]);
    } finally {
      setMsgLoading(false);
    }
  }, []);

  const selectConversation = (conv: Conversation) => {
    setSelected(conv);
    void loadMessages(conv.id);
  };

  const sendMessage = useCallback(async () => {
    if (!selected || !newMsg.trim()) return;
    setSending(true);
    try {
      await sendMessageRequest(selected.id, { body: newMsg.trim() });
      setNewMsg('');
      await loadMessages(selected.id);
      await loadConversations(true);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSending(false);
    }
  }, [selected, newMsg, loadMessages, loadConversations]);

  const createConversation = useCallback(async () => {
    if (!newTitle.trim()) return;
    setCreating(true);
    try {
      await createConversationRequest({
        title:          newTitle.trim(),
        type:           'group',
        participantIds: [],
        initialMessage: newInitMsg.trim() || undefined,
      });
      setShowNewForm(false);
      setNewTitle('');
      setNewInitMsg('');
      await loadConversations(true);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setCreating(false);
    }
  }, [newTitle, newInitMsg, loadConversations]);

  const filtered = conversations.filter(c =>
    !search.trim() || (c.title ?? '').toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="px-8 py-10 max-w-6xl mx-auto">

      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-[var(--text-primary)] mb-1">Meddelanden</h1>
          <p className="text-sm text-[var(--text-muted)]">Teamkommunikation och AI-samtalsutskrifter.</p>
        </div>
        <button
          type="button"
          onClick={() => setShowNewForm(v => !v)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--accent)] text-white text-sm font-medium hover:opacity-90 transition-opacity shrink-0"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Nytt samtal
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 dark:border-red-800/40 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-400 flex items-center justify-between gap-3">
          <span>{error}</span>
          <button type="button" onClick={() => setError(null)} className="shrink-0 opacity-60 hover:opacity-100">✕</button>
        </div>
      )}

      {/* New conversation form */}
      {showNewForm && (
        <div className="mb-6 rounded-2xl border border-[var(--accent)]/30 bg-[var(--surface)] p-5 space-y-3">
          <p className="text-sm font-semibold text-[var(--text-primary)]">Nytt samtal</p>
          <input
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            placeholder="Titel (t.ex. Projektstatus Q2)"
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-alt)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] transition-colors"
          />
          <textarea
            value={newInitMsg}
            onChange={e => setNewInitMsg(e.target.value)}
            rows={2}
            placeholder="Valfritt startmeddelande…"
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-alt)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] transition-colors resize-none"
          />
          <div className="flex gap-2">
            <button type="button" onClick={() => void createConversation()} disabled={creating || !newTitle.trim()}
              className="rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50 transition-opacity">
              {creating ? 'Skapar…' : 'Skapa'}
            </button>
            <button type="button" onClick={() => setShowNewForm(false)}
              className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] transition-colors">
              Avbryt
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5" style={{ height: 'calc(100vh - 280px)', minHeight: '500px' }}>

        {/* Conversation list */}
        <div className="md:col-span-1 rounded-2xl border border-[var(--border)] overflow-hidden flex flex-col">
          <div className="p-3 border-b border-[var(--border)] bg-[var(--surface-alt)] shrink-0">
            <div className="relative">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="search"
                placeholder="Sök samtal…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-xs placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] transition-colors"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center p-8 gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin text-[var(--text-muted)]">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
                <span className="text-xs text-[var(--text-muted)]">Laddar…</span>
              </div>
            ) : filtered.length === 0 ? (
              <div className="p-6 text-center">
                <p className="text-xs text-[var(--text-muted)]">
                  {search ? 'Inga samtal matchar sökningen' : 'Inga samtal ännu — skapa ett nytt'}
                </p>
              </div>
            ) : (
              filtered.map((conv) => (
                <button
                  key={conv.id}
                  type="button"
                  onClick={() => selectConversation(conv)}
                  className={cn(
                    'w-full flex items-start gap-3 px-4 py-3 border-b border-[var(--border)] last:border-0 transition-colors text-left',
                    selected?.id === conv.id
                      ? 'bg-[var(--accent)]/8 border-l-2 border-l-[var(--accent)]'
                      : 'bg-[var(--surface)] hover:bg-[var(--surface-hover)]',
                  )}
                >
                  <div className={`w-9 h-9 rounded-full ${avatarColor(conv.id)} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                    {conv.title ? initials(conv.title) : '#'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-semibold text-[var(--text-primary)] truncate">{conv.title ?? `Samtal ${conv.id.slice(0, 6)}`}</span>
                      <span className="text-[10px] text-[var(--text-muted)] shrink-0">{relativeTime(conv.updatedAt)}</span>
                    </div>
                    {conv.lastMessage && (
                      <p className="text-[11px] text-[var(--text-muted)] truncate mt-0.5">
                        {conv.lastMessage.senderName}: {conv.lastMessage.body}
                      </p>
                    )}
                  </div>
                  {conv.unreadCount > 0 && (
                    <span className="shrink-0 w-4 h-4 rounded-full bg-[var(--accent)] text-white text-[10px] font-bold flex items-center justify-center">
                      {conv.unreadCount}
                    </span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Message thread */}
        <div className="md:col-span-2 rounded-2xl border border-[var(--border)] bg-[var(--surface)] flex flex-col overflow-hidden">
          {!selected ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 py-20 text-center px-6">
              <div className="w-14 h-14 rounded-2xl bg-[var(--accent)]/8 flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--text-primary)] mb-1">Välj ett samtal</p>
                <p className="text-xs text-[var(--text-muted)] max-w-xs leading-relaxed">
                  Klicka på ett samtal till vänster för att läsa och svara.
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Chat header */}
              <div className="px-5 py-3 border-b border-[var(--border)] bg-[var(--surface-alt)] shrink-0">
                <p className="text-sm font-semibold text-[var(--text-primary)]">{selected.title ?? `Samtal ${selected.id.slice(0, 6)}`}</p>
                <p className="text-xs text-[var(--text-muted)]">{selected.participantCount} deltagare · {selected.type}</p>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {msgLoading ? (
                  <div className="flex items-center justify-center py-10 gap-2">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin text-[var(--text-muted)]">
                      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                    </svg>
                    <span className="text-xs text-[var(--text-muted)]">Laddar meddelanden…</span>
                  </div>
                ) : messages.length === 0 ? (
                  <p className="text-center text-xs text-[var(--text-muted)] py-10">Inga meddelanden ännu — skriv det första!</p>
                ) : (
                  messages.map(msg => (
                    <div key={msg.id} className="flex items-start gap-2.5">
                      <div className={`w-7 h-7 rounded-full ${msg.type === 'system' ? 'bg-[var(--surface-alt)]' : avatarColor(msg.senderId)} flex items-center justify-center text-white text-[10px] font-bold shrink-0`}>
                        {msg.type === 'system' ? '⚙' : initials(msg.senderName)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2 mb-0.5">
                          <span className="text-xs font-semibold text-[var(--text-primary)]">{msg.senderName}</span>
                          <span className="text-[10px] text-[var(--text-muted)]">{relativeTime(msg.createdAt)}</span>
                        </div>
                        <p className="text-sm text-[var(--text-secondary)] leading-relaxed break-words">{msg.body}</p>
                      </div>
                    </div>
                  ))
                )}
                <div ref={bottomRef} />
              </div>

              {/* Input */}
              <div className="px-4 py-3 border-t border-[var(--border)] bg-[var(--surface-alt)] shrink-0">
                <div className="flex items-end gap-2">
                  <textarea
                    value={newMsg}
                    onChange={e => setNewMsg(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void sendMessage(); } }}
                    placeholder="Skriv ett meddelande… (Enter för att skicka)"
                    rows={1}
                    className="flex-1 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] transition-colors resize-none"
                  />
                  <button
                    type="button"
                    onClick={() => void sendMessage()}
                    disabled={sending || !newMsg.trim()}
                    className="shrink-0 w-9 h-9 rounded-xl bg-[var(--accent)] flex items-center justify-center text-white hover:opacity-90 disabled:opacity-40 transition-opacity"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
                    </svg>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
