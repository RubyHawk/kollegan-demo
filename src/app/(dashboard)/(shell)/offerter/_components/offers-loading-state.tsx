'use client';

export function OffersLoadingState() {
  return (
    <div className="flex items-center justify-center py-20 gap-3">
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="animate-spin text-[var(--text-muted)]"
      >
        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
      </svg>
      <p className="text-sm text-[var(--text-muted)]">Laddar offerter&hellip;</p>
    </div>
  );
}
