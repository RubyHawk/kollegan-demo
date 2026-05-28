'use client';

/**
 * /mallar/[id] (also handles "ny" / "new" for create mode)
 *
 * Visual Word-like offer template editor + visual email editor.
 * Tabs: "Offert" (offer WYSIWYG) | "E-post" (email WYSIWYG)
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import {
  createTemplate,
  getTemplate,
  previewTemplate,
  updateTemplate,
  type CreateTemplatePayload,
} from '@shared/lib/api/templates.api';
import { useActiveCompany } from '@shared/hooks/use-active-company';
import type { TemplateEditorHandle } from '../_components/TemplateEditor';
import type { EmailEditorHandle } from '../_components/EmailEditor';
import { normalizeTemplateImages } from '../_components/template-image-upload';
import { TemplateWorkflowDock } from '../_components/TemplateWorkflowDock';

const TemplateEditor = dynamic(() => import('../_components/TemplateEditor'), { ssr: false });
const EmailEditor = dynamic(() => import('../_components/EmailEditor'), { ssr: false });

type Tab = 'offer' | 'email';

export default function TemplateEditorPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const isNew = params.id === 'new' || params.id === 'ny';
  const {
    companies,
    selectedCompany,
    selectedCompanyId,
    setSelectedCompanyId,
  } = useActiveCompany();

  const [activeTab, setActiveTab] = useState<Tab>('offer');
  const [emailMounted, setEmailMounted] = useState(false);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [draftBanner, setDraftBanner] = useState(false);
  const [migrationNotice, setMigrationNotice] = useState<string | null>(null);

  const [initEmailSubject, setInitEmailSubject] = useState('');
  const [initEmailBody, setInitEmailBody] = useState('');
  const [initEmailHdrCfg, setInitEmailHdrCfg] = useState('');

  const editorRef = useRef<TemplateEditorHandle | null>(null);
  const emailEditorRef = useRef<EmailEditorHandle | null>(null);
  const initialContentRef = useRef<string | undefined>(undefined);
  const draftKey = `template-draft-${params.id ?? 'new'}`;

  const selectedCompanyBranding = useMemo(
    () =>
      selectedCompany
        ? {
            name: selectedCompany.name,
            website: selectedCompany.website,
            logoUrl: selectedCompany.logoUrl,
            senderEmail: selectedCompany.senderEmail,
            senderName: selectedCompany.senderName,
            emailHeaderConfig: selectedCompany.emailHeaderConfig,
          }
        : undefined,
    [selectedCompany],
  );
  const emailConfigured = Boolean(initEmailSubject || initEmailBody || initEmailHdrCfg);

  useEffect(() => {
    if (isNew) return;
    void (async () => {
      setLoading(true);
      try {
        const template = await getTemplate(params.id);
        setName(template.name);
        if (template.companyId) {
          setSelectedCompanyId(template.companyId);
        }
        setInitEmailSubject(template.emailSubject ?? '');
        setInitEmailBody(template.emailBody ?? '');
        setInitEmailHdrCfg(template.emailHeaderConfig ?? '');
        initialContentRef.current = template.content;
        editorRef.current?.setContent(template.content ?? '');
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setLoading(false);
      }
    })();
  }, [isNew, params.id, setSelectedCompanyId]);

  useEffect(() => {
    if (loading) return;
    try {
      const raw = localStorage.getItem(draftKey);
      if (raw) setDraftBanner(true);
    } catch {
      // ignore local storage read failures
    }
  }, [draftKey, loading]);

  useEffect(() => {
    if (!isDirty) return;
    const id = setInterval(() => {
      try {
        const json = editorRef.current?.getJSON();
        if (json) localStorage.setItem(draftKey, JSON.stringify(json));
      } catch {
        // ignore local storage write failures
      }
    }, 30_000);
    return () => clearInterval(id);
  }, [draftKey, isDirty]);

  const save = useCallback(async () => {
    if (!name.trim()) {
      setError('Ange ett namn för mallen.');
      return;
    }
    if (!selectedCompanyId) {
      setError('Välj företag för mallen innan du sparar.');
      return;
    }

    const rawJson = editorRef.current?.getJSON();
    const json = rawJson ? await normalizeTemplateImages(rawJson) : null;
    if (!json) {
      setError('Editorn är inte redo.');
      return;
    }

    editorRef.current?.setContent(json);
    const content = JSON.stringify(json);

    const emailSubject = emailEditorRef.current?.getSubject() ?? initEmailSubject;
    const emailBody = emailEditorRef.current?.getBodyHtml() ?? initEmailBody;
    const emailHeaderConfig = emailEditorRef.current?.getHeaderConfig() ?? initEmailHdrCfg;

    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const payload: CreateTemplatePayload = {
        name: name.trim(),
        companyId: selectedCompanyId,
        content,
        ...(emailSubject ? { emailSubject } : {}),
        ...(emailBody ? { emailBody } : {}),
        ...(emailHeaderConfig ? { emailHeaderConfig } : {}),
      };

      const savedTemplate = isNew
        ? await createTemplate(payload)
        : await updateTemplate(params.id, payload);

      if (isNew) {
        try {
          localStorage.removeItem(draftKey);
        } catch {
          // ignore
        }
        router.replace(`/mallar/${savedTemplate.id}`);
      } else {
        setIsDirty(false);
        setDraftBanner(false);
        try {
          localStorage.removeItem(draftKey);
        } catch {
          // ignore
        }
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }, [draftKey, initEmailBody, initEmailHdrCfg, initEmailSubject, isNew, name, params.id, router, selectedCompanyId]);

  const openPreview = useCallback(async () => {
    const rawJson = editorRef.current?.getJSON();
    setPreviewing(true);
    setPreviewHtml(null);
    try {
      const json = rawJson ? await normalizeTemplateImages(rawJson) : undefined;
      if (json) editorRef.current?.setContent(json);
      setPreviewHtml(await previewTemplate({
        content: json ? JSON.stringify(json) : undefined,
        branding: selectedCompanyBranding,
      }));
    } catch (e) {
      setError((e as Error).message);
      setPreviewing(false);
    }
  }, [selectedCompanyBranding]);

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        void save();
      }
    }
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [save]);

  return (
    <div className="relative flex h-full min-h-0 flex-col overflow-hidden">
      <TemplateWorkflowDock
        activeTab={activeTab}
        companies={companies}
        emailConfigured={emailConfigured || isDirty}
        error={error}
        isDirty={isDirty}
        isNew={isNew}
        name={name}
        previewing={previewing}
        saved={saved}
        saving={saving}
        selectedCompanyId={selectedCompanyId}
        onBack={() => router.push('/mallar')}
        onNameChange={(value) => {
          setName(value);
          setIsDirty(true);
        }}
        onPreview={() => void openPreview()}
        onSave={() => void save()}
        onSelectedCompanyChange={setSelectedCompanyId}
        onTabChange={(tab) => {
          setActiveTab(tab);
          if (tab === 'email') setEmailMounted(true);
        }}
      />
      {draftBanner && (
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-800">
          <span>Osparat utkast hittades i din webbläsare.</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                try {
                  const raw = localStorage.getItem(draftKey);
                  if (raw) editorRef.current?.setContent(JSON.parse(raw) as object);
                } catch {
                  // ignore
                }
                setDraftBanner(false);
              }}
              className="font-medium underline hover:no-underline"
            >
              Återställ
            </button>
            <button
              type="button"
              onClick={() => {
                try {
                  localStorage.removeItem(draftKey);
                } catch {
                  // ignore
                }
                setDraftBanner(false);
              }}
              className="text-amber-600 hover:text-amber-800"
            >
              Ignorera
            </button>
          </div>
        </div>
      )}

      {migrationNotice && (
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-sky-200 bg-sky-50 px-4 py-2.5 text-xs text-sky-900">
          <span>{migrationNotice}</span>
          <button
            type="button"
            onClick={() => setMigrationNotice(null)}
            className="shrink-0 font-medium text-sky-700 hover:text-sky-900"
          >
            Stäng
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex flex-1 items-center justify-center gap-3 text-[var(--text-muted)]">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin">
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
          <span className="text-sm">Laddar mall...</span>
        </div>
      ) : (
        <>
          <div className={`flex-1 overflow-hidden rounded-b-2xl ${activeTab === 'offer' ? '' : 'hidden'}`}>
            <TemplateEditor
              initialContent={initialContentRef.current}
              editorRef={editorRef}
              onUpdate={() => setIsDirty(true)}
              onMigrationNotice={setMigrationNotice}
            />
          </div>

          {emailMounted && (
            <div className={`flex-1 overflow-hidden ${activeTab === 'email' ? '' : 'hidden'}`}>
              <EmailEditor
                initialSubject={initEmailSubject}
                initialHtml={initEmailBody}
                initialHeaderConfig={initEmailHdrCfg}
                editorRef={emailEditorRef}
                onUpdate={() => setIsDirty(true)}
              />
            </div>
          )}
        </>
      )}

      {previewing && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={() => {
            setPreviewing(false);
            setPreviewHtml(null);
          }}
        >
          <div
            className="relative flex h-[92vh] min-h-0 w-[min(96vw,1320px)] max-w-[1320px] flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface-0)] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex shrink-0 items-center justify-between border-b border-[var(--border)] bg-[var(--surface-alt)] px-5 py-3">
              <div className="flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--text-muted)]">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
                <span className="text-sm font-medium text-[var(--text-primary)]">Förhandsvisning</span>
                <span className="text-xs text-[var(--text-muted)]">— med exempeldata</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setPreviewing(false);
                  setPreviewHtml(null);
                }}
                className="rounded p-1 text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-active)] hover:text-[var(--text-primary)]"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {previewHtml === null ? (
              <div className="flex flex-1 items-center justify-center gap-3 text-[var(--text-muted)]">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
                <span className="text-sm">Genererar förhandsvisning...</span>
              </div>
            ) : (
              <iframe
                srcDoc={previewHtml}
                className="h-full w-full flex-1 rounded-xl border-0 bg-white shadow-sm"
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
