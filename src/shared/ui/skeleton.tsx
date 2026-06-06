'use client';

import { cn } from '@shared/lib/utils';

type SkeletonProps = {
  className?: string;
};

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'animate-pulse rounded-[var(--ui-radius-md)] bg-[var(--ui-surface-active)]',
        className,
      )}
    />
  );
}
