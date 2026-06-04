'use client';

import { useCallback, useEffect, type MutableRefObject } from 'react';
import {
  getTemplate,
  previewTemplate,
  type TemplateBrandingPreview,
} from '@shared/lib/api/templates.api';
import { deriveValidityDays } from '@modules/supporting/offers/domain/validity';
import type { ContactResult, Offer, OfferForm } from '../_store/types';
import { EMPTY_LINE } from '../_store/types';
import { useOffersFormStore } from '../_store/offers-form.store';
import { clearOfferDraftAutosave } from './use-offer-draft-autosave';

type CompanyBranding = {
  name?: string | null;
  website?: string | null;
  logoUrl?: string | null;
  senderEmail?: string | null;
  senderName?: string | null;
  emailHeaderConfig?: unknown;
};

function toTemplateBrandingPreview(
  branding?: CompanyBranding,
): TemplateBrandingPreview | undefined {
  if (!branding) return undefined;

  return {
    ...(branding.name ? { name: branding.name } : {}),
    ...(branding.website ? { website: branding.website } : {}),
    ...(branding.logoUrl ? { logoUrl: branding.logoUrl } : {}),
    ...(branding.senderEmail ? { senderEmail: branding.senderEmail } : {}),
    ...(branding.senderName ? { senderName: branding.senderName } : {}),
    ...(typeof branding.emailHeaderConfig === 'string' && branding.emailHeaderConfig
      ? { emailHeaderConfig: branding.emailHeaderConfig }
      : {}),
  };
}

type UseOfferWizardLifecycleInput = {
  dismissNotices: () => void;
  livePreviewTimer: MutableRefObject<ReturnType<typeof setTimeout> | null>;
  priceDisplayMode: Offer['priceDisplayMode'];
  resetForm: () => void;
  selectedCompanyBranding?: CompanyBranding;
  selectedCompanyId?: string | null;
  setCachedTplContent: (content: string | null) => void;
  setConfirmedSections: (sections: Set<'mottagare' | 'detaljer'>) => void;
  setContactResults: (results: ContactResult[]) => void;
  setContactSearch: (value: string) => void;
  setEditingOfferId: (id: string | null) => void;
  setFieldErrors: (errors: Record<string, string>) => void;
  setForm: (form: OfferForm | ((prev: OfferForm) => OfferForm)) => void;
  setLivePreviewHtml: (html: string | null) => void;
  setLivePreviewLoading: (loading: boolean) => void;
  setOpenCards: (cards: { mottagare: boolean; detaljer: boolean }) => void;
  setOpenLines: (lines: Set<number>) => void;
  setSelectedCompanyId: (id: string) => void;
  setShowForm: (show: boolean) => void;
  setWizardStep: (step: 1 | 2) => void;
};

export function useOfferWizardLifecycle({
  dismissNotices,
  livePreviewTimer,
  priceDisplayMode,
  resetForm,
  selectedCompanyBranding,
  selectedCompanyId,
  setCachedTplContent,
  setConfirmedSections,
  setContactResults,
  setContactSearch,
  setEditingOfferId,
  setFieldErrors,
  setForm,
  setLivePreviewHtml,
  setLivePreviewLoading,
  setOpenCards,
  setOpenLines,
  setSelectedCompanyId,
  setShowForm,
  setWizardStep,
}: UseOfferWizardLifecycleInput) {
  const openCreateOffer = useCallback(() => {
    if (livePreviewTimer.current) clearTimeout(livePreviewTimer.current);
    resetForm();
    setForm((current) => ({ ...current, companyId: selectedCompanyId || current.companyId }));
    dismissNotices();
    setShowForm(true);
  }, [
    dismissNotices,
    livePreviewTimer,
    resetForm,
    selectedCompanyId,
    setForm,
    setShowForm,
  ]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('new') !== 'true') return;

    setShowForm(true);
    setEditingOfferId(null);
    resetForm();
    setForm((current) => ({ ...current, companyId: selectedCompanyId || current.companyId }));
    setWizardStep(1);
    window.history.replaceState(null, '', window.location.pathname);
  }, [resetForm, selectedCompanyId, setEditingOfferId, setForm, setShowForm, setWizardStep]);

  const openEdit = useCallback((offer: Offer) => {
    if (offer.companyId) {
      setSelectedCompanyId(offer.companyId);
    }
    setEditingOfferId(offer.id);
    setForm({
      templateId: offer.templateId ?? '',
      priceDisplayMode,
      contactId: offer.customerId ?? '',
      leadId: offer.leadId ?? '',
      companyId: offer.companyId ?? '',
      title: offer.title,
      recipientName: offer.recipientName,
      recipientEmail: offer.recipientEmail,
      recipientCompany: offer.recipientCompany ?? '',
      notes: offer.notes ?? '',
      validityDays: offer.validityDays
        ?? (offer.validUntil ? deriveValidityDays(offer.createdAt, offer.validUntil) : 30),
      lineItems: offer.lineItems.length > 0 ? offer.lineItems : [{ ...EMPTY_LINE }],
    });
    setWizardStep(2);
    setLivePreviewHtml(null);
    setCachedTplContent(null);
    setFieldErrors({});
    setContactSearch('');
    setContactResults([]);

    if (offer.templateId) {
      const templateId = offer.templateId;
      void (async () => {
        setLivePreviewLoading(true);
        try {
          const template = await getTemplate(templateId);
          const content = template.content ?? null;
          setCachedTplContent(content);
          if (content) {
            const html = await previewTemplate({
              content,
              branding: toTemplateBrandingPreview(selectedCompanyBranding),
              offer: { priceDisplayMode },
            });
            setLivePreviewHtml(html || null);
          }
        } catch {
          /* ignore */
        } finally {
          setLivePreviewLoading(false);
        }
      })();
    }

    setOpenCards({ mottagare: true, detaljer: true });
    setConfirmedSections(new Set());
    setOpenLines(new Set([0]));
    dismissNotices();
    setShowForm(true);
  }, [
    dismissNotices,
    priceDisplayMode,
    selectedCompanyBranding,
    setCachedTplContent,
    setConfirmedSections,
    setContactResults,
    setContactSearch,
    setEditingOfferId,
    setFieldErrors,
    setForm,
    setLivePreviewHtml,
    setLivePreviewLoading,
    setOpenCards,
    setOpenLines,
    setSelectedCompanyId,
    setShowForm,
    setWizardStep,
  ]);

  const closeWizard = useCallback(() => {
    const state = useOffersFormStore.getState();
    const dirty = state.form.recipientName.trim() !== ''
      || state.form.lineItems.some((line) => line.description.trim() !== '');
    if (dirty && !window.confirm('Stäng utan att spara? Alla ändringar försvinner.')) return;

    clearOfferDraftAutosave();
    setShowForm(false);
    resetForm();
    dismissNotices();
    if (livePreviewTimer.current) clearTimeout(livePreviewTimer.current);
  }, [
    dismissNotices,
    livePreviewTimer,
    resetForm,
    setShowForm,
  ]);

  return {
    closeWizard,
    openCreateOffer,
    openEdit,
  };
}
