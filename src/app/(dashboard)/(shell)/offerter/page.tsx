'use client';

/* eslint react-hooks/exhaustive-deps: "off" */

import { useEffect, useCallback, useRef, useMemo, useState } from 'react';
import { fetchWithRefresh } from '@shared/lib/api-client';
import { useActiveCompany } from '@shared/hooks/use-active-company';
import { useToast } from '@shared/ui/toast/toast-context';
import ToastContainer from '@shared/ui/toast/toast-container';
import { DEFAULT_OFFER_PRICE_DISPLAY_MODE } from '@modules/supporting/offers/domain/pricing';
import { deriveValidityDays } from '@modules/supporting/offers/domain/validity';
import { useOffersListStore, PAGE_SIZE } from './_store/offers-list.store';
import { useOffersFormStore } from './_store/offers-form.store';
import type { Offer, OfferTemplate, OfferProduct, ContactResult, CompanyResult } from './_store/types';
import { EMPTY_LINE, EMPTY_FORM } from './_store/types';
import { OfferTemplatePreviewModal } from './_components/offer-template-preview-modal';
import { SendOfferDialog } from './_components/send-offer-dialog';
import { OfferPreviewDialog } from './_components/offer-preview-dialog';
import { OfferWizardShell } from './_components/offer-wizard-shell';
import { OffersLoadingState } from './_components/offers-loading-state';
import { OffersMobileCards } from './_components/offers-mobile-cards';
import { OffersDesktopTable } from './_components/offers-desktop-table';
import { useOfferListActions } from './_hooks/use-offer-list-actions';
import {
  BulkActionBar,
  BulkSendResultBanner,
  DraftSavedToast,
  OffersDashboardToolbar,
  OffersNoticeStack,
  OffersPageHeader,
} from './_components/offers-dashboard-controls';
import type { BlockingAlert } from './_components/offer-blocking-alerts';
import {
  normalizeSearchValue,
  pricingSummary,
} from './_lib/offers-dashboard-formatters';
import { ConfirmDestructiveDialog } from '@shared/ui/confirm-destructive-dialog';


// ─── Page ──────────────────────────────────────────────────────────────────────

export default function OffersPage() {
  const enforcedPriceDisplayMode = DEFAULT_OFFER_PRICE_DISPLAY_MODE;
  const { toasts, addToast, dismissToast } = useToast();
  const [blockingAlert, setBlockingAlert] = useState<BlockingAlert | null>(null);
  const {
    companies,
    selectedCompany,
    selectedCompanyId,
    setSelectedCompanyId,
  } = useActiveCompany();
  // ── List store ─────────────────────────────────────────────────────────────
  const {
    allOffers, serverTotal, tabCounts, loading, error,
    searchInput, search,
    tab, sortAsc, dateFrom, dateTo, currentPage,
    selected, bulkSending, bulkResult,
    acting, confirmDeleteOffer, copied, confirmSend,
    setSearchInput, setSearch, setTab, setSortAsc, setDateFrom, setDateTo, setCurrentPage,
    setError,
    setSelected, toggleSelected, clearSelected, setBulkSending, setBulkResult,
    setActing, setConfirmDeleteOffer, setCopied, setConfirmSend,
    load, loadCounts,
  } = useOffersListStore();

  // ── Form store ─────────────────────────────────────────────────────────────
  const {
    showForm, editingOfferId, wizardStep, form, fieldErrors, saving, draftSaved,
    livePreviewHtml, livePreviewLoading, previewDirty, activeField, cachedTplContent,
    previewDoc, fetchingDocId, tplPreview,
    contactSearch, contactResults, contactLoading,
    companyResults, companyLoading,
    services, templates, productPickerRow, productSearch,
    openLines, openCards, confirmedSections,
    setShowForm, setEditingOfferId, setWizardStep, setForm, setFieldErrors, setSaving, setDraftSaved,
    setLivePreviewHtml, setLivePreviewLoading, setPreviewDirty, setActiveField, setCachedTplContent,
    setPreviewDoc, setFetchingDocId, setTplPreview,
    setContactSearch, setContactResults, setContactLoading,
    setCompanyResults, setCompanyLoading,
    setServices, setTemplates, setProductPickerRow, setProductSearch,
    setOpenLines, setOpenCards, setConfirmedSections,
    updateLine, addLine, removeLine, reorderLines, resetForm,
  } = useOffersFormStore();

  // ── Local refs (non-serializable / timer handles) ─────────────────────────
  const saveAndSendRef = useRef(false);
  const contactSearchRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const livePreviewTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const previewIframeRef = useRef<HTMLIFrameElement>(null);
  const lastActiveFieldRef = useRef<string | null>(null);
  const dismissNotices = useCallback(() => {
    setError(null);
    setBlockingAlert(null);
  }, [setError]);

  // Keep lastActiveFieldRef in sync so onLoad can reference it after activeField resets to null
  useEffect(() => { if (activeField) lastActiveFieldRef.current = activeField; }, [activeField]);

  // ── Auto-open wizard when navigated from "Ny offert" sidebar link ─────────────
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('new') === 'true') {
      setShowForm(true);
      setEditingOfferId(null);
      resetForm();
      setForm((current) => ({ ...current, companyId: selectedCompanyId || current.companyId }));
      setWizardStep(1);
      // Clean the URL so a refresh doesn't re-trigger
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, [resetForm, selectedCompanyId, setEditingOfferId, setForm, setShowForm, setWizardStep]);

  // ── Load templates ────────────────────────────────────────────────────────────
  useEffect(() => {
    const params = new URLSearchParams();
    if (selectedCompanyId) params.set('companyId', selectedCompanyId);
    void fetchWithRefresh(`/api/templates${params.toString() ? `?${params.toString()}` : ''}`)
      .then(async (r) => {
        if (r.ok) {
          const j = await r.json() as { data: OfferTemplate[] };
          setTemplates(j.data);
        }
      })
      .catch(() => { /* templates unavailable — dropdown stays empty */ });
  }, [selectedCompanyId, setTemplates]);

  // ── Load products ─────────────────────────────────────────────────────────────
  const loadServices = useCallback(async () => {
    const params = new URLSearchParams();
    if (selectedCompanyId) params.set('companyId', selectedCompanyId);
    const r = await fetchWithRefresh(`/api/offers/products${params.toString() ? `?${params.toString()}` : ''}`);
    if (r.ok) {
      const j = await r.json() as { data: { products: OfferProduct[] } };
      setServices(j.data.products);
    }
  }, [selectedCompanyId, setServices]);

  useEffect(() => { void loadServices(); }, [loadServices]);

  useEffect(() => {
    if (!selectedCompanyId || editingOfferId) return;
    setForm((current) => (
      current.companyId === selectedCompanyId
        ? current
        : { ...current, companyId: current.companyId || selectedCompanyId }
    ));
  }, [editingOfferId, selectedCompanyId, setForm]);

  // ── Reload offers when filters change (store actions read their own state) ────
  useEffect(() => {
    void load();
    void loadCounts();
    clearSelected();
    setBulkResult(null);
    // load/loadCounts/clearSelected/setBulkResult are stable store actions
  }, [tab, search, currentPage, dateFrom, dateTo]);

  // ── Derived: client-side sort only (status + date filtering is server-side) ───
  const filteredOffers = useMemo(() => {
    return allOffers.slice().sort((a, b) => {
      const diff = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      return sortAsc ? diff : -diff;
    });
  }, [allOffers, sortAsc]);

  const offers     = filteredOffers;
  const total      = tabCounts.all;
  const totalPages = Math.max(1, Math.ceil(serverTotal / PAGE_SIZE));

  // ── Open edit form for an existing draft offer ────────────────────────────────
  const openEdit = useCallback((offer: Offer) => {
    if (offer.companyId) {
      setSelectedCompanyId(offer.companyId);
    }
    setEditingOfferId(offer.id);
    setForm({
      templateId:       offer.templateId ?? '',
      priceDisplayMode: enforcedPriceDisplayMode,
      contactId:        '',
      companyId:        offer.companyId ?? '',
      title:            offer.title,
      recipientName:    offer.recipientName,
      recipientEmail:   offer.recipientEmail,
      recipientCompany: offer.recipientCompany ?? '',
      notes:            offer.notes ?? '',
      validityDays:     offer.validityDays
        ?? (offer.validUntil ? deriveValidityDays(offer.createdAt, offer.validUntil) : 30),
      lineItems:        offer.lineItems.length > 0 ? offer.lineItems : [{ ...EMPTY_LINE }],
    });
    setWizardStep(2);           // skip template picker when editing
    setLivePreviewHtml(null);
    setCachedTplContent(null);
    setFieldErrors({});
    setContactSearch('');
    setContactResults([]);
    // Load template preview if the offer has a template
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
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                content,
                branding: selectedCompanyBranding,
                offer: { priceDisplayMode: enforcedPriceDisplayMode },
              }),
            });
            const j = await res.json() as { html?: string };
            setLivePreviewHtml(j.html ?? null);
          }
        } catch { /* ignore */ } finally {
          setLivePreviewLoading(false);
        }
      })();
    }
    setOpenCards({ mottagare: true, detaljer: true });
    setConfirmedSections(new Set());
    setOpenLines(new Set([0]));
    dismissNotices();
    setShowForm(true);
  }, [setSelectedCompanyId]);

  // ── Create / update offer ──────────────────────────────────────────────────────
  const createOffer = useCallback(async () => {
    const errs: Record<string, string> = {};
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

    if (!form.title.trim())                errs.title          = 'Obligatoriskt';
    else if (form.title.trim().length < 2) errs.title          = 'Minst 2 tecken';

    if (!form.recipientName.trim())                errs.recipientName  = 'Obligatoriskt';
    else if (form.recipientName.trim().length < 2) errs.recipientName  = 'Minst 2 tecken';

    if (!form.recipientEmail.trim())              errs.recipientEmail = 'Obligatoriskt';
    else if (!emailRe.test(form.recipientEmail.trim())) errs.recipientEmail = 'Ogiltig e-postadress';

    let anyComplete = false;
    form.lineItems.forEach((item, idx) => {
      const hasDesc = item.description.trim().length > 0;
      const hasQty  = item.quantity > 0;
      if (hasDesc && hasQty) anyComplete = true;
      if (hasDesc && !hasQty)  errs[`line_${idx}_quantity`]    = 'Måste vara > 0';
      if (hasQty  && !hasDesc) errs[`line_${idx}_description`] = 'Beskrivning saknas';
    });
    if (!anyComplete) errs.lineItems = 'Minst en rad måste ha beskrivning och antal > 0.';

    if (Object.keys(errs).length > 0) { setFieldErrors(errs); return; }

    setSaving(true); dismissNotices(); setFieldErrors({});
    try {
      const body: Record<string, unknown> = {
        title:            form.title,
        priceDisplayMode: enforcedPriceDisplayMode,
        recipientName:    form.recipientName,
        recipientEmail:   form.recipientEmail,
        recipientCompany: form.recipientCompany || undefined,
        notes:            form.notes || undefined,
        validityDays:     form.validityDays,
        lineItems:        form.lineItems
          .filter((i) => i.description.trim() && i.quantity > 0)
          .map((item, idx) => ({
            ...item,
            sortOrder: idx,
          })),
      };
      if (form.templateId)    body.templateId   = form.templateId;
      if (form.contactId)     body.customerId   = form.contactId;
      if (form.companyId)     body.companyId    = form.companyId;

      const isEdit = Boolean(editingOfferId);
      const res = isEdit
        ? await fetchWithRefresh(`/api/offers/${editingOfferId}`, {
            method: 'PATCH', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          })
        : await fetchWithRefresh('/api/offers', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body:   JSON.stringify(body),
          });
      if (!res.ok) {
        const j = await res.json().catch(() => ({})) as { detail?: string };
        throw new Error(j.detail ?? `Fel ${res.status}`);
      }
      const j = await res.json() as { data: Offer };
      setShowForm(false); setForm(EMPTY_FORM); setEditingOfferId(null);
      await Promise.all([load(true), loadCounts()]);
      if (saveAndSendRef.current) {
        saveAndSendRef.current = false;
        setConfirmSend(j.data);
      } else {
        setDraftSaved(true);
        setTimeout(() => setDraftSaved(false), 3000);
      }
    } catch (e) {
      setBlockingAlert(null);
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }, [dismissNotices, editingOfferId, form]);

  const selectedCompanyBranding = useMemo(() => (
    selectedCompany ? {
      name: selectedCompany.name,
      website: selectedCompany.website,
      logoUrl: selectedCompany.logoUrl,
      senderEmail: selectedCompany.senderEmail,
      senderName: selectedCompany.senderName,
      emailHeaderConfig: selectedCompany.emailHeaderConfig,
    } : undefined
  ), [selectedCompany]);

  const openTemplatePreview = useCallback(async (templateId?: string) => {
    const activeTemplateId = templateId ?? form.templateId;
    if (!activeTemplateId) return;
    setTplPreview({ loading: true, html: null });
    try {
      // Fetch full template (list response omits content for performance)
      const tplRes = await fetchWithRefresh(`/api/templates/${activeTemplateId}`);
      if (!tplRes.ok) throw new Error(`Kunde inte hämta mall (${tplRes.status})`);
      const tplData = await tplRes.json() as { data?: { content?: string } };
      const content = tplData.data?.content;

      const res = await fetchWithRefresh('/api/templates/preview', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, branding: selectedCompanyBranding }),
      });
      const j = await res.json() as { html?: string; detail?: string };
      if (!res.ok) throw new Error(j.detail ?? `Fel ${res.status}`);
      setTplPreview({ loading: false, html: j.html ?? '' });
    } catch {
      setTplPreview(null);
    }
  }, [form.templateId, selectedCompanyBranding, setTplPreview]);

  const {
    copyLink,
    deleteOffer,
    doAction,
    doBulkSend,
    fetchAndPreviewDoc,
  } = useOfferListActions({
    addToast,
    allOffers,
    clearSelected,
    dismissNotices,
    load,
    loadCounts,
    selected,
    setActing,
    setBlockingAlert,
    setBulkResult,
    setBulkSending,
    setConfirmDeleteOffer,
    setCopied,
    setError,
    setFetchingDocId,
    setPreviewDoc,
  });

  const draftOffers = allOffers.filter((o) => o.status === 'draft');
  const selectedDraftCount = Array.from(selected).filter((id) => allOffers.find((o) => o.id === id)?.status === 'draft').length;
  const allDraftsSelected  = draftOffers.length > 0 && draftOffers.every((o) => selected.has(o.id));

  function toggleSelect(id: string) {
    toggleSelected(id);
  }
  function toggleSelectAllDrafts() {
    if (allDraftsSelected) {
      setSelected((prev) => { const s = new Set(prev); draftOffers.forEach((o) => s.delete(o.id)); return s; });
    } else {
      setSelected((prev) => { const s = new Set(prev); draftOffers.forEach((o) => s.add(o.id)); return s; });
    }
  }

  // ── Contact search (debounced) ────────────────────────────────────────────
  const searchContacts = useCallback((q: string) => {
    setContactSearch(q);
    if (contactSearchRef.current) clearTimeout(contactSearchRef.current);
    if (!q.trim()) { setContactResults([]); return; }
    contactSearchRef.current = setTimeout(async () => {
      setContactLoading(true);
      try {
        const res = await fetchWithRefresh(`/api/crm/contacts?search=${encodeURIComponent(q)}&limit=8`);
        if (res.ok) {
          const j = await res.json() as { data: { contacts: ContactResult[] } };
          setContactResults(j.data.contacts);
        }
      } catch { /* ignore */ } finally {
        setContactLoading(false);
      }
    }, 280);
  }, []);

  const companySearchRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchCompanies = useCallback((q: string) => {
    if (companySearchRef.current) clearTimeout(companySearchRef.current);
    if (!q.trim()) { setCompanyResults([]); return; }
    companySearchRef.current = setTimeout(async () => {
      setCompanyLoading(true);
      try {
        const res = await fetchWithRefresh(`/api/companies?search=${encodeURIComponent(q)}&limit=8`);
        if (res.ok) {
          const j = await res.json() as { data: { companies: CompanyResult[] } };
          setCompanyResults(j.data.companies ?? []);
        }
      } catch { /* ignore */ } finally {
        setCompanyLoading(false);
      }
    }, 280);
  }, [setCompanyResults, setCompanyLoading]);

  const pickContact = useCallback((c: ContactResult) => {
    setForm((f) => ({
      ...f,
      contactId:        c.id,
      recipientName:    c.name    ?? f.recipientName,
      recipientEmail:   c.email   ?? f.recipientEmail,
      recipientCompany: c.company ?? f.recipientCompany,
    }));
    setContactSearch('');
    setContactResults([]);
  }, []);

  // ── Product management ────────────────────────────────────────────────────────
  const pickProduct = useCallback((idx: number, p: OfferProduct) => {
    setForm((f) => {
      const items = [...f.lineItems];
      const mainCategoryTitle = (((p as unknown as { category?: string }).category) ?? '')
        .split('/')
        .map((part: string) => part.trim())
        .filter(Boolean)[0];
      items[idx] = {
        ...items[idx],
        description: p.name + (p.description ? ` — ${p.description}` : ''),
        unitPrice:   p.unitPrice,
        vatRate:     p.vatRate,
        productId:   p.id,
        unit:        p.unit,
      };
      return {
        ...f,
        lineItems: items,
        title: f.title.trim() || mainCategoryTitle || f.title,
      };
    });
    setProductPickerRow(null);
    setProductSearch('');
  }, [selectedCompanyBranding]);

  const filteredServices = useMemo(
    () => {
      const query = normalizeSearchValue(productSearch);
      if (!query) return services;

      return services.filter((p) => {
        const haystack = normalizeSearchValue([
          p.name,
          p.description ?? '',
          p.unit ?? '',
        ].join(' '));
        return haystack.includes(query);
      });
    },
    [services, productSearch],
  );

  const selectedTemplate = useMemo(
    () => templates.find((template) => template.id === form.templateId) ?? null,
    [templates, form.templateId],
  );

  const previewLooksImageLed = useMemo(
    () => Boolean(livePreviewHtml && /<img[\s>]/i.test(livePreviewHtml)),
    [livePreviewHtml],
  );

  // ── Wizard helpers ────────────────────────────────────────────────────────────

  const closeWizard = useCallback(() => {
    const s = useOffersFormStore.getState();
    const dirty = s.form.recipientName.trim() !== '' || s.form.lineItems.some((l) => l.description.trim() !== '');
    if (dirty && !window.confirm('Stäng utan att spara? Alla ändringar försvinner.')) return;
    setShowForm(false); setForm(EMPTY_FORM); setEditingOfferId(null);
    dismissNotices(); setFieldErrors({}); setContactSearch(''); setContactResults([]);
    setWizardStep(1); setLivePreviewHtml(null); setCachedTplContent(null);
    setPreviewDirty(false); setActiveField(null);
    setOpenCards({ mottagare: true, detaljer: true });
    setConfirmedSections(new Set());
    setOpenLines(new Set([0]));
    if (livePreviewTimer.current) clearTimeout(livePreviewTimer.current);
  }, []);

  /** Fetch a template's full content, set it selected, load initial preview (stays on step 1). */
  const selectTemplate = useCallback(async (tplId: string) => {
    setForm((f) => ({ ...f, templateId: tplId }));
    setLivePreviewLoading(true);
    setLivePreviewHtml(null);
    setCachedTplContent(null);
    try {
      const tplRes = await fetchWithRefresh(`/api/templates/${tplId}`);
      if (!tplRes.ok) throw new Error();
      const tplData = await tplRes.json() as { data?: { content?: string } };
      const content = tplData.data?.content ?? null;
      setCachedTplContent(content);
      const res = await fetchWithRefresh('/api/templates/preview', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, branding: selectedCompanyBranding }),
      });
      const j = await res.json() as { html?: string };
      setLivePreviewHtml(j.html ?? null);
    } catch { /* ignore */ } finally {
      setLivePreviewLoading(false);
    }
  }, []);

  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  const mottagareComplete = form.recipientName.trim().length >= 2 && emailRe.test(form.recipientEmail.trim());
  const detajerComplete   = form.title.trim().length >= 2;

  /** Schedule a debounced re-render of the live preview with current form values. */
  const scheduleLivePreview = useCallback((currentForm: typeof form, content: string) => {
    setPreviewDirty(true);
    if (livePreviewTimer.current) clearTimeout(livePreviewTimer.current);
    livePreviewTimer.current = setTimeout(async () => {
      const validItems = currentForm.lineItems.filter((i) => i.description.trim() && i.quantity > 0);
      try {
        setLivePreviewLoading(true);
        setPreviewDirty(false);
        const res = await fetchWithRefresh('/api/templates/preview', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content,
            branding: selectedCompanyBranding,
            offer: {
              priceDisplayMode: enforcedPriceDisplayMode,
              title:            currentForm.title            || undefined,
              recipientName:    currentForm.recipientName    || undefined,
              recipientEmail:   currentForm.recipientEmail   || undefined,
              recipientCompany: currentForm.recipientCompany || undefined,
              notes:            currentForm.notes            || undefined,
              lineItems:        validItems.length > 0 ? validItems : undefined,
            },
          }),
        });
        const j = await res.json() as { html?: string };
        if (j.html) setLivePreviewHtml(j.html);
      } catch { /* ignore */ } finally {
        setLivePreviewLoading(false);
        setActiveField(null);
      }
    }, 1000);
  }, [selectedCompanyBranding]);

  // Re-render preview whenever form values change (step 2 only)
  useEffect(() => {
    if (!showForm || wizardStep !== 2 || !cachedTplContent) return;
    scheduleLivePreview(form, cachedTplContent);
  }, [
    form.title, form.recipientName, form.recipientEmail,
    form.recipientCompany, form.notes, form.lineItems,
    showForm, wizardStep, cachedTplContent, scheduleLivePreview,
  ]);

  const tots = useMemo(
    () => pricingSummary(form.lineItems, enforcedPriceDisplayMode),
    [enforcedPriceDisplayMode, form.lineItems],
  );


  return (
    <div className="px-8 py-10 max-w-6xl mx-auto">

      <OffersPageHeader
        onCreateOffer={() => {
          setShowForm(true);
          setEditingOfferId(null);
          setForm(EMPTY_FORM);
          dismissNotices();
          setWizardStep(1);
          setLivePreviewHtml(null);
          setCachedTplContent(null);
        }}
      />

      <OffersNoticeStack
        blockingAlert={blockingAlert}
        error={error}
        onDismiss={dismissNotices}
      />

      <BulkSendResultBanner result={bulkResult} onDismiss={() => setBulkResult(null)} />

      <OfferWizardShell
        open={showForm}
        wizardStep={wizardStep}
        livePreviewProps={{
          closeWizard,
          livePreviewHtml,
          previewDirty,
          livePreviewLoading,
          activeField,
          selectedCompany,
          selectedTemplate,
          previewLooksImageLed,
          openTemplatePreview,
          previewIframeRef,
          lastActiveFieldRef,
          templatesCount: templates.length,
        }}
        stepOneProps={{
          companies,
          form,
          selectedCompanyId,
          templates,
          contactSearch,
          contactResults,
          contactLoading,
          companyResults,
          companyLoading,
          closeWizard,
          setSelectedCompanyId,
          setForm,
          setLivePreviewHtml,
          setCachedTplContent,
          selectTemplate,
          openTemplatePreview,
          searchContacts,
          setContactSearch,
          setContactResults,
          pickContact,
          searchCompanies,
          setCompanyResults,
          setWizardStep,
          setConfirmedSections,
        }}
        stepTwoProps={{
          activeTemplateLabel: form.templateId ? selectedTemplate?.name ?? '' : null,
          blockingAlert,
          companyLoading,
          companyResults,
          confirmedSections,
          contactLoading,
          contactResults,
          contactSearch,
          detajerComplete,
          editingOfferId,
          enforcedPriceDisplayMode,
          error,
          fieldErrors,
          filteredServices,
          form,
          mottagareComplete,
          openCards,
          openLines,
          productPickerRow,
          productSearch,
          saveAndSendActive: saveAndSendRef.current,
          saving,
          services,
          totals: tots,
          addLine,
          closeWizard,
          createOffer,
          dismissNotices,
          markSaveAndSend: () => { saveAndSendRef.current = true; },
          pickContact,
          pickProduct,
          removeLine,
          reorderLines,
          searchCompanies,
          searchContacts,
          setActiveField,
          setCompanyResults,
          setConfirmedSections,
          setContactResults,
          setContactSearch,
          setFieldErrors,
          setForm,
          setOpenCards,
          setOpenLines,
          setProductPickerRow,
          setProductSearch,
          setWizardStep,
          updateLine,
        }}
      />

      <BulkActionBar
        selectedCount={selected.size}
        selectedDraftCount={selectedDraftCount}
        bulkSending={bulkSending}
        onBulkSend={() => void doBulkSend()}
        onClearSelection={() => setSelected(new Set())}
      />

      <OffersDashboardToolbar
        tab={tab}
        tabCounts={tabCounts}
        searchInput={searchInput}
        dateFrom={dateFrom}
        dateTo={dateTo}
        onTabChange={setTab}
        onSearchInputChange={setSearchInput}
        onSearchChange={setSearch}
        onDateFromChange={setDateFrom}
        onDateToChange={setDateTo}
      />

      {/* Offers table */}
      {loading ? (
        <OffersLoadingState />
      ) : (
        <>
        <OffersMobileCards
          offers={offers}
          acting={acting}
          copied={copied}
          priceDisplayMode={enforcedPriceDisplayMode}
          onAcceptAction={doAction}
          onCopyLink={copyLink}
          onDelete={setConfirmDeleteOffer}
          onDuplicate={(id) => void doAction(id, 'duplicate')}
          onEdit={openEdit}
          onSend={setConfirmSend}
        />

        <OffersDesktopTable
          offers={offers}
          draftOffers={draftOffers}
          allDraftsSelected={allDraftsSelected}
          selected={selected}
          sortAsc={sortAsc}
          acting={acting}
          copied={copied}
          fetchingDocId={fetchingDocId}
          priceDisplayMode={enforcedPriceDisplayMode}
          currentPage={currentPage}
          pageSize={PAGE_SIZE}
          serverTotal={serverTotal}
          total={total}
          totalPages={totalPages}
          onAcceptAction={doAction}
          onCopyLink={copyLink}
          onCreateOffer={() => {
            setShowForm(true);
            setEditingOfferId(null);
            resetForm();
            setWizardStep(1);
          }}
          onDelete={setConfirmDeleteOffer}
          onDuplicate={(id) => void doAction(id, 'duplicate')}
          onEdit={openEdit}
          onFetchPreview={fetchAndPreviewDoc}
          onPageChange={setCurrentPage}
          onSend={setConfirmSend}
          onSortToggle={() => setSortAsc(!sortAsc)}
          onToggleSelect={toggleSelect}
          onToggleSelectAllDrafts={toggleSelectAllDrafts}
        />
        </>
      )}

      <DraftSavedToast
        visible={draftSaved}
        onOpenDrafts={() => {
          setTab('draft');
          setDraftSaved(false);
        }}
      />

      {/* Send confirmation modal */}
      <SendOfferDialog
        open={Boolean(confirmSend)}
        onClose={() => setConfirmSend(null)}
        recipientName={confirmSend?.recipientName ?? ''}
        recipientEmail={confirmSend?.recipientEmail ?? ''}
        recipientCompany={confirmSend?.recipientCompany}
        loading={confirmSend ? acting === confirmSend.id : false}
        onConfirm={() => {
          if (!confirmSend) return;
          void doAction(confirmSend.id, 'send');
          setConfirmSend(null);
        }}
      />

      {/* Template preview modal */}
      <OfferTemplatePreviewModal
        open={Boolean(tplPreview)}
        html={tplPreview?.html ?? null}
        loading={tplPreview?.loading ?? false}
        onClose={() => setTplPreview(null)}
      />
      {/* Delete offer confirmation modal */}
      <ConfirmDestructiveDialog
        open={Boolean(confirmDeleteOffer)}
        onOpenChange={(open) => { if (!open) setConfirmDeleteOffer(null); }}
        title="Ta bort offert?"
        description="Offerten tas bort permanent och kan inte återställas."
        confirmLabel="Ta bort"
        onConfirm={() => {
          if (!confirmDeleteOffer) return;
          void deleteOffer(confirmDeleteOffer);
          setConfirmDeleteOffer(null);
        }}
      />

      {/* Document preview modal */}
      <OfferPreviewDialog
        open={Boolean(previewDoc)}
        onClose={() => setPreviewDoc(null)}
        srcDoc={previewDoc ?? ''}
      />

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
