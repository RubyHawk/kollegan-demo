/**
 * Offers form store — wizard, form fields, live preview, product/contact search.
 */

import { create } from 'zustand';
import { arrayMove } from '@dnd-kit/sortable';
import type {
  OfferForm,
  OfferProduct,
  OfferTemplate,
  ContactResult,
  CompanyResult,
  ServiceForm,
  LineItem,
} from './types';
import { EMPTY_FORM, EMPTY_LINE, EMPTY_SERVICE_FORM } from './types';

// ─── State + Actions interface ─────────────────────────────────────────────────

interface TplPreview { loading: boolean; html: string | null }

interface OffersFormState {
  // ── Visibility ───────────────────────────────────────────────────────────────
  showForm:       boolean;
  editingOfferId: string | null;

  // ── Wizard / Form ────────────────────────────────────────────────────────────
  wizardStep:  1 | 2;
  form:        OfferForm;
  fieldErrors: Record<string, string>;
  saving:      boolean;
  draftSaved:  boolean;

  // ── Live preview ─────────────────────────────────────────────────────────────
  livePreviewHtml:    string | null;
  livePreviewLoading: boolean;
  previewDirty:       boolean;
  activeField:        string | null;
  cachedTplContent:   string | null;

  // ── Offer doc viewer (modal for existing offers) ─────────────────────────────
  previewDoc:    string | null;
  fetchingDocId: string | null;
  tplPreview:    TplPreview | null;

  // ── Contact search ───────────────────────────────────────────────────────────
  contactSearch:   string;
  contactResults:  ContactResult[];
  contactLoading:  boolean;

  // ── Company typeahead ────────────────────────────────────────────────────────
  companyResults:  CompanyResult[];
  companyLoading:  boolean;

  // ── Product library / picker ─────────────────────────────────────────────────
  services:          OfferProduct[];
  templates:         OfferTemplate[];
  productPickerRow:  number | null;
  productSearch:     string;
  showServiceLibrary: boolean;
  serviceForm:       ServiceForm;
  savingService:     boolean;

  // ── UI helpers ───────────────────────────────────────────────────────────────
  openLines:         Set<number>;
  openCards:         { mottagare: boolean; detaljer: boolean };
  confirmedSections: Set<'mottagare' | 'detaljer'>;

  // ── Setters ──────────────────────────────────────────────────────────────────
  setShowForm:       (show: boolean) => void;
  setEditingOfferId: (id: string | null) => void;

  setWizardStep:   (step: 1 | 2) => void;
  setForm:         (form: OfferForm | ((prev: OfferForm) => OfferForm)) => void;
  setFieldErrors:  (errs: Record<string, string> | ((prev: Record<string, string>) => Record<string, string>)) => void;
  setSaving:       (saving: boolean) => void;
  setDraftSaved:   (saved: boolean) => void;

  setLivePreviewHtml:    (html: string | null) => void;
  setLivePreviewLoading: (loading: boolean) => void;
  setPreviewDirty:       (dirty: boolean) => void;
  setActiveField:        (field: string | null) => void;
  setCachedTplContent:   (content: string | null) => void;

  setPreviewDoc:    (html: string | null) => void;
  setFetchingDocId: (id: string | null) => void;
  setTplPreview:    (preview: TplPreview | null) => void;

  setContactSearch:  (v: string) => void;
  setContactResults: (results: ContactResult[]) => void;
  setContactLoading: (loading: boolean) => void;

  setCompanyResults: (results: CompanyResult[]) => void;
  setCompanyLoading: (loading: boolean) => void;

  setServices:          (products: OfferProduct[]) => void;
  setTemplates:         (templates: OfferTemplate[]) => void;
  setProductPickerRow:  (row: number | null) => void;
  setProductSearch:     (v: string) => void;
  setShowServiceLibrary: (show: boolean | ((prev: boolean) => boolean)) => void;
  setServiceForm:       (form: ServiceForm | ((prev: ServiceForm) => ServiceForm)) => void;
  setSavingService:     (saving: boolean) => void;

  setOpenLines:         (updater: Set<number> | ((prev: Set<number>) => Set<number>)) => void;
  setOpenCards:         (updater: { mottagare: boolean; detaljer: boolean } | ((prev: { mottagare: boolean; detaljer: boolean }) => { mottagare: boolean; detaljer: boolean })) => void;
  setConfirmedSections: (updater: Set<'mottagare' | 'detaljer'> | ((prev: Set<'mottagare' | 'detaljer'>) => Set<'mottagare' | 'detaljer'>)) => void;

  // ── Line item helpers ────────────────────────────────────────────────────────
  updateLine:  (idx: number, field: keyof LineItem, value: string | number) => void;
  addLine:     () => void;
  removeLine:  (idx: number) => void;
  reorderLines:(oldIdx: number, newIdx: number) => void;

  resetForm: () => void;
}

// ─── Store ─────────────────────────────────────────────────────────────────────

export const useOffersFormStore = create<OffersFormState>()((set) => ({
  // Visibility
  showForm:       false,
  editingOfferId: null,

  // Wizard
  wizardStep:  1,
  form:        { ...EMPTY_FORM, lineItems: [{ ...EMPTY_LINE }] },
  fieldErrors: {},
  saving:      false,
  draftSaved:  false,

  // Preview
  livePreviewHtml:    null,
  livePreviewLoading: false,
  previewDirty:       false,
  activeField:        null,
  cachedTplContent:   null,

  // Doc viewer
  previewDoc:    null,
  fetchingDocId: null,
  tplPreview:    null,

  // Contact search
  contactSearch:  '',
  contactResults: [],
  contactLoading: false,

  // Company typeahead
  companyResults: [],
  companyLoading: false,

  // Product/service
  services:           [],
  templates:          [],
  productPickerRow:   null,
  productSearch:      '',
  showServiceLibrary: false,
  serviceForm:        { ...EMPTY_SERVICE_FORM },
  savingService:      false,

  // UI
  openLines:         new Set([0]),
  openCards:         { mottagare: true, detaljer: true },
  confirmedSections: new Set<'mottagare' | 'detaljer'>(),

  // ── Setters ──────────────────────────────────────────────────────────────────
  setShowForm:       (showForm)       => set({ showForm }),
  setEditingOfferId: (editingOfferId) => set({ editingOfferId }),

  setWizardStep:   (wizardStep)   => set({ wizardStep }),
  setForm:         (form)         => set((s) => ({ form: typeof form === 'function' ? form(s.form) : form })),
  setFieldErrors:  (errs)         => set((s) => ({ fieldErrors: typeof errs === 'function' ? errs(s.fieldErrors) : errs })),
  setSaving:       (saving)       => set({ saving }),
  setDraftSaved:   (draftSaved)   => set({ draftSaved }),

  setLivePreviewHtml:    (livePreviewHtml)    => set({ livePreviewHtml }),
  setLivePreviewLoading: (livePreviewLoading) => set({ livePreviewLoading }),
  setPreviewDirty:       (previewDirty)       => set({ previewDirty }),
  setActiveField:        (activeField)        => set({ activeField }),
  setCachedTplContent:   (cachedTplContent)   => set({ cachedTplContent }),

  setPreviewDoc:    (previewDoc)    => set({ previewDoc }),
  setFetchingDocId: (fetchingDocId) => set({ fetchingDocId }),
  setTplPreview:    (tplPreview)    => set({ tplPreview }),

  setContactSearch:  (contactSearch)  => set({ contactSearch }),
  setContactResults: (contactResults) => set({ contactResults }),
  setContactLoading: (contactLoading) => set({ contactLoading }),

  setCompanyResults: (companyResults) => set({ companyResults }),
  setCompanyLoading: (companyLoading) => set({ companyLoading }),

  setServices:    (services)   => set({ services }),
  setTemplates:   (templates)  => set({ templates }),
  setProductPickerRow:  (productPickerRow)  => set({ productPickerRow }),
  setProductSearch:     (productSearch)     => set({ productSearch }),
  setShowServiceLibrary: (show) => set((s) => ({
    showServiceLibrary: typeof show === 'function' ? show(s.showServiceLibrary) : show,
  })),
  setServiceForm: (form) => set((s) => ({
    serviceForm: typeof form === 'function' ? form(s.serviceForm) : form,
  })),
  setSavingService: (savingService) => set({ savingService }),

  setOpenLines: (updater) => set((s) => ({
    openLines: typeof updater === 'function' ? updater(s.openLines) : updater,
  })),
  setOpenCards: (updater) => set((s) => ({
    openCards: typeof updater === 'function' ? updater(s.openCards) : updater,
  })),
  setConfirmedSections: (updater) => set((s) => ({
    confirmedSections: typeof updater === 'function' ? updater(s.confirmedSections) : updater,
  })),

  // ── Line item helpers ────────────────────────────────────────────────────────
  updateLine: (idx, field, value) => {
    let v: string | number = value;
    if (field === 'quantity')  v = Math.max(0, Number(v));
    if (field === 'unitPrice') v = Math.max(0, Number(v));
    if (field === 'discount')  v = Math.min(100, Math.max(0, Number(v)));
    set((s) => {
      const items = [...s.form.lineItems];
      items[idx] = { ...items[idx], [field]: v };
      const fieldErrors = { ...s.fieldErrors };
      delete fieldErrors[`line_${idx}_${field}`];
      return { form: { ...s.form, lineItems: items }, fieldErrors };
    });
  },

  addLine: () => set((s) => {
    const newIdx = s.form.lineItems.length;
    const n = new Set(s.openLines); n.add(newIdx);
    return { form: { ...s.form, lineItems: [...s.form.lineItems, { ...EMPTY_LINE }] }, openLines: n };
  }),

  removeLine: (idx) => set((s) => {
    // Rebuild fieldErrors with re-indexed keys
    const next: Record<string, string> = {};
    for (const [k, v] of Object.entries(s.fieldErrors)) {
      const m = k.match(/^line_(\d+)_(.+)$/);
      if (!m) { next[k] = v; continue; }
      const rowIdx = parseInt(m[1]);
      if (rowIdx === idx) continue;
      next[`line_${rowIdx < idx ? rowIdx : rowIdx - 1}_${m[2]}`] = v;
    }
    // Rebuild openLines with re-indexed indices
    const openLines = new Set<number>();
    for (const i of s.openLines) {
      if (i < idx) openLines.add(i);
      else if (i > idx) openLines.add(i - 1);
    }
    return {
      form: { ...s.form, lineItems: s.form.lineItems.filter((_, i) => i !== idx) },
      fieldErrors: next,
      openLines,
    };
  }),

  reorderLines: (oldIdx, newIdx) => {
    set((s) => {
      const items = arrayMove(s.form.lineItems, oldIdx, newIdx);
      const mapping = arrayMove([...Array(s.form.lineItems.length).keys()], oldIdx, newIdx);
      const openLines = new Set<number>();
      for (const i of s.openLines) {
        const newI = (mapping as number[]).indexOf(i);
        if (newI !== -1) openLines.add(newI);
      }
      return { form: { ...s.form, lineItems: items }, openLines };
    });
  },

  resetForm: () => set({
    wizardStep: 1,
    form: { ...EMPTY_FORM, lineItems: [{ ...EMPTY_LINE }] },
    fieldErrors: {}, saving: false, draftSaved: false,
    livePreviewHtml: null, livePreviewLoading: false, previewDirty: false,
    activeField: null, cachedTplContent: null,
    openLines: new Set([0]), openCards: { mottagare: true, detaljer: true },
    confirmedSections: new Set<'mottagare' | 'detaljer'>(),
    contactSearch: '', contactResults: [], contactLoading: false,
    companyResults: [], companyLoading: false,
    productPickerRow: null, productSearch: '',
    showServiceLibrary: false, serviceForm: { ...EMPTY_SERVICE_FORM }, savingService: false,
    editingOfferId: null,
  }),
}));

export { EMPTY_LINE, EMPTY_FORM, EMPTY_SERVICE_FORM };
export type { OfferForm, LineItem, TplPreview };
