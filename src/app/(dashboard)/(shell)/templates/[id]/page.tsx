'use client';

/**
 * /templates/[id]  (also handles "new" when params.id === 'new')
 *
 * Visual Word-like offer template editor.
 * Uses the shared TemplateEditor component for the WYSIWYG canvas.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import type { TemplateEditorHandle } from '../_components/TemplateEditor';

// Lazy-load the heavy TipTap editor (avoids SSR issues with ProseMirror)
const TemplateEditor = dynamic(() => import('../_components/TemplateEditor'), { ssr: false });

interface OfferTemplate { id: string; name: string; content: string; }

export default function TemplateEditorPage() {
  const router   = useRouter();
  const params   = useParams<{ id: string }>();
  const isNew    = params.id === 'new';

  const [name,    setName]    = useState('');
  const [loading, setLoading] = useState(!isNew);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const [saved,   setSaved]   = useState(false);

  const editorRef = useRef<TemplateEditorHandle | null>(null);
  const initialContentRef = useRef<string | undefined>(undefined);

  // ── Load existing template ─────────────────────────────────────────────────
  useEffect(() => {
    if (isNew) return;
    void (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/templates/${params.id}`);
        if (!res.ok) throw new Error(`Hittade inte mallen (${res.status})`);
        const json = await res.json() as { data: OfferTemplate };
        setName(json.data.name);
        initialContentRef.current = json.data.content;
        // If editor is already mounted, set content directly
        editorRef.current?.setContent(json.data.content);
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setLoading(false);
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isNew, params.id]);

  // ── Save ──────────────────────────────────────────────────────────────────
  const save = useCallback(async () => {
    if (!name.trim()) { setError('Ange ett namn för mallen.'); return; }
    const json = editorRef.current?.getJSON();
    if (!json) { setError('Editorn är inte redo.'); return; }
    const content = JSON.stringify(json);

    setSaving(true); setError(null); setSaved(false);
    try {
      let res: Response;
      if (isNew) {
        res = await fetch('/api/templates', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: name.trim(), content }),
        });
      } else {
        res = await fetch(`/api/templates/${params.id}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: name.trim(), content }),
        });
      }
      if (!res.ok) {
        const j = await res.json().catch(() => ({})) as { detail?: string };
        throw new Error(j.detail ?? `Fel ${res.status}`);
      }
      if (isNew) {
        const j = await res.json() as { data: OfferTemplate };
        router.replace(`/templates/${j.data.id}`);
      } else {
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }, [isNew, name, params.id, router]);

  // Ctrl+S shortcut
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); void save(); }
    }
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [save]);

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden">

      {/* ── Top bar ────────────────────────────────────────────────────────── */}
      <div className="shrink-0 flex items-center gap-3 px-6 py-3 border-b border-[var(--border)] bg-[var(--surface)]">
        <button onClick={() => router.push('/templates')}
          className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors shrink-0">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>

        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Mallnamn…"
          className="flex-1 min-w-0 bg-transparent text-lg font-semibold text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none border-b-2 border-transparent focus:border-[var(--accent)] transition-colors py-0.5"
        />

        <div className="flex items-center gap-2 shrink-0">
          {error && (
            <span className="text-xs text-red-500 max-w-xs truncate">{error}</span>
          )}
          {saved && (
            <span className="text-xs text-emerald-600 flex items-center gap-1">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              Sparat
            </span>
          )}
          <button onClick={() => router.push('/templates')}
            className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-1.5 text-sm text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] transition-colors">
            Avbryt
          </button>
          <button onClick={() => void save()} disabled={saving}
            className="rounded-xl bg-[var(--accent)] px-5 py-1.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center gap-2">
            {saving ? (
              <>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                </svg>
                Sparar…
              </>
            ) : (isNew ? 'Skapa mall' : 'Spara')}
          </button>
        </div>
      </div>

      {/* ── Editor ─────────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center gap-3 text-[var(--text-muted)]">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin">
            <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
          </svg>
          <span className="text-sm">Laddar mall…</span>
        </div>
      ) : (
        <div className="flex-1 overflow-hidden rounded-b-2xl">
          <TemplateEditor
            initialContent={initialContentRef.current}
            editorRef={editorRef}
          />
        </div>
      )}
    </div>
  );
}
