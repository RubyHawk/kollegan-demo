import * as React from 'react';
import { cn } from '@shared/lib/utils';

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<'input'>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-10 w-full rounded-[var(--ui-radius-md)] border border-[var(--ui-border)] bg-[var(--ui-surface)] px-3 py-2 text-sm text-[var(--ui-text)] ring-offset-[var(--ui-bg)] file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-[var(--ui-text-muted)] hover:border-[var(--ui-border-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ui-focus)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:border-[var(--ui-disabled-border)] disabled:bg-[var(--ui-disabled-bg)] disabled:text-[var(--ui-text-disabled)]',
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = 'Input';

export { Input };
