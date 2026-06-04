'use client';

import { useCallback, useEffect, useMemo, useRef } from 'react';
import { listCompanies } from '@shared/lib/api/companies.api';
import { listRecipientSuggestions } from '@shared/lib/api/recipient-suggestions.api';
import { listProducts } from '@shared/lib/api/products.api';
import {
  getTemplate,
  listTemplates,
  previewTemplate,
  type TemplateBrandingPreview,
} from '@shared/lib/api/templates.api';
import type {
  CompanyResult,
  ContactResult,
  OfferForm,
  OfferProduct,
  OfferTemplate,
} from '../_store/types';
import { normalizeSearchValue } from '../_lib/offers-dashboard-formatters';

type TemplatePreview = { loading: boolean; html: string | null };

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

type UseOfferWizardLookupsInput = {
  editingOfferId: string | null;
  form: OfferForm;
  productSearch: string;
  selectedCompanyBranding?: CompanyBranding;
  selectedCompanyId?: string | null;
  services: OfferProduct[];
  templates: OfferTemplate[];
  setCachedTplContent: (content: string | null) => void;
  setCompanyLoading: (loading: boolean) => void;
  setCompanyResults: (results: CompanyResult[]) => void;
  setContactLoading: (loading: boolean) => void;
  setContactResults: (results: ContactResult[]) => void;
  setContactSearch: (value: string) => void;
  setForm: (form: OfferForm | ((prev: OfferForm) => OfferForm)) => void;
  setLivePreviewHtml: (html: string | null) => void;
  setLivePreviewLoading: (loading: boolean) => void;
  setProductPickerRow: (row: number | null) => void;
  setProductSearch: (value: string) => void;
  setServices: (products: OfferProduct[]) => void;
  setTemplates: (templates: OfferTemplate[]) => void;
  setTplPreview: (preview: TemplatePreview | null) => void;
};

export function useOfferWizardLookups({
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
}: UseOfferWizardLookupsInput) {
  const contactSearchRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const companySearchRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    void listTemplates(selectedCompanyId ? { companyId: selectedCompanyId } : {})
      .then((nextTemplates) => {
        setTemplates(nextTemplates as OfferTemplate[]);
      })
      .catch(() => {
        /* templates unavailable - dropdown stays empty */
      });
  }, [selectedCompanyId, setTemplates]);

  const loadServices = useCallback(async () => {
    try {
      const products = await listProducts(selectedCompanyId ? { companyId: selectedCompanyId } : {});
      setServices(products as OfferProduct[]);
    } catch {
      /* keep the existing services list when product lookups fail */
    }
  }, [selectedCompanyId, setServices]);

  useEffect(() => {
    void loadServices();
  }, [loadServices]);

  useEffect(() => {
    if (!selectedCompanyId || editingOfferId) return;
    setForm((current) => (
      current.companyId === selectedCompanyId
        ? current
        : { ...current, companyId: current.companyId || selectedCompanyId }
    ));
  }, [editingOfferId, selectedCompanyId, setForm]);

  useEffect(() => () => {
    if (contactSearchRef.current) clearTimeout(contactSearchRef.current);
    if (companySearchRef.current) clearTimeout(companySearchRef.current);
  }, []);

  const openTemplatePreview = useCallback(async (templateId?: string) => {
    const activeTemplateId = templateId ?? form.templateId;
    if (!activeTemplateId) return;
    setTplPreview({ loading: true, html: null });
    try {
      const template = await getTemplate(activeTemplateId);
      const html = await previewTemplate({
        content: template.content ?? undefined,
        branding: toTemplateBrandingPreview(selectedCompanyBranding),
      });
      setTplPreview({ loading: false, html });
    } catch {
      setTplPreview(null);
    }
  }, [form.templateId, selectedCompanyBranding, setTplPreview]);

  const searchContacts = useCallback((query: string) => {
    setContactSearch(query);
    if (contactSearchRef.current) clearTimeout(contactSearchRef.current);
    if (!query.trim()) {
      setContactResults([]);
      return;
    }
    contactSearchRef.current = setTimeout(async () => {
      setContactLoading(true);
      try {
        const result = await listRecipientSuggestions({
          search: query,
          companyId: selectedCompanyId,
          limit: 8,
        });
        setContactResults(result.map((suggestion) => ({
          id: suggestion.customerId ?? suggestion.leadId ?? suggestion.id,
          kind: suggestion.kind,
          name: suggestion.name,
          email: suggestion.email,
          phone: suggestion.phone,
          company: suggestion.company,
          leadId: suggestion.leadId,
          customerId: suggestion.customerId,
          requestedService: suggestion.requestedService,
          sourceLabel: suggestion.sourceLabel,
          hasOffer: suggestion.hasOffer,
        })) as ContactResult[]);
      } catch {
        /* ignore */
      } finally {
        setContactLoading(false);
      }
    }, 280);
  }, [selectedCompanyId, setContactLoading, setContactResults, setContactSearch]);

  const searchCompanies = useCallback((query: string) => {
    if (companySearchRef.current) clearTimeout(companySearchRef.current);
    if (!query.trim()) {
      setCompanyResults([]);
      return;
    }
    companySearchRef.current = setTimeout(async () => {
      setCompanyLoading(true);
      try {
        const companies = await listCompanies({ search: query, limit: 8, offset: 0 });
        setCompanyResults(companies as CompanyResult[]);
      } catch {
        /* ignore */
      } finally {
        setCompanyLoading(false);
      }
    }, 280);
  }, [setCompanyLoading, setCompanyResults]);

  const pickContact = useCallback((contact: ContactResult) => {
    setForm((current) => ({
      ...current,
      contactId: contact.customerId ?? (contact.kind === 'customer' ? contact.id : ''),
      leadId: contact.leadId ?? '',
      recipientName: contact.name ?? current.recipientName,
      recipientEmail: contact.email ?? current.recipientEmail,
      recipientCompany: contact.company ?? current.recipientCompany,
      title: current.title || contact.requestedService || current.title,
    }));
    setContactSearch('');
    setContactResults([]);
  }, [setContactResults, setContactSearch, setForm]);

  const pickProduct = useCallback((idx: number, product: OfferProduct) => {
    setForm((current) => {
      const items = [...current.lineItems];
      const mainCategoryTitle = (((product as unknown as { category?: string }).category) ?? '')
        .split('/')
        .map((part: string) => part.trim())
        .filter(Boolean)[0];
      items[idx] = {
        ...items[idx],
        description: product.name + (product.description ? ` - ${product.description}` : ''),
        unitPrice: product.unitPrice,
        vatRate: product.vatRate,
        productId: product.id,
        unit: product.unit,
      };
      return {
        ...current,
        lineItems: items,
        title: current.title.trim() || mainCategoryTitle || current.title,
      };
    });
    setProductPickerRow(null);
    setProductSearch('');
  }, [setForm, setProductPickerRow, setProductSearch]);

  const selectTemplate = useCallback(async (templateId: string) => {
    setForm((current) => ({ ...current, templateId }));
    setLivePreviewLoading(true);
    setLivePreviewHtml(null);
    setCachedTplContent(null);
    try {
      const template = await getTemplate(templateId);
      const content = template.content ?? null;
      setCachedTplContent(content);
      const html = await previewTemplate({
        content: content ?? undefined,
        branding: toTemplateBrandingPreview(selectedCompanyBranding),
      });
      setLivePreviewHtml(html || null);
    } catch {
      /* ignore */
    } finally {
      setLivePreviewLoading(false);
    }
  }, [
    selectedCompanyBranding,
    setCachedTplContent,
    setForm,
    setLivePreviewHtml,
    setLivePreviewLoading,
  ]);

  const filteredServices = useMemo(() => {
    const query = normalizeSearchValue(productSearch);
    if (!query) return services;

    return services.filter((product) => {
      const haystack = normalizeSearchValue([
        product.name,
        product.description ?? '',
        product.unit ?? '',
      ].join(' '));
      return haystack.includes(query);
    });
  }, [productSearch, services]);

  const selectedTemplate = useMemo(
    () => templates.find((template) => template.id === form.templateId) ?? null,
    [form.templateId, templates],
  );

  return {
    filteredServices,
    openTemplatePreview,
    pickContact,
    pickProduct,
    searchCompanies,
    searchContacts,
    selectTemplate,
    selectedTemplate,
  };
}
