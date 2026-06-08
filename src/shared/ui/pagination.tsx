import * as React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@shared/ui/button';
import { cn } from '@shared/lib/utils';

type PaginationProps = React.HTMLAttributes<HTMLDivElement> & {
  page: number;
  pageCount: number;
  onPrevious?: () => void;
  onNext?: () => void;
  label?: string;
};

function Pagination({ page, pageCount, onPrevious, onNext, label, className, ...props }: PaginationProps) {
  const current = Math.max(1, page);
  const total = Math.max(1, pageCount);

  return (
    <nav
      aria-label={label ?? 'Pagination'}
      className={cn('flex items-center justify-between gap-3 border-t border-[var(--ui-border)] px-3 py-2', className)}
      {...props}
    >
      <p className="text-sm text-[var(--ui-text-muted)]">
        Sida <span className="font-medium text-[var(--ui-text)]">{current}</span> av{' '}
        <span className="font-medium text-[var(--ui-text)]">{total}</span>
      </p>
      <div className="flex items-center gap-2">
        <Button type="button" variant="secondary" size="icon" onClick={onPrevious} disabled={!onPrevious || current <= 1} aria-label="Foregaende sida">
          <ChevronLeft size={16} strokeWidth={1.75} />
        </Button>
        <Button type="button" variant="secondary" size="icon" onClick={onNext} disabled={!onNext || current >= total} aria-label="Nasta sida">
          <ChevronRight size={16} strokeWidth={1.75} />
        </Button>
      </div>
    </nav>
  );
}

export { Pagination };

