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
        'animate-pulse rounded-md bg-[var(--surface-active)]/80',
        className,
      )}
    />
  );
}
