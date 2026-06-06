import * as React from 'react';
import { Badge } from '@shared/ui/badge';

export type StatusTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'accent';

type StatusBadgeProps = React.ComponentProps<typeof Badge> & {
  tone?: StatusTone;
};

const toneToVariant: Record<StatusTone, React.ComponentProps<typeof Badge>['variant']> = {
  neutral: 'neutral',
  success: 'success',
  warning: 'warning',
  danger: 'danger',
  info: 'info',
  accent: 'accent',
};

function StatusBadge({ tone = 'neutral', variant, ...props }: StatusBadgeProps) {
  return <Badge variant={variant ?? toneToVariant[tone]} {...props} />;
}

export { StatusBadge };

