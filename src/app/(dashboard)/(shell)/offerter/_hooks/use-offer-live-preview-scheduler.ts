'use client';

import { useCallback, useEffect, type RefObject } from 'react';
import { previewTemplate } from '@shared/lib/api/templates.api';
import type { OfferPriceDisplayMode } from '@shared/lib/api/offers.api';
import type { OfferForm } from '../_store/types';

type PreviewBranding = Parameters<typeof previewTemplate>[0]['branding'];

type UseOfferLivePreviewSchedulerInput = {
  form: OfferForm;
  showForm: boolean;
  wizardStep: number;
  cachedTplContent?: string | null;
  livePreviewTimer: RefObject<ReturnType<typeof setTimeout> | null>;
  selectedCompanyBranding?: PreviewBranding;
  priceDisplayMode: OfferPriceDisplayMode;
  setPreviewDirty: (dirty: boolean) => void;
  setLivePreviewLoading: (loading: boolean) => void;
  setLivePreviewHtml: (html: string) => void;
  setActiveField: (field: string | null) => void;
};

export function useOfferLivePreviewScheduler({
  form,
  showForm,
  wizardStep,
  cachedTplContent,
  livePreviewTimer,
  selectedCompanyBranding,
  priceDisplayMode,
  setPreviewDirty,
  setLivePreviewLoading,
  setLivePreviewHtml,
  setActiveField,
}: UseOfferLivePreviewSchedulerInput) {
  const scheduleLivePreview = useCallback((currentForm: OfferForm, content: string) => {
    setPreviewDirty(true);
    if (livePreviewTimer.current) clearTimeout(livePreviewTimer.current);
    livePreviewTimer.current = setTimeout(async () => {
      const validItems = currentForm.lineItems.filter((item) => item.description.trim() && item.quantity > 0);
      try {
        setLivePreviewLoading(true);
        setPreviewDirty(false);
        const html = await previewTemplate({
          content,
          branding: selectedCompanyBranding,
          offer: {
            priceDisplayMode,
            title: currentForm.title || undefined,
            recipientName: currentForm.recipientName || undefined,
            recipientEmail: currentForm.recipientEmail || undefined,
            recipientCompany: currentForm.recipientCompany || undefined,
            notes: currentForm.notes || undefined,
            lineItems: validItems.length > 0 ? validItems : undefined,
          },
        });
        if (html) setLivePreviewHtml(html);
      } catch {
        /* ignore */
      } finally {
        setLivePreviewLoading(false);
        setActiveField(null);
      }
    }, 1000);
  }, [
    livePreviewTimer,
    priceDisplayMode,
    selectedCompanyBranding,
    setActiveField,
    setLivePreviewHtml,
    setLivePreviewLoading,
    setPreviewDirty,
  ]);

  useEffect(() => {
    if (!showForm || wizardStep !== 2 || !cachedTplContent) return;
    scheduleLivePreview(form, cachedTplContent);
  }, [
    form.title,
    form.recipientName,
    form.recipientEmail,
    form.recipientCompany,
    form.notes,
    form.lineItems,
    form,
    showForm,
    wizardStep,
    cachedTplContent,
    scheduleLivePreview,
  ]);
}
