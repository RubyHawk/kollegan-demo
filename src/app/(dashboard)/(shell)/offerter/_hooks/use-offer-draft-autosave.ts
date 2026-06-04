'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { OfferForm } from '../_store/types';
import { EMPTY_FORM, EMPTY_LINE } from '../_store/types';

type OfferDraftPayload = {
  form: OfferForm;
  wizardStep: 1 | 2;
  updatedAt: string;
};

type DraftStatus = 'idle' | 'dirty' | 'autosaving' | 'autosaved' | 'restored';

type UseOfferDraftAutosaveInput = {
  editingOfferId: string | null;
  form: OfferForm;
  showForm: boolean;
  wizardStep: 1 | 2;
  setForm: (form: OfferForm | ((prev: OfferForm) => OfferForm)) => void;
  setWizardStep: (step: 1 | 2) => void;
};

const STORAGE_KEY = 'soleria:offer-wizard:draft:v1';

function hasMeaningfulOfferDraft(form: OfferForm): boolean {
  return Boolean(
    form.templateId
      || form.contactId
      || form.leadId
      || form.companyId
      || form.title.trim()
      || form.recipientName.trim()
      || form.recipientEmail.trim()
      || form.recipientCompany.trim()
      || form.notes.trim()
      || form.lineItems.some((line) => (
        line.description.trim()
        || line.quantity !== 1
        || (line.unit ?? 'st').trim() !== 'st'
        || line.unitPrice > 0
        || line.discount > 0
      )),
  );
}

function readDraft(): OfferDraftPayload | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as OfferDraftPayload;
    if (!parsed?.form?.lineItems?.length) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearOfferDraftAutosave() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Local storage can be unavailable in private browsing.
  }
}

export function useOfferDraftAutosave({
  editingOfferId,
  form,
  showForm,
  wizardStep,
  setForm,
  setWizardStep,
}: UseOfferDraftAutosaveInput) {
  const [status, setStatus] = useState<DraftStatus>('idle');
  const [restoredAt, setRestoredAt] = useState<string | null>(null);
  const restoredThisSessionRef = useRef(false);
  const serializedForm = useMemo(() => JSON.stringify({ form, wizardStep }), [form, wizardStep]);

  useEffect(() => {
    if (!showForm || editingOfferId || restoredThisSessionRef.current) return;
    if (hasMeaningfulOfferDraft(form)) return;

    const draft = readDraft();
    if (!draft) return;

    restoredThisSessionRef.current = true;
    setForm(draft.form);
    setWizardStep(draft.wizardStep);
    window.setTimeout(() => {
      setRestoredAt(draft.updatedAt);
      setStatus('restored');
    }, 0);
  }, [editingOfferId, form, setForm, setWizardStep, showForm]);

  useEffect(() => {
    if (!showForm || editingOfferId) return;
    if (!hasMeaningfulOfferDraft(form)) return;

    const id = window.setTimeout(() => {
      setStatus('autosaving');
      try {
        const payload: OfferDraftPayload = {
          form,
          wizardStep,
          updatedAt: new Date().toISOString(),
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
        setStatus('autosaved');
      } catch {
        setStatus('dirty');
      }
    }, 900);

    return () => window.clearTimeout(id);
  }, [editingOfferId, form, serializedForm, showForm, wizardStep]);

  const discardRestoredDraft = useCallback(() => {
    clearOfferDraftAutosave();
    setRestoredAt(null);
    setStatus('idle');
    setForm({ ...EMPTY_FORM, lineItems: [{ ...EMPTY_LINE }] });
    setWizardStep(1);
  }, [setForm, setWizardStep]);

  const dismissRestoredDraft = useCallback(() => {
    setRestoredAt(null);
    setStatus((current) => current === 'restored' ? 'autosaved' : current);
  }, []);

  return {
    draftStatus: status,
    restoredAt,
    discardRestoredDraft,
    dismissRestoredDraft,
  };
}
