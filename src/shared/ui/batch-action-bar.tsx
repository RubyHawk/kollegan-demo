import * as React from 'react';
import { cn } from '@shared/lib/utils';

type BatchActionBarProps = React.HTMLAttributes<HTMLDivElement> & {
  selectedCount: number;
  actions?: React.ReactNode;
};

function BatchActionBar({ selectedCount, actions, className, ...props }: BatchActionBarProps) {
  if (selectedCount <= 0) return null;

  return (
    <div
      className={cn('flex flex-wrap items-center justify-between gap-3 rounded-[var(--ui-radius-lg)] border border-[var(--ui-accent-border)] bg-[var(--ui-accent-subtle)] px-3 py-2 text-sm text-[var(--ui-text)]', className)}
      {...props}
    >
      <p>
        <span className="font-medium">{selectedCount}</span> markerade
      </p>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export { BatchActionBar };

