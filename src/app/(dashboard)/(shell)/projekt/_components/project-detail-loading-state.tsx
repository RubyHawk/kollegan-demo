'use client';

import { Skeleton } from '@shared/ui/skeleton';

export function ProjectDetailLoadingState() {
  return (
    <div className="mx-auto max-w-[1360px] space-y-5 px-6 py-8 xl:px-8">
      <Skeleton className="h-9 w-28" />
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-3">
          <Skeleton className="h-6 w-36 rounded-full" />
          <Skeleton className="h-9 w-80 max-w-full" />
          <Skeleton className="h-4 w-56 max-w-full" />
        </div>
        <Skeleton className="h-10 w-40" />
      </div>
      <Skeleton className="h-24 w-full rounded-2xl" />
      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <Skeleton className="h-64 w-full rounded-2xl" />
          <Skeleton className="h-80 w-full rounded-2xl" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-40 w-full rounded-2xl" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
