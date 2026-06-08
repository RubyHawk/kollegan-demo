import * as React from 'react';
import { Circle } from 'lucide-react';
import type { StatusTone } from '@shared/ui/status-badge';
import { cn } from '@shared/lib/utils';

export type ActivityFeedItem = {
  id: string;
  title: React.ReactNode;
  detail?: React.ReactNode;
  timestamp?: React.ReactNode;
  tone?: StatusTone;
  href?: string;
};

const toneClass: Record<StatusTone, string> = {
  neutral: 'text-[var(--ui-text-muted)]',
  accent: 'text-[var(--ui-accent)]',
  success: 'text-[var(--ui-success-text)]',
  warning: 'text-[var(--ui-warning-text)]',
  danger: 'text-[var(--ui-danger-text)]',
  info: 'text-[var(--ui-info-text)]',
};

type ActivityFeedProps = React.HTMLAttributes<HTMLDivElement> & {
  items: ActivityFeedItem[];
  empty?: React.ReactNode;
};

function ActivityFeed({ items, empty, className, ...props }: ActivityFeedProps) {
  return (
    <div className={cn('rounded-[var(--ui-radius-lg)] border border-[var(--ui-border)] bg-[var(--ui-surface)]', className)} {...props}>
      {items.length === 0 ? (
        <div className="p-4 text-sm text-[var(--ui-text-muted)]">{empty ?? 'Ingen aktivitet'}</div>
      ) : (
        <ol className="divide-y divide-[var(--ui-border)]">
          {items.map((item) => {
            const content = (
              <div className="flex gap-3 p-3">
                <Circle size={10} strokeWidth={2} className={cn('mt-1.5 shrink-0 fill-current', toneClass[item.tone ?? 'neutral'])} aria-hidden />
                <div className="min-w-0 flex-1">
                  <div className="flex min-w-0 flex-wrap items-baseline justify-between gap-2">
                    <p className="truncate text-sm font-medium text-[var(--ui-text)]">{item.title}</p>
                    {item.timestamp ? <time className="text-xs text-[var(--ui-text-muted)]">{item.timestamp}</time> : null}
                  </div>
                  {item.detail ? <p className="mt-0.5 line-clamp-2 text-sm leading-5 text-[var(--ui-text-muted)]">{item.detail}</p> : null}
                </div>
              </div>
            );

            return (
              <li key={item.id}>
                {item.href ? (
                  <a href={item.href} className="block hover:bg-[var(--ui-surface-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--ui-focus)]">
                    {content}
                  </a>
                ) : content}
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}

export { ActivityFeed };
