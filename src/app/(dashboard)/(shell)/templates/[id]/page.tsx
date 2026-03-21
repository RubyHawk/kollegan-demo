'use client';

/**
 * /templates/[id]  (also handles "new" when params.id === 'new')
 *
 * Visual Word-like offer template editor + visual email editor.
 * Tabs: "Offert" (offer WYSIWYG) | "E-post" (email WYSIWYG)
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import type { TemplateEditorHandle } from '../_components/TemplateEditor';
import type { EmailEditorHandle } from '../_components/EmailEditor';

// Lazy-load the heavy TipTap editors (avoids SSR issues with ProseMirror)
const TemplateEditor = dynamic(() => import('../_components/TemplateEditor'), { ssr: false });
const EmailEditor    = dynamic(() => import('../_components/EmailEditor'),    { ssr: false });

interface OfferTemplate {
  id: string;
  name: string;
  content: string;
  emailSubject?:      string;
  emailBody?:         string;
  emailHeaderConfig?: string;
}

type Tab = 'offer' | 'email';

export default function TemplateEditorPage() {
  const router   = useRouter();
  const params   = useParams<{ id: string }>();
  const isNew    = params.id === 'new';

  const [activeTab,         setActiveTab]         = useState<Tab>('offer');
  const [name,              setName]              = useState('');
  const [loading,           setLoading]           = useState(!isNew);
  const [saving,            setSaving]            = useState(false);
  const [error,             setError]             = useState<string | null>(null);
  const [saved,             setSaved]             = useState(false);

  // Stored initial values for email editor (passed as props on first render)
  const [initEmailSubject,  setInitEmailSubject]  = useState('');
  const [initEmailBody,     setInitEmailBody]     = useState('');
  const [initEmailHdrCfg,   setInitEmailHdrCfg]   = useState('');

  const editorRef      = useRef<TemplateEditorHandle | null>(null);
  const emailEditorRef = useRef<EmailEditorHandle | null>(null);
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
        setInitEmailSubject(json.data.emailSubject ?? '');
        setInitEmailBody(json.data.emailBody ?? '');
        setInitEmailHdrCfg(json.data.emailHeaderConfig ?? '');
        initialContentRef.current = json.data.content;
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

    const emailSubject      = emailEditorRef.current?.getSubject()      ?? '';
    const emailBody         = emailEditorRef.current?.getBodyHtml()     ?? '';
    const emailHeaderConfig = emailEditorRef.current?.getHeaderConfig() ?? '';

    setSaving(true); setError(null); setSaved(false);
    try {
      const payload: Record<string, unknown> = {
        name: name.trim(),
        content,
        ...(emailSubject      ? { emailSubject }      : {}),
        ...(emailBody         ? { emailBody }         : {}),
        ...(emailHeaderConfig ? { emailHeaderConfig } : {}),
      };

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

      {/* ── Tab bar ────────────────────────────────────────────────────────── */}
      <div className="shrink-0 flex items-center gap-0 px-6 border-b border-[var(--border)] bg-[var(--surface)]">
        {(['offer', 'email'] as Tab[]).map((tab) => {
          const label = tab === 'offer' ? 'Offert' : 'E-post';
          const icon  = tab === 'offer' ? (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
              <polyline points="10 9 9 9 8 9"/>
            </svg>
          ) : (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
              <polyline points="22,6 12,13 2,6"/>
            </svg>
          );
          const active = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                active
                  ? 'border-[var(--accent)] text-[var(--accent)]'
                  : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border)]'
              }`}
            >
              {icon}
              {label}
            </button>
          );
        })}
      </div>

      {/* ── Content area ────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center gap-3 text-[var(--text-muted)]">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin">
            <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
          </svg>
          <span className="text-sm">Laddar mall…</span>
        </div>
      ) : (
        <>
          {/* Offer editor — keep mounted but hidden when on Email tab */}
          <div className={`flex-1 overflow-hidden rounded-b-2xl ${activeTab === 'offer' ? '' : 'hidden'}`}>
            <TemplateEditor
              initialContent={initialContentRef.current}
              editorRef={editorRef}
            />
          </div>

          {/* Email editor — keep mounted but hidden when on Offer tab */}
          <div className={`flex-1 overflow-hidden ${activeTab === 'email' ? '' : 'hidden'}`}>
            <EmailEditor
              initialSubject={initEmailSubject}
              initialHtml={initEmailBody}
              initialHeaderConfig={initEmailHdrCfg}
              editorRef={emailEditorRef}
            />
          </div>
        </>
      )}
    </div>
  );
}
