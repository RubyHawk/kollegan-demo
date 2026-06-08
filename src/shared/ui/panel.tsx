import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@shared/lib/utils';

const panelVariants = cva(
  'rounded-[var(--ui-radius-lg)] border text-[var(--ui-text)]',
  {
    variants: {
      variant: {
        base: 'border-[var(--ui-border)] bg-[var(--ui-surface)]',
        subtle: 'border-[var(--ui-border-subtle)] bg-[var(--ui-surface-subtle)]',
        raised: 'border-[var(--ui-border)] bg-[var(--ui-surface-raised)] shadow-[var(--ui-shadow-raised)]',
        selected: 'border-[var(--ui-accent-border)] bg-[var(--ui-surface-selected)]',
        warning: 'border-[var(--ui-warning-border)] bg-[var(--ui-warning-bg)] text-[var(--ui-warning-text)]',
        danger: 'border-[var(--ui-danger-border)] bg-[var(--ui-danger-bg)] text-[var(--ui-danger-text)]',
        info: 'border-[var(--ui-info-border)] bg-[var(--ui-info-bg)] text-[var(--ui-info-text)]',
      },
      padding: {
        none: 'p-0',
        sm: 'p-3',
        md: 'p-4',
        lg: 'p-5',
      },
    },
    defaultVariants: {
      variant: 'base',
      padding: 'md',
    },
  },
);

export interface PanelProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof panelVariants> {}

const Panel = React.forwardRef<HTMLDivElement, PanelProps>(
  ({ className, variant, padding, ...props }, ref) => (
    <div ref={ref} className={cn(panelVariants({ variant, padding, className }))} {...props} />
  ),
);
Panel.displayName = 'Panel';

export { Panel, panelVariants };

