'use client';

import { cn } from '@shared/lib/utils';

type OffersPaginationFooterProps = {
  currentPage: number;
  pageSize: number;
  serverTotal: number;
  total: number;
  totalPages: number;
  onPageChange: (page: number | ((prev: number) => number)) => void;
};

export function OffersPaginationFooter({
  currentPage,
  pageSize,
  serverTotal,
  total,
  totalPages,
  onPageChange,
}: OffersPaginationFooterProps) {
  const pages = Array.from({ length: totalPages }, (_, i) => i).filter(
    (i) => Math.abs(i - currentPage) <= 2 || i === 0 || i === totalPages - 1,
  );

  return (
    <div className="flex items-center justify-between px-4 py-2.5 border-t border-[var(--border)] bg-[var(--surface-alt)]">
      <span className="text-[11px] text-[var(--text-muted)]">
        {serverTotal === 0
          ? 'Inga resultat'
          : `Visar ${currentPage * pageSize + 1}–${Math.min((currentPage + 1) * pageSize, serverTotal)} av ${serverTotal}`}
        {total > serverTotal && ` (filtrerat från ${total})`}
      </span>
      {totalPages > 1 && (
        <div className="flex items-center gap-1">
          <button
            onClick={() => onPageChange((p) => Math.max(0, p - 1))}
            disabled={currentPage === 0}
            className="px-2 py-1 rounded border border-[var(--border)] bg-[var(--surface)] text-[11px] text-[var(--text-secondary)] hover:bg-[var(--surface-alt)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            ‹
          </button>
          {pages.map((i, idx, arr) => (
            <span key={i}>
              {idx > 0 && arr[idx - 1] !== i - 1 && (
                <span className="text-[11px] text-[var(--text-muted)] px-0.5">…</span>
              )}
              <button
                onClick={() => onPageChange(i)}
                className={cn(
                  'w-6 h-6 rounded text-[11px] font-medium transition-colors',
                  i === currentPage
                    ? 'bg-[var(--accent)] text-white'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--surface-alt)] border border-[var(--border)]',
                )}
              >
                {i + 1}
              </button>
            </span>
          ))}
          <button
            onClick={() => onPageChange((p) => Math.min(totalPages - 1, p + 1))}
            disabled={currentPage >= totalPages - 1}
            className="px-2 py-1 rounded border border-[var(--border)] bg-[var(--surface)] text-[11px] text-[var(--text-secondary)] hover:bg-[var(--surface-alt)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            ›
          </button>
        </div>
      )}
    </div>
  );
}
