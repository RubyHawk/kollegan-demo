'use client';

import { useCallback, useRef } from 'react';
import {
  createOffer as createOfferRequest,
  updateOffer,
  type SaveOfferPayload,
} from '@shared/lib/api/offers.api';
import type { Offer, OfferForm, OfferPriceDisplayMode } from '../_store/types';
import { EMPTY_FORM } from '../_store/types';
import type { BlockingAlert } from '../_components/offer-blocking-alerts';
import { clearOfferDraftAutosave } from './use-offer-draft-autosave';

type UseOfferWizardSubmitInput = {
  dismissNotices: () => void;
  editingOfferId: string | null;
  form: OfferForm;
  priceDisplayMode: OfferPriceDisplayMode;
  load: (silent?: boolean) => Promise<void>;
  loadCounts: () => Promise<void>;
  setBlockingAlert: (alert: BlockingAlert | null) => void;
  setConfirmSend: (offer: Offer | null) => void;
  setDraftSaved: (saved: boolean) => void;
  setEditingOfferId: (id: string | null) => void;
  setError: (error: string | null) => void;
  setFieldErrors: (errors: Record<string, string>) => void;
  setForm: (form: OfferForm) => void;
  setSaving: (saving: boolean) => void;
  setShowForm: (show: boolean) => void;
};

function validateOfferForm(form: OfferForm): Record<string, string> {
  const errs: Record<string, string> = {};
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  if (!form.title.trim()) errs.title = 'Obligatoriskt';
  else if (form.title.trim().length < 2) errs.title = 'Minst 2 tecken';

  if (!form.recipientName.trim()) errs.recipientName = 'Obligatoriskt';
  else if (form.recipientName.trim().length < 2) errs.recipientName = 'Minst 2 tecken';

  if (!form.recipientEmail.trim()) errs.recipientEmail = 'Obligatoriskt';
  else if (!emailRe.test(form.recipientEmail.trim())) errs.recipientEmail = 'Ogiltig e-postadress';

  let anyComplete = false;
  form.lineItems.forEach((item, idx) => {
    const hasDesc = item.description.trim().length > 0;
    const hasQty = item.quantity > 0;
    if (hasDesc && hasQty) anyComplete = true;
    if (hasDesc && !hasQty) errs[`line_${idx}_quantity`] = 'Måste vara > 0';
    if (hasQty && !hasDesc) errs[`line_${idx}_description`] = 'Beskrivning saknas';
  });
  if (!anyComplete) errs.lineItems = 'Minst en rad måste ha beskrivning och antal > 0.';

  return errs;
}

function buildOfferPayload(form: OfferForm, priceDisplayMode: OfferPriceDisplayMode): SaveOfferPayload {
  const body: SaveOfferPayload = {
    title: form.title,
    priceDisplayMode,
    recipientName: form.recipientName,
    recipientEmail: form.recipientEmail,
    recipientCompany: form.recipientCompany || undefined,
    notes: form.notes || undefined,
    validityDays: form.validityDays,
    lineItems: form.lineItems
      .filter((item) => item.description.trim() && item.quantity > 0)
      .map((item, idx) => ({
        ...item,
        sortOrder: idx,
      })),
  };

  if (form.templateId) body.templateId = form.templateId;
  if (form.contactId) body.customerId = form.contactId;
  if (form.companyId) body.companyId = form.companyId;

  return body;
}

export function useOfferWizardSubmit({
  dismissNotices,
  editingOfferId,
  form,
  priceDisplayMode,
  load,
  loadCounts,
  setBlockingAlert,
  setConfirmSend,
  setDraftSaved,
  setEditingOfferId,
  setError,
  setFieldErrors,
  setForm,
  setSaving,
  setShowForm,
}: UseOfferWizardSubmitInput) {
  const saveAndSendRef = useRef(false);

  const createOffer = useCallback(async () => {
    const errs = validateOfferForm(form);
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      return;
    }

    setSaving(true);
    dismissNotices();
    setFieldErrors({});

    try {
      const body = buildOfferPayload(form, priceDisplayMode);
      const savedOffer = editingOfferId
        ? await updateOffer(editingOfferId, body)
        : await createOfferRequest(body);
      clearOfferDraftAutosave();
      setShowForm(false);
      setForm(EMPTY_FORM);
      setEditingOfferId(null);
      await Promise.all([load(true), loadCounts()]);

      if (saveAndSendRef.current) {
        saveAndSendRef.current = false;
        setConfirmSend(savedOffer);
      } else {
        setDraftSaved(true);
        setTimeout(() => setDraftSaved(false), 3000);
      }
    } catch {
      setBlockingAlert(null);
      setError('Kunde inte skapa offerten. Kontrollera anslutningen och försök igen.');
    } finally {
      setSaving(false);
    }
  }, [
    dismissNotices,
    editingOfferId,
    form,
    load,
    loadCounts,
    priceDisplayMode,
    setBlockingAlert,
    setConfirmSend,
    setDraftSaved,
    setEditingOfferId,
    setError,
    setFieldErrors,
    setForm,
    setSaving,
    setShowForm,
  ]);

  const markSaveAndSend = useCallback(() => {
    saveAndSendRef.current = true;
  }, []);

  return {
    createOffer,
    markSaveAndSend,
    saveAndSendActive: saveAndSendRef.current,
  };
}
