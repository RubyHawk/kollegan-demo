'use client';

import { AlertCircle, Check, ChevronLeft, Eye, Loader2, Save, X } from 'lucide-react';
import { cn } from '@shared/lib/utils';
import type { ActiveCompanyOption } from '@shared/hooks/use-active-company';
import { Button } from '@shared/ui/button';
import { InlineAlert } from '@shared/ui/inline-alert';

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
  onErrorDismiss?: () => void;
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
  onErrorDismiss,
  onNameChange,
  onPreview,
  onSave,
  onSelectedCompanyChange,
  onTabChange,
}: Props) {
  const saveStatus = saving ? 'saving' : isDirty ? 'dirty' : saved ? 'saved' : 'clean';

  return (
    <div className="flex shrink-0 flex-col">
      <div className="flex h-12 shrink-0 items-center gap-2 overflow-x-auto border-b border-[var(--ui-border)] bg-[var(--ui-surface)]/95 px-3 backdrop-blur scrollbar-none">
        <button
          type="button"
          onClick={onBack}
          className="flex shrink-0 items-center gap-1.5 rounded-[var(--ui-radius-md)] px-2 py-1.5 text-sm text-[var(--ui-text-muted)] transition-colors hover:bg-[var(--ui-surface-hover)] hover:text-[var(--ui-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ui-focus)]"
        >
          <ChevronLeft size={16} strokeWidth={1.75} />
          Mallar
        </button>

        <span className="shrink-0 select-none text-[var(--ui-border)]">|</span>

        <input
          value={name}
          onChange={(event) => onNameChange(event.target.value)}
          placeholder="Mallnamn..."
          className="min-w-0 flex-1 rounded-[var(--ui-radius-md)] bg-transparent px-2 py-1 text-sm font-medium text-[var(--ui-text)] placeholder:text-[var(--ui-text-muted)] outline-none transition-colors hover:bg-[var(--ui-surface-hover)] focus:bg-[var(--ui-surface)] focus:ring-2 focus:ring-[var(--ui-focus)]"
        />

        {companies.length > 0 ? (
          <select
            value={selectedCompanyId}
            onChange={(event) => onSelectedCompanyChange(event.target.value)}
            className="hidden h-8 max-w-[170px] shrink-0 cursor-pointer rounded-[var(--ui-radius-md)] border border-[var(--ui-border)] bg-[var(--ui-surface-subtle)] px-2 text-xs font-medium text-[var(--ui-text-secondary)] outline-none transition-colors hover:border-[var(--ui-border-strong)] focus:border-[var(--ui-accent)] focus:ring-2 focus:ring-[var(--ui-focus)] md:block"
          >
            <option value="">Välj företag</option>
            {companies.map((company) => (
              <option key={company.id} value={company.id}>{company.name}</option>
            ))}
          </select>
        ) : null}

        <div className="flex shrink-0 items-center rounded-[var(--ui-radius-md)] bg-[var(--ui-surface-subtle)] p-0.5">
          {(['offer', 'email'] as Tab[]).map((tab) => {
            const active = activeTab === tab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => onTabChange(tab)}
                className={cn(
                  'relative rounded-[var(--ui-radius-sm)] px-3 py-1 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ui-focus)]',
                  active
                    ? 'bg-[var(--ui-surface)] text-[var(--ui-accent)]'
                    : 'text-[var(--ui-text-secondary)] hover:text-[var(--ui-text)]',
                )}
              >
                {tab === 'offer' ? 'Offert' : 'E-post'}
                {tab === 'email' && emailConfigured ? (
                  <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-[var(--ui-accent)]" />
                ) : null}
              </button>
            );
          })}
        </div>

        <div className="hidden w-[156px] shrink-0 items-center justify-end sm:flex">
          <SaveStatus status={saveStatus} />
        </div>

        {activeTab === 'offer' ? (
          <Button type="button" size="compact" variant="secondary" onClick={onPreview} disabled={previewing}>
            {previewing ? <Loader2 size={16} strokeWidth={1.75} className="animate-spin" /> : <Eye size={16} strokeWidth={1.75} />}
            Förhandsgranska
          </Button>
        ) : null}

        <Button type="button" size="compact" onClick={onSave} loading={saving}>
          {!saving ? <Save size={16} strokeWidth={1.75} /> : null}
          {isNew ? 'Skapa' : 'Spara'}
        </Button>
      </div>

      {error ? (
        <InlineAlert tone="danger" className="rounded-none border-x-0 border-t-0 px-4 py-2 text-xs">
          <div className="flex items-center justify-between gap-3">
            <span>{error}</span>
            {onErrorDismiss ? (
              <button type="button" onClick={onErrorDismiss} className="shrink-0 rounded-[var(--ui-radius-sm)] p-0.5 hover:bg-[var(--ui-danger-border)]/20">
                <X size={14} strokeWidth={1.75} />
              </button>
            ) : null}
          </div>
        </InlineAlert>
      ) : null}
    </div>
  );
}

function SaveStatus({ status }: { status: 'saving' | 'dirty' | 'saved' | 'clean' }) {
  if (status === 'saving') {
    return (
      <span className="flex items-center gap-1.5 text-xs text-[var(--ui-text-muted)]">
        <Loader2 size={14} strokeWidth={1.75} className="animate-spin" />
        Sparas...
      </span>
    );
  }

  if (status === 'saved') {
    return (
      <span className="flex items-center gap-1.5 text-xs text-[var(--ui-success-text)]">
        <Check size={14} strokeWidth={2} />
        Sparat
      </span>
    );
  }

  if (status === 'dirty') {
    return (
      <span className="flex items-center gap-1.5 text-xs font-medium text-[var(--ui-warning-text)]">
        <AlertCircle size={14} strokeWidth={1.75} />
        Osparade ändringar
      </span>
    );
  }

  return null;
}
