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
import { Eye, Loader2, X } from 'lucide-react';
import {
  createTemplate,
  getTemplate,
  previewTemplate,
  updateTemplate,
  type CreateTemplatePayload,
} from '@shared/lib/api/templates.api';
import { useActiveCompany } from '@shared/hooks/use-active-company';
import { Skeleton } from '@shared/ui/skeleton';
import type { TemplateEditorHandle } from '../_components/TemplateEditor';
import type { EmailEditorHandle } from '../_components/EmailEditor';
import { normalizeTemplateImages } from '../_components/template-image-upload';
import { TemplateWorkflowDock } from '../_components/TemplateWorkflowDock';

const TemplateEditor = dynamic(() => import('../_components/TemplateEditor'), { ssr: false });
const EmailEditor = dynamic(() => import('../_components/EmailEditor'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center gap-3 text-[var(--ui-text-muted)]">
      <Loader2 size={18} strokeWidth={1.75} className="animate-spin" aria-hidden />
      <span className="text-sm">Laddar e-postredigeraren...</span>
    </div>
  ),
});

type Tab = 'offer' | 'email';

type TemplateDraftPayload = {
  activeTab: Tab;
  contentJson: unknown;
  emailBody: string;
  emailHeaderConfig: string;
  emailSubject: string;
  name: string;
  selectedCompanyId: string;
  updatedAt: string;
};

function isTemplateDraftPayload(value: unknown): value is TemplateDraftPayload {
  return Boolean(value && typeof value === 'object' && 'contentJson' in value);
}

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
  const [emailIsDirty, setEmailIsDirty] = useState(false);
  const [draftRevision, setDraftRevision] = useState(0);
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
      } catch {
        setError('Kunde inte ladda mallen. Kontrollera anslutningen och försök igen.');
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
    if (!isDirty && !emailIsDirty) return;
    const id = setTimeout(() => {
      try {
        const json = editorRef.current?.getJSON();
        if (!json) return;
        const payload: TemplateDraftPayload = {
          activeTab,
          contentJson: json,
          emailBody: emailEditorRef.current?.getBodyHtml() ?? initEmailBody,
          emailHeaderConfig: emailEditorRef.current?.getHeaderConfig() ?? initEmailHdrCfg,
          emailSubject: emailEditorRef.current?.getSubject() ?? initEmailSubject,
          name,
          selectedCompanyId,
          updatedAt: new Date().toISOString(),
        };
        localStorage.setItem(draftKey, JSON.stringify(payload));
      } catch {
        // ignore local storage write failures
      }
    }, 1200);
    return () => clearTimeout(id);
  }, [
    activeTab,
    draftKey,
    draftRevision,
    emailIsDirty,
    initEmailBody,
    initEmailHdrCfg,
    initEmailSubject,
    isDirty,
    name,
    selectedCompanyId,
  ]);

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
        setEmailIsDirty(false);
        setDraftBanner(false);
        try {
          localStorage.removeItem(draftKey);
        } catch {
          // ignore
        }
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      }
    } catch {
      setError('Kunde inte spara mallen. Kontrollera anslutningen och försök igen.');
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
    } catch {
      setError('Kunde inte förhandsgranska mallen. Försök igen.');
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
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <TemplateWorkflowDock
        activeTab={activeTab}
        companies={companies}
        emailConfigured={emailConfigured || emailIsDirty}
        error={error}
        isDirty={isDirty}
        isNew={isNew}
        name={name}
        previewing={previewing}
        saved={saved}
        saving={saving}
        selectedCompanyId={selectedCompanyId}
        onBack={() => router.push('/mallar')}
        onErrorDismiss={() => setError(null)}
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
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[var(--ui-warning-border)] bg-[var(--ui-warning-bg)] px-4 py-2 text-xs text-[var(--ui-warning-text)]">
          <span>Osparat utkast hittades i din webbläsare.</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                try {
                  const raw = localStorage.getItem(draftKey);
                  if (raw) {
                    const parsed = JSON.parse(raw) as unknown;
                    if (isTemplateDraftPayload(parsed)) {
                      setName(parsed.name);
                      if (parsed.selectedCompanyId) setSelectedCompanyId(parsed.selectedCompanyId);
                      setActiveTab(parsed.activeTab);
                      if (parsed.activeTab === 'email') setEmailMounted(true);
                      setInitEmailSubject(parsed.emailSubject);
                      setInitEmailBody(parsed.emailBody);
                      setInitEmailHdrCfg(parsed.emailHeaderConfig);
                      editorRef.current?.setContent(parsed.contentJson as object);
                      emailEditorRef.current?.setContent(parsed.emailSubject, parsed.emailBody, parsed.emailHeaderConfig);
                    } else {
                      editorRef.current?.setContent(parsed as object);
                    }
                    setIsDirty(true);
                    setDraftRevision((current) => current + 1);
                  }
                } catch {
                  // ignore
                }
                setDraftBanner(false);
              }}
              className="font-medium underline hover:no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ui-focus)] focus-visible:ring-offset-2"
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
              className="rounded-sm px-1 font-medium hover:bg-[var(--ui-warning-border)]/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ui-focus)] focus-visible:ring-offset-2"
            >
              Ignorera
            </button>
          </div>
        </div>
      )}

      {migrationNotice && (
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-[var(--ui-info-border)] bg-[var(--ui-info-bg)] px-4 py-2.5 text-xs text-[var(--ui-info-text)]">
          <span>{migrationNotice}</span>
          <button
            type="button"
            onClick={() => setMigrationNotice(null)}
            className="shrink-0 rounded-sm px-1 font-medium hover:bg-[var(--ui-info-border)]/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ui-focus)] focus-visible:ring-offset-2"
          >
            Stäng
          </button>
        </div>
      )}

      {loading ? (
        <div className="grid flex-1 gap-4 overflow-hidden bg-[var(--ui-surface-subtle)] p-4 lg:grid-cols-[220px_1fr_260px]">
          <Skeleton className="hidden h-full min-h-[520px] rounded-lg lg:block" />
          <Skeleton className="h-full min-h-[520px] rounded-lg" />
          <Skeleton className="hidden h-full min-h-[520px] rounded-lg lg:block" />
        </div>
      ) : (
        <>
          <div className={`flex-1 overflow-hidden rounded-b-lg ${activeTab === 'offer' ? '' : 'hidden'}`}>
            <TemplateEditor
              initialContent={initialContentRef.current}
              editorRef={editorRef}
              onUpdate={() => {
                setIsDirty(true);
                setDraftRevision((current) => current + 1);
              }}
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
                onUpdate={() => {
                  setIsDirty(true);
                  setEmailIsDirty(true);
                  setDraftRevision((current) => current + 1);
                }}
              />
            </div>
          )}
        </>
      )}

      {previewing && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--ui-overlay)] p-4 backdrop-blur-sm"
          onClick={() => {
            setPreviewing(false);
            setPreviewHtml(null);
          }}
        >
          <div
            className="relative flex h-[92vh] min-h-0 w-[min(96vw,1320px)] max-w-[1320px] flex-col overflow-hidden rounded-lg border border-[var(--ui-border)] bg-[var(--ui-surface)] shadow-[var(--ui-shadow-dialog)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex shrink-0 items-center justify-between border-b border-[var(--ui-border)] bg-[var(--ui-surface-subtle)] px-5 py-3">
              <div className="flex items-center gap-2">
                <Eye size={16} strokeWidth={1.75} className="text-[var(--ui-text-muted)]" aria-hidden />
                <span className="text-sm font-medium text-[var(--ui-text)]">Förhandsvisning</span>
                <span className="text-xs text-[var(--ui-text-muted)]">— med exempeldata</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setPreviewing(false);
                  setPreviewHtml(null);
                }}
                className="rounded-md p-1 text-[var(--ui-text-muted)] transition-colors hover:bg-[var(--ui-surface-hover)] hover:text-[var(--ui-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ui-focus)] focus-visible:ring-offset-2"
                aria-label="Stäng förhandsvisning"
              >
                <X size={16} strokeWidth={1.75} aria-hidden />
              </button>
            </div>

            {previewHtml === null ? (
              <div className="flex flex-1 items-center justify-center gap-3 text-[var(--ui-text-muted)]">
                <Loader2 size={18} strokeWidth={1.75} className="animate-spin" aria-hidden />
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
