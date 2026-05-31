'use client';

/**
 * /announcements
 *
 * Announcements board — create, pin, and read-track org announcements.
 * Connected through the announcements feature API client.
 */

import { useState, useEffect, useCallback } from 'react';
import { cn } from '@shared/lib/utils';
import { ConfirmDestructiveDialog } from '@shared/ui/confirm-destructive-dialog';
import {
  createAnnouncement,
  deleteAnnouncement as deleteAnnouncementRequest,
  listAnnouncements,
  markAnnouncementRead,
  updateAnnouncement,
  type Announcement,
  type AnnouncementPriority,
} from '@shared/lib/api/announcements.api';

// ─── Types ────────────────────────────────────────────────────────────────────

type Priority = AnnouncementPriority;

const PRIORITY_STYLE: Record<Priority, string> = {
  normal:    'bg-[var(--surface-alt)] text-[var(--text-muted)] border border-[var(--border)]',
  important: 'bg-amber-50 dark:bg-amber-900/25 text-amber-700 dark:text-amber-400',
  urgent:    'bg-red-50 dark:bg-red-900/25 text-red-600 dark:text-red-400',
};

const PRIORITY_LABEL: Record<Priority, string> = {
  normal: 'Normal', important: 'Viktig', urgent: 'Brådskande',
};

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('sv-SE', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

const EMPTY_FORM = { title: '', content: '', priority: 'normal' as Priority, isPinned: false, expiresAt: '' };

// ─── Page ────────────────────────────────────────────────────────────────────

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [total,         setTotal]         = useState(0);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState<string | null>(null);
  const [showForm,      setShowForm]      = useState(false);
  const [form,          setForm]          = useState(EMPTY_FORM);
  const [editing,       setEditing]       = useState<Announcement | null>(null);
  const [saving,        setSaving]        = useState(false);
  const [acting,        setActing]        = useState<string | null>(null);
  const [expanded,      setExpanded]      = useState<string | null>(null);
  const [confirmDeleteAnnouncement, setConfirmDeleteAnnouncement] = useState<Announcement | null>(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const result = await listAnnouncements({ limit: 50, offset: 0 });
      setAnnouncements(result.announcements);
      setTotal(result.total);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const openCreate = () => { setEditing(null); setForm(EMPTY_FORM); setShowForm(true); setError(null); };
  const openEdit   = (a: Announcement) => {
    setEditing(a);
    setForm({ title: a.title, content: a.content, priority: a.priority, isPinned: a.isPinned, expiresAt: a.expiresAt?.slice(0, 10) ?? '' });
    setShowForm(true); setError(null);
  };

  const saveAnnouncement = useCallback(async () => {
    if (!form.title.trim() || !form.content.trim()) { setError('Titel och innehåll krävs.'); return; }
    setSaving(true); setError(null);
    try {
      const payload = {
        title:     form.title.trim(),
        content:   form.content.trim(),
        priority:  form.priority,
        isPinned:  form.isPinned,
        expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : undefined,
      };
      if (editing) {
        await updateAnnouncement(editing.id, payload);
      } else {
        await createAnnouncement(payload);
      }
      setShowForm(false); setEditing(null); setForm(EMPTY_FORM);
      await load(true);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }, [form, editing, load]);

  const markRead = useCallback(async (id: string) => {
    try {
      await markAnnouncementRead(id);
      await load(true);
    } catch { /* silent */ }
  }, [load]);

  const deleteAnnouncement = useCallback(async (id: string) => {
    setActing(id);
    try {
      await deleteAnnouncementRequest(id);
      await load(true);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setActing(null);
      setConfirmDeleteAnnouncement(null);
    }
  }, [load]);

  const unread = announcements.filter(a => !a.isRead).length;

  return (
    <div className="px-8 py-10 max-w-4xl mx-auto">

      {/* Header */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="font-heading text-2xl font-semibold text-[var(--text-primary)]">Meddelanden</h1>
            {unread > 0 && (
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[var(--accent)] text-white text-[10px] font-bold">
                {unread}
              </span>
            )}
          </div>
          <p className="text-sm text-[var(--text-muted)]">Organisationens nyheter och viktiga uppdateringar.</p>
        </div>
        <button type="button" onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--accent)] text-white text-sm font-medium hover:opacity-90 transition-opacity shrink-0">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Nytt meddelande
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 rounded-xl border border-red-200 dark:border-red-800/40 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-400 flex items-center justify-between gap-3">
          <span>{error}</span>
          <button type="button" onClick={() => setError(null)} className="opacity-60 hover:opacity-100">✕</button>
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div className="mb-8 rounded-2xl border border-[var(--accent)]/30 bg-[var(--surface)] shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">{editing ? 'Redigera meddelande' : 'Nytt meddelande'}</h2>
            <button type="button" onClick={() => { setShowForm(false); setEditing(null); setError(null); }} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">✕</button>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">Titel *</label>
              <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Meddelanderubrik"
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-alt)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] transition-colors" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">Innehåll * (Markdown stöds)</label>
              <textarea value={form.content} rows={5} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} placeholder="Skriv meddelandet här…"
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-alt)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] transition-colors resize-none" />
            </div>
            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">Prioritet</label>
                <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value as Priority }))}
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-alt)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] transition-colors">
                  <option value="normal">Normal</option>
                  <option value="important">Viktig</option>
                  <option value="urgent">Brådskande</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">Utgångsdatum</label>
                <input type="date" value={form.expiresAt} onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))}
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-alt)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] transition-colors" />
              </div>
              <div className="flex items-end pb-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.isPinned} onChange={e => setForm(f => ({ ...f, isPinned: e.target.checked }))}
                    className="rounded accent-[var(--accent)]" />
                  <span className="text-sm text-[var(--text-secondary)]">Fäst längst upp</span>
                </label>
              </div>
            </div>
            <div className="flex gap-2 pt-2 border-t border-[var(--border-light)]">
              <button type="button" onClick={() => void saveAnnouncement()} disabled={saving}
                className="rounded-xl bg-[var(--accent)] px-5 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50 transition-opacity">
                {saving ? 'Sparar…' : editing ? 'Spara ändringar' : 'Publicera'}
              </button>
              <button type="button" onClick={() => { setShowForm(false); setEditing(null); setError(null); }}
                className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] transition-colors">
                Avbryt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-20 gap-3">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin text-[var(--text-muted)]">
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
          <p className="text-sm text-[var(--text-muted)]">Laddar meddelanden…</p>
        </div>
      ) : announcements.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--border)] p-16 text-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[var(--accent)]/10 flex items-center justify-center">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 17H2a3 3 0 0 0 3-3V9a7 7 0 0 1 14 0v5a3 3 0 0 0 3 3zm-8.27 4a2 2 0 0 1-3.46 0" />
              </svg>
            </div>
            <p className="text-sm font-medium text-[var(--text-primary)]">Inga meddelanden ännu</p>
            <p className="text-xs text-[var(--text-muted)]">Klicka på &ldquo;Nytt meddelande&rdquo; för att skapa ett.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {announcements.map(a => (
            <div key={a.id} className={cn(
              'rounded-2xl border bg-[var(--surface)] transition-opacity overflow-hidden',
              a.isPinned ? 'border-[var(--accent)]/40' : 'border-[var(--border)]',
              acting === a.id && 'opacity-50',
              !a.isRead && 'shadow-sm',
            )}>
              <div className="px-5 py-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    {a.isPinned && (
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="var(--accent)" stroke="none" className="shrink-0">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                    )}
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${PRIORITY_STYLE[a.priority]}`}>
                      {PRIORITY_LABEL[a.priority]}
                    </span>
                    {!a.isRead && (
                      <span className="w-2 h-2 rounded-full bg-[var(--accent)] shrink-0" />
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button type="button" onClick={() => openEdit(a)} className="text-xs text-[var(--accent)] hover:underline">Redigera</button>
                    <button type="button" onClick={() => setConfirmDeleteAnnouncement(a)} disabled={acting === a.id}
                      className="text-xs text-[var(--text-muted)] hover:text-red-500 transition-colors disabled:opacity-40">Ta bort</button>
                  </div>
                </div>

                <button type="button" onClick={() => {
                  setExpanded(v => v === a.id ? null : a.id);
                  if (!a.isRead) void markRead(a.id);
                }} className="w-full text-left">
                  <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-1">{a.title}</h3>
                  <p className={cn('text-xs text-[var(--text-secondary)] leading-relaxed', expanded !== a.id && 'line-clamp-2')}>
                    {a.content}
                  </p>
                </button>

                <div className="flex items-center justify-between mt-3">
                  <p className="text-[10px] text-[var(--text-muted)]">{fmtDate(a.publishedAt)}</p>
                  <div className="flex items-center gap-3">
                    {a.isRead && <p className="text-[10px] text-[var(--text-muted)]">Läst {a.readAt ? fmtDate(a.readAt) : ''}</p>}
                    {!a.isRead && (
                      <button type="button" onClick={() => void markRead(a.id)} className="text-[10px] text-[var(--accent)] hover:underline">
                        Markera som läst
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {total > announcements.length && (
        <p className="text-xs text-center text-[var(--text-muted)] mt-4">Visar {announcements.length} av {total}</p>
      )}
      <ConfirmDestructiveDialog
        open={Boolean(confirmDeleteAnnouncement)}
        onOpenChange={(open) => { if (!open) setConfirmDeleteAnnouncement(null); }}
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
