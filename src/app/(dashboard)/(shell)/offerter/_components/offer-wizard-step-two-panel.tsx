'use client';

import type { pricingSummary } from '../_lib/offers-dashboard-formatters';
import type {
  CompanyResult,
  ContactResult,
  LineItem,
  OfferForm,
  OfferPriceDisplayMode,
  OfferProduct,
} from '../_store/types';
import {
  BlockingAlertCard,
  GenericErrorBanner,
  type BlockingAlert,
} from './offer-blocking-alerts';
import { OfferWizardDetailsCard } from './offer-wizard-details-card';
import { OfferWizardFooter } from './offer-wizard-footer';
import { OfferWizardLineItemsCard } from './offer-wizard-line-items-card';
import { OfferWizardRecipientCard } from './offer-wizard-recipient-card';
import { OfferWizardStepTwoHeader } from './offer-wizard-step-two-header';

type PricingSummary = ReturnType<typeof pricingSummary>;
type OpenCards = { mottagare: boolean; detaljer: boolean };
type ConfirmedSection = 'mottagare' | 'detaljer';

type OfferFormSetter = (form: OfferForm | ((prev: OfferForm) => OfferForm)) => void;
type FieldErrorsSetter = (errors: Record<string, string> | ((prev: Record<string, string>) => Record<string, string>)) => void;
type OpenCardsSetter = (updater: OpenCards | ((prev: OpenCards) => OpenCards)) => void;
type ConfirmedSectionsSetter = (
  updater: Set<ConfirmedSection> | ((prev: Set<ConfirmedSection>) => Set<ConfirmedSection>)
) => void;
type OpenLinesSetter = (updater: Set<number> | ((prev: Set<number>) => Set<number>)) => void;

type OfferWizardStepTwoPanelProps = {
  activeTemplateLabel: string | null;
  blockingAlert: BlockingAlert | null;
  companyLoading: boolean;
  companyResults: CompanyResult[];
  confirmedSections: Set<ConfirmedSection>;
  contactLoading: boolean;
  contactResults: ContactResult[];
  contactSearch: string;
  detajerComplete: boolean;
  editingOfferId: string | null;
  enforcedPriceDisplayMode: OfferPriceDisplayMode;
  error: string | null;
  fieldErrors: Record<string, string>;
  filteredServices: OfferProduct[];
  form: OfferForm;
  mottagareComplete: boolean;
  openCards: OpenCards;
  openLines: Set<number>;
  productPickerRow: number | null;
  productSearch: string;
  saveAndSendActive: boolean;
  saving: boolean;
  services: OfferProduct[];
  totals: PricingSummary;
  addLine: () => void;
  closeWizard: () => void;
  createOffer: () => Promise<void>;
  dismissNotices: () => void;
  markSaveAndSend: () => void;
  pickContact: (contact: ContactResult) => void;
  pickProduct: (idx: number, product: OfferProduct) => void;
  removeLine: (idx: number) => void;
  reorderLines: (oldIdx: number, newIdx: number) => void;
  searchCompanies: (query: string) => void;
  searchContacts: (query: string) => void;
  setActiveField: (field: string | null) => void;
  setCompanyResults: (results: CompanyResult[]) => void;
  setConfirmedSections: ConfirmedSectionsSetter;
  setContactResults: (results: ContactResult[]) => void;
  setContactSearch: (value: string) => void;
  setFieldErrors: FieldErrorsSetter;
  setForm: OfferFormSetter;
  setOpenCards: OpenCardsSetter;
  setOpenLines: OpenLinesSetter;
  setProductPickerRow: (row: number | null) => void;
  setProductSearch: (value: string) => void;
  setWizardStep: (step: 1 | 2) => void;
  updateLine: (idx: number, field: keyof LineItem, value: string | number) => void;
};

export function OfferWizardStepTwoPanel({
  activeTemplateLabel,
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
  saving,
  services,
  totals,
  addLine,
  closeWizard,
  createOffer,
  dismissNotices,
  markSaveAndSend,
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
}: OfferWizardStepTwoPanelProps) {
  return (
    <>
      <OfferWizardStepTwoHeader
        editingOfferId={editingOfferId}
        templateLabel={activeTemplateLabel}
        onBackToTemplates={() => setWizardStep(1)}
        onClose={closeWizard}
      />

      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-3">
          {blockingAlert ? (
            <BlockingAlertCard alert={blockingAlert} onDismiss={dismissNotices} compact />
          ) : error ? (
            <GenericErrorBanner message={error} onDismiss={dismissNotices} compact />
          ) : null}

          <OfferWizardRecipientCard
            form={form}
            fieldErrors={fieldErrors}
            openCards={openCards}
            confirmedSections={confirmedSections}
            contactSearch={contactSearch}
            contactResults={contactResults}
            contactLoading={contactLoading}
            companyResults={companyResults}
            companyLoading={companyLoading}
            mottagareComplete={mottagareComplete}
            setForm={setForm}
            setFieldErrors={setFieldErrors}
            setOpenCards={setOpenCards}
            setConfirmedSections={setConfirmedSections}
            setActiveField={setActiveField}
            searchContacts={searchContacts}
            setContactSearch={setContactSearch}
            setContactResults={setContactResults}
            pickContact={pickContact}
            searchCompanies={searchCompanies}
            setCompanyResults={setCompanyResults}
          />

          <OfferWizardDetailsCard
            form={form}
            fieldErrors={fieldErrors}
            openCards={openCards}
            confirmedSections={confirmedSections}
            detajerComplete={detajerComplete}
            setForm={setForm}
            setFieldErrors={setFieldErrors}
            setOpenCards={setOpenCards}
            setConfirmedSections={setConfirmedSections}
            setActiveField={setActiveField}
          />

          <OfferWizardLineItemsCard
            form={form}
            fieldErrors={fieldErrors}
            openLines={openLines}
            services={services}
            filteredServices={filteredServices}
            productPickerRow={productPickerRow}
            productSearch={productSearch}
            enforcedPriceDisplayMode={enforcedPriceDisplayMode}
            setOpenLines={setOpenLines}
            setProductPickerRow={setProductPickerRow}
            setProductSearch={setProductSearch}
            setActiveField={setActiveField}
            updateLine={updateLine}
            addLine={addLine}
            removeLine={removeLine}
            reorderLines={reorderLines}
            pickProduct={pickProduct}
          />
        </div>
      </div>

      <OfferWizardFooter
        totals={totals}
        saving={saving}
        editingOfferId={editingOfferId}
        saveAndSendActive={saveAndSendActive}
        createOffer={createOffer}
        markSaveAndSend={markSaveAndSend}
      />
    </>
  );
}
