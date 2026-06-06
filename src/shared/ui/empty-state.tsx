import * as React from 'react';
import { Inbox } from 'lucide-react';
import { Button } from '@shared/ui/button';
import { cn } from '@shared/lib/utils';

type EmptyStateProps = Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> & {
  icon?: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
  title: React.ReactNode;
  description?: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
};

function EmptyState({ icon: Icon = Inbox, title, description, actionLabel, onAction, className, ...props }: EmptyStateProps) {
  return (
    <div className={cn('grid justify-items-center gap-3 px-4 py-8 text-center', className)} {...props}>
      <div className="flex h-10 w-10 items-center justify-center rounded-[var(--ui-radius-lg)] border border-[var(--ui-border)] bg-[var(--ui-surface-subtle)] text-[var(--ui-text-muted)]">
        <Icon size={24} strokeWidth={1.75} aria-hidden />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium text-[var(--ui-text)]">{title}</p>
        {description ? <p className="max-w-sm text-sm leading-5 text-[var(--ui-text-muted)]">{description}</p> : null}
      </div>
      {actionLabel && onAction ? (
        <Button type="button" size="compact" variant="secondary" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}

export { EmptyState };
