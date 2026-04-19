'use client';

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
      <div className="shrink-0 flex items-center gap-2 px-3 py-1.5 bg-[var(--surface-alt)] border-b border-[var(--border)]/50">
        <span className="flex-1 text-[10px] text-[var(--text-muted)] truncate">
          {editingOfferId ? 'Redigera offert' : 'Ny offert'}
          {templateLabel !== null && ` · ${templateLabel}`}
        </span>
        {!editingOfferId && (
          <button
            type="button"
            onClick={onBackToTemplates}
            className="shrink-0 text-[10px] text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors"
          >
            Byt mall
          </button>
        )}
        <button
          onClick={onClose}
          title="Stäng"
          className="lg:hidden shrink-0 p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
      <div className="h-0.5 w-full bg-[var(--accent)]"/>
    </>
  );
}
