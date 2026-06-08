import * as React from 'react';
import { StatusBadge, type StatusTone } from '@shared/ui/status-badge';
import { cn } from '@shared/lib/utils';

export type KpiStripItem = {
  id: string;
  label: React.ReactNode;
  value: React.ReactNode;
  detail?: React.ReactNode;
  tone?: StatusTone;
  trend?: React.ReactNode;
};

type KpiStripProps = React.HTMLAttributes<HTMLDivElement> & {
  items: KpiStripItem[];
  density?: 'compact' | 'comfortable';
};

function KpiStrip({ items, density = 'compact', className, ...props }: KpiStripProps) {
  return (
    <div
      className={cn('grid overflow-hidden rounded-[var(--ui-radius-lg)] border border-[var(--ui-border)] bg-[var(--ui-surface)] sm:grid-cols-2 lg:grid-cols-none lg:auto-cols-fr lg:grid-flow-col', className)}
      {...props}
    >
      {items.map((item) => (
        <section
          key={item.id}
          className={cn(
            'min-w-0 border-b border-[var(--ui-border)] px-4 last:border-b-0 sm:border-r sm:last:border-r-0 lg:border-b-0',
            density === 'compact' ? 'min-h-[72px] py-3' : 'min-h-[88px] py-4',
          )}
        >
          <div className="flex min-w-0 items-start justify-between gap-2">
            <div className="min-w-0 space-y-1">
              <p className="truncate text-xs font-medium uppercase text-[var(--ui-text-muted)]">{item.label}</p>
              <p className="truncate text-xl font-semibold tabular-nums text-[var(--ui-text)]">{item.value}</p>
            </div>
            {item.tone ? <StatusBadge tone={item.tone}>{item.trend ?? item.tone}</StatusBadge> : item.trend}
          </div>
          {item.detail ? <p className="mt-1 truncate text-sm text-[var(--ui-text-muted)]">{item.detail}</p> : null}
        </section>
      ))}
    </div>
  );
}

export { KpiStrip };
