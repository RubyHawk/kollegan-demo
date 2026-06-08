import * as React from 'react';
import { cn } from '@shared/lib/utils';

type PageHeaderProps = Omit<React.HTMLAttributes<HTMLElement>, 'title'> & {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  meta?: React.ReactNode;
  actions?: React.ReactNode;
};

function PageHeader({ eyebrow, title, description, meta, actions, className, ...props }: PageHeaderProps) {
  return (
    <header className={cn('flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between', className)} {...props}>
      <div className="min-w-0 space-y-1">
        {eyebrow ? <p className="text-xs font-medium uppercase text-[var(--ui-text-muted)]">{eyebrow}</p> : null}
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-xl font-semibold leading-tight text-[var(--ui-text)]">{title}</h1>
          {meta}
        </div>
        {description ? <p className="max-w-3xl text-sm leading-6 text-[var(--ui-text-muted)]">{description}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  );
}

export { PageHeader };
