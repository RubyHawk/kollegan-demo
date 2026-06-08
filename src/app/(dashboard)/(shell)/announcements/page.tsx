'use client';

import { useCallback, useEffect, useState } from 'react';
import { Bell, LoaderCircle, Pin, Plus, X } from 'lucide-react';
import { cn } from '@shared/lib/utils';
import {
  createAnnouncement,
  deleteAnnouncement as deleteAnnouncementRequest,
  listAnnouncements,
  markAnnouncementRead,
  updateAnnouncement,
  type Announcement,
  type AnnouncementPriority,
} from '@shared/lib/api/announcements.api';
import { Button } from '@shared/ui/button';
import { ConfirmDestructiveDialog } from '@shared/ui/confirm-destructive-dialog';
import { EmptyState } from '@shared/ui/empty-state';
import { InlineAlert } from '@shared/ui/inline-alert';
import { Input } from '@shared/ui/input';
import { Panel } from '@shared/ui/panel';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@shared/ui/select';
import { StatusBadge, type StatusTone } from '@shared/ui/status-badge';
import { Textarea } from '@shared/ui/textarea';

type Priority = AnnouncementPriority;

const PRIORITY_LABEL: Record<Priority, string> = {
  normal: 'Normal',
  important: 'Viktig',
  urgent: 'Brådskande',
};

const PRIORITY_TONE: Record<Priority, StatusTone> = {
  normal: 'neutral',
  important: 'warning',
  urgent: 'danger',
};

const EMPTY_FORM = { title: '', content: '', priority: 'normal' as Priority, isPinned: false, expiresAt: '' };

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('sv-SE', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editing, setEditing] = useState<Announcement | null>(null);
  const [saving, setSaving] = useState(false);
  const [acting, setActing] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [confirmDeleteAnnouncement, setConfirmDeleteAnnouncement] = useState<Announcement | null>(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const result = await listAnnouncements({ limit: 50, offset: 0 });
      setAnnouncements(result.announcements);
      setTotal(result.total);
    } catch {
      setError('Kunde inte ladda aviseringar. Kontrollera anslutningen och försök igen.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
    setError(null);
  };

  const openEdit = (announcement: Announcement) => {
    setEditing(announcement);
    setForm({
      title: announcement.title,
      content: announcement.content,
      priority: announcement.priority,
      isPinned: announcement.isPinned,
      expiresAt: announcement.expiresAt?.slice(0, 10) ?? '',
    });
    setShowForm(true);
    setError(null);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditing(null);
    setError(null);
  };

  const saveAnnouncement = useCallback(async () => {
    if (!form.title.trim() || !form.content.trim()) {
      setError('Titel och innehåll krävs.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload = {
        title: form.title.trim(),
        content: form.content.trim(),
        priority: form.priority,
        isPinned: form.isPinned,
        expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : undefined,
      };
      if (editing) {
        await updateAnnouncement(editing.id, payload);
      } else {
        await createAnnouncement(payload);
      }
      setShowForm(false);
      setEditing(null);
      setForm(EMPTY_FORM);
      await load(true);
    } catch {
      setError('Kunde inte spara. Kontrollera anslutningen och försök igen.');
    } finally {
      setSaving(false);
    }
  }, [form, editing, load]);

  const markRead = useCallback(async (id: string) => {
    try {
      await markAnnouncementRead(id);
      await load(true);
    } catch {
      // Read tracking should not interrupt the user.
    }
  }, [load]);

  const deleteAnnouncement = useCallback(async (id: string) => {
    setActing(id);
    try {
      await deleteAnnouncementRequest(id);
      await load(true);
    } catch {
      setError('Kunde inte ta bort. Försök igen.');
    } finally {
      setActing(null);
      setConfirmDeleteAnnouncement(null);
    }
  }, [load]);

  const unread = announcements.filter((announcement) => !announcement.isRead).length;

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-6 py-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold text-[var(--ui-text)]">Meddelanden</h1>
            {unread > 0 ? <StatusBadge tone="accent">{unread}</StatusBadge> : null}
          </div>
          <p className="mt-1 text-sm text-[var(--ui-text-muted)]">Organisationens nyheter och viktiga uppdateringar.</p>
        </div>
        <Button type="button" onClick={openCreate}>
          <Plus aria-hidden="true" size={16} strokeWidth={1.75} />
          Nytt meddelande
        </Button>
      </div>

      {error ? (
        <InlineAlert tone="danger">
          <div className="flex items-center justify-between gap-3">
            <span>{error}</span>
            <button type="button" onClick={() => setError(null)} className="text-[var(--ui-danger-text)] opacity-70 hover:opacity-100">
              <X aria-hidden="true" size={16} strokeWidth={1.75} />
            </button>
          </div>
        </InlineAlert>
      ) : null}

      {showForm ? (
        <Panel padding="none" className="overflow-hidden">
          <div className="flex items-center justify-between gap-3 border-b border-[var(--ui-border)] px-6 py-4">
            <h2 className="text-sm font-semibold text-[var(--ui-text)]">{editing ? 'Redigera meddelande' : 'Nytt meddelande'}</h2>
            <Button type="button" variant="ghost" size="icon" onClick={closeForm} aria-label="Stäng formulär">
              <X aria-hidden="true" size={16} strokeWidth={1.75} />
            </Button>
          </div>
          <div className="space-y-4 p-6">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-[var(--ui-text-secondary)]">Titel *</label>
              <Input
                value={form.title}
                onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                placeholder="Meddelanderubrik"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-[var(--ui-text-secondary)]">Innehåll * (Markdown stöds)</label>
              <Textarea
                value={form.content}
                rows={5}
                onChange={(event) => setForm((current) => ({ ...current, content: event.target.value }))}
                placeholder="Skriv meddelandet här..."
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[var(--ui-text-secondary)]">Prioritet</label>
                <Select
                  value={form.priority}
                  onValueChange={(priority) => setForm((current) => ({ ...current, priority: priority as Priority }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="important">Viktig</SelectItem>
                    <SelectItem value="urgent">Brådskande</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[var(--ui-text-secondary)]">Utgångsdatum</label>
                <Input
                  type="date"
                  value={form.expiresAt}
                  onChange={(event) => setForm((current) => ({ ...current, expiresAt: event.target.value }))}
                />
              </div>
              <div className="flex items-end pb-2">
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.isPinned}
                    onChange={(event) => setForm((current) => ({ ...current, isPinned: event.target.checked }))}
                    className="rounded border-[var(--ui-border)] accent-[var(--ui-accent)]"
                  />
                  <span className="text-sm text-[var(--ui-text-secondary)]">Fäst längst upp</span>
                </label>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 border-t border-[var(--ui-border-subtle)] pt-4">
              <Button type="button" onClick={() => void saveAnnouncement()} disabled={saving} loading={saving}>
                {saving ? 'Sparar...' : editing ? 'Spara ändringar' : 'Publicera'}
              </Button>
              <Button type="button" variant="secondary" onClick={closeForm}>
                Avbryt
              </Button>
            </div>
          </div>
        </Panel>
      ) : null}

      {loading ? (
        <div className="flex items-center justify-center gap-3 py-20">
          <LoaderCircle aria-hidden="true" size={18} strokeWidth={1.75} className="animate-spin text-[var(--ui-text-muted)]" />
          <p className="text-sm text-[var(--ui-text-muted)]">Laddar meddelanden...</p>
        </div>
      ) : announcements.length === 0 ? (
        <Panel className="border-dashed">
          <EmptyState
            icon={Bell}
            title="Inga meddelanden ännu"
            description="Klicka på Nytt meddelande för att skapa ett."
          />
        </Panel>
      ) : (
        <div className="space-y-3">
          {announcements.map((announcement) => (
            <Panel
              key={announcement.id}
              padding="lg"
              className={cn(
                'transition-opacity',
                announcement.isPinned ? 'border-[var(--ui-accent-border)]' : undefined,
                acting === announcement.id ? 'opacity-50' : undefined,
              )}
            >
              <div className="mb-3 flex items-start justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  {announcement.isPinned ? <Pin aria-hidden="true" size={14} strokeWidth={1.75} className="text-[var(--ui-accent)]" /> : null}
                  <StatusBadge tone={PRIORITY_TONE[announcement.priority]}>{PRIORITY_LABEL[announcement.priority]}</StatusBadge>
                  {!announcement.isRead ? <StatusBadge tone="accent">Oläst</StatusBadge> : null}
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Button type="button" variant="ghost" size="compact" onClick={() => openEdit(announcement)}>
                    Redigera
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="compact"
                    onClick={() => setConfirmDeleteAnnouncement(announcement)}
                    disabled={acting === announcement.id}
                  >
                    Ta bort
                  </Button>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setExpanded((value) => value === announcement.id ? null : announcement.id);
                  if (!announcement.isRead) void markRead(announcement.id);
                }}
                className="w-full rounded-[var(--ui-radius-md)] text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ui-focus)] focus-visible:ring-offset-2"
              >
                <h3 className="text-sm font-semibold text-[var(--ui-text)]">{announcement.title}</h3>
                <p className={cn('mt-1 text-xs leading-relaxed text-[var(--ui-text-secondary)]', expanded !== announcement.id && 'line-clamp-2')}>
                  {announcement.content}
                </p>
              </button>

              <div className="mt-3 flex items-center justify-between gap-3">
                <p className="text-[10px] text-[var(--ui-text-muted)]">{fmtDate(announcement.publishedAt)}</p>
                <div className="flex items-center gap-3">
                  {announcement.isRead ? (
                    <p className="text-[10px] text-[var(--ui-text-muted)]">Läst {announcement.readAt ? fmtDate(announcement.readAt) : ''}</p>
                  ) : (
                    <Button type="button" variant="link" size="compact" className="h-auto px-0 text-[10px]" onClick={() => void markRead(announcement.id)}>
                      Markera som läst
                    </Button>
                  )}
                </div>
              </div>
            </Panel>
          ))}
        </div>
      )}

      {total > announcements.length ? (
        <p className="mt-4 text-center text-xs text-[var(--ui-text-muted)]">Visar {announcements.length} av {total}</p>
      ) : null}

      <ConfirmDestructiveDialog
        open={Boolean(confirmDeleteAnnouncement)}
        onOpenChange={(open) => {
          if (!open) setConfirmDeleteAnnouncement(null);
        }}
        title="Ta bort meddelande?"
        description={
          confirmDeleteAnnouncement
            ? `"${confirmDeleteAnnouncement.title}" tas bort för organisationen. Det här går inte att ångra.`
            : 'Meddelandet tas bort för organisationen. Det här går inte att ångra.'
        }
        confirmLabel="Ta bort meddelande"
        loading={Boolean(confirmDeleteAnnouncement && acting === confirmDeleteAnnouncement.id)}
        onConfirm={() => {
          if (!confirmDeleteAnnouncement) return;
          void deleteAnnouncement(confirmDeleteAnnouncement.id);
        }}
      />
    </div>
  );
}
