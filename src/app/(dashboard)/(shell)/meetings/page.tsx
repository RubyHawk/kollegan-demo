'use client';

/**
 * /meetings
 *
 * Meetings calendar — schedule, view, and manage team meetings.
 * Connected through the meetings feature API client.
 */

import { useState, useEffect, useCallback } from 'react';
import { cn } from '@shared/lib/utils';
import { ConfirmDestructiveDialog } from '@shared/ui/confirm-destructive-dialog';
import {
  createMeeting,
  deleteMeeting as deleteMeetingRequest,
  listMeetings,
  updateMeeting,
  type Meeting,
  type MeetingProvider,
  type MeetingStatus,
} from '@shared/lib/api/meetings.api';

// ─── Types ────────────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<MeetingStatus, string> = {
  scheduled:   'Schemalagd',
  in_progress: 'Pågår',
  completed:   'Avslutad',
  cancelled:   'Inställd',
};

const STATUS_STYLE: Record<MeetingStatus, string> = {
  scheduled:   'bg-blue-50 dark:bg-blue-900/25 text-blue-700 dark:text-blue-400',
  in_progress: 'bg-emerald-50 dark:bg-emerald-900/25 text-emerald-700 dark:text-emerald-400',
  completed:   'bg-[var(--surface-alt)] text-[var(--text-muted)] border border-[var(--border)]',
  cancelled:   'bg-red-50 dark:bg-red-900/25 text-red-600 dark:text-red-400',
};

const STATUS_TABS: { id: MeetingStatus | 'all'; label: string }[] = [
  { id: 'all', label: 'Alla' }, { id: 'scheduled', label: 'Schemalagda' },
  { id: 'in_progress', label: 'Pågår' }, { id: 'completed', label: 'Avslutade' }, { id: 'cancelled', label: 'Inställda' },
];

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('sv-SE', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

const fmtDuration = (secs: number | null) => {
  if (!secs) return null;
  const m = Math.floor(secs / 60);
  return m < 60 ? `${m} min` : `${Math.floor(m / 60)}h ${m % 60}m`;
};

const EMPTY_FORM = { title: '', scheduledAt: '', provider: 'manual', meetingUrl: '', agenda: '' };

// ─── Page ────────────────────────────────────────────────────────────────────

export default function MeetingsPage() {
  const [meetings,  setMeetings]  = useState<Meeting[]>([]);
  const [total,     setTotal]     = useState(0);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState<string | null>(null);
  const [tab,       setTab]       = useState<MeetingStatus | 'all'>('all');
  const [showForm,  setShowForm]  = useState(false);
  const [form,      setForm]      = useState(EMPTY_FORM);
  const [saving,    setSaving]    = useState(false);
  const [acting,    setActing]    = useState<string | null>(null);
  const [expanded,  setExpanded]  = useState<string | null>(null);
  const [confirmDeleteMeeting, setConfirmDeleteMeeting] = useState<Meeting | null>(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const result = await listMeetings({ limit: 50, offset: 0, status: tab === 'all' ? undefined : tab });
      setMeetings(result.meetings);
      setTotal(result.total);
    } catch {
      setError('Något gick fel. Kontrollera anslutningen och försök igen.');
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => { void load(); }, [load]);

  const saveMeeting = useCallback(async () => {
    if (!form.title.trim() || !form.scheduledAt) { setError('Titel och tid krävs.'); return; }
    setSaving(true); setError(null);
    try {
      await createMeeting({
        title:       form.title.trim(),
        scheduledAt: new Date(form.scheduledAt).toISOString(),
        provider:    form.provider as MeetingProvider,
        meetingUrl:  form.meetingUrl.trim() || undefined,
        agenda:      form.agenda.trim()     || undefined,
        participants: [],
      });
      setShowForm(false); setForm(EMPTY_FORM);
      await load(true);
    } catch {
      setError('Något gick fel. Kontrollera anslutningen och försök igen.');
    } finally {
      setSaving(false);
    }
  }, [form, load]);

  const updateStatus = useCallback(async (id: string, status: MeetingStatus) => {
    setActing(id);
    try {
      await updateMeeting(id, { status });
      await load(true);
    } catch {
      setError('Något gick fel. Kontrollera anslutningen och försök igen.');
    } finally {
      setActing(null);
    }
  }, [load]);

  const deleteMeeting = useCallback(async (id: string) => {
    setActing(id);
    try {
      await deleteMeetingRequest(id);
      await load(true);
    } catch {
      setError('Något gick fel. Kontrollera anslutningen och försök igen.');
    } finally {
      setActing(null);
      setConfirmDeleteMeeting(null);
    }
  }, [load]);

  const upcoming = meetings.filter(m => m.status === 'scheduled' || m.status === 'in_progress').length;

  return (
    <div className="px-8 py-10 max-w-5xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-[var(--text-primary)] mb-1">Möten</h1>
          <p className="text-sm text-[var(--text-muted)]">
            Schemalägg och följ upp möten.
            {upcoming > 0 && <span className="ml-2 text-[var(--accent)] font-medium">{upcoming} kommande</span>}
          </p>
        </div>
        <button type="button" onClick={() => { setShowForm(v => !v); setError(null); }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--accent)] text-white text-sm font-medium hover:opacity-90 transition-opacity shrink-0">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Nytt möte
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-200 dark:border-red-800/40 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-400 flex items-center justify-between gap-3">
          <span>{error}</span>
          <button type="button" onClick={() => setError(null)} className="opacity-60 hover:opacity-100">✕</button>
        </div>
      )}

      {/* Create form */}
      {showForm && (
        <div className="rounded-2xl border border-[var(--accent)]/30 bg-[var(--surface)] shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">Nytt möte</h2>
            <button type="button" onClick={() => { setShowForm(false); setError(null); }} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">✕</button>
          </div>
          <div className="p-6 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">Titel *</label>
              <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="t.ex. Sprint Review Q2"
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-alt)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] transition-colors" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">Datum & tid *</label>
              <input type="datetime-local" value={form.scheduledAt} onChange={e => setForm(f => ({ ...f, scheduledAt: e.target.value }))}
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-alt)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] transition-colors" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">Plattform</label>
              <select value={form.provider} onChange={e => setForm(f => ({ ...f, provider: e.target.value }))}
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-alt)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] transition-colors">
                <option value="manual">Manuellt</option>
                <option value="google_meet">Google Meet</option>
                <option value="zoom">Zoom</option>
                <option value="daily">Daily</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">Möteslänk</label>
              <input value={form.meetingUrl} onChange={e => setForm(f => ({ ...f, meetingUrl: e.target.value }))} placeholder="https://…"
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-alt)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] transition-colors" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">Agenda</label>
              <textarea value={form.agenda} rows={3} onChange={e => setForm(f => ({ ...f, agenda: e.target.value }))} placeholder="Mötespunkter…"
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-alt)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] transition-colors resize-none" />
            </div>
            <div className="sm:col-span-2 flex gap-2 pt-2 border-t border-[var(--border-light)]">
              <button type="button" onClick={() => void saveMeeting()} disabled={saving}
                className="rounded-xl bg-[var(--accent)] px-5 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50 transition-opacity">
                {saving ? 'Sparar…' : 'Schemalägg möte'}
              </button>
              <button type="button" onClick={() => { setShowForm(false); setError(null); }}
                className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] transition-colors">
                Avbryt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-[var(--surface-alt)] border border-[var(--border)] rounded-xl p-1 overflow-x-auto shrink-0 w-fit">
        {STATUS_TABS.map(t => (
          <button key={t.id} type="button" onClick={() => setTab(t.id)}
            className={cn('px-3 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap',
              tab === t.id ? 'bg-[var(--surface)] text-[var(--text-primary)] shadow-sm border border-[var(--border)]' : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]',
            )}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Meetings list */}
      {loading ? (
        <div className="flex items-center justify-center py-20 gap-3">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin text-[var(--text-muted)]">
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
          <p className="text-sm text-[var(--text-muted)]">Laddar möten…</p>
        </div>
      ) : meetings.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--border)] p-16 text-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[var(--accent)]/10 flex items-center justify-center">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>
            <p className="text-sm font-medium text-[var(--text-primary)]">Inga möten {tab !== 'all' ? `med status "${STATUS_LABEL[tab as MeetingStatus]}"` : 'ännu'}</p>
            <p className="text-xs text-[var(--text-muted)]">Klicka på &ldquo;Nytt möte&rdquo; för att schemalägga.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {meetings.map(m => (
            <div key={m.id} className={cn('rounded-2xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden transition-opacity', acting === m.id && 'opacity-50')}>
              <div className="p-5">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{m.title}</p>
                      <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLE[m.status]}`}>
                        {STATUS_LABEL[m.status]}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--text-muted)]">
                      {fmtDate(m.scheduledAt)}
                      {m.durationSeconds && ` · ${fmtDuration(m.durationSeconds)}`}
                      {m.participants.length > 0 && ` · ${m.participants.length} deltagare`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 flex-wrap">
                    {m.status === 'scheduled' && (
                      <button type="button" onClick={() => void updateStatus(m.id, 'in_progress')} disabled={acting === m.id}
                        className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline disabled:opacity-40">Starta</button>
                    )}
                    {m.status === 'in_progress' && (
                      <button type="button" onClick={() => void updateStatus(m.id, 'completed')} disabled={acting === m.id}
                        className="text-xs text-[var(--accent)] hover:underline disabled:opacity-40">Avsluta</button>
                    )}
                    {m.status === 'scheduled' && (
                      <button type="button" onClick={() => void updateStatus(m.id, 'cancelled')} disabled={acting === m.id}
                        className="text-xs text-[var(--text-muted)] hover:text-red-500 transition-colors disabled:opacity-40">Ställ in</button>
                    )}
                    <button type="button" onClick={() => setConfirmDeleteMeeting(m)} disabled={acting === m.id}
                      className="text-xs text-[var(--text-muted)] hover:text-red-500 transition-colors disabled:opacity-40">Ta bort</button>
                    {(m.agenda || m.summary || m.meetingUrl) && (
                      <button type="button" onClick={() => setExpanded(v => v === m.id ? null : m.id)}
                        className="text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors">
                        {expanded === m.id ? '▲' : '▼'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Meeting URL */}
                {m.meetingUrl && (
                  <a href={m.meetingUrl} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-[var(--accent)] hover:underline mt-1">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                      <polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
                    </svg>
                    Gå med i mötet
                  </a>
                )}
              </div>

              {/* Expanded details */}
              {expanded === m.id && (
                <div className="px-5 pb-5 border-t border-[var(--border)] pt-4 space-y-3">
                  {m.agenda && (
                    <div>
                      <p className="text-xs font-semibold text-[var(--text-secondary)] mb-1">Agenda</p>
                      <p className="text-xs text-[var(--text-muted)] whitespace-pre-line leading-relaxed">{m.agenda}</p>
                    </div>
                  )}
                  {m.summary?.summary && (
                    <div>
                      <p className="text-xs font-semibold text-[var(--text-secondary)] mb-1">Sammanfattning (AI)</p>
                      <p className="text-xs text-[var(--text-muted)] whitespace-pre-line leading-relaxed">{m.summary.summary}</p>
                    </div>
                  )}
                  {m.participants.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-[var(--text-secondary)] mb-1.5">Deltagare</p>
                      <div className="flex flex-wrap gap-1.5">
                        {m.participants.map(p => (
                          <span key={p.id} className="px-2 py-0.5 rounded-full bg-[var(--surface-alt)] border border-[var(--border)] text-[10px] text-[var(--text-secondary)]">
                            {p.name}{p.email ? ` (${p.email})` : ''}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      {total > meetings.length && (
        <p className="text-xs text-center text-[var(--text-muted)]">Visar {meetings.length} av {total} möten</p>
      )}
      <ConfirmDestructiveDialog
        open={Boolean(confirmDeleteMeeting)}
        onOpenChange={(open) => { if (!open) setConfirmDeleteMeeting(null); }}
        title="Ta bort möte?"
        description={
          confirmDeleteMeeting
            ? `"${confirmDeleteMeeting.title}" tas bort permanent. Det här går inte att ångra.`
            : 'Mötet tas bort permanent. Det här går inte att ångra.'
        }
        confirmLabel="Ta bort möte"
        loading={Boolean(confirmDeleteMeeting && acting === confirmDeleteMeeting.id)}
        onConfirm={() => {
          if (!confirmDeleteMeeting) return;
          void deleteMeeting(confirmDeleteMeeting.id);
        }}
      />
    </div>
  );
}
