'use client';

/**
 * /templates/new — create a new offer template.
 * Uses the shared TemplateEditor visual component.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import type { TemplateEditorHandle } from '../_components/TemplateEditor';

const TemplateEditor = dynamic(() => import('../_components/TemplateEditor'), { ssr: false });

interface OfferTemplate { id: string; name: string; content: string; }

export default function NewTemplatePage() {
  const router    = useRouter();
  const [name,    setName]    = useState('');
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const editorRef = useRef<TemplateEditorHandle | null>(null);

  const save = useCallback(async () => {
    if (!name.trim()) { setError('Ange ett namn för mallen.'); return; }
    const json = editorRef.current?.getJSON();
    if (!json) { setError('Editorn är inte redo.'); return; }

    setSaving(true); setError(null);
    try {
      const res = await fetch('/api/templates', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), content: JSON.stringify(json) }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({})) as { detail?: string };
        throw new Error(j.detail ?? `Fel ${res.status}`);
      }
      const j = await res.json() as { data: OfferTemplate };
      router.replace(`/templates/${j.data.id}`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }, [name, router]);

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); void save(); }
    }
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [save]);

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden">
      {/* Top bar */}
      <div className="shrink-0 flex items-center gap-3 px-6 py-3 border-b border-[var(--border)] bg-[var(--surface)]">
        <button onClick={() => router.push('/templates')}
          className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors shrink-0">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Mallnamn…"
          className="flex-1 min-w-0 bg-transparent text-lg font-semibold text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none border-b-2 border-transparent focus:border-[var(--accent)] transition-colors py-0.5"/>
        <div className="flex items-center gap-2 shrink-0">
          {error && <span className="text-xs text-red-500 max-w-xs truncate">{error}</span>}
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
            ) : 'Skapa mall'}
          </button>
        </div>
      </div>
      {/* Editor */}
      <div className="flex-1 overflow-hidden">
        <TemplateEditor editorRef={editorRef}/>
      </div>
    </div>
  );
}
