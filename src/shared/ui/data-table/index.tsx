'use client';

import * as React from 'react';
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type RowSelectionState,
} from '@tanstack/react-table';
import { EmptyState } from '@shared/ui/empty-state';
import { Skeleton } from '@shared/ui/skeleton';
import { cn } from '@shared/lib/utils';

type DataTableProps<TData, TValue> = {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  getRowId?: (row: TData, index: number) => string;
  density?: 'compact' | 'comfortable';
  loading?: boolean;
  emptyTitle?: React.ReactNode;
  emptyDescription?: React.ReactNode;
  rowSelection?: RowSelectionState;
  onRowSelectionChange?: React.Dispatch<React.SetStateAction<RowSelectionState>>;
  className?: string;
};

function DataTable<TData, TValue>({
  columns,
  data,
  getRowId,
  density = 'compact',
  loading = false,
  emptyTitle = 'Inga rader',
  emptyDescription,
  rowSelection,
  onRowSelectionChange,
  className,
}: DataTableProps<TData, TValue>) {
  // TanStack Table intentionally returns table helpers from this hook.
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId,
    state: { rowSelection },
    onRowSelectionChange,
    enableRowSelection: Boolean(onRowSelectionChange),
  });

  const rowHeight = density === 'compact' ? 'h-10' : 'h-12';

  return (
    <div className={cn('overflow-hidden rounded-[var(--ui-radius-lg)] border border-[var(--ui-border)] bg-[var(--ui-surface)]', className)}>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="sticky top-0 z-10 bg-[var(--ui-surface-subtle)] text-xs font-medium uppercase text-[var(--ui-text-muted)]">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="h-10 border-b border-[var(--ui-border)]">
                {headerGroup.headers.map((header) => (
                  <th key={header.id} colSpan={header.colSpan} className="px-3 text-left">
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-[var(--ui-border)]">
            {loading
              ? Array.from({ length: 5 }).map((_, index) => (
                  <tr key={index} className={rowHeight}>
                    <td colSpan={columns.length} className="px-3">
                      <Skeleton className="h-4 w-full" />
                    </td>
                  </tr>
                ))
              : table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    data-selected={row.getIsSelected() || undefined}
                    className={cn(
                      rowHeight,
                      'outline-none hover:bg-[var(--ui-surface-hover)] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--ui-focus)] data-[selected=true]:bg-[var(--ui-surface-selected)]',
                    )}
                    tabIndex={0}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-3 text-[var(--ui-text)]">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
          </tbody>
        </table>
      </div>
      {!loading && table.getRowModel().rows.length === 0 ? (
        <EmptyState title={emptyTitle} description={emptyDescription} />
      ) : null}
    </div>
  );
}

export { DataTable };
export type { ColumnDef, RowSelectionState };
