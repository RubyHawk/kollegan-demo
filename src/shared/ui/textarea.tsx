import * as React from 'react';
import { cn } from '@shared/lib/utils';

const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<'textarea'>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        'min-h-24 w-full rounded-[var(--ui-radius-md)] border border-[var(--ui-border)] bg-[var(--ui-surface)] px-3 py-2 text-sm text-[var(--ui-text)] ring-offset-[var(--ui-bg)] placeholder:text-[var(--ui-text-muted)] hover:border-[var(--ui-border-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ui-focus)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:border-[var(--ui-disabled-border)] disabled:bg-[var(--ui-disabled-bg)] disabled:text-[var(--ui-text-disabled)]',
        className,
      )}
      {...props}
    />
  ),
);
Textarea.displayName = 'Textarea';

export { Textarea };

