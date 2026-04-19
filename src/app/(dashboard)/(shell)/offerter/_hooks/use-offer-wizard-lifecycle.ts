'use client';

import { useCallback, useEffect, type MutableRefObject } from 'react';
import { fetchWithRefresh } from '@shared/lib/api-client';
import { deriveValidityDays } from '@modules/supporting/offers/domain/validity';
import type { ContactResult, Offer, OfferForm } from '../_store/types';
import { EMPTY_FORM, EMPTY_LINE } from '../_store/types';
import { useOffersFormStore } from '../_store/offers-form.store';

type CompanyBranding = {
  name?: string | null;
  website?: string | null;
  logoUrl?: string | null;
  senderEmail?: string | null;
  senderName?: string | null;
  emailHeaderConfig?: unknown;
};

type UseOfferWizardLifecycleInput = {
  dismissNotices: () => void;
  livePreviewTimer: MutableRefObject<ReturnType<typeof setTimeout> | null>;
  priceDisplayMode: Offer['priceDisplayMode'];
  resetForm: () => void;
  selectedCompanyBranding?: CompanyBranding;
  selectedCompanyId?: string | null;
  setActiveField: (field: string | null) => void;
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
  setPreviewDirty: (dirty: boolean) => void;
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
  setActiveField,
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
  setPreviewDirty,
  setSelectedCompanyId,
  setShowForm,
  setWizardStep,
}: UseOfferWizardLifecycleInput) {
  const openCreateOffer = useCallback(() => {
    setShowForm(true);
    setEditingOfferId(null);
    setForm(EMPTY_FORM);
    dismissNotices();
    setWizardStep(1);
    setLivePreviewHtml(null);
    setCachedTplContent(null);
  }, [
    dismissNotices,
    setCachedTplContent,
    setEditingOfferId,
    setForm,
    setLivePreviewHtml,
    setShowForm,
    setWizardStep,
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
      contactId: '',
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
      void (async () => {
        setLivePreviewLoading(true);
        try {
          const tplRes = await fetchWithRefresh(`/api/templates/${offer.templateId}`);
          if (!tplRes.ok) throw new Error();
          const tplData = await tplRes.json() as { data?: { content?: string } };
          const content = tplData.data?.content ?? null;
          setCachedTplContent(content);
          if (content) {
            const res = await fetchWithRefresh('/api/templates/preview', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                content,
                branding: selectedCompanyBranding,
                offer: { priceDisplayMode },
              }),
            });
            const json = await res.json() as { html?: string };
            setLivePreviewHtml(json.html ?? null);
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

    setShowForm(false);
    setForm(EMPTY_FORM);
    setEditingOfferId(null);
    dismissNotices();
    setFieldErrors({});
    setContactSearch('');
    setContactResults([]);
    setWizardStep(1);
    setLivePreviewHtml(null);
    setCachedTplContent(null);
    setPreviewDirty(false);
    setActiveField(null);
    setOpenCards({ mottagare: true, detaljer: true });
    setConfirmedSections(new Set());
    setOpenLines(new Set([0]));
    if (livePreviewTimer.current) clearTimeout(livePreviewTimer.current);
  }, [
    dismissNotices,
    livePreviewTimer,
    setActiveField,
    setCachedTplContent,
    setConfirmedSections,
    setContactResults,
    setContactSearch,
    setEditingOfferId,
    setFieldErrors,
    setForm,
    setLivePreviewHtml,
    setOpenCards,
    setOpenLines,
    setPreviewDirty,
    setShowForm,
    setWizardStep,
  ]);

  return {
    closeWizard,
    openCreateOffer,
    openEdit,
  };
}
