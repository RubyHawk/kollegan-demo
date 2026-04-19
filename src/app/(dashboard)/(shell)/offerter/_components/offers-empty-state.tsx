'use client';

function OffersEmptyStateIcon() {
  return (
    <div className="relative">
      <span
        className="absolute inset-0 rounded-2xl animate-[empty-state-ring_2.4s_ease-in-out_infinite]"
        style={{ background: 'var(--accent-subtle)' }}
      />
      <div
        className="relative w-14 h-14 rounded-2xl flex items-center justify-center"
        style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--accent)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
          <rect x="9" y="3" width="6" height="4" rx="1" />
          <path d="M9 12h6M9 16h4" />
        </svg>
      </div>
    </div>
  );
}

export function OffersMobileEmptyState() {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-0)] px-4 py-14 text-center shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
      <div className="flex flex-col items-center gap-4">
        <OffersEmptyStateIcon />
        <div className="space-y-1">
          <p className="text-sm font-semibold text-[var(--text-primary)]">Inga offerter</p>
          <p className="text-xs text-[var(--text-muted)]">Skapa din första offert för att komma igång.</p>
        </div>
      </div>
    </div>
  );
}

type OffersTableEmptyStateProps = {
  onCreateOffer: () => void;
};

export function OffersTableEmptyState({ onCreateOffer }: OffersTableEmptyStateProps) {
  return (
    <tr>
      <td colSpan={8} className="px-4 py-16 text-center">
        <div className="flex flex-col items-center gap-4">
          <OffersEmptyStateIcon />
          <div className="space-y-1">
            <p className="text-sm font-semibold text-[var(--text-primary)]">Inga offerter ännu</p>
            <p className="text-sm text-[var(--text-secondary)]">
              Skapa din första offert för att komma igång med en tydlig och trygg kunddialog.
            </p>
          </div>
          <button
            type="button"
            onClick={onCreateOffer}
            className="rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity"
          >
            Skapa ny offert
          </button>
          <p className="text-xs text-[var(--text-muted)]">
            Du kan alltid justera innehållet innan du skickar.
          </p>
        </div>
      </td>
    </tr>
  );
}
