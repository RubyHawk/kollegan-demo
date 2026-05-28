'use client';

import type { ActiveCompanyOption } from '@shared/hooks/use-active-company';

type Tab = 'offer' | 'email';

type Props = {
  activeTab: Tab;
  companies: ActiveCompanyOption[];
  emailConfigured: boolean;
  error: string | null;
  isDirty: boolean;
  isNew: boolean;
  name: string;
  previewing: boolean;
  saved: boolean;
  saving: boolean;
  selectedCompanyId: string;
  onBack: () => void;
  onNameChange: (value: string) => void;
  onPreview: () => void;
  onSave: () => void;
  onSelectedCompanyChange: (value: string) => void;
  onTabChange: (tab: Tab) => void;
};

export function TemplateWorkflowDock({
  activeTab,
  companies,
  emailConfigured,
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
  onSelectedCompanyChange,
  onTabChange,
}: Props) {
  const saveStatus = saving ? 'saving' : saved ? 'saved' : isDirty ? 'dirty' : 'clean';

  return (
    <div className="flex shrink-0 flex-col">
      <div className="flex h-12 shrink-0 items-center gap-2 border-b border-[var(--border)] bg-[var(--surface)]/95 px-3 backdrop-blur">

        {/* Back to list */}
        <button
          type="button"
          onClick={onBack}
          className="flex shrink-0 items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-active)] hover:text-[var(--text-primary)]"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Mallar
        </button>

        <span className="shrink-0 select-none text-[var(--border)]">|</span>

        {/* Inline template name */}
        <input
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="Mallnamn..."
          className="min-w-0 flex-1 rounded-md bg-transparent px-2 py-1 text-sm font-medium text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none transition-colors hover:bg-[var(--surface-active)] focus:bg-[var(--surface-1)] focus:ring-1 focus:ring-[var(--accent-border)]"
        />

        {/* Company selector */}
        {companies.length > 0 && (
          <select
            value={selectedCompanyId}
            onChange={(e) => onSelectedCompanyChange(e.target.value)}
            className="h-7 max-w-[160px] shrink-0 cursor-pointer rounded-md border border-[var(--border)] bg-[var(--surface-alt)] px-2 text-xs font-medium text-[var(--text-secondary)] outline-none transition-colors hover:border-[var(--accent-border)] focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent-border)]"
          >
            <option value="">Välj företag</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        )}

        {/* Tab switcher */}
        <div className="flex shrink-0 items-center rounded-lg bg-[var(--surface-active)] p-0.5">
          {(['offer', 'email'] as Tab[]).map((tab) => {
            const active = activeTab === tab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => onTabChange(tab)}
                className={`relative rounded-md px-3 py-1 text-xs font-semibold transition-all ${
                  active
                    ? 'bg-[var(--surface)] text-[var(--accent)] shadow-sm'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                {tab === 'offer' ? 'Offert' : 'E-post'}
                {tab === 'email' && emailConfigured && (
                  <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
                )}
              </button>
            );
          })}
        </div>

        {/* Save state indicator */}
        <div className="flex w-[148px] shrink-0 items-center justify-end">
          {saveStatus === 'saving' && (
            <span className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin">
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
              Sparas...
            </span>
          )}
          {saveStatus === 'saved' && (
            <span className="flex items-center gap-1.5 text-xs text-emerald-600">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Sparat
            </span>
          )}
          {saveStatus === 'dirty' && (
            <span className="flex items-center gap-1.5 text-xs font-medium text-amber-600">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              Osparade ändringar
            </span>
          )}
        </div>

        {/* Preview — only on the Offert tab */}
        {activeTab === 'offer' && (
          <button
            type="button"
            onClick={onPreview}
            disabled={previewing}
            className="flex shrink-0 items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-active)] disabled:opacity-50"
          >
            {previewing ? (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin">
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
            ) : (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
            Förhandsgranska
          </button>
        )}

        {/* Save */}
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="flex shrink-0 items-center gap-1.5 rounded-lg bg-[var(--accent)] px-3 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {saving ? (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin">
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
          ) : (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
              <polyline points="17 21 17 13 7 13 7 21" />
              <polyline points="7 3 7 8 15 8" />
            </svg>
          )}
          {isNew ? 'Skapa' : 'Spara'}
        </button>
      </div>

      {/* Error banner — replaces the invisible 2px red dot */}
      {error && (
        <div className="flex shrink-0 items-center gap-2 border-b border-red-200 bg-red-50 px-4 py-2 text-xs text-red-700 dark:border-red-800/40 dark:bg-red-900/20 dark:text-red-400">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {error}
        </div>
      )}
    </div>
  );
}
