'use client';

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { Hash, LoaderCircle, MessageSquare, Plus, Search, Send, Settings, X } from 'lucide-react';
import { cn } from '@shared/lib/utils';
import {
  createConversation as createConversationRequest,
  listConversations,
  listMessages,
  sendMessage as sendMessageRequest,
  type Conversation,
  type Message,
} from '@shared/lib/api/messages.api';
import { Button } from '@shared/ui/button';
import { EmptyState } from '@shared/ui/empty-state';
import { InlineAlert } from '@shared/ui/inline-alert';
import { Input } from '@shared/ui/input';
import { Panel } from '@shared/ui/panel';
import { StatusBadge } from '@shared/ui/status-badge';
import { Textarea } from '@shared/ui/textarea';

const initials = (name: string) => name.split(' ').map((word) => word[0]).slice(0, 2).join('').toUpperCase();

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);
  if (mins < 1) return 'Nu';
  if (mins < 60) return `${mins}m`;
  if (hours < 24) return `${hours}h`;
  if (days < 7) return `${days}d`;
  return new Date(iso).toLocaleDateString('sv-SE', { day: '2-digit', month: 'short' });
}

export default function MessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selected, setSelected] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [msgLoading, setMsgLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newMsg, setNewMsg] = useState('');
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState('');
  const [showNewForm, setShowNewForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newInitMsg, setNewInitMsg] = useState('');
  const [creating, setCreating] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const loadConversations = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const result = await listConversations({ limit: 50, offset: 0 });
      setConversations(result.conversations);
    } catch {
      setError('Kunde inte ladda meddelanden. Kontrollera anslutningen och försök igen.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadConversations();
  }, [loadConversations]);

  const loadMessages = useCallback(async (conversationId: string) => {
    setMsgLoading(true);
    try {
      const result = await listMessages(conversationId, { limit: 100, offset: 0 });
      setMessages(result.messages);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    } catch {
      setMessages([]);
    } finally {
      setMsgLoading(false);
    }
  }, []);

  const selectConversation = (conversation: Conversation) => {
    setSelected(conversation);
    void loadMessages(conversation.id);
  };

  const sendMessage = useCallback(async () => {
    if (!selected || !newMsg.trim()) return;
    setSending(true);
    try {
      await sendMessageRequest(selected.id, { body: newMsg.trim() });
      setNewMsg('');
      await loadMessages(selected.id);
      await loadConversations(true);
    } catch {
      setError('Kunde inte spara. Kontrollera anslutningen och försök igen.');
    } finally {
      setSending(false);
    }
  }, [loadConversations, loadMessages, newMsg, selected]);

  const createConversation = useCallback(async () => {
    if (!newTitle.trim()) return;
    setCreating(true);
    try {
      await createConversationRequest({
        title: newTitle.trim(),
        type: 'group',
        participantIds: [],
        initialMessage: newInitMsg.trim() || undefined,
      });
      setShowNewForm(false);
      setNewTitle('');
      setNewInitMsg('');
      await loadConversations(true);
    } catch {
      setError('Kunde inte spara. Kontrollera anslutningen och försök igen.');
    } finally {
      setCreating(false);
    }
  }, [loadConversations, newInitMsg, newTitle]);

  const filtered = conversations.filter((conversation) =>
    !search.trim() || (conversation.title ?? '').toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="mx-auto max-w-6xl space-y-5 px-4 py-6 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1">
          <h1 className="text-xl font-semibold text-[var(--ui-text)]">Meddelanden</h1>
          <p className="max-w-3xl text-sm leading-6 text-[var(--ui-text-muted)]">Teamkommunikation och AI-samtalsutskrifter.</p>
        </div>
        <Button type="button" onClick={() => setShowNewForm((value) => !value)}>
          <Plus size={16} strokeWidth={1.75} />
          Nytt samtal
        </Button>
      </header>

      {error ? (
        <InlineAlert tone="danger" title="Meddelanden kunde inte uppdateras">
          <div className="flex flex-wrap items-center gap-3">
            <span>{error}</span>
            <Button type="button" variant="secondary" size="compact" onClick={() => setError(null)}>
              <X size={16} strokeWidth={1.75} />
              Stäng
            </Button>
          </div>
        </InlineAlert>
      ) : null}

      {showNewForm ? (
        <Panel variant="selected" className="space-y-3">
          <p className="text-sm font-semibold text-[var(--ui-text)]">Nytt samtal</p>
          <Input value={newTitle} onChange={(event) => setNewTitle(event.target.value)} placeholder="Titel (t.ex. Projektstatus Q2)" />
          <Textarea value={newInitMsg} onChange={(event) => setNewInitMsg(event.target.value)} rows={2} placeholder="Valfritt startmeddelande..." />
          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={() => void createConversation()} disabled={creating || !newTitle.trim()} loading={creating}>Skapa</Button>
            <Button type="button" variant="secondary" onClick={() => setShowNewForm(false)}>Avbryt</Button>
          </div>
        </Panel>
      ) : null}

      <div className="grid min-h-[500px] grid-cols-1 gap-5 md:h-[calc(100vh-280px)] md:grid-cols-3">
        <Panel padding="none" className="flex min-h-0 flex-col overflow-hidden md:col-span-1">
          <div className="shrink-0 border-b border-[var(--ui-border)] bg-[var(--ui-surface-subtle)] p-3">
            <div className="relative">
              <Search size={16} strokeWidth={1.75} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ui-text-muted)]" />
              <Input
                type="search"
                placeholder="Sök samtal..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="h-9 pl-9 text-xs"
              />
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {loading ? (
              <LoadingRow>Laddar...</LoadingRow>
            ) : filtered.length === 0 ? (
              <EmptyState
                icon={MessageSquare}
                title={search ? 'Inga samtal matchar sökningen' : 'Inga samtal ännu'}
                description={search ? 'Justera sökningen och försök igen.' : 'Skapa ett nytt samtal för att komma igång.'}
                actionLabel={search ? undefined : 'Nytt samtal'}
                onAction={search ? undefined : () => setShowNewForm(true)}
              />
            ) : (
              filtered.map((conversation) => (
                <ConversationButton
                  key={conversation.id}
                  conversation={conversation}
                  selected={selected?.id === conversation.id}
                  onClick={() => selectConversation(conversation)}
                />
              ))
            )}
          </div>
        </Panel>

        <Panel padding="none" className="flex min-h-0 flex-col overflow-hidden md:col-span-2">
          {!selected ? (
            <div className="flex flex-1 items-center justify-center px-6 py-16">
              <EmptyState
                icon={MessageSquare}
                title="Välj ett samtal"
                description="Klicka på ett samtal till vänster för att läsa och svara."
              />
            </div>
          ) : (
            <>
              <div className="shrink-0 border-b border-[var(--ui-border)] bg-[var(--ui-surface-subtle)] px-4 py-3">
                <p className="text-sm font-semibold text-[var(--ui-text)]">{selected.title ?? `Samtal ${selected.id.slice(0, 6)}`}</p>
                <p className="text-xs text-[var(--ui-text-muted)]">{selected.participantCount} deltagare · {selected.type}</p>
              </div>

              <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
                {msgLoading ? (
                  <LoadingRow>Laddar meddelanden...</LoadingRow>
                ) : messages.length === 0 ? (
                  <EmptyState title="Inga meddelanden ännu" description="Skriv det första meddelandet i fältet nedan." />
                ) : (
                  messages.map((message) => <MessageItem key={message.id} message={message} />)
                )}
                <div ref={bottomRef} />
              </div>

              <div className="shrink-0 border-t border-[var(--ui-border)] bg-[var(--ui-surface-subtle)] px-4 py-3">
                <div className="flex items-end gap-2">
                  <Textarea
                    value={newMsg}
                    onChange={(event) => setNewMsg(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' && !event.shiftKey) {
                        event.preventDefault();
                        void sendMessage();
                      }
                    }}
                    placeholder="Skriv ett meddelande... (Enter för att skicka)"
                    rows={1}
                    className="min-h-10 flex-1 resize-none"
                  />
                  <Button type="button" size="icon" onClick={() => void sendMessage()} disabled={sending || !newMsg.trim()} loading={sending} aria-label="Skicka meddelande">
                    {!sending ? <Send size={16} strokeWidth={1.75} /> : null}
                  </Button>
                </div>
              </div>
            </>
          )}
        </Panel>
      </div>
    </div>
  );
}

function ConversationButton({ conversation, selected, onClick }: { conversation: Conversation; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex w-full items-start gap-3 border-b border-[var(--ui-border)] px-4 py-3 text-left transition-colors last:border-0 hover:bg-[var(--ui-surface-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--ui-focus)]',
        selected && 'border-l-2 border-l-[var(--ui-accent)] bg-[var(--ui-surface-selected)]',
      )}
    >
      <Avatar label={conversation.title ?? conversation.id} icon={!conversation.title ? Hash : undefined} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-xs font-semibold text-[var(--ui-text)]">{conversation.title ?? `Samtal ${conversation.id.slice(0, 6)}`}</span>
          <span className="shrink-0 text-[10px] text-[var(--ui-text-muted)]">{relativeTime(conversation.updatedAt)}</span>
        </div>
        {conversation.lastMessage ? (
          <p className="mt-0.5 truncate text-[11px] text-[var(--ui-text-muted)]">
            {conversation.lastMessage.senderName}: {conversation.lastMessage.body}
          </p>
        ) : null}
      </div>
      {conversation.unreadCount > 0 ? <StatusBadge tone="accent">{conversation.unreadCount}</StatusBadge> : null}
    </button>
  );
}

function MessageItem({ message }: { message: Message }) {
  const isSystem = message.type === 'system';

  return (
    <div className="flex items-start gap-2.5">
      <Avatar label={message.senderName} icon={isSystem ? Settings : undefined} muted={isSystem} />
      <div className="min-w-0 flex-1">
        <div className="mb-0.5 flex items-baseline gap-2">
          <span className="text-xs font-semibold text-[var(--ui-text)]">{message.senderName}</span>
          <span className="text-[10px] text-[var(--ui-text-muted)]">{relativeTime(message.createdAt)}</span>
        </div>
        <p className="break-words text-sm leading-6 text-[var(--ui-text-secondary)]">{message.body}</p>
      </div>
    </div>
  );
}

function Avatar({ label, icon: Icon, muted = false }: { label: string; icon?: typeof Hash; muted?: boolean }) {
  return (
    <span className={cn(
      'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-bold',
      muted
        ? 'border-[var(--ui-border)] bg-[var(--ui-surface-subtle)] text-[var(--ui-text-muted)]'
        : 'border-[var(--ui-accent-border)] bg-[var(--ui-accent-subtle)] text-[var(--ui-accent)]',
    )}>
      {Icon ? <Icon size={16} strokeWidth={1.75} /> : initials(label)}
    </span>
  );
}

function LoadingRow({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center justify-center gap-2 p-8 text-xs text-[var(--ui-text-muted)]">
      <LoaderCircle size={16} strokeWidth={1.75} className="animate-spin" />
      {children}
    </div>
  );
}
