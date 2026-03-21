'use client';

/**
 * /templates
 *
 * Offer template list page.
 * - Lists all saved templates for the organization
 * - Preview template (rendered with sample offer data)
 * - Duplicate template
 * - Edit / Delete with styled confirmation modal
 */

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@shared/lib/utils';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface OfferTemplate {
  id:        string;
  name:      string;
  content:   string;
  createdAt: string;
  updatedAt: string;
}

// ─── Utilities ─────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('sv-SE', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function TemplatesPage() {
  const router = useRouter();

  const [templates,      setTemplates]      = useState<OfferTemplate[]>([]);
  const [loading,        setLoading]        = useState(true);
  const [error,          setError]          = useState<string | null>(null);
  const [deleting,       setDeleting]       = useState<string | null>(null);
  const [duplicating,    setDuplicating]    = useState<string | null>(null);
  const [confirmDelete,  setConfirmDelete]  = useState<{ id: string; name: string } | null>(null);
  const [previewHtml,    setPreviewHtml]    = useState<string | null>(null);
  const [previewing,     setPreviewing]     = useState<string | null>(null); // template id being fetched

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/templates');
      if (!res.ok) throw new Error(`Fel ${res.status}`);
      const json = await res.json() as { data: OfferTemplate[] };
      setTemplates(json.data);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  // ── Preview ──────────────────────────────────────────────────────────────────
  const handlePreview = useCallback(async (t: OfferTemplate) => {
    setPreviewing(t.id);
    setPreviewHtml(null);
    try {
      const res = await fetch('/api/templates/preview', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: t.content }),
      });
      const j = await res.json() as { html?: string; detail?: string };
      if (!res.ok) throw new Error(j.detail ?? `Fel ${res.status}`);
      setPreviewHtml(j.html ?? '');
    } catch (e) {
      setError((e as Error).message);
      setPreviewing(null);
    }
  }, []);

  // ── Duplicate ────────────────────────────────────────────────────────────────
  const handleDuplicate = useCallback(async (t: OfferTemplate) => {
    setDuplicating(t.id);
    try {
      const res = await fetch('/api/templates', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: `Kopia av ${t.name}`, content: t.content }),
      });
      if (!res.ok) throw new Error(`Fel ${res.status}`);
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setDuplicating(null);
    }
  }, [load]);

  // ── Delete ───────────────────────────────────────────────────────────────────
  const handleDelete = useCallback(async (id: string) => {
    setDeleting(id);
    setConfirmDelete(null);
    try {
      const res = await fetch(`/api/templates/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(`Fel ${res.status}`);
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setDeleting(null);
    }
  }, [load]);

  return (
    <div className="px-8 py-10 max-w-5xl mx-auto">

      {/* Header */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-[var(--text-primary)] mb-1">Offertmallar</h1>
          <p className="text-sm text-[var(--text-muted)]">
            Skapa och hantera WYSIWYG-mallar med platshållare för dynamisk offertgenerering.
          </p>
        </div>
        <button
          onClick={() => router.push('/templates/new')}
          className="flex items-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity shrink-0"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Ny mall
        </button>
      </div>

      {/* Error banner */}
      {error && (
        <div className="mb-6 rounded-xl border border-red-200 dark:border-red-800/40 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-400 flex items-center justify-between gap-3">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="shrink-0 opacity-60 hover:opacity-100">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20 gap-3">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin text-[var(--text-muted)]">
            <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
          </svg>
          <p className="text-sm text-[var(--text-muted)]">Laddar mallar…</p>
        </div>
      ) : (
        <div className="rounded-xl border border-[var(--border)] overflow-hidden">
          <table className="min-w-full divide-y divide-[var(--border)] text-sm">
            <thead className="bg-[var(--surface-alt)]">
              <tr>
                {['Mall-namn', 'Skapad', 'Uppdaterad', ''].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)] bg-[var(--surface)]">
              {templates.map((t) => (
                <tr key={t.id} className="hover:bg-[var(--surface-hover)] transition-colors group">
                  <td className="px-4 py-3.5">
                    <p className="font-medium text-[var(--text-primary)]">{t.name}</p>
                  </td>
                  <td className="px-4 py-3.5 text-[var(--text-muted)]">{fmtDate(t.createdAt)}</td>
                  <td className="px-4 py-3.5 text-[var(--text-muted)]">{fmtDate(t.updatedAt)}</td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3 justify-end">
                      {/* Preview */}
                      <button
                        onClick={() => void handlePreview(t)}
                        disabled={previewing === t.id}
                        className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors disabled:opacity-40 flex items-center gap-1"
                        title="Förhandsgranska med exempeldata"
                      >
                        {previewing === t.id ? (
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin">
                            <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                          </svg>
                        ) : (
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                          </svg>
                        )}
                        Förhandsgranska
                      </button>
                      <span className="text-[var(--border)]">·</span>
                      {/* Duplicate */}
                      <button
                        onClick={() => void handleDuplicate(t)}
                        disabled={duplicating === t.id}
                        className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors disabled:opacity-40 flex items-center gap-1"
                        title="Duplicera mall"
                      >
                        {duplicating === t.id ? (
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin">
                            <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                          </svg>
                        ) : (
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                          </svg>
                        )}
                        Duplicera
                      </button>
                      <span className="text-[var(--border)]">·</span>
                      {/* Edit */}
                      <button
                        onClick={() => router.push(`/templates/${t.id}`)}
                        className="text-xs text-[var(--accent)] hover:underline"
                      >
                        Redigera
                      </button>
                      <span className="text-[var(--border)]">·</span>
                      {/* Delete */}
                      <button
                        onClick={() => setConfirmDelete({ id: t.id, name: t.name })}
                        disabled={deleting === t.id}
                        className={cn(
                          'text-xs hover:underline disabled:opacity-40',
                          deleting === t.id ? 'text-[var(--text-muted)]' : 'text-red-500'
                        )}
                      >
                        {deleting === t.id ? 'Tar bort…' : 'Ta bort'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {templates.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-[var(--accent)]/10 flex items-center justify-center">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                          <polyline points="14,2 14,8 20,8"/>
                          <line x1="16" y1="13" x2="8" y2="13"/>
                          <line x1="16" y1="17" x2="8" y2="17"/>
                          <polyline points="10,9 9,9 8,9"/>
                        </svg>
                      </div>
                      <p className="text-sm font-medium text-[var(--text-primary)]">Inga mallar ännu</p>
                      <p className="text-xs text-[var(--text-muted)]">Klicka på &ldquo;Ny mall&rdquo; för att skapa din första offertmall.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Delete confirmation modal ─────────────────────────────────────────── */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setConfirmDelete(null)}>
          <div className="relative w-full max-w-sm bg-[var(--surface)] rounded-xl shadow-2xl overflow-hidden border border-[var(--border)]"
            onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-[var(--border)]">
              <h2 className="text-sm font-semibold text-[var(--text-primary)]">Ta bort mall?</h2>
            </div>
            <div className="px-6 py-5 space-y-3">
              <p className="text-sm text-[var(--text-secondary)]">
                Mallen <span className="font-medium text-[var(--text-primary)]">&ldquo;{confirmDelete.name}&rdquo;</span> tas bort permanent.
              </p>
              <p className="text-xs text-[var(--text-muted)]">
                Befintliga offerter som redan skickats påverkas inte.
              </p>
            </div>
            <div className="px-6 pb-5 flex gap-2">
              <button
                onClick={() => void handleDelete(confirmDelete.id)}
                disabled={deleting === confirmDelete.id}
                className="rounded-xl bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-50 transition-colors"
              >
                {deleting === confirmDelete.id ? 'Tar bort…' : 'Ta bort'}
              </button>
              <button
                onClick={() => setConfirmDelete(null)}
                className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--surface-active)] transition-colors"
              >
                Avbryt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Preview modal ─────────────────────────────────────────────────────── */}
      {previewing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => { setPreviewing(null); setPreviewHtml(null); }}>
          <div className="relative w-full max-w-4xl max-h-[90vh] bg-[var(--surface-0)] rounded-xl shadow-2xl overflow-hidden flex flex-col border border-[var(--border)]"
            onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--border)] bg-[var(--surface-alt)] shrink-0">
              <div className="flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--text-muted)]">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                </svg>
                <span className="text-sm font-medium text-[var(--text-primary)]">Förhandsvisning</span>
                <span className="text-xs text-[var(--text-muted)]">— med exempeldata</span>
              </div>
              <button onClick={() => { setPreviewing(null); setPreviewHtml(null); }}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors p-1 rounded hover:bg-[var(--surface-active)]">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            {/* Content */}
            {previewHtml === null ? (
              <div className="flex-1 flex items-center justify-center gap-3 text-[var(--text-muted)]">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                </svg>
                <span className="text-sm">Genererar förhandsvisning…</span>
              </div>
            ) : (
              <iframe
                srcDoc={previewHtml}
                className="flex-1 w-full border-0"
                sandbox="allow-same-origin"
                title="Förhandsvisning av offertmall"
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
