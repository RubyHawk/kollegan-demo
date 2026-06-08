import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@shared/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[var(--ui-radius-md)] text-sm font-medium ring-offset-[var(--ui-bg)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ui-focus)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-[var(--ui-disabled-bg)] disabled:text-[var(--ui-text-disabled)] disabled:opacity-100 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 cursor-pointer',
  {
    variants: {
      variant: {
        default:
          'bg-[var(--ui-accent)] text-[var(--ui-text-inverse)] hover:bg-[var(--ui-accent-hover)] active:bg-[var(--ui-accent-active)]',
        destructive:
          'bg-[var(--ui-danger-fill)] text-[var(--ui-text-inverse)] hover:bg-[var(--ui-danger-fill-hover)] active:bg-[var(--ui-danger-fill-hover)]',
        outline:
          'border border-[var(--ui-border)] bg-transparent text-[var(--ui-text)] hover:bg-[var(--ui-surface-hover)]',
        secondary:
          'border border-[var(--ui-border)] bg-[var(--ui-surface-subtle)] text-[var(--ui-text)] hover:bg-[var(--ui-surface-hover)]',
        ghost:
          'text-[var(--ui-text-secondary)] hover:bg-[var(--ui-surface-hover)] hover:text-[var(--ui-text)]',
        link:
          'h-auto rounded-none px-0 text-[var(--ui-accent)] underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-4 py-2',
        compact: 'h-9 px-3',
        sm: 'h-9 px-3',
        lg: 'h-11 px-5',
        icon: 'h-9 w-9 p-0',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

const LoadingSpinner = () => (
  <span
    className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
    aria-hidden
  />
);

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      loading = false,
      disabled,
      children,
      ...props
    },
    ref,
  ) => {
    const classes = cn(buttonVariants({ variant, size, className }));

    if (asChild) {
      return (
        <Slot
          className={classes}
          ref={ref}
          aria-busy={loading || undefined}
          aria-disabled={disabled || loading || undefined}
          data-disabled={disabled || loading ? '' : undefined}
          {...props}
        >
          {children}
        </Slot>
      );
    }

    return (
      <button
        className={classes}
        ref={ref}
        aria-busy={loading || undefined}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? <LoadingSpinner /> : null}
        {children}
      </button>
    );
  },
);

Button.displayName = 'Button';

export { Button, buttonVariants };