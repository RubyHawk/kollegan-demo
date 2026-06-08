'use client';

import { Panel } from '@shared/ui/panel';
import { Skeleton } from '@shared/ui/skeleton';

export function OffersLoadingState() {
  return (
    <Panel className="space-y-3">
      <div className="grid grid-cols-[1.4fr_0.9fr_0.7fr_0.7fr_0.9fr_2.5rem] gap-3 border-b border-[var(--ui-border)] pb-3">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-3 w-8" />
      </div>
      {Array.from({ length: 7 }).map((_, index) => (
        <div
          key={index}
          className="grid min-h-[3.75rem] grid-cols-[1.4fr_0.9fr_0.7fr_0.7fr_0.9fr_2.5rem] items-center gap-3 border-b border-[var(--ui-border-subtle)] pb-3 last:border-b-0 last:pb-0"
        >
          <div className="space-y-2">
            <Skeleton className="h-3 w-44 max-w-full" />
            <Skeleton className="h-2.5 w-28 max-w-full" />
          </div>
          <Skeleton className="h-7 w-24 rounded-full" />
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-[4.5rem]" />
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-8 w-8 rounded-[var(--ui-radius-md)]" />
        </div>
      ))}
    </Panel>
  );
}

