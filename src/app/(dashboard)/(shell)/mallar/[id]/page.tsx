'use client';

/**
 * /mallar/[id] (also handles "ny" / "new" for create mode)
 *
 * Visual Word-like offer template editor + visual email editor.
 * Tabs: "Offert" (offer WYSIWYG) | "E-post" (email WYSIWYG)
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  createTemplate,
  getTemplate,
  previewTemplate,
  updateTemplate,
  type CreateTemplatePayload,
} from '@shared/lib/api/templates.api';
import { useActiveCompany } from '@shared/hooks/use-active-company';
import type { EmailEditorHandle } from '../_components/EmailEditor';
import type { TemplateEditorHandle } from '../_components/TemplateEditor';
import { normalizeTemplateImages } from '../_components/template-image-upload';
import { TemplateEditorPageView, type TemplateEditorTab } from './template-editor-page-view';

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

  const [activeTab, setActiveTab] = useState<TemplateEditorTab>('offer');
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

  const closePreview = useCallback(() => {
    setPreviewing(false);
    setPreviewHtml(null);
  }, []);

  const handleNameChange = useCallback((nextName: string) => {
    setName(nextName);
    setIsDirty(true);
  }, []);

  const handleTabChange = useCallback((nextTab: TemplateEditorTab) => {
    setActiveTab(nextTab);
    if (nextTab === 'email') setEmailMounted(true);
  }, []);

  const restoreDraft = useCallback(() => {
    try {
      const raw = localStorage.getItem(draftKey);
      if (raw) editorRef.current?.setContent(JSON.parse(raw) as object);
    } catch {
      // ignore
    }
    setDraftBanner(false);
  }, [draftKey]);

  const dismissDraft = useCallback(() => {
    try {
      localStorage.removeItem(draftKey);
    } catch {
      // ignore
    }
    setDraftBanner(false);
  }, [draftKey]);

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
    <TemplateEditorPageView
      activeTab={activeTab}
      companies={companies}
      draftBanner={draftBanner}
      emailEditorRef={emailEditorRef}
      emailMounted={emailMounted}
      editorRef={editorRef}
      error={error}
      initEmailBody={initEmailBody}
      initEmailHdrCfg={initEmailHdrCfg}
      initEmailSubject={initEmailSubject}
      initialContent={initialContentRef.current}
      isDirty={isDirty}
      isNew={isNew}
      loading={loading}
      migrationNotice={migrationNotice}
      name={name}
      previewHtml={previewHtml}
      previewing={previewing}
      saved={saved}
      saving={saving}
      selectedCompanyId={selectedCompanyId}
      onBack={() => router.push('/mallar')}
      onClosePreview={closePreview}
      onDismissDraft={dismissDraft}
      onDismissMigrationNotice={() => setMigrationNotice(null)}
      onEditorUpdate={() => setIsDirty(true)}
      onMigrationNotice={setMigrationNotice}
      onNameChange={handleNameChange}
      onPreview={() => void openPreview()}
      onRestoreDraft={restoreDraft}
      onSave={() => void save()}
      onSelectCompany={setSelectedCompanyId}
      onTabChange={handleTabChange}
    />
  );
}
