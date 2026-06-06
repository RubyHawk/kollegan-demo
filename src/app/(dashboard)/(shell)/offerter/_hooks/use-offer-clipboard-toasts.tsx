'use client';

import { useCallback } from 'react';
import { Check } from 'lucide-react';
import type { Toast } from '@shared/ui/toast/types';

type UseOfferClipboardToastsInput = {
  addToast: (toast: Omit<Toast, 'id'>) => void;
  setCopiedText: (key: string | null) => void;
  setViewLinkCopied: (copied: boolean) => void;
};

export function useOfferClipboardToasts({
  addToast,
  setCopiedText,
  setViewLinkCopied,
}: UseOfferClipboardToastsInput) {
  const copyText = useCallback(async (key: string, value: string, label: string) => {
    if (!value) return;
    await navigator.clipboard.writeText(value).catch(() => {});
    setCopiedText(key);
    addToast({
      message: `${label} kopierad`,
      color: 'emerald',
      icon: <Check aria-hidden="true" size={14} strokeWidth={2} />,
    });
    window.setTimeout(() => setCopiedText(null), 1800);
  }, [addToast, setCopiedText]);

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

  return {
    copyCurrentViewLink,
    copyText,
  };
}
