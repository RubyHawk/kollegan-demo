'use client';

import { useEffect, useState } from 'react';
import type { Toast } from './types';

interface ContainerProps {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}

export default function ToastContainer({ toasts, onDismiss }: ContainerProps) {
  return (
    <div className="fixed bottom-6 right-6 z-[200] flex flex-col gap-2 items-end pointer-events-none">
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
    const t1 = setTimeout(() => setExiting(true), 3200);
    const t2 = setTimeout(() => onDismiss(toast.id), 3550);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [toast.id, onDismiss]);

  const borderColorMap: Record<Toast['color'], string> = {
    amber: 'border-l-amber-400',
    emerald: 'border-l-emerald-400',
    red: 'border-l-red-400',
    indigo: 'border-l-indigo-400',
    gray: 'border-l-stone-400',
  };

  const bgColorMap: Record<Toast['color'], string> = {
    amber: 'bg-amber-50/90 dark:bg-amber-950/90',
    emerald: 'bg-emerald-50/90 dark:bg-emerald-950/90',
    red: 'bg-red-50/90 dark:bg-red-950/90',
    indigo: 'bg-indigo-50/90 dark:bg-indigo-950/90',
    gray: 'bg-white/90 dark:bg-zinc-800/90',
  };

  return (
    <div
      className={[
        'pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-2xl',
        'border border-white/50 dark:border-white/10 border-l-4',
        bgColorMap[toast.color],
        borderColorMap[toast.color],
        'backdrop-blur-xl shadow-elevated',
        'min-w-[220px] max-w-[300px]',
        exiting ? 'toast-out' : 'toast-in',
      ].join(' ')}
    >
      <span className="shrink-0 text-base">{toast.icon}</span>
      <p className="text-sm font-medium text-[var(--text-primary)] leading-snug">
        {toast.message}
      </p>
    </div>
  );
}
