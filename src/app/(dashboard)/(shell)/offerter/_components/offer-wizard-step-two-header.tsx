'use client';

import { X } from 'lucide-react';
import { Button } from '@shared/ui/button';

type OfferWizardStepTwoHeaderProps = {
  editingOfferId: string | null;
  templateLabel: string | null;
  onBackToTemplates: () => void;
  onClose: () => void;
};

export function OfferWizardStepTwoHeader({
  editingOfferId,
  templateLabel,
  onBackToTemplates,
  onClose,
}: OfferWizardStepTwoHeaderProps) {
  return (
    <>
      <div className="flex shrink-0 items-center gap-2 border-b border-[var(--ui-border)] bg-[var(--ui-surface-subtle)] px-3 py-1.5">
        <span className="flex-1 truncate text-[10px] text-[var(--ui-text-muted)]">
          {editingOfferId ? 'Redigera offert' : 'Ny offert'}
          {templateLabel !== null ? ` · ${templateLabel}` : ''}
        </span>
        {!editingOfferId ? (
          <Button type="button" variant="link" size="compact" onClick={onBackToTemplates} className="h-auto text-[10px]">
            Byt mall
          </Button>
        ) : null}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onClose}
          title="Stäng"
          className="size-7 shrink-0 lg:hidden"
          aria-label="Stäng"
        >
          <X size={16} strokeWidth={1.75} aria-hidden />
        </Button>
      </div>
      <div className="h-0.5 w-full bg-[var(--ui-accent)]" />
    </>
  );
}
