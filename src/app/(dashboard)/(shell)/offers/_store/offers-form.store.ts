/**
 * Offers form store — manages the create/edit wizard state.
 *
 * Isolates wizard state (step, form values, preview, line items) from the
 * list view state so changes in the wizard don't re-render the list table.
 */

import { create } from 'zustand';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface LineItem {
  id?:         string;
  description: string;
  quantity:    number;
  unitPrice:   number;
  vatRate:     number;
  discount:    number;
}

interface OfferForm {
  templateId:       string;
  contactId:        string;
  title:            string;
  recipientName:    string;
  recipientEmail:   string;
  recipientCompany: string;
  notes:            string;
  validityDays:     number;
  lineItems:        LineItem[];
}

const EMPTY_LINE: LineItem = { description: '', quantity: 1, unitPrice: 0, vatRate: 0.25, discount: 0 };

const EMPTY_FORM: OfferForm = {
  templateId: '', contactId: '', title: '', recipientName: '',
  recipientEmail: '', recipientCompany: '', notes: '',
  validityDays: 30, lineItems: [{ ...EMPTY_LINE }],
};

// ─── Store ─────────────────────────────────────────────────────────────────────

interface OffersFormState {
  // ── Visibility ───────────────────────────────────────────────────────────────
  showForm:       boolean;
  editingOfferId: string | null;

  // ── Wizard ───────────────────────────────────────────────────────────────────
  wizardStep:     1 | 2;
  form:           OfferForm;
  fieldErrors:    Record<string, string>;
  saving:         boolean;
  draftSaved:     boolean;

  // ── Preview ──────────────────────────────────────────────────────────────────
  livePreviewHtml:    string | null;
  livePreviewLoading: boolean;
  previewDirty:       boolean;
  activeField:        string | null;
  cachedTplContent:   string | null;

  // ── UI helpers ───────────────────────────────────────────────────────────────
  openLines:   Set<number>;
  openCards:   { mottagare: boolean; detaljer: boolean };

  // ── Actions ──────────────────────────────────────────────────────────────────
  setShowForm:       (show: boolean) => void;
  setEditingOfferId: (id: string | null) => void;
  setWizardStep:     (step: 1 | 2) => void;
  setForm:           (form: OfferForm | ((prev: OfferForm) => OfferForm)) => void;
  setFieldErrors:    (errs: Record<string, string> | ((prev: Record<string, string>) => Record<string, string>)) => void;
  setSaving:         (saving: boolean) => void;
  setDraftSaved:     (saved: boolean) => void;
  setLivePreviewHtml:    (html: string | null) => void;
  setLivePreviewLoading: (loading: boolean) => void;
  setPreviewDirty:   (dirty: boolean) => void;
  setActiveField:    (field: string | null) => void;
  setCachedTplContent: (content: string | null) => void;
  setOpenLines:      (updater: Set<number> | ((prev: Set<number>) => Set<number>)) => void;
  setOpenCards:      (cards: { mottagare: boolean; detaljer: boolean }) => void;

  resetForm:         () => void;
}

export const useOffersFormStore = create<OffersFormState>()((set) => ({
  showForm:       false,
  editingOfferId: null,

  wizardStep:     1,
  form:           { ...EMPTY_FORM, lineItems: [{ ...EMPTY_LINE }] },
  fieldErrors:    {},
  saving:         false,
  draftSaved:     false,

  livePreviewHtml:    null,
  livePreviewLoading: false,
  previewDirty:       false,
  activeField:        null,
  cachedTplContent:   null,

  openLines: new Set([0]),
  openCards: { mottagare: true, detaljer: true },

  setShowForm:       (showForm)       => set({ showForm }),
  setEditingOfferId: (editingOfferId) => set({ editingOfferId }),
  setWizardStep:     (wizardStep)     => set({ wizardStep }),
  setForm:           (form)           => set((s) => ({ form: typeof form === 'function' ? form(s.form) : form })),
  setFieldErrors:    (errs)           => set((s) => ({ fieldErrors: typeof errs === 'function' ? errs(s.fieldErrors) : errs })),
  setSaving:         (saving)         => set({ saving }),
  setDraftSaved:     (draftSaved)     => set({ draftSaved }),
  setLivePreviewHtml:    (livePreviewHtml)    => set({ livePreviewHtml }),
  setLivePreviewLoading: (livePreviewLoading) => set({ livePreviewLoading }),
  setPreviewDirty:   (previewDirty)   => set({ previewDirty }),
  setActiveField:    (activeField)    => set({ activeField }),
  setCachedTplContent: (cachedTplContent) => set({ cachedTplContent }),
  setOpenLines:      (updater)        => set((s) => ({
    openLines: typeof updater === 'function' ? updater(s.openLines) : updater,
  })),
  setOpenCards:      (openCards)      => set({ openCards }),

  resetForm: () => set({
    wizardStep: 1, form: { ...EMPTY_FORM, lineItems: [{ ...EMPTY_LINE }] },
    fieldErrors: {}, saving: false, draftSaved: false,
    livePreviewHtml: null, livePreviewLoading: false, previewDirty: false,
    activeField: null, cachedTplContent: null,
    openLines: new Set([0]), openCards: { mottagare: true, detaljer: true },
  }),
}));

export { EMPTY_LINE, EMPTY_FORM };
export type { LineItem, OfferForm };
