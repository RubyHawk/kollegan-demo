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
  return (
    <div className="pointer-events-none absolute bottom-2 left-2 z-40 flex max-h-[calc(100%-1rem)] flex-col items-center gap-1 rounded-xl border border-[var(--border)] bg-[var(--surface)]/95 p-1 shadow-[0_16px_40px_rgba(15,23,42,0.14)] backdrop-blur">
      <button
        type="button"
        onClick={onBack}
        className="pointer-events-auto inline-flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-active)] hover:text-[var(--text-primary)]"
        title="Tillbaka"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>

      <details className="pointer-events-auto group relative">
        <summary
          className="relative flex h-8 w-8 cursor-pointer list-none items-center justify-center rounded-lg text-[11px] font-semibold text-[var(--text-primary)] transition-colors hover:bg-[var(--surface-active)] [&::-webkit-details-marker]:hidden"
          title={name.trim() || 'Mallinställningar'}
        >
          <span>{(name.trim() || 'Mall').slice(0, 1).toUpperCase()}</span>
          {isDirty ? <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-amber-400" title="Osparat" /> : null}
        </summary>

        <div className="absolute bottom-0 left-[calc(100%+8px)] w-[300px] rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 shadow-[0_18px_48px_rgba(15,23,42,0.18)]">
          <label className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">
            Mallnamn
          </label>
          <input
            value={name}
            onChange={(event) => onNameChange(event.target.value)}
            placeholder="Mallnamn..."
            className="mt-1 h-8 w-full rounded-lg border border-[var(--border)] bg-[var(--surface-0)] px-2.5 text-[12px] font-medium text-[var(--text-primary)] outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-border)]"
          />

          {companies.length > 0 ? (
            <>
              <label className="mt-3 block text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">
                Företag
              </label>
              <select
                value={selectedCompanyId}
                onChange={(event) => onSelectedCompanyChange(event.target.value)}
                className="mt-1 h-8 w-full rounded-lg border border-[var(--border)] bg-[var(--surface-0)] px-2.5 text-[12px] font-medium text-[var(--text-primary)] outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-border)]"
              >
                <option value="">Välj företag</option>
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>{company.name}</option>
                ))}
              </select>
            </>
          ) : null}
        </div>
      </details>

      <div className="pointer-events-auto flex flex-col items-center rounded-lg bg-[var(--surface-active)] p-0.5">
        {(['offer', 'email'] as Tab[]).map((tab) => {
          const active = activeTab === tab;
          return (
            <button
              key={tab}
              type="button"
              onClick={() => onTabChange(tab)}
              title={tab === 'offer' ? 'Offert' : `E-post${emailConfigured ? ' anpassad' : ''}`}
              className={`relative h-8 w-8 rounded-md text-[11px] font-semibold transition-all ${
                active ? 'bg-[var(--surface)] text-[var(--accent)] shadow-sm' : 'text-[var(--text-secondary)] hover:bg-[var(--surface)]'
              }`}
            >
              {tab === 'offer' ? 'O' : 'E'}
              {tab === 'email' && emailConfigured ? <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-[var(--accent)]" /> : null}
            </button>
          );
        })}
      </div>

      {error ? <span className="pointer-events-auto h-2 w-2 rounded-full bg-red-500" title={error} /> : null}
      {saved ? <span className="pointer-events-auto h-2 w-2 rounded-full bg-emerald-500" title="Sparat" /> : null}

      {activeTab === 'offer' ? (
        <button
          type="button"
          onClick={onPreview}
          disabled={previewing}
          className="pointer-events-auto inline-flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-active)] disabled:opacity-50"
          title="Förhandsgranska"
        >
          {previewing ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin">
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          )}
        </button>
      ) : null}

      <button
        type="button"
        onClick={onSave}
        disabled={saving}
        className="pointer-events-auto inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent)] text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        title={isNew ? 'Skapa mall' : 'Spara mall'}
      >
        {saving ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin">
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
            <polyline points="17 21 17 13 7 13 7 21" />
            <polyline points="7 3 7 8 15 8" />
          </svg>
        )}
      </button>
    </div>
  );
}
