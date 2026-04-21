'use client';

import type { MutableRefObject } from 'react';
import dynamic from 'next/dynamic';
import type { ActiveCompanyOption } from '@shared/hooks/use-active-company';
import type { EmailEditorHandle } from '../_components/EmailEditor';
import type { TemplateEditorHandle } from '../_components/TemplateEditor';

const TemplateEditor = dynamic(() => import('../_components/TemplateEditor'), { ssr: false });
const EmailEditor = dynamic(() => import('../_components/EmailEditor'), { ssr: false });

export type TemplateEditorTab = 'offer' | 'email';

interface TemplateEditorPageViewProps {
  activeTab: TemplateEditorTab;
  companies: ActiveCompanyOption[];
  draftBanner: boolean;
  emailEditorRef: MutableRefObject<EmailEditorHandle | null>;
  emailMounted: boolean;
  editorRef: MutableRefObject<TemplateEditorHandle | null>;
  error: string | null;
  initEmailBody: string;
  initEmailHdrCfg: string;
  initEmailSubject: string;
  initialContent: string | undefined;
  isDirty: boolean;
  isNew: boolean;
  loading: boolean;
  migrationNotice: string | null;
  name: string;
  previewHtml: string | null;
  previewing: boolean;
  saved: boolean;
  saving: boolean;
  selectedCompanyId: string;
  onBack: () => void;
  onClosePreview: () => void;
  onDismissDraft: () => void;
  onDismissMigrationNotice: () => void;
  onEditorUpdate: () => void;
  onMigrationNotice: (notice: string | null) => void;
  onNameChange: (name: string) => void;
  onPreview: () => void;
  onRestoreDraft: () => void;
  onSave: () => void;
  onSelectCompany: (companyId: string) => void;
  onTabChange: (tab: TemplateEditorTab) => void;
}

export function TemplateEditorPageView({
  activeTab,
  companies,
  draftBanner,
  emailEditorRef,
  emailMounted,
  editorRef,
  error,
  initEmailBody,
  initEmailHdrCfg,
  initEmailSubject,
  initialContent,
  isDirty,
  isNew,
  loading,
  migrationNotice,
  name,
  previewHtml,
  previewing,
  saved,
  saving,
  selectedCompanyId,
  onBack,
  onClosePreview,
  onDismissDraft,
  onDismissMigrationNotice,
  onEditorUpdate,
  onMigrationNotice,
  onNameChange,
  onPreview,
  onRestoreDraft,
  onSave,
  onSelectCompany,
  onTabChange,
}: TemplateEditorPageViewProps) {
  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <TemplateEditorToolbar
        activeTab={activeTab}
        companies={companies}
        error={error}
        isDirty={isDirty}
        isNew={isNew}
        name={name}
        previewing={previewing}
        saved={saved}
        saving={saving}
        selectedCompanyId={selectedCompanyId}
        onBack={onBack}
        onNameChange={onNameChange}
        onPreview={onPreview}
        onSave={onSave}
        onSelectCompany={onSelectCompany}
        onTabChange={onTabChange}
      />

      {draftBanner && (
        <TemplateDraftBanner
          onDismiss={onDismissDraft}
          onRestore={onRestoreDraft}
        />
      )}

      {migrationNotice && (
        <TemplateMigrationNotice
          notice={migrationNotice}
          onDismiss={onDismissMigrationNotice}
        />
      )}

      <TemplateEditorShell
        activeTab={activeTab}
        emailEditorRef={emailEditorRef}
        emailMounted={emailMounted}
        editorRef={editorRef}
        initEmailBody={initEmailBody}
        initEmailHdrCfg={initEmailHdrCfg}
        initEmailSubject={initEmailSubject}
        initialContent={initialContent}
        loading={loading}
        onEditorUpdate={onEditorUpdate}
        onMigrationNotice={onMigrationNotice}
      />

      {previewing && (
        <TemplatePreviewModal
          html={previewHtml}
          onClose={onClosePreview}
        />
      )}
    </div>
  );
}

interface TemplateEditorToolbarProps {
  activeTab: TemplateEditorTab;
  companies: ActiveCompanyOption[];
  error: string | null;
  isDirty: boolean;
  isNew: boolean;
  name: string;
  previewing: boolean;
  saved: boolean;
  saving: boolean;
  selectedCompanyId: string;
  onBack: () => void;
  onNameChange: (name: string) => void;
  onPreview: () => void;
  onSave: () => void;
  onSelectCompany: (companyId: string) => void;
  onTabChange: (tab: TemplateEditorTab) => void;
}

function TemplateEditorToolbar({
  activeTab,
  companies,
  error,
  isDirty,
  isNew,
  name,
  previewing,
  saved,
  saving,
  selectedCompanyId,
  onBack,
  onNameChange,
  onPreview,
  onSave,
  onSelectCompany,
  onTabChange,
}: TemplateEditorToolbarProps) {
  return (
    <div className="flex min-h-0 shrink-0 flex-wrap items-center gap-2 border-b border-[var(--border)] bg-[var(--surface)] px-3 py-2 md:px-4">
      <button
        type="button"
        onClick={onBack}
        className="shrink-0 rounded p-1 text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-active)] hover:text-[var(--text-primary)]"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>

      <input
        value={name}
        onChange={(event) => onNameChange(event.target.value)}
        placeholder="Mallnamn..."
        className="min-w-[180px] flex-1 basis-[220px] rounded-md border border-[var(--border)] bg-[var(--surface-0)] px-2.5 py-1.5 text-sm font-medium text-[var(--text-primary)] placeholder:text-[var(--text-muted)] transition-colors hover:border-[var(--accent)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-border)] md:max-w-[320px]"
      />

      {companies.length > 0 && (
        <div className="flex shrink-0 items-center gap-1.5 rounded-md border border-[var(--border)] bg-[var(--surface-0)] px-2 py-1">
          <span className="text-[11px] font-medium text-[var(--text-muted)]">Företag</span>
          <select
            value={selectedCompanyId}
            onChange={(event) => onSelectCompany(event.target.value)}
            className="max-w-[170px] bg-transparent text-xs font-medium text-[var(--text-primary)] focus:outline-none"
          >
            <option value="">Välj företag</option>
            {companies.map((company) => (
              <option key={company.id} value={company.id}>
                {company.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {isDirty && <span className="shrink-0 text-xs font-medium text-amber-500">Osparat •</span>}

      <div className="hidden flex-1 md:block" />

      <div className="flex shrink-0 items-center gap-0 overflow-hidden rounded-md border border-[var(--border)]">
        {(['offer', 'email'] as TemplateEditorTab[]).map((tab) => {
          const label = tab === 'offer' ? 'Offert' : 'E-post';
          const active = activeTab === tab;
          return (
            <button
              key={tab}
              type="button"
              onClick={() => onTabChange(tab)}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium transition-colors ${
                active
                  ? 'bg-[var(--accent)] text-white'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--surface-active)] hover:text-[var(--text-primary)]'
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      <div className="ml-auto flex shrink-0 items-center gap-2 max-sm:w-full max-sm:justify-between">
        {error && <span className="max-w-[180px] truncate text-xs text-red-500">{error}</span>}
        {saved && (
          <span className="flex items-center gap-1 text-xs text-emerald-600">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Sparat
          </span>
        )}

        {activeTab === 'offer' && (
          <button
            type="button"
            onClick={onPreview}
            disabled={previewing}
            className="flex items-center gap-1.5 rounded border border-[var(--border)] bg-[var(--surface)] px-3 py-1 text-xs font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-active)] disabled:opacity-50"
          >
            {previewing ? <SpinnerIcon /> : <PreviewIcon />}
            Förhandsgranska
          </button>
        )}

        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="flex items-center gap-1.5 rounded bg-[var(--accent)] px-3 py-1 text-xs font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {saving ? (
            <>
              <SpinnerIcon />
              Sparar...
            </>
          ) : isNew ? (
            'Skapa'
          ) : (
            'Spara'
          )}
        </button>
      </div>
    </div>
  );
}

function TemplateDraftBanner({
  onDismiss,
  onRestore,
}: {
  onDismiss: () => void;
  onRestore: () => void;
}) {
  return (
    <div className="flex shrink-0 items-center justify-between gap-3 border-b border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-800">
      <span>Osparat utkast hittades i din webbläsare.</span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onRestore}
          className="font-medium underline hover:no-underline"
        >
          Återställ
        </button>
        <button
          type="button"
          onClick={onDismiss}
          className="text-amber-600 hover:text-amber-800"
        >
          Ignorera
        </button>
      </div>
    </div>
  );
}

function TemplateMigrationNotice({
  notice,
  onDismiss,
}: {
  notice: string;
  onDismiss: () => void;
}) {
  return (
    <div className="flex shrink-0 items-start justify-between gap-3 border-b border-sky-200 bg-sky-50 px-4 py-2.5 text-xs text-sky-900">
      <span>{notice}</span>
      <button
        type="button"
        onClick={onDismiss}
        className="shrink-0 font-medium text-sky-700 hover:text-sky-900"
      >
        Stäng
      </button>
    </div>
  );
}

interface TemplateEditorShellProps {
  activeTab: TemplateEditorTab;
  emailEditorRef: MutableRefObject<EmailEditorHandle | null>;
  emailMounted: boolean;
  editorRef: MutableRefObject<TemplateEditorHandle | null>;
  initEmailBody: string;
  initEmailHdrCfg: string;
  initEmailSubject: string;
  initialContent: string | undefined;
  loading: boolean;
  onEditorUpdate: () => void;
  onMigrationNotice: (notice: string | null) => void;
}

function TemplateEditorShell({
  activeTab,
  emailEditorRef,
  emailMounted,
  editorRef,
  initEmailBody,
  initEmailHdrCfg,
  initEmailSubject,
  initialContent,
  loading,
  onEditorUpdate,
  onMigrationNotice,
}: TemplateEditorShellProps) {
  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center gap-3 text-[var(--text-muted)]">
        <SpinnerIcon className="h-[18px] w-[18px]" />
        <span className="text-sm">Laddar mall...</span>
      </div>
    );
  }

  return (
    <>
      <div className={`flex-1 overflow-hidden rounded-b-2xl ${activeTab === 'offer' ? '' : 'hidden'}`}>
        <TemplateEditor
          initialContent={initialContent}
          editorRef={editorRef}
          onUpdate={onEditorUpdate}
          onMigrationNotice={onMigrationNotice}
        />
      </div>

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
  );
}

function TemplatePreviewModal({
  html,
  onClose,
}: {
  html: string | null;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative flex h-[92vh] min-h-0 w-[min(96vw,1320px)] max-w-[1320px] flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface-0)] shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-[var(--border)] bg-[var(--surface-alt)] px-5 py-3">
          <div className="flex items-center gap-2">
            <PreviewIcon className="text-[var(--text-muted)]" />
            <span className="text-sm font-medium text-[var(--text-primary)]">Förhandsvisning</span>
            <span className="text-xs text-[var(--text-muted)]">— med exempeldata</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-active)] hover:text-[var(--text-primary)]"
          >
            <CloseIcon />
          </button>
        </div>

        {html === null ? (
          <div className="flex flex-1 items-center justify-center gap-3 text-[var(--text-muted)]">
            <SpinnerIcon className="h-[18px] w-[18px]" />
            <span className="text-sm">Genererar förhandsvisning...</span>
          </div>
        ) : (
          <iframe
            srcDoc={html}
            className="h-full w-full flex-1 rounded-xl border-0 bg-white shadow-sm"
            sandbox="allow-same-origin"
            title="Förhandsvisning av offertdokument"
          />
        )}
      </div>
    </div>
  );
}

function SpinnerIcon({ className }: { className?: string }) {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`animate-spin ${className ?? ''}`}>
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}

function PreviewIcon({ className }: { className?: string }) {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
