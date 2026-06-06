import * as React from 'react';
import { EmptyState } from '@shared/ui/empty-state';
import { StatusBadge, type StatusTone } from '@shared/ui/status-badge';
import { cn } from '@shared/lib/utils';

export type KanbanColumn<TItem> = {
  id: string;
  title: React.ReactNode;
  tone?: StatusTone;
  items: TItem[];
};

type KanbanBoardProps<TItem> = React.HTMLAttributes<HTMLDivElement> & {
  columns: KanbanColumn<TItem>[];
  renderItem: (item: TItem, column: KanbanColumn<TItem>) => React.ReactNode;
  getItemKey: (item: TItem) => React.Key;
  emptyLabel?: React.ReactNode;
};

function KanbanBoard<TItem>({ columns, renderItem, getItemKey, emptyLabel = 'Inga poster', className, ...props }: KanbanBoardProps<TItem>) {
  return (
    <div className={cn('grid gap-3 overflow-x-auto pb-2 md:auto-cols-fr md:grid-flow-col md:grid-cols-none', className)} {...props}>
      {columns.map((column) => (
        <section key={column.id} className="min-w-[260px] rounded-[var(--ui-radius-lg)] border border-[var(--ui-border)] bg-[var(--ui-surface)]">
          <header className="flex min-h-10 items-center justify-between gap-2 border-b border-[var(--ui-border)] px-3">
            <h2 className="truncate text-sm font-medium text-[var(--ui-text)]">{column.title}</h2>
            <StatusBadge tone={column.tone ?? 'neutral'}>{column.items.length}</StatusBadge>
          </header>
          <div className="grid gap-2 p-2">
            {column.items.length === 0 ? (
              <EmptyState title={emptyLabel} className="py-6" />
            ) : (
              column.items.map((item) => (
                <div key={getItemKey(item)} className="rounded-[var(--ui-radius-md)] border border-[var(--ui-border)] bg-[var(--ui-surface-raised)] p-3 shadow-sm">
                  {renderItem(item, column)}
                </div>
              ))
            )}
          </div>
        </section>
      ))}
    </div>
  );
}

export { KanbanBoard };
