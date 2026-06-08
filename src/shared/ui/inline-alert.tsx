import * as React from 'react';
import { AlertCircle, CheckCircle, Info, TriangleAlert } from 'lucide-react';
import { cn } from '@shared/lib/utils';

type InlineAlertTone = 'info' | 'success' | 'warning' | 'danger';

const toneClasses: Record<InlineAlertTone, string> = {
  info: 'border-[var(--ui-info-border)] bg-[var(--ui-info-bg)] text-[var(--ui-info-text)]',
  success: 'border-[var(--ui-success-border)] bg-[var(--ui-success-bg)] text-[var(--ui-success-text)]',
  warning: 'border-[var(--ui-warning-border)] bg-[var(--ui-warning-bg)] text-[var(--ui-warning-text)]',
  danger: 'border-[var(--ui-danger-border)] bg-[var(--ui-danger-bg)] text-[var(--ui-danger-text)]',
};

const toneIcons = {
  info: Info,
  success: CheckCircle,
  warning: TriangleAlert,
  danger: AlertCircle,
};

type InlineAlertProps = Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> & {
  tone?: InlineAlertTone;
  title?: React.ReactNode;
};

function InlineAlert({ tone = 'info', title, children, className, ...props }: InlineAlertProps) {
  const Icon = toneIcons[tone];

  return (
    <div
      role={tone === 'danger' || tone === 'warning' ? 'alert' : 'status'}
      className={cn('flex gap-3 rounded-[var(--ui-radius-lg)] border p-3 text-sm', toneClasses[tone], className)}
      {...props}
    >
      <Icon size={16} strokeWidth={1.75} className="mt-0.5 shrink-0" aria-hidden />
      <div className="min-w-0 space-y-1">
        {title ? <p className="font-medium">{title}</p> : null}
        {children ? <div className="leading-5">{children}</div> : null}
      </div>
    </div>
  );
}

export { InlineAlert };
