import * as React from 'react';
import { cn } from '@shared/lib/utils';

type ToolbarProps = React.HTMLAttributes<HTMLDivElement> & {
  density?: 'compact' | 'comfortable';
};

function Toolbar({ density = 'compact', className, ...props }: ToolbarProps) {
  return (
    <div
      role="toolbar"
      className={cn(
        'flex flex-wrap items-center gap-2 rounded-[var(--ui-radius-lg)] border border-[var(--ui-border)] bg-[var(--ui-surface)] px-3',
        density === 'compact' ? 'min-h-11 py-2' : 'min-h-12 py-2.5',
        className,
      )}
      {...props}
    />
  );
}

type ToolbarGroupProps = React.HTMLAttributes<HTMLDivElement>;

function ToolbarGroup({ className, ...props }: ToolbarGroupProps) {
  return <div className={cn('flex min-w-0 flex-wrap items-center gap-2', className)} {...props} />;
}

function ToolbarSpacer({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('hidden flex-1 sm:block', className)} aria-hidden="true" {...props} />;
}

export { Toolbar, ToolbarGroup, ToolbarSpacer };

