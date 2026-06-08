'use client';

/* eslint react-hooks/exhaustive-deps: "off" */

import { useEffect, useCallback, useRef, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useActiveCompany } from '@shared/hooks/use-active-company';
import { useToast } from '@shared/ui/toast/toast-context';
import { DEFAULT_OFFER_PRICE_DISPLAY_MODE } from '@modules/supporting/offers/domain/pricing';
import { useOffersListStore, PAGE_SIZE } from './_store/offers-list.store';
import { useOffersFormStore } from './_store/offers-form.store';
import { OfferWizardShell } from './_components/offer-wizard-shell';
import { OfferDraftRecoveryBanner } from './_components/offer-draft-recovery-banner';
import { OffersLoadingState } from './_components/offers-loading-state';
import { OffersMobileCards } from './_components/offers-mobile-cards';
import { OffersDesktopTable } from './_components/offers-desktop-table';
import { OfferAttentionStrip } from './_components/offer-attention-strip';
import { OffersPageDialogs } from './_components/offers-page-dialogs';
import { useOfferListActions } from './_hooks/use-offer-list-actions';
import { useOfferWizardLifecycle } from './_hooks/use-offer-wizard-lifecycle';
import { useOfferWizardLookups } from './_hooks/use-offer-wizard-lookups';
import { useOfferWizardSubmit } from './_hooks/use-offer-wizard-submit';
import { useOfferDraftAutosave } from './_hooks/use-offer-draft-autosave';
import { useOfferClipboardToasts } from './_hooks/use-offer-clipboard-toasts';
import { useOfferUrlFilters } from './_hooks/use-offer-url-filters';
import { useOfferLivePreviewScheduler } from './_hooks/use-offer-live-preview-scheduler';
import { useOfferTableState } from './_hooks/use-offer-table-state';
import { useSelectedCompanyBranding } from './_hooks/use-selected-company-branding';
import {
  BulkActionBar,
  BulkSendResultBanner,
  DraftSavedToast,
  OffersDashboardToolbar,
  OffersNoticeStack,
  OffersPageHeader,
} from './_components/offers-dashboard-controls';
import type { BlockingAlert } from './_components/offer-blocking-alerts';
import { pricingSummary } from './_lib/offers-dashboard-formatters';

export default function OffersPage() {
  const searchParams = useSearchParams();
  const enforcedPriceDisplayMode = DEFAULT_OFFER_PRICE_DISPLAY_MODE;
  const { toasts, addToast, dismissToast } = useToast();
  const [blockingAlert, setBlockingAlert] = useState<BlockingAlert | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [viewLinkCopied, setViewLinkCopied] = useState(false);
  const {
    companies,
    selectedCompany,
    selectedCompanyId,
    setSelectedCompanyId,
  } = useActiveCompany();
  const {
    allOffers, serverTotal, tabCounts, loading, error,
    searchInput,
    tab, sortAsc, dateFrom, dateTo, currentPage,
    selected, bulkSending, bulkResult,
    acting, confirmDeleteOffer, copied, confirmSend,
    setSearchInput, setSearch, setTab, setSortAsc, setDateFrom, setDateTo, setCurrentPage,
    setError,
    setSelected, clearSelected, setBulkSending, setBulkResult,
    setActing, setConfirmDeleteOffer, setCopied, setConfirmSend,
    resetFilters,
    load, loadCounts,
  } = useOffersListStore();

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
    updateLine, addLine, removeLine, restoreLine, reorderLines, resetForm,
  } = useOffersFormStore();

  const livePreviewTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const previewIframeRef = useRef<HTMLIFrameElement>(null);
  const lastActiveFieldRef = useRef<string | null>(null);
  const dismissNotices = useCallback(() => {
    setError(null);
    setBlockingAlert(null);
  }, [setError]);

  useEffect(() => { if (activeField) lastActiveFieldRef.current = activeField; }, [activeField]);

  const {
    draftStatus,
    restoredAt,
    discardRestoredDraft,
    dismissRestoredDraft,
  } = useOfferDraftAutosave({
    editingOfferId,
    form,
    showForm,
    wizardStep,
    setForm,
    setWizardStep,
  });

  useOfferUrlFilters(searchParams);

  const {
    allDraftsSelected,
    draftOffers,
    hasActiveOfferFilters,
    offers,
    selectedDraftCount,
    toggleSelect,
    toggleSelectAllDrafts,
    total,
    totalPages,
  } = useOfferTableState();

  const {
    createOffer,
    markSaveAndSend,
    saveAndSendActive,
  } = useOfferWizardSubmit({
    dismissNotices,
    editingOfferId,
    form,
    priceDisplayMode: enforcedPriceDisplayMode,
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
  });
  const selectedCompanyBranding = useSelectedCompanyBranding(selectedCompany);

  const {
    filteredServices,
    openTemplatePreview,
    pickContact,
    pickProduct,
    searchCompanies,
    searchContacts,
    selectTemplate,
    selectedTemplate,
  } = useOfferWizardLookups({
    editingOfferId,
    form,
    productSearch,
    selectedCompanyBranding,
    selectedCompanyId,
    services,
    templates,
    setCachedTplContent,
    setCompanyLoading,
    setCompanyResults,
    setContactLoading,
    setContactResults,
    setContactSearch,
    setForm,
    setLivePreviewHtml,
    setLivePreviewLoading,
    setProductPickerRow,
    setProductSearch,
    setServices,
    setTemplates,
    setTplPreview,
  });
  const {
    closeWizard,
    openCreateOffer,
    openEdit,
  } = useOfferWizardLifecycle({
    dismissNotices,
    livePreviewTimer,
    priceDisplayMode: enforcedPriceDisplayMode,
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
  });
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

  const { copyCurrentViewLink, copyText } = useOfferClipboardToasts({
    addToast,
    setCopiedText,
    setViewLinkCopied,
  });

  const previewLooksImageLed = useMemo(
    () => Boolean(livePreviewHtml && /<img[\s>]/i.test(livePreviewHtml)),
    [livePreviewHtml],
  );

  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  const mottagareComplete = form.recipientName.trim().length >= 2 && emailRe.test(form.recipientEmail.trim());
  const detajerComplete   = form.title.trim().length >= 2;

  useOfferLivePreviewScheduler({
    form,
    showForm,
    wizardStep,
    cachedTplContent,
    livePreviewTimer,
    selectedCompanyBranding,
    priceDisplayMode: enforcedPriceDisplayMode,
    setPreviewDirty,
    setLivePreviewLoading,
    setLivePreviewHtml,
    setActiveField,
  });

  const tots = useMemo(
    () => pricingSummary(form.lineItems, enforcedPriceDisplayMode),
    [enforcedPriceDisplayMode, form.lineItems],
  );


  return (
    <div className="px-8 py-10 max-w-6xl mx-auto">

      <OffersPageHeader onCreateOffer={openCreateOffer} />

      <OffersNoticeStack
        blockingAlert={blockingAlert}
        error={error}
        onDismiss={dismissNotices}
      />

      <BulkSendResultBanner result={bulkResult} onDismiss={() => setBulkResult(null)} />

      <OfferWizardShell
        open={showForm}
        wizardStep={wizardStep}
        notice={restoredAt ? (
          <OfferDraftRecoveryBanner
            onContinue={dismissRestoredDraft}
            onDiscard={discardRestoredDraft}
          />
        ) : null}
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
          saveAndSendActive,
          draftStatus,
          saving,
          services,
          totals: tots,
          addLine,
          closeWizard,
          createOffer,
          dismissNotices,
          markSaveAndSend,
          pickContact,
          pickProduct,
          removeLine,
          restoreLine,
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
        hasActiveFilters={hasActiveOfferFilters}
        viewLinkCopied={viewLinkCopied}
        onTabChange={setTab}
        onSearchInputChange={setSearchInput}
        onSearchChange={setSearch}
        onDateFromChange={setDateFrom}
        onDateToChange={setDateTo}
        onResetFilters={resetFilters}
        onCopyViewLink={copyCurrentViewLink}
      />

      <OfferAttentionStrip
        offers={allOffers}
        tabCounts={tabCounts}
        onTabChange={setTab}
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
          copiedText={copiedText}
          priceDisplayMode={enforcedPriceDisplayMode}
          onAcceptAction={doAction}
          onCopyLink={copyLink}
          onCopyText={copyText}
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
          copiedText={copiedText}
          fetchingDocId={fetchingDocId}
          priceDisplayMode={enforcedPriceDisplayMode}
          currentPage={currentPage}
          pageSize={PAGE_SIZE}
          serverTotal={serverTotal}
          total={total}
          totalPages={totalPages}
          onAcceptAction={doAction}
          onCopyLink={copyLink}
          onCopyText={copyText}
          onCreateOffer={openCreateOffer}
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

      <OffersPageDialogs
        confirmSend={confirmSend}
        confirmDeleteOffer={confirmDeleteOffer}
        previewDoc={previewDoc}
        templatePreview={tplPreview}
        acting={acting}
        toasts={toasts}
        onCloseSend={() => setConfirmSend(null)}
        onConfirmSend={() => {
          if (!confirmSend) return;
          void doAction(confirmSend.id, 'send');
          setConfirmSend(null);
        }}
        onCloseTemplatePreview={() => setTplPreview(null)}
        onDeleteDialogOpenChange={(open) => { if (!open) setConfirmDeleteOffer(null); }}
        onConfirmDelete={() => {
          if (!confirmDeleteOffer) return;
          void deleteOffer(confirmDeleteOffer);
          setConfirmDeleteOffer(null);
        }}
        onClosePreview={() => setPreviewDoc(null)}
        onDismissToast={dismissToast}
      />
    </div>
  );
}
