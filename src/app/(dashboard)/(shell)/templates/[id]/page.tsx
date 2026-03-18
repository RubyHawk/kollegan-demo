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

interface OfferTemplate { id: string; name: string; content: string; emailSubject?: string; emailBody?: string; }

export default function TemplateEditorPage() {
  const router   = useRouter();
  const params   = useParams<{ id: string }>();
  const isNew    = params.id === 'new';

  const [name,         setName]         = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody,    setEmailBody]    = useState('');
  const [showEmail,    setShowEmail]    = useState(false);
  const [loading,      setLoading]      = useState(!isNew);
  const [saving,       setSaving]       = useState(false);
  const [error,        setError]        = useState<string | null>(null);
  const [saved,        setSaved]        = useState(false);

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
        setEmailSubject(json.data.emailSubject ?? '');
        setEmailBody(json.data.emailBody ?? '');
        if (json.data.emailSubject || json.data.emailBody) setShowEmail(true);
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
      const payload: Record<string, unknown> = { name: name.trim(), content };
      if (emailSubject.trim()) payload.emailSubject = emailSubject.trim();
      if (emailBody.trim())    payload.emailBody    = emailBody.trim();

      let res: Response;
      if (isNew) {
        res = await fetch('/api/templates', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch(`/api/templates/${params.id}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
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
  }, [isNew, name, emailSubject, emailBody, params.id, router]);

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

      {/* ── Email customization ────────────────────────────────────────────── */}
      <div className="shrink-0 border-b border-[var(--border)] bg-[var(--surface)]">
        <button
          type="button"
          onClick={() => setShowEmail((v) => !v)}
          className="w-full flex items-center gap-2 px-6 py-2 text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] transition-colors"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            className={`transition-transform ${showEmail ? 'rotate-90' : ''}`}>
            <polyline points="9 18 15 12 9 6"/>
          </svg>
          Anpassa e-postmeddelande
          {(emailSubject || emailBody) && (
            <span className="ml-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-normal">Anpassad</span>
          )}
        </button>
        {showEmail && (
          <div className="px-6 pb-4 space-y-3">
            <p className="text-[11px] text-[var(--text-muted)]">
              Anpassa e-postmeddelandet som mottagaren ser. Använd platshållare som{' '}
              <code className="bg-[var(--surface-alt)] px-1 py-0.5 rounded text-[10px]">{'{{recipientName}}'}</code>,{' '}
              <code className="bg-[var(--surface-alt)] px-1 py-0.5 rounded text-[10px]">{'{{offerTitle}}'}</code>,{' '}
              <code className="bg-[var(--surface-alt)] px-1 py-0.5 rounded text-[10px]">{'{{totalIncVat}}'}</code>,{' '}
              <code className="bg-[var(--surface-alt)] px-1 py-0.5 rounded text-[10px]">{'{{validUntil}}'}</code>{' '}
              för att infoga data automatiskt.
            </p>
            <div>
              <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">Ämnesrad</label>
              <input
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                placeholder="t.ex. Offert från Företag AB: {{offerTitle}}"
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-alt)] px-3 py-1.5 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] transition-colors"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">E-postinnehåll (HTML)</label>
              <textarea
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
                rows={5}
                placeholder={'t.ex. <h2>Hej {{recipientName}},</h2>\n<p>Vi har nöjet att presentera en offert för <strong>{{offerTitle}}</strong>.</p>\n<p>Totalt: {{totalIncVat}}</p>'}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-alt)] px-3 py-1.5 text-sm text-[var(--text-primary)] font-mono focus:outline-none focus:border-[var(--accent)] transition-colors resize-y"
              />
              <p className="mt-1 text-[10px] text-[var(--text-muted)]">
                Knappen &ldquo;Visa &amp; signera offert&rdquo; läggs till automatiskt under innehållet.
              </p>
            </div>
          </div>
        )}
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
