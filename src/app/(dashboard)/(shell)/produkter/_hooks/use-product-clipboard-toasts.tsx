'use client';

import { useCallback } from 'react';
import { Check } from 'lucide-react';
import type { Toast } from '@shared/ui/toast/types';

type UseProductClipboardToastsInput = {
  addToast: (toast: Omit<Toast, 'id'>) => void;
  setViewLinkCopied: (copied: boolean) => void;
};

export function useProductClipboardToasts({
  addToast,
  setViewLinkCopied,
}: UseProductClipboardToastsInput) {
  const copyCurrentViewLink = useCallback(async () => {
    await navigator.clipboard.writeText(window.location.href).catch(() => {});
    setViewLinkCopied(true);
    addToast({
      message: 'Vy-länk kopierad',
      color: 'emerald',
      icon: <Check aria-hidden="true" size={14} strokeWidth={2} />,
    });
    window.setTimeout(() => setViewLinkCopied(false), 1800);
  }, [addToast, setViewLinkCopied]);

  return { copyCurrentViewLink };
}
