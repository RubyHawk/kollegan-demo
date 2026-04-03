'use client';

/**
 * /mallar/[id]  (also handles "ny" / "new" for create mode)
 *
 * Visual Word-like offer template editor + visual email editor.
 * Tabs: "Offert" (offer WYSIWYG) | "E-post" (email WYSIWYG)
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { fetchWithRefresh } from '@shared/lib/api-client';
import type { TemplateEditorHandle } from '../_components/TemplateEditor';
import type { EmailEditorHandle } from '../_components/EmailEditor';
import { normalizeTemplateImages } from '../_components/template-image-upload';

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

async function readJsonResponse<T>(res: Response): Promise<T> {
  const raw = await res.text();
  try {
    return JSON.parse(raw) as T;
  } catch {
    throw new Error(
      raw.startsWith('<')
        ? 'Servern returnerade HTML i stället för JSON. Kontrollera att du fortfarande är inloggad och att API:t svarar korrekt.'
        : 'Kunde inte tolka svaret från servern.',
    );
  }
}

export default function TemplateEditorPage() {
  const router   = useRouter();
  const params   = useParams<{ id: string }>();
  const isNew    = params.id === 'new' || params.id === 'ny';

  const [activeTab,         setActiveTab]         = useState<Tab>('offer');
  const [emailMounted,      setEmailMounted]      = useState(false); // lazy-mount on first visit
  const [name,              setName]              = useState('');
  const [loading,           setLoading]           = useState(!isNew);
  const [saving,            setSaving]            = useState(false);
  const [error,             setError]             = useState<string | null>(null);
  const [saved,             setSaved]             = useState(false);
  const [previewing,        setPreviewing]        = useState(false);
  const [previewHtml,       setPreviewHtml]       = useState<string | null>(null);
  const [isDirty,           setIsDirty]           = useState(false);
  const [draftBanner,       setDraftBanner]       = useState(false);

  // Stored initial values for email editor (passed as props on first render)
  const [initEmailSubject,  setInitEmailSubject]  = useState('');
  const [initEmailBody,     setInitEmailBody]     = useState('');
  const [initEmailHdrCfg,   setInitEmailHdrCfg]   = useState('');

  const editorRef      = useRef<TemplateEditorHandle | null>(null);
  const emailEditorRef = useRef<EmailEditorHandle | null>(null);
  const initialContentRef = useRef<string | undefined>(undefined);
  const draftKey = `template-draft-${params.id ?? 'new'}`;

  // ── Load existing template ─────────────────────────────────────────────────
  useEffect(() => {
    if (isNew) return;
    void (async () => {
      setLoading(true);
      try {
        const res = await fetchWithRefresh(`/api/templates/${params.id}`);
        if (!res.ok) throw new Error(`Hittade inte mallen (${res.status})`);
        const json = await readJsonResponse<{ data: OfferTemplate }>(res);
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
  }, [isNew, params.id]);

  // ── Check for unsaved draft in localStorage after load ────────────────────
  useEffect(() => {
    if (loading) return;
    try {
      const raw = localStorage.getItem(draftKey);
      if (raw) setDraftBanner(true);
    } catch { /* ignore */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  // ── Autosave to localStorage every 30 s when dirty ────────────────────────
  useEffect(() => {
    if (!isDirty) return;
    const id = setInterval(() => {
      try {
        const json = editorRef.current?.getJSON();
        if (json) localStorage.setItem(draftKey, JSON.stringify(json));
      } catch { /* ignore */ }
    }, 30_000);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDirty]);

  // ── Save ──────────────────────────────────────────────────────────────────
  const save = useCallback(async () => {
    if (!name.trim()) { setError('Ange ett namn för mallen.'); return; }
    const rawJson = editorRef.current?.getJSON();
    const json = rawJson ? await normalizeTemplateImages(rawJson) : null;
    if (!json) { setError('Editorn är inte redo.'); return; }
    editorRef.current?.setContent(json);
    const content = JSON.stringify(json);

    const emailSubject      = emailEditorRef.current?.getSubject()      ?? initEmailSubject;
    const emailBody         = emailEditorRef.current?.getBodyHtml()     ?? initEmailBody;
    const emailHeaderConfig = emailEditorRef.current?.getHeaderConfig() ?? initEmailHdrCfg;

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
        res = await fetchWithRefresh('/api/templates', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetchWithRefresh(`/api/templates/${params.id}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }
      if (!res.ok) {
        const j = await readJsonResponse<{ detail?: string } | null>(res).catch(() => null);
        throw new Error(j?.detail ?? `Fel ${res.status}`);
      }
      if (isNew) {
        const j = await readJsonResponse<{ data: OfferTemplate }>(res);
        try { localStorage.removeItem(draftKey); } catch { /* ignore */ }
        router.replace(`/mallar/${j.data.id}`);
      } else {
        setIsDirty(false);
        setDraftBanner(false);
        try { localStorage.removeItem(draftKey); } catch { /* ignore */ }
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }, [draftKey, initEmailBody, initEmailHdrCfg, initEmailSubject, isNew, name, params.id, router]);

  // ── Preview ────────────────────────────────────────────────────────────────
  const openPreview = useCallback(async () => {
    const rawJson = editorRef.current?.getJSON();
    setPreviewing(true); setPreviewHtml(null);
    try {
      const json = rawJson ? await normalizeTemplateImages(rawJson) : undefined;
      if (json) editorRef.current?.setContent(json);
      const res = await fetchWithRefresh('/api/templates/preview', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: json ? JSON.stringify(json) : undefined }),
      });
      const j = await readJsonResponse<{ html?: string; detail?: string }>(res);
      if (!res.ok) throw new Error(j.detail ?? `Fel ${res.status}`);
      setPreviewHtml(j.html ?? '');
    } catch (e) {
      setError((e as Error).message);
      setPreviewing(false);
    }
  }, []);

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
        <button onClick={() => router.push('/mallar')}
          className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-active)] transition-colors shrink-0">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>

        {/* Name */}
        <input
          value={name}
          onChange={(e) => { setName(e.target.value); setIsDirty(true); }}
          placeholder="Mallnamn…"
          className="flex-1 min-w-0 text-sm font-medium text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none border border-[var(--border)] bg-[var(--surface-0)] hover:border-[var(--accent)] focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent-border)] rounded-md px-2.5 py-1 transition-colors max-w-[260px]"
        />
        {isDirty && (
          <span className="text-xs text-amber-500 font-medium shrink-0">Osparat •</span>
        )}

        {/* Spacer */}
        <div className="flex-1"/>

        {/* Offer / Email tabs */}
        <div className="flex items-center gap-0 border border-[var(--border)] rounded-md overflow-hidden shrink-0">
          {(['offer', 'email'] as Tab[]).map((t) => {
            const label  = t === 'offer' ? 'Offert' : 'E-post';
            const active = activeTab === t;
            return (
              <button key={t} onClick={() => { setActiveTab(t); if (t === 'email') setEmailMounted(true); }}
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
          {/* Preview button — only on Offer tab */}
          {activeTab === 'offer' && (
            <button onClick={() => void openPreview()} disabled={previewing}
              className="rounded border border-[var(--border)] bg-[var(--surface)] px-3 py-1 text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-active)] disabled:opacity-50 transition-colors flex items-center gap-1.5">
              {previewing ? (
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

      {/* ── Draft restore banner ────────────────────────────────────────────── */}
      {draftBanner && (
        <div className="shrink-0 flex items-center justify-between gap-3 px-4 py-2 bg-amber-50 border-b border-amber-200 text-amber-800 text-xs">
          <span>Osparat utkast hittades i din webbläsare.</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                try {
                  const raw = localStorage.getItem(draftKey);
                  if (raw) editorRef.current?.setContent(JSON.parse(raw) as object);
                } catch { /* ignore */ }
                setDraftBanner(false);
              }}
              className="font-medium underline hover:no-underline">
              Återställ
            </button>
            <button
              onClick={() => {
                try { localStorage.removeItem(draftKey); } catch { /* ignore */ }
                setDraftBanner(false);
              }}
              className="text-amber-600 hover:text-amber-800">
              Ignorera
            </button>
          </div>
        </div>
      )}

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
              onUpdate={() => setIsDirty(true)}
            />
          </div>

          {/* Email editor — lazy-mounted on first tab visit, then kept alive */}
          {emailMounted && (
            <div className={`flex-1 overflow-hidden ${activeTab === 'email' ? '' : 'hidden'}`}>
              <EmailEditor
                initialSubject={initEmailSubject}
                initialHtml={initEmailBody}
                initialHeaderConfig={initEmailHdrCfg}
                editorRef={emailEditorRef}
              />
            </div>
          )}
        </>
      )}

      {/* ── Preview modal ──────────────────────────────────────────────────── */}
      {previewing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => { setPreviewing(false); setPreviewHtml(null); }}>
          <div className="relative flex h-[92vh] w-[min(96vw,1320px)] max-w-[1320px] min-h-0 flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface-0)] shadow-2xl"
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
              <button onClick={() => { setPreviewing(false); setPreviewHtml(null); }}
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
                className="flex-1 h-full w-full rounded-xl border-0 bg-white shadow-sm"
                sandbox="allow-same-origin"
                title="Förhandsvisning av offertdokument"
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
