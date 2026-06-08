'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@shared/lib/utils';
import { Button } from '@shared/ui/button';

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
    <div className="flex items-center justify-between border-t border-[var(--ui-border)] bg-[var(--ui-surface-subtle)] px-4 py-2.5">
      <span className="text-xs text-[var(--ui-text-muted)]">
        {serverTotal === 0
          ? 'Inga resultat'
          : `Visar ${currentPage * pageSize + 1}-${Math.min((currentPage + 1) * pageSize, serverTotal)} av ${serverTotal}`}
        {total > serverTotal && ` (filtrerat från ${total})`}
      </span>
      {totalPages > 1 ? (
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="secondary"
            size="icon"
            onClick={() => onPageChange((p) => Math.max(0, p - 1))}
            disabled={currentPage === 0}
            aria-label="Föregående sida"
          >
            <ChevronLeft size={16} strokeWidth={1.75} aria-hidden />
          </Button>
          {pages.map((i, idx, arr) => (
            <span key={i} className="inline-flex items-center gap-1">
              {idx > 0 && arr[idx - 1] !== i - 1 ? (
                <span className="px-0.5 text-xs text-[var(--ui-text-muted)]">...</span>
              ) : null}
              <Button
                type="button"
                variant={i === currentPage ? 'default' : 'secondary'}
                size="icon"
                onClick={() => onPageChange(i)}
                className={cn('h-7 w-7 text-xs', i === currentPage && 'pointer-events-none')}
                aria-current={i === currentPage ? 'page' : undefined}
              >
                {i + 1}
              </Button>
            </span>
          ))}
          <Button
            type="button"
            variant="secondary"
            size="icon"
            onClick={() => onPageChange((p) => Math.min(totalPages - 1, p + 1))}
            disabled={currentPage >= totalPages - 1}
            aria-label="Nästa sida"
          >
            <ChevronRight size={16} strokeWidth={1.75} aria-hidden />
          </Button>
        </div>
      ) : null}
    </div>
  );
}

