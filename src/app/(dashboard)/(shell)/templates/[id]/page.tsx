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

      {/* ── Combined header: back · name · tabs · save ──────────────────────── */}
      <div className="shrink-0 flex items-center gap-2 px-3 py-1.5 border-b border-[var(--border)] bg-[var(--surface)] min-h-0">
        {/* Back */}
        <button onClick={() => router.push('/templates')}
          className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-active)] transition-colors shrink-0">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>

        {/* Name */}
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Mallnamn…"
          className="flex-1 min-w-0 bg-transparent text-sm font-medium text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none border-b border-transparent focus:border-[var(--accent)] transition-colors py-0.5 max-w-[260px]"
        />

        {/* Spacer */}
        <div className="flex-1"/>

        {/* Offer / Email tabs */}
        <div className="flex items-center gap-0 border border-[var(--border)] rounded-md overflow-hidden shrink-0">
          {(['offer', 'email'] as Tab[]).map((t) => {
            const label  = t === 'offer' ? 'Offert' : 'E-post';
            const active = activeTab === t;
            return (
              <button key={t} onClick={() => setActiveTab(t)}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium transition-colors ${
                  active
                    ? 'bg-[var(--accent)] text-white'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--surface-active)] hover:text-[var(--text-primary)]'
                }`}>
                {label}
              </button>
            );
          })}
        </div>

        {/* Status + save */}
        <div className="flex items-center gap-2 shrink-0">
          {error && <span className="text-xs text-red-500 max-w-[180px] truncate">{error}</span>}
          {saved && (
            <span className="text-xs text-emerald-600 flex items-center gap-1">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              Sparat
            </span>
          )}
          <button onClick={() => void save()} disabled={saving}
            className="rounded bg-[var(--accent)] px-3 py-1 text-xs font-medium text-white hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center gap-1.5">
            {saving ? (
              <>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                </svg>
                Sparar…
              </>
            ) : (isNew ? 'Skapa' : 'Spara')}
          </button>
        </div>
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
