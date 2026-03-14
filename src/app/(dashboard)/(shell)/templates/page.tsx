'use client';

/**
 * /templates
 *
 * Offer template list page.
 * - Lists all saved templates for the organization
 * - "Ny mall" navigates to /templates/new
 * - Edit / Delete actions per row
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

  const [templates, setTemplates] = useState<OfferTemplate[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState<string | null>(null);
  const [deleting,  setDeleting]  = useState<string | null>(null);

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

  const handleDelete = useCallback(async (id: string, name: string) => {
    if (!confirm(`Ta bort mallen "${name}"? Befintliga offerter påverkas inte.`)) return;
    setDeleting(id);
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
          <button onClick={() => setError(null)} className="shrink-0 opacity-60 hover:opacity-100">✕</button>
        </div>
      )}

      {/* Placeholder reference */}
      <div className="mb-6 rounded-xl border border-[var(--border)] bg-[var(--surface-alt)] px-4 py-3">
        <p className="text-xs font-semibold text-[var(--text-secondary)] mb-2 uppercase tracking-wider">Tillgängliga platshållare</p>
        <div className="flex flex-wrap gap-1.5">
          {[
            '{{offerTitle}}', '{{recipientName}}', '{{recipientEmail}}', '{{recipientCompany}}',
            '{{totalExVat}}', '{{totalIncVat}}', '{{vatAmount}}', '{{validUntil}}',
            '{{notes}}', '{{lineItems}}', '{{signature}}',
          ].map((p) => (
            <code key={p} className="rounded-md bg-[var(--surface)] border border-[var(--border)] px-2 py-0.5 text-[11px] text-[var(--accent)] font-mono">
              {p}
            </code>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20 gap-3">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin text-[var(--text-muted)]">
            <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
          </svg>
          <p className="text-sm text-[var(--text-muted)]">Laddar mallar…</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-[var(--border)] overflow-hidden">
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
                <tr key={t.id} className="hover:bg-[var(--surface-hover)] transition-colors">
                  <td className="px-4 py-3.5">
                    <p className="font-medium text-[var(--text-primary)]">{t.name}</p>
                  </td>
                  <td className="px-4 py-3.5 text-[var(--text-muted)]">{fmtDate(t.createdAt)}</td>
                  <td className="px-4 py-3.5 text-[var(--text-muted)]">{fmtDate(t.updatedAt)}</td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3 justify-end">
                      <button
                        onClick={() => router.push(`/templates/${t.id}`)}
                        className="text-xs text-[var(--accent)] hover:underline"
                      >
                        Redigera
                      </button>
                      <span className="text-[var(--border)]">·</span>
                      <button
                        onClick={() => void handleDelete(t.id, t.name)}
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
    </div>
  );
}
