'use client';

import { useEffect, useState } from 'react';
import type { Toast } from './types';

interface ContainerProps {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}

export default function ToastContainer({ toasts, onDismiss }: ContainerProps) {
  return (
    <div className="fixed bottom-6 right-6 z-200 flex flex-col gap-2 items-end pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: Toast;
  onDismiss: (id: string) => void;
}) {
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const exitDelay = toast.action ? 7800 : 3200;
    const dismissDelay = toast.action ? 8200 : 3550;
    const t1 = setTimeout(() => setExiting(true), exitDelay);
    const t2 = setTimeout(() => onDismiss(toast.id), dismissDelay);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [toast.action, toast.id, onDismiss]);

  const toneClassMap: Record<Toast['color'], string> = {
    amber: 'border-[var(--ui-warning-border)] border-l-[var(--ui-warning-text)] bg-[var(--ui-warning-bg)] text-[var(--ui-warning-text)]',
    emerald: 'border-[var(--ui-success-border)] border-l-[var(--ui-success-text)] bg-[var(--ui-success-bg)] text-[var(--ui-success-text)]',
    red: 'border-[var(--ui-danger-border)] border-l-[var(--ui-danger-text)] bg-[var(--ui-danger-bg)] text-[var(--ui-danger-text)]',
    indigo: 'border-[var(--ui-accent-border)] border-l-[var(--ui-accent)] bg-[var(--ui-accent-subtle)] text-[var(--ui-accent)]',
    gray: 'border-[var(--ui-border)] border-l-[var(--ui-border-strong)] bg-[var(--ui-surface-raised)] text-[var(--ui-text-muted)]',
  };

  return (
    <div
      className={[
        'pointer-events-auto flex items-center gap-3 rounded-lg px-4 py-3',
        'border border-l-4',
        toneClassMap[toast.color],
        'shadow-[var(--ui-shadow-raised)]',
        'min-w-55 max-w-85',
        exiting ? 'toast-out' : 'toast-in',
      ].join(' ')}
    >
      <span className="shrink-0 text-base">{toast.icon}</span>
      <p className="text-sm font-medium leading-snug text-[var(--ui-text)]">
        {toast.message}
      </p>
      {toast.action ? (
        <button
          type="button"
          onClick={() => {
            toast.action?.onClick();
            onDismiss(toast.id);
          }}
          className="ml-1 shrink-0 rounded-md border border-[var(--ui-border)] bg-[var(--ui-surface)] px-2.5 py-1 text-xs font-semibold text-[var(--ui-accent)] transition-colors hover:bg-[var(--ui-surface-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ui-focus)] focus-visible:ring-offset-2"
        >
          {toast.action.label}
        </button>
      ) : null}
    </div>
  );
}
