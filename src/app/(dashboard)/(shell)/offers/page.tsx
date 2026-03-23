'use client';

/**
 * /offers
 *
 * Offer / Quotation Builder.
 * - List of all offers with status tabs + search
 * - Slide-out panel to create a new offer with line-item editor
 * - Template dropdown: select a WYSIWYG template before creating
 * - Real-time totals (ex VAT, VAT amount, total inc VAT)
 * - Send / Accept / Decline actions
 * - Preview generated document in modal
 * - Copy public signing link to clipboard
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@shared/lib/utils';

// ─── Types ─────────────────────────────────────────────────────────────────────

type OfferStatus = 'draft' | 'sent' | 'viewed' | 'accepted' | 'declined' | 'expired';

interface LineItem {
  id?:         string;
  description: string;
  quantity:    number;
  unitPrice:   number;
  vatRate:     number;
  discount:    number;
}

interface Offer {
  id:                   string;
  title:                string;
  status:               OfferStatus;
  offerNumber?:         number;
  recipientName:        string;
  recipientEmail:       string;
  recipientCompany?:    string;
  notes?:               string;
  validUntil:           string;
  totalExVat:           number;
  totalIncVat:          number;
  lineItems:            LineItem[];
  createdAt:            string;
  sentAt?:              string;
  viewedAt?:            string;
  acceptedAt?:          string;
  declinedAt?:          string;
  reminderSentAt?:      string;
  reminderCount:        number;
  leadId?:              string;
  templateId?:          string;
  publicToken:          string;
  publicTokenExpiresAt?: string;
}

interface OfferTemplate {
  id:            string;
  name:          string;
  content?:      string; // TipTap JSON string (may be absent in list responses)
  emailSubject?: string;
  emailBody?:    string;
}

interface OfferProduct {
  id:          string;
  name:        string;
  description?: string;
  unitPrice:   number;
  vatRate:     number;
  unit?:       string;
}

interface ContactResult {
  id:      string;
  name:    string | null;
  email:   string | null;
  company: string | null;
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const PAGE_SIZE = 25;

const STATUS_TABS: { id: OfferStatus | 'all'; label: string }[] = [
  { id: 'all',      label: 'Alla' },
  { id: 'draft',    label: 'Utkast' },
  { id: 'sent',     label: 'Skickade' },
  { id: 'viewed',   label: 'Visade' },
  { id: 'accepted', label: 'Accepterade' },
  { id: 'declined', label: 'Avvisade' },
];

const STATUS_STYLES: Record<OfferStatus, string> = {
  draft:    'bg-[var(--surface-alt)] text-[var(--text-muted)] border border-[var(--border)]',
  sent:     'bg-blue-50 dark:bg-blue-900/25 text-blue-700 dark:text-blue-400',
  viewed:   'bg-violet-50 dark:bg-violet-900/25 text-violet-700 dark:text-violet-400',
  accepted: 'bg-emerald-50 dark:bg-emerald-900/25 text-emerald-700 dark:text-emerald-400',
  declined: 'bg-red-50 dark:bg-red-900/25 text-red-600 dark:text-red-400',
  expired:  'bg-amber-50 dark:bg-amber-900/25 text-amber-700 dark:text-amber-400',
};

const STATUS_LABEL: Record<OfferStatus, string> = {
  draft:    'Utkast',
  sent:     'Skickad',
  viewed:   'Visad',
  accepted: 'Accepterad',
  declined: 'Avvisad',
  expired:  'Utgången',
};

const EMPTY_LINE: LineItem = { description: '', quantity: 1, unitPrice: 0, vatRate: 0.25, discount: 0 };

const VALIDITY_OPTIONS = [
  { days: 7,  label: '7 dagar' },
  { days: 14, label: '14 dagar' },
  { days: 30, label: '30 dagar' },
  { days: 60, label: '60 dagar' },
  { days: 90, label: '90 dagar' },
] as const;


const EMPTY_FORM = {
  templateId: '', contactId: '',
  title: '', recipientName: '', recipientEmail: '', recipientCompany: '',
  notes: '', validityDays: 30 as number, lineItems: [{ ...EMPTY_LINE }],
};

// ─── Utilities ─────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('sv-SE', { day: '2-digit', month: 'short', year: 'numeric' });
}

function fmtSEK(n: number) {
  return new Intl.NumberFormat('sv-SE', { style: 'currency', currency: 'SEK', maximumFractionDigits: 0 }).format(n);
}

function computeTotals(items: LineItem[]) {
  let exVat = 0; let vatAmt = 0;
  for (const item of items) {
    if (!item.description || item.quantity <= 0 || item.unitPrice < 0) continue;
    const disc = 1 - (item.discount / 100);
    const line = item.quantity * item.unitPrice * disc;
    exVat  += line;
    vatAmt += line * item.vatRate;
  }
  return {
    exVat:  Math.round(exVat * 100)  / 100,
    vat:    Math.round(vatAmt * 100) / 100,
    incVat: Math.round((exVat + vatAmt) * 100) / 100,
  };
}

function publicUrl(token: string): string {
  const base = typeof window !== 'undefined' ? window.location.origin : '';
  return `${base}/offers/public/${token}`;
}

function fmtOfferNumber(offer: Offer): string {
  if (!offer.offerNumber) return offer.id.slice(0, 8).toUpperCase();
  const year = new Date(offer.createdAt).getFullYear();
  return `${year}-${String(offer.offerNumber).padStart(3, '0')}`;
}

/** Returns true if a reminder can be sent (no reminder yet, or cooldown of 3 days has passed) */
function canRemind(offer: Offer): boolean {
  if (offer.status !== 'sent' && offer.status !== 'viewed') return false;
  if (!offer.reminderSentAt) return true;
  return Date.now() - new Date(offer.reminderSentAt).getTime() >= 3 * 24 * 60 * 60 * 1000;
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function OffersPage() {
  // allOffers always holds the full unfiltered list — tab counts stay stable
  const [allOffers,  setAllOffers]  = useState<Offer[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState<string | null>(null);
  const [tab,        setTab]        = useState<OfferStatus | 'all'>('all');
  const [sortAsc,    setSortAsc]    = useState(false); // desc by default (newest first)
  const [search,     setSearch]     = useState('');
  const [dateFrom,   setDateFrom]   = useState('');
  const [dateTo,     setDateTo]     = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [showForm,         setShowForm]         = useState(false);
  const [editingOfferId,   setEditingOfferId]   = useState<string | null>(null);
  const [form,             setForm]             = useState(EMPTY_FORM);
  const [saving,     setSaving]     = useState(false);
  const [acting,     setActing]     = useState<string | null>(null);
  const [templates,         setTemplates]         = useState<OfferTemplate[]>([]);
  const [previewDoc,        setPreviewDoc]        = useState<string | null>(null); // generated-doc HTML
  const [fetchingDocId,     setFetchingDocId]     = useState<string | null>(null); // offer being doc-fetched
  const [tplPreview,        setTplPreview]        = useState<{ loading: boolean; html: string | null } | null>(null);
  const [confirmDeleteOffer, setConfirmDeleteOffer] = useState<string | null>(null);
  const [copied,            setCopied]            = useState<string | null>(null); // offerId copied
  const [confirmSend,       setConfirmSend]       = useState<Offer | null>(null);  // offer pending send confirmation
  const [selected,       setSelected]       = useState<Set<string>>(new Set()); // bulk-selected offer ids
  const [bulkSending,    setBulkSending]    = useState(false);
  const [bulkResult,     setBulkResult]     = useState<{ sent: number; failed: number } | null>(null);
  const [contactSearch,    setContactSearch]    = useState('');
  const [contactResults,   setContactResults]   = useState<ContactResult[]>([]);
  const [contactLoading,   setContactLoading]   = useState(false);
  const [draftSaved,       setDraftSaved]       = useState(false);
  const [fieldErrors,      setFieldErrors]      = useState<Record<string, string>>({});
  const saveAndSendRef = useRef(false);
  const contactSearchRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Service/product library state
  const [services,          setServices]          = useState<OfferProduct[]>([]);
  const [productPickerRow,  setProductPickerRow]  = useState<number | null>(null);
  const [productSearch,     setProductSearch]     = useState('');
  const [showServiceLibrary, setShowServiceLibrary] = useState(false);
  const [serviceForm,       setServiceForm]       = useState({ name: '', description: '', unitPrice: 0, vatRate: 0.25, unit: '' });
  const [savingService,     setSavingService]     = useState(false);

  // ── Guided wizard (full-screen create/edit flow) ───────────────────────────
  const [wizardStep,         setWizardStep]         = useState<1 | 2>(1);
  const [livePreviewHtml,    setLivePreviewHtml]    = useState<string | null>(null);
  const [livePreviewLoading, setLivePreviewLoading] = useState(false);
  const [cachedTplContent,   setCachedTplContent]   = useState<string | null>(null);
  const livePreviewTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Load templates ────────────────────────────────────────────────────────────
  useEffect(() => {
    void fetch('/api/templates')
      .then(async (r) => {
        if (r.ok) {
          const j = await r.json() as { data: OfferTemplate[] };
          setTemplates(j.data);
        }
      })
      .catch(() => { /* templates unavailable — dropdown stays empty */ });
  }, []);

  // ── Load products ─────────────────────────────────────────────────────────────
  const loadServices = useCallback(async () => {
    const r = await fetch('/api/offers/products');
    if (r.ok) {
      const j = await r.json() as { data: { products: OfferProduct[] } };
      setServices(j.data.products);
    }
  }, []);

  useEffect(() => { void loadServices(); }, [loadServices]);

  // ── Load offers — always fetch all so tab counts stay accurate ───────────────
  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ limit: '100', offset: '0' });
      if (search.trim()) params.set('search', search.trim());
      const res = await fetch(`/api/offers?${params}`);
      if (!res.ok) throw new Error(`Fel ${res.status}`);
      const json = await res.json().catch(() => null) as { data: { offers: Offer[]; total: number } } | null;
      if (!json) throw new Error('Serverfel — försök igen.');
      setAllOffers(json.data.offers);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => { void load(); setSelected(new Set()); setBulkResult(null); }, [load]);
  useEffect(() => { setCurrentPage(0); }, [tab, dateFrom, dateTo, search]);

  // ── Derived: filtered + sorted list for current tab ───────────────────────────
  const filteredOffers = useMemo(() => {
    let base = tab === 'all' ? allOffers : allOffers.filter((o) => o.status === tab);
    if (dateFrom) base = base.filter((o) => new Date(o.createdAt) >= new Date(dateFrom));
    if (dateTo)   base = base.filter((o) => new Date(o.createdAt) <= new Date(dateTo + 'T23:59:59'));
    return base.slice().sort((a, b) => {
      const diff = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      return sortAsc ? diff : -diff;
    });
  }, [allOffers, tab, sortAsc, dateFrom, dateTo]);

  const offers       = useMemo(
    () => filteredOffers.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE),
    [filteredOffers, currentPage]);

  const total          = allOffers.length;
  const totalFiltered  = filteredOffers.length;
  const totalPages     = Math.max(1, Math.ceil(totalFiltered / PAGE_SIZE));

  // ── Open edit form for an existing draft offer ────────────────────────────────
  const openEdit = useCallback((offer: Offer) => {
    setEditingOfferId(offer.id);
    setForm({
      templateId:       offer.templateId ?? '',
      contactId:        '',
      title:            offer.title,
      recipientName:    offer.recipientName,
      recipientEmail:   offer.recipientEmail,
      recipientCompany: offer.recipientCompany ?? '',
      notes:            offer.notes ?? '',
      validityDays:     30,
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
          const tplRes = await fetch(`/api/templates/${offer.templateId}`);
          if (!tplRes.ok) throw new Error();
          const tplData = await tplRes.json() as { data?: { content?: string } };
          const content = tplData.data?.content ?? null;
          setCachedTplContent(content);
          if (content) {
            const res = await fetch('/api/templates/preview', {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ content }),
            });
            const j = await res.json() as { html?: string };
            setLivePreviewHtml(j.html ?? null);
          }
        } catch { /* ignore */ } finally {
          setLivePreviewLoading(false);
        }
      })();
    }
    setError(null);
    setShowForm(true);
  }, []);

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

    setSaving(true); setError(null); setFieldErrors({});
    try {
      const body: Record<string, unknown> = {
        title:            form.title,
        recipientName:    form.recipientName,
        recipientEmail:   form.recipientEmail,
        recipientCompany: form.recipientCompany || undefined,
        notes:            form.notes || undefined,
        validityDays:     form.validityDays,
        lineItems:        form.lineItems.filter((i) => i.description.trim() && i.quantity > 0),
      };
      if (form.templateId)    body.templateId   = form.templateId;
      if (form.contactId)     body.customerId   = form.contactId;

      const isEdit = Boolean(editingOfferId);
      const res = isEdit
        ? await fetch(`/api/offers/${editingOfferId}`, {
            method: 'PATCH', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          })
        : await fetch('/api/offers', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body:   JSON.stringify(body),
          });
      if (!res.ok) {
        const j = await res.json().catch(() => ({})) as { detail?: string };
        throw new Error(j.detail ?? `Fel ${res.status}`);
      }
      const j = await res.json() as { data: Offer };
      setShowForm(false); setForm(EMPTY_FORM); setEditingOfferId(null);
      await load(true);
      if (saveAndSendRef.current) {
        saveAndSendRef.current = false;
        setConfirmSend(j.data);
      } else {
        setDraftSaved(true);
        setTimeout(() => setDraftSaved(false), 3000);
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }, [form, load, editingOfferId]);

  // ── Status actions (send / accept / decline / duplicate / remind) ────────────
  const doAction = useCallback(async (id: string, action: 'send' | 'accept' | 'decline' | 'duplicate' | 'remind') => {
    setActing(id);
    try {
      const res = await fetch(`/api/offers/${id}?action=${action}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}),
      });
      if (!res.ok) throw new Error(`Fel ${res.status}`);
      await load(true);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setActing(null);
    }
  }, [load]);

  // ── Delete ────────────────────────────────────────────────────────────────────
  const deleteOffer = useCallback(async (id: string) => {
    setConfirmDeleteOffer(null);
    try {
      await fetch(`/api/offers/${id}`, { method: 'DELETE' });
      await load(true);
    } catch (e) {
      setError((e as Error).message);
    }
  }, [load]);

  // ── Template preview (from offer form) ────────────────────────────────────────
  const openTemplatePreview = useCallback(async () => {
    if (!form.templateId) return;
    setTplPreview({ loading: true, html: null });
    try {
      // Fetch full template (list response omits content for performance)
      const tplRes = await fetch(`/api/templates/${form.templateId}`);
      if (!tplRes.ok) throw new Error(`Kunde inte hämta mall (${tplRes.status})`);
      const tplData = await tplRes.json() as { data?: { content?: string } };
      const content = tplData.data?.content;

      const res = await fetch('/api/templates/preview', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      const j = await res.json() as { html?: string; detail?: string };
      if (!res.ok) throw new Error(j.detail ?? `Fel ${res.status}`);
      setTplPreview({ loading: false, html: j.html ?? '' });
    } catch {
      setTplPreview(null);
    }
  }, [form.templateId]);

  // ── Fetch & open generated document preview on-demand ─────────────────────────
  // generatedDocument is excluded from the list payload (too large); fetch by ID.
  const fetchAndPreviewDoc = useCallback(async (offerId: string) => {
    setFetchingDocId(offerId);
    try {
      const res = await fetch(`/api/offers/${offerId}`);
      if (!res.ok) throw new Error(`Fel ${res.status}`);
      const j = await res.json() as { data?: { generatedDocument?: string } };
      setPreviewDoc(j.data?.generatedDocument ?? null);
    } catch { /* show nothing on error */ } finally {
      setFetchingDocId(null);
    }
  }, []);

  // ── Copy public link ───────────────────────────────────────────────────────────
  const copyLink = useCallback(async (offer: Offer) => {
    const url = publicUrl(offer.publicToken);
    await navigator.clipboard.writeText(url).catch(() => {});
    setCopied(offer.id);
    setTimeout(() => setCopied(null), 2000);
  }, []);

  // ── Bulk send ─────────────────────────────────────────────────────────────
  const doBulkSend = useCallback(async () => {
    const ids = Array.from(selected).filter((id) => {
      const o = allOffers.find((o) => o.id === id);
      return o?.status === 'draft';
    });
    if (ids.length === 0) return;
    setBulkSending(true); setBulkResult(null); setError(null);
    try {
      const res = await fetch('/api/offers/bulk-send', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body:   JSON.stringify({ ids }),
      });
      if (!res.ok) throw new Error(`Fel ${res.status}`);
      const j = await res.json() as { data: { sent: number; failed: number } };
      setBulkResult(j.data);
      setSelected(new Set());
      await load(true);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBulkSending(false);
    }
  }, [selected, allOffers, load]);

  // ── Selection helpers ─────────────────────────────────────────────────────
  const draftOffers = allOffers.filter((o) => o.status === 'draft');
  const selectedDraftCount = Array.from(selected).filter((id) => allOffers.find((o) => o.id === id)?.status === 'draft').length;
  const allDraftsSelected  = draftOffers.length > 0 && draftOffers.every((o) => selected.has(o.id));

  function toggleSelect(id: string) {
    setSelected((prev) => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });
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
        const res = await fetch(`/api/crm/contacts?search=${encodeURIComponent(q)}&limit=8`);
        if (res.ok) {
          const j = await res.json() as { data: { contacts: ContactResult[] } };
          setContactResults(j.data.contacts);
        }
      } catch { /* ignore */ } finally {
        setContactLoading(false);
      }
    }, 280);
  }, []);

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
      items[idx] = {
        ...items[idx],
        description: p.name + (p.description ? ` — ${p.description}` : ''),
        unitPrice:   p.unitPrice,
        vatRate:     p.vatRate,
      };
      return { ...f, lineItems: items };
    });
    setProductPickerRow(null);
    setProductSearch('');
  }, []);

  const saveService = useCallback(async () => {
    if (!serviceForm.name.trim() || serviceForm.unitPrice < 0) return;
    setSavingService(true);
    try {
      const res = await fetch('/api/offers/products', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name:        serviceForm.name,
          description: serviceForm.description || undefined,
          unitPrice:   serviceForm.unitPrice,
          vatRate:     serviceForm.vatRate,
          unit:        serviceForm.unit || undefined,
        }),
      });
      if (!res.ok) throw new Error(`Fel ${res.status}`);
      setServiceForm({ name: '', description: '', unitPrice: 0, vatRate: 0.25, unit: '' });
      await loadServices();
    } catch { /* ignore */ } finally {
      setSavingService(false);
    }
  }, [serviceForm, loadServices]);

  const removeService = useCallback(async (id: string) => {
    if (!confirm('Ta bort produkt?')) return;
    await fetch(`/api/offers/products/${id}`, { method: 'DELETE' });
    await loadServices();
  }, [loadServices]);

  const filteredServices = services.filter((p) =>
    !productSearch.trim() || p.name.toLowerCase().includes(productSearch.toLowerCase())
  );

  // ── Wizard helpers ────────────────────────────────────────────────────────────

  const closeWizard = useCallback(() => {
    setShowForm(false); setForm(EMPTY_FORM); setEditingOfferId(null);
    setError(null); setFieldErrors({}); setContactSearch(''); setContactResults([]);
    setWizardStep(1); setLivePreviewHtml(null); setCachedTplContent(null);
    if (livePreviewTimer.current) clearTimeout(livePreviewTimer.current);
  }, []);

  /** Fetch a template's full content, set it selected, load initial preview, advance to step 2. */
  const selectTemplate = useCallback(async (tplId: string) => {
    setForm((f) => ({ ...f, templateId: tplId }));
    setWizardStep(2);
    setLivePreviewLoading(true);
    setLivePreviewHtml(null);
    setCachedTplContent(null);
    try {
      const tplRes = await fetch(`/api/templates/${tplId}`);
      if (!tplRes.ok) throw new Error();
      const tplData = await tplRes.json() as { data?: { content?: string } };
      const content = tplData.data?.content ?? null;
      setCachedTplContent(content);
      const res = await fetch('/api/templates/preview', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      const j = await res.json() as { html?: string };
      setLivePreviewHtml(j.html ?? null);
    } catch { /* ignore */ } finally {
      setLivePreviewLoading(false);
    }
  }, []);

  /** Schedule a debounced re-render of the live preview with current form values. */
  const scheduleLivePreview = useCallback((currentForm: typeof form, content: string) => {
    if (livePreviewTimer.current) clearTimeout(livePreviewTimer.current);
    livePreviewTimer.current = setTimeout(async () => {
      const validItems = currentForm.lineItems.filter((i) => i.description.trim() && i.quantity > 0);
      try {
        setLivePreviewLoading(true);
        const res = await fetch('/api/templates/preview', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content,
            offer: {
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
      }
    }, 500);
  }, []);

  // Re-render preview whenever form values change (step 2 only)
  useEffect(() => {
    if (!showForm || wizardStep !== 2 || !cachedTplContent) return;
    scheduleLivePreview(form, cachedTplContent);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    form.title, form.recipientName, form.recipientEmail,
    form.recipientCompany, form.notes, form.lineItems,
    showForm, wizardStep, cachedTplContent, scheduleLivePreview,
  ]);

  // ── Line item helpers ─────────────────────────────────────────────────────────
  function updateLine(idx: number, field: keyof LineItem, value: string | number) {
    let v: string | number = value;
    if (field === 'quantity')  v = Math.max(0, Number(v));
    if (field === 'unitPrice') v = Math.max(0, Number(v));
    if (field === 'discount')  v = Math.min(100, Math.max(0, Number(v)));
    setForm((f) => { const items = [...f.lineItems]; items[idx] = { ...items[idx], [field]: v }; return { ...f, lineItems: items }; });
    setFieldErrors((fe) => { const next = { ...fe }; delete next[`line_${idx}_${field}`]; return next; });
  }
  function addLine() { setForm((f) => ({ ...f, lineItems: [...f.lineItems, { ...EMPTY_LINE }] })); }
  function removeLine(idx: number) {
    setForm((f) => ({ ...f, lineItems: f.lineItems.filter((_, i) => i !== idx) }));
    setFieldErrors((fe) => {
      const next: Record<string, string> = {};
      for (const [k, v] of Object.entries(fe)) {
        const m = k.match(/^line_(\d+)_(.+)$/);
        if (!m) { next[k] = v; continue; }
        const rowIdx = parseInt(m[1]);
        if (rowIdx === idx) continue;           // drop errors for removed row
        const newKey = `line_${rowIdx < idx ? rowIdx : rowIdx - 1}_${m[2]}`;
        next[newKey] = v;
      }
      return next;
    });
  }

  const tots = computeTotals(form.lineItems);

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className="px-8 py-10 max-w-6xl mx-auto">

      {/* Header */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-[var(--text-primary)] mb-1">Offerter</h1>
          <p className="text-sm text-[var(--text-muted)]">Skapa, skicka och följ upp offerter direkt från plattformen.</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => { setShowForm(true); setEditingOfferId(null); setForm(EMPTY_FORM); setError(null); setWizardStep(1); setLivePreviewHtml(null); setCachedTplContent(null); }}
            className="flex items-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Ny offert
          </button>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="mb-6 rounded-xl border border-red-200 dark:border-red-800/40 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-400 flex items-center justify-between gap-3">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="shrink-0 opacity-60 hover:opacity-100">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      )}

      {/* Bulk send result banner */}
      {bulkResult && (
        <div className="mb-6 rounded-xl border border-emerald-200 dark:border-emerald-800/40 bg-emerald-50 dark:bg-emerald-900/20 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-400 flex items-center justify-between gap-3">
          <span>
            {bulkResult.sent} offert{bulkResult.sent !== 1 ? 'er' : ''} skickade
            {bulkResult.failed > 0 ? ` · ${bulkResult.failed} misslyckades` : ''}
          </span>
          <button onClick={() => setBulkResult(null)} className="shrink-0 opacity-60 hover:opacity-100">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      )}

      {/* ── Guided offer wizard — full-screen split layout ── */}
      <AnimatePresence>
      {showForm && (
        <>
          <motion.div
            key="offer-wizard"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 flex flex-col bg-[var(--surface)]"
          >
            {/* ── Top bar ── */}
            <div className="shrink-0 flex items-center gap-3 px-4 py-3 border-b border-[var(--border)] bg-[var(--surface-alt)]">
              <button onClick={closeWizard} title="Stäng"
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1.5 rounded-lg hover:bg-[var(--surface-active)] transition-colors shrink-0">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
              <h2 className="font-semibold text-sm text-[var(--text-primary)]">
                {editingOfferId ? 'Redigera offert' : 'Ny offert'}
              </h2>
              <div className="flex-1"/>
              {/* Step indicator */}
              <div className="flex items-center gap-2 text-xs">
                <span className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-full font-medium transition-all',
                  wizardStep === 1
                    ? 'bg-[var(--accent)] text-white shadow-sm'
                    : 'bg-[var(--surface)] text-[var(--text-muted)] border border-[var(--border)]',
                )}>
                  {wizardStep > 1
                    ? <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    : <span>1</span>}
                  <span>Välj mall</span>
                </span>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--border)]">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
                <span className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-full font-medium transition-all',
                  wizardStep === 2
                    ? 'bg-[var(--accent)] text-white shadow-sm'
                    : 'bg-[var(--surface)] text-[var(--text-muted)] border border-[var(--border)]',
                )}>
                  <span>2</span>
                  <span>Fyll i</span>
                </span>
              </div>
              <div className="flex-1"/>
              <div className="w-9 shrink-0"/>
            </div>

            {/* ── Split body ── */}
            <div className="flex-1 flex overflow-hidden">

              {/* ── Left: live preview canvas (hidden on small screens) ── */}
              <div className="hidden lg:flex flex-1 bg-slate-100 dark:bg-slate-900/60 overflow-auto flex-col items-center py-10 px-8 relative">
                <AnimatePresence mode="wait">
                  {!livePreviewHtml && !livePreviewLoading && (
                    <motion.div key="preview-empty"
                      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className="flex flex-col items-center justify-center h-full text-center gap-5 max-w-xs mx-auto">
                      <div className="w-20 h-20 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-sm">
                        <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" className="text-slate-300 dark:text-slate-600">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                          <polyline points="14 2 14 8 20 8"/>
                          <line x1="16" y1="13" x2="8" y2="13"/>
                          <line x1="16" y1="17" x2="8" y2="17"/>
                          <polyline points="10 9 9 9 8 9"/>
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[var(--text-primary)] mb-1.5">Välj en mall för att se förhandsvisning</p>
                        <p className="text-xs text-[var(--text-muted)] leading-relaxed">Mallen styr offertens utseende. Välj bland dina mallar i panelen till höger — förhandsvisningen uppdateras live.</p>
                      </div>
                      {templates.length === 0 && (
                        <a href="/templates" target="_blank" rel="noreferrer" className="text-xs text-[var(--accent)] hover:underline font-medium">
                          Skapa din första mall →
                        </a>
                      )}
                    </motion.div>
                  )}
                  {livePreviewLoading && !livePreviewHtml && (
                    <motion.div key="preview-loading"
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="flex flex-col items-center justify-center h-full gap-3 text-[var(--text-muted)]">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin text-[var(--accent)]">
                        <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                      </svg>
                      <p className="text-xs">Laddar mall…</p>
                    </motion.div>
                  )}
                  {livePreviewHtml && (
                    <motion.div key="preview-iframe"
                      initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                      className="relative w-full max-w-3xl">
                      {livePreviewLoading && (
                        <div className="absolute inset-0 z-10 rounded-xl flex items-center justify-center bg-slate-100/70 dark:bg-slate-900/70 backdrop-blur-sm">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin text-[var(--accent)]">
                            <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                          </svg>
                        </div>
                      )}
                      <iframe
                        srcDoc={livePreviewHtml}
                        title="Live-förhandsvisning"
                        className="w-full rounded-xl shadow-2xl"
                        style={{ border: 'none', minHeight: '85vh' }}
                        sandbox="allow-same-origin"
                        onLoad={(e) => {
                          const iframe = e.currentTarget;
                          const resize = () => {
                            try {
                              const d = iframe.contentDocument;
                              if (d?.body) iframe.style.height = `${d.body.scrollHeight}px`;
                            } catch { /* cross-origin */ }
                          };
                          resize();
                          iframe.contentDocument?.querySelectorAll('img').forEach((img) => {
                            img.addEventListener('load', resize);
                          });
                        }}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* ── Right: step panel ── */}
              <div className="w-full lg:w-[460px] shrink-0 border-l border-[var(--border)] bg-[var(--surface)] flex flex-col overflow-hidden">

                {/* ════ STEP 1: Template picker ════ */}
                {wizardStep === 1 && (
                  <>
                    <div className="px-5 py-4 border-b border-[var(--border)] bg-[var(--surface-alt)] shrink-0">
                      <h3 className="text-sm font-semibold text-[var(--text-primary)]">Välj offertmall</h3>
                      <p className="text-xs text-[var(--text-muted)] mt-0.5">Mallen styr dokumentets layout och design</p>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-2">
                      {templates.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center gap-4 px-4">
                          <div className="w-14 h-14 rounded-xl bg-[var(--surface-alt)] border border-[var(--border)] flex items-center justify-center">
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--text-muted)]">
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                              <polyline points="14 2 14 8 20 8"/>
                            </svg>
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-[var(--text-primary)] mb-1">Inga mallar ännu</p>
                            <p className="text-xs text-[var(--text-muted)]">Skapa en offertmall innan du skapar en offert.</p>
                          </div>
                          <a href="/templates" target="_blank" rel="noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity">
                            Skapa mall
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/>
                            </svg>
                          </a>
                        </div>
                      ) : (
                        templates.map((t) => (
                          <button key={t.id} type="button" onClick={() => void selectTemplate(t.id)}
                            className={cn(
                              'w-full text-left rounded-xl border p-4 transition-all flex items-center gap-3 group',
                              form.templateId === t.id
                                ? 'border-[var(--accent)] bg-[var(--accent)]/5 shadow-sm'
                                : 'border-[var(--border)] bg-[var(--surface-alt)] hover:border-[var(--accent)]/50 hover:shadow-sm',
                            )}>
                            <div className={cn(
                              'shrink-0 w-10 h-10 rounded-lg flex items-center justify-center transition-colors',
                              form.templateId === t.id
                                ? 'bg-[var(--accent)] text-white'
                                : 'bg-[var(--surface)] border border-[var(--border)] text-[var(--text-muted)] group-hover:border-[var(--accent)]/40 group-hover:text-[var(--accent)]',
                            )}>
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                                <polyline points="14 2 14 8 20 8"/>
                                <line x1="16" y1="13" x2="8" y2="13"/>
                                <line x1="16" y1="17" x2="8" y2="17"/>
                              </svg>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={cn('text-sm font-semibold truncate transition-colors', form.templateId === t.id ? 'text-[var(--accent)]' : 'text-[var(--text-primary)] group-hover:text-[var(--accent)]')}>{t.name}</p>
                              <p className="text-xs text-[var(--text-muted)] mt-0.5">Klicka för att välja och förhandsgranska</p>
                            </div>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                              className={cn('shrink-0 transition-colors', form.templateId === t.id ? 'text-[var(--accent)]' : 'text-[var(--border)] group-hover:text-[var(--accent)]/50')}>
                              <polyline points="9 18 15 12 9 6"/>
                            </svg>
                          </button>
                        ))
                      )}
                    </div>
                    {templates.length > 0 && (
                      <div className="shrink-0 px-5 py-3 border-t border-[var(--border)] bg-[var(--surface-alt)]">
                        <a href="/templates" target="_blank" rel="noreferrer"
                          className="text-xs text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors">
                          Hantera mallar →
                        </a>
                      </div>
                    )}
                  </>
                )}

                {/* ════ STEP 2: Form ════ */}
                {wizardStep === 2 && (
                  <>
                    {/* Step 2 header */}
                    <div className="shrink-0 border-b border-[var(--border)] bg-[var(--surface-alt)]">
                      <div className="h-0.5 w-full bg-[var(--accent)]"/>
                      <div className="px-5 py-3 flex items-center justify-between">
                        <div>
                          <p className="text-xs font-semibold text-[var(--text-primary)]">Offertuppgifter</p>
                          {form.templateId && (
                            <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                              {templates.find((t) => t.id === form.templateId)?.name ?? ''}
                            </p>
                          )}
                        </div>
                        {!editingOfferId && (
                          <button type="button" onClick={() => setWizardStep(1)}
                            className="flex items-center gap-1 text-[11px] text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors bg-[var(--surface)] border border-[var(--border)] rounded-lg px-2.5 py-1.5">
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
                            </svg>
                            Byt mall
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Scrollable body */}
                    <div className="flex-1 overflow-y-auto">
                    <div className="p-4 space-y-3">

                    {/* Error */}
                    {error && (
                      <div className="rounded-xl border border-red-200 dark:border-red-800/40 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-400 flex items-center justify-between gap-3">
                        <span>{error}</span>
                        <button onClick={() => setError(null)} className="shrink-0 opacity-60 hover:opacity-100">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                          </svg>
                        </button>
                      </div>
                    )}

                    {/* ── CARD 1: Mottagare ── */}
                    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-visible">
                      <div className="flex items-center gap-2 px-4 pt-3.5 pb-3">
                        <div className="w-0.5 h-3.5 rounded-full bg-[var(--accent)] shrink-0"/>
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">Mottagare</span>
                      </div>
                      <div className="px-4 pb-4 space-y-3">
                        {/* Contact autofill */}
                        <div className="relative">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none z-10">
                            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                          </svg>
                          <input
                            value={form.contactId
                              ? (contactResults.find((c) => c.id === form.contactId)?.name ?? (contactSearch || 'Kontakt vald ✓'))
                              : contactSearch}
                            onChange={(e) => { if (form.contactId) setForm((f) => ({ ...f, contactId: '' })); searchContacts(e.target.value); }}
                            placeholder="Sök kontakt för autofyll…"
                            className="w-full pl-9 pr-9 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface-alt)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/15 transition-all"
                          />
                          {(contactSearch || form.contactId) && (
                            <button type="button" onClick={() => { setForm((f) => ({ ...f, contactId: '' })); setContactSearch(''); setContactResults([]); }}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors z-10">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                              </svg>
                            </button>
                          )}
                          {contactSearch && !form.contactId && (
                            <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-lg overflow-hidden">
                              {contactLoading ? (
                                <div className="flex items-center gap-2 px-4 py-3 text-sm text-[var(--text-muted)]">
                                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin shrink-0">
                                    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                                  </svg>
                                  Söker…
                                </div>
                              ) : contactResults.length === 0 ? (
                                <div className="px-4 py-3 text-sm text-[var(--text-muted)]">Inga kontakter hittades</div>
                              ) : (
                                contactResults.map((c) => (
                                  <button key={c.id} type="button" onClick={() => pickContact(c)}
                                    className="w-full text-left px-4 py-2.5 hover:bg-[var(--surface-active)] transition-colors flex items-center gap-3 border-b border-[var(--border)] last:border-0">
                                    <div className="w-7 h-7 rounded-full bg-[var(--accent)]/15 flex items-center justify-center text-[var(--accent)] text-xs font-semibold shrink-0">
                                      {(c.name ?? '?').charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium text-[var(--text-primary)] truncate">{c.name ?? '—'}</p>
                                      <p className="text-xs text-[var(--text-muted)] truncate">{[c.email, c.company].filter(Boolean).join(' · ')}</p>
                                    </div>
                                  </button>
                                ))
                              )}
                            </div>
                          )}
                        </div>
                        {form.contactId && (
                          <p className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12"/>
                            </svg>
                            Fält ifyllda från kontakt
                          </p>
                        )}
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[11px] font-medium text-[var(--text-secondary)] mb-1">Namn *</label>
                            <input value={form.recipientName}
                              onChange={(e) => { setForm((f) => ({ ...f, recipientName: e.target.value })); setFieldErrors((fe) => ({ ...fe, recipientName: '' })); }}
                              onBlur={(e) => { const v = e.target.value.trim(); if (!v) setFieldErrors((fe) => ({ ...fe, recipientName: 'Obligatoriskt' })); else if (v.length < 2) setFieldErrors((fe) => ({ ...fe, recipientName: 'Minst 2 tecken' })); }}
                              placeholder="Anna Lindström"
                              className={`w-full rounded-lg border px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/15 transition-all bg-[var(--surface-alt)] ${fieldErrors.recipientName ? 'border-red-400' : 'border-[var(--border)] focus:border-[var(--accent)]'}`}/>
                            {fieldErrors.recipientName && <p className="text-[11px] text-red-500 mt-0.5">{fieldErrors.recipientName}</p>}
                          </div>
                          <div>
                            <label className="block text-[11px] font-medium text-[var(--text-secondary)] mb-1">E-post *</label>
                            <input type="email" value={form.recipientEmail}
                              onChange={(e) => { setForm((f) => ({ ...f, recipientEmail: e.target.value })); setFieldErrors((fe) => ({ ...fe, recipientEmail: '' })); }}
                              onBlur={(e) => { const v = e.target.value.trim(); if (!v) setFieldErrors((fe) => ({ ...fe, recipientEmail: 'Obligatoriskt' })); else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) setFieldErrors((fe) => ({ ...fe, recipientEmail: 'Ogiltig e-postadress' })); }}
                              placeholder="anna@example.com"
                              className={`w-full rounded-lg border px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/15 transition-all bg-[var(--surface-alt)] ${fieldErrors.recipientEmail ? 'border-red-400' : 'border-[var(--border)] focus:border-[var(--accent)]'}`}/>
                            {fieldErrors.recipientEmail && <p className="text-[11px] text-red-500 mt-0.5">{fieldErrors.recipientEmail}</p>}
                          </div>
                        </div>
                        <div>
                          <label className="block text-[11px] font-medium text-[var(--text-secondary)] mb-1">Företag</label>
                          <input value={form.recipientCompany} onChange={(e) => setForm((f) => ({ ...f, recipientCompany: e.target.value }))} placeholder="Lindström AB"
                            className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-alt)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/15 transition-all"/>
                        </div>
                      </div>
                    </div>

                    {/* ── CARD 2: Offertdetaljer ── */}
                    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
                      <div className="flex items-center gap-2 px-4 pt-3.5 pb-3">
                        <div className="w-0.5 h-3.5 rounded-full bg-[var(--accent)] shrink-0"/>
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">Offertdetaljer</span>
                      </div>
                      <div className="px-4 pb-4 space-y-3">
                        <div>
                          <label className="block text-[11px] font-medium text-[var(--text-secondary)] mb-1">Rubrik *</label>
                          <input value={form.title}
                            onChange={(e) => { setForm((f) => ({ ...f, title: e.target.value })); setFieldErrors((fe) => ({ ...fe, title: '' })); }}
                            onBlur={(e) => { const v = e.target.value.trim(); if (!v) setFieldErrors((fe) => ({ ...fe, title: 'Obligatoriskt' })); else if (v.length < 2) setFieldErrors((fe) => ({ ...fe, title: 'Minst 2 tecken' })); }}
                            placeholder="t.ex. Hotellprojekt Q2 2026"
                            className={`w-full rounded-lg border px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/15 transition-all bg-[var(--surface-alt)] ${fieldErrors.title ? 'border-red-400' : 'border-[var(--border)] focus:border-[var(--accent)]'}`}/>
                          {fieldErrors.title && <p className="text-[11px] text-red-500 mt-0.5">{fieldErrors.title}</p>}
                        </div>
                        <div>
                          <label className="block text-[11px] font-medium text-[var(--text-secondary)] mb-1.5">Giltighetstid</label>
                          <div className="flex gap-1.5 flex-wrap">
                            {VALIDITY_OPTIONS.map(({ days, label }) => (
                              <button key={days} type="button" onClick={() => setForm((f) => ({ ...f, validityDays: days }))}
                                className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
                                  form.validityDays === days
                                    ? 'border-[var(--accent)] bg-[var(--accent)] text-white shadow-sm'
                                    : 'border-[var(--border)] bg-[var(--surface-alt)] text-[var(--text-secondary)] hover:border-[var(--accent)]/50'
                                }`}>
                                {label}
                              </button>
                            ))}
                          </div>
                          <p className="mt-1 text-[11px] text-[var(--text-muted)]">Räknas från skickad-datum</p>
                        </div>
                        <details className="rounded-lg border border-[var(--border)] overflow-hidden group">
                          <summary className="px-3 py-2.5 text-[11px] font-medium text-[var(--text-secondary)] cursor-pointer bg-[var(--surface-alt)] list-none flex items-center justify-between hover:bg-[var(--surface-active)] transition-colors select-none">
                            <span>Anteckningar{form.notes ? ' · ifyllt' : ' (frivilligt)'}</span>
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                              className="transition-transform group-open:rotate-180">
                              <polyline points="6 9 12 15 18 9"/>
                            </svg>
                          </summary>
                          <div className="p-3 border-t border-[var(--border)]">
                            <textarea value={form.notes} rows={2} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} placeholder="Eventuella villkor eller kommentarer…"
                              className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-alt)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/15 transition-all resize-none"/>
                          </div>
                        </details>
                      </div>
                    </div>

                    {/* ── CARD 3: Offert-rader ── */}
                    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-visible">
                      <div className="flex items-center justify-between px-4 pt-3.5 pb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-0.5 h-3.5 rounded-full bg-[var(--accent)] shrink-0"/>
                          <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">Offert-rader</span>
                          {fieldErrors.lineItems && <span className="text-xs text-red-500">{fieldErrors.lineItems}</span>}
                        </div>
                      </div>
                      <div className="divide-y divide-[var(--border)]">
                        {form.lineItems.map((item, idx) => {
                          const disc = 1 - (item.discount / 100);
                          const lineExVat = item.quantity * item.unitPrice * disc;
                          return (
                            <div key={idx} className="px-3 py-3 space-y-2.5 group/row">
                              {/* Description + row# + delete */}
                              <div className="flex items-center gap-2">
                                <span className="shrink-0 w-5 h-5 rounded-md bg-[var(--surface-alt)] text-[var(--text-muted)] text-[10px] font-semibold flex items-center justify-center tabular-nums select-none">
                                  {idx + 1}
                                </span>
                                <div className="flex-1 relative">
                                  <input value={item.description} onChange={(e) => updateLine(idx, 'description', e.target.value)} placeholder="Tjänst eller produkt"
                                    className={`w-full rounded-lg border bg-[var(--surface-alt)] px-3 py-1.5 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/15 transition-all pr-8 ${fieldErrors[`line_${idx}_description`] ? 'border-red-400' : 'border-[var(--border)] focus:border-[var(--accent)]'}`}/>
                                  {fieldErrors[`line_${idx}_description`] && (
                                    <p className="text-[10px] text-red-500 mt-0.5">{fieldErrors[`line_${idx}_description`]}</p>
                                  )}
                                  {services.length > 0 && (
                                    <button type="button" onClick={() => { setProductPickerRow(productPickerRow === idx ? null : idx); setProductSearch(''); }}
                                      title="Välj från produktbibliotek"
                                      className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors">
                                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>
                                      </svg>
                                    </button>
                                  )}
                                </div>
                                <button type="button" onClick={() => removeLine(idx)}
                                  className={cn(
                                    'shrink-0 rounded-lg p-1.5 text-[var(--text-muted)] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all',
                                    form.lineItems.length > 1 ? 'opacity-0 group-hover/row:opacity-100' : 'invisible',
                                  )}>
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
                                  </svg>
                                </button>
                              </div>
                              {/* Product picker dropdown */}
                              {productPickerRow === idx && (
                                <div className="relative z-50">
                                  <div className="absolute top-0 left-0 right-0 bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-lg overflow-hidden">
                                    <div className="p-2 border-b border-[var(--border)]">
                                      <input autoFocus value={productSearch} onChange={(e) => setProductSearch(e.target.value)}
                                        placeholder="Sök produkt…"
                                        className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-alt)] px-2 py-1.5 text-xs focus:outline-none focus:border-[var(--accent)] transition-colors"/>
                                    </div>
                                    <div className="max-h-40 overflow-y-auto">
                                      {filteredServices.length === 0 ? (
                                        <div className="px-3 py-2 text-xs text-[var(--text-muted)]">Inga produkter hittades</div>
                                      ) : filteredServices.map((p) => (
                                        <button key={p.id} type="button" onClick={() => pickProduct(idx, p)}
                                          className="w-full text-left px-3 py-2 hover:bg-[var(--surface-active)] transition-colors border-b border-[var(--border)] last:border-0 text-xs">
                                          <p className="font-medium text-[var(--text-primary)]">{p.name}{p.unit ? ` / ${p.unit}` : ''}</p>
                                          <p className="text-[var(--text-muted)]">{fmtSEK(p.unitPrice)} · moms {Math.round(p.vatRate * 100)}%</p>
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              )}
                              {/* Antal × Á-pris = Summa */}
                              <div className="flex items-end gap-1.5">
                                <div className="w-16 shrink-0">
                                  <label className="block text-[10px] text-[var(--text-muted)] mb-1">Antal</label>
                                  <input type="number" min={0} step={0.1} value={item.quantity} onChange={(e) => updateLine(idx, 'quantity', parseFloat(e.target.value) || 0)}
                                    onFocus={(e) => { try { const l = e.target.value.length; e.target.setSelectionRange(l, l); } catch {} }}
                                    className={`w-full rounded-lg border bg-[var(--surface-alt)] px-2 py-1.5 text-xs text-center text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/15 transition-all [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none ${fieldErrors[`line_${idx}_quantity`] ? 'border-red-400' : 'border-[var(--border)] focus:border-[var(--accent)]'}`}/>
                                  {fieldErrors[`line_${idx}_quantity`] && (
                                    <p className="text-[10px] text-red-500 mt-0.5 text-center">{fieldErrors[`line_${idx}_quantity`]}</p>
                                  )}
                                </div>
                                <span className="pb-2 text-[var(--text-muted)] text-xs shrink-0 select-none">×</span>
                                <div className="flex-1 min-w-0">
                                  <label className="block text-[10px] text-[var(--text-muted)] mb-1">Á-pris (SEK)</label>
                                  <input type="number" min={0} value={item.unitPrice} onChange={(e) => updateLine(idx, 'unitPrice', parseFloat(e.target.value) || 0)}
                                    onFocus={(e) => { try { const l = e.target.value.length; e.target.setSelectionRange(l, l); } catch {} }}
                                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-alt)] px-2 py-1.5 text-xs text-right text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/15 transition-all [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"/>
                                </div>
                                <span className="pb-2 text-[var(--text-muted)] text-xs shrink-0 select-none">=</span>
                                <div className="shrink-0 text-right min-w-[72px] pb-1.5">
                                  <p className="text-[10px] text-[var(--text-muted)] mb-1">Summa</p>
                                  <p className="text-sm font-semibold text-[var(--text-primary)] tabular-nums">{fmtSEK(lineExVat)}</p>
                                </div>
                              </div>
                              {/* Moms pills + discount */}
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-[10px] text-[var(--text-muted)] shrink-0">Moms:</span>
                                <div className="flex gap-1">
                                  {([0, 0.06, 0.12, 0.25] as const).map((rate) => (
                                    <button key={rate} type="button" onClick={() => updateLine(idx, 'vatRate', rate)}
                                      className={`rounded-md px-2 py-0.5 text-[10px] font-medium transition-all ${
                                        item.vatRate === rate
                                          ? 'bg-[var(--accent)] text-white shadow-sm'
                                          : 'bg-[var(--surface-alt)] text-[var(--text-secondary)] border border-[var(--border)] hover:border-[var(--accent)]/50'
                                      }`}>
                                      {Math.round(rate * 100)}%
                                    </button>
                                  ))}
                                </div>
                                <div className="ml-auto flex items-center gap-1 shrink-0">
                                  <span className="text-[10px] text-[var(--text-muted)]">Rabatt:</span>
                                  <input type="number" min={0} max={100} value={item.discount} onChange={(e) => updateLine(idx, 'discount', parseFloat(e.target.value) || 0)}
                                    onFocus={(e) => { try { const l = e.target.value.length; e.target.setSelectionRange(l, l); } catch {} }}
                                    className="w-10 rounded-md border border-[var(--border)] bg-[var(--surface-alt)] px-1.5 py-0.5 text-[10px] text-center text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] transition-colors [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"/>
                                  <span className="text-[10px] text-[var(--text-muted)]">%</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      {/* Add row */}
                      <div className="border-t border-[var(--border)] p-2">
                        <button type="button" onClick={addLine}
                          className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg border border-dashed border-[var(--border)] text-xs text-[var(--text-muted)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                          </svg>
                          Lägg till rad
                        </button>
                      </div>
                    </div>

                    {/* ── CARD 4: Produktbibliotek ── */}
                    <div className="rounded-xl border border-[var(--border)] overflow-hidden">
                      <button type="button" onClick={() => setShowServiceLibrary((v) => !v)}
                        className="w-full flex items-center justify-between px-4 py-3 text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-active)] transition-colors bg-[var(--surface-alt)]">
                        <span className="flex items-center gap-2">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>
                          </svg>
                          Produktbibliotek{services.length > 0 ? ` (${services.length})` : ''}
                        </span>
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                          className={`transition-transform ${showServiceLibrary ? 'rotate-180' : ''}`}>
                          <polyline points="6 9 12 15 18 9"/>
                        </svg>
                      </button>
                      {showServiceLibrary && (
                        <div className="p-4 space-y-4 border-t border-[var(--border)]">
                          <div>
                            <p className="text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">Lägg till tjänst</p>
                            <div className="grid gap-2 grid-cols-2">
                              <div className="col-span-2">
                                <input value={serviceForm.name} onChange={(e) => setServiceForm((f) => ({ ...f, name: e.target.value }))}
                                  placeholder="Tjänst- / produktnamn *"
                                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-alt)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/15 transition-all"/>
                              </div>
                              <div>
                                <input type="number" min={0} value={serviceForm.unitPrice} onChange={(e) => setServiceForm((f) => ({ ...f, unitPrice: parseFloat(e.target.value) || 0 }))}
                                  placeholder="Á-pris (SEK)"
                                  onFocus={(e) => { try { const l = e.target.value.length; e.target.setSelectionRange(l, l); } catch {} }}
                                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-alt)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/15 transition-all [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"/>
                              </div>
                              <div>
                                <select value={serviceForm.vatRate} onChange={(e) => setServiceForm((f) => ({ ...f, vatRate: parseFloat(e.target.value) }))}
                                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-alt)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] transition-colors">
                                  <option value={0}>0% moms</option><option value={0.06}>6% moms</option>
                                  <option value={0.12}>12% moms</option><option value={0.25}>25% moms</option>
                                </select>
                              </div>
                              <div>
                                <input value={serviceForm.unit} onChange={(e) => setServiceForm((f) => ({ ...f, unit: e.target.value }))}
                                  placeholder="Enhet (tim, st…)"
                                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-alt)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] transition-colors"/>
                              </div>
                              <div>
                                <button onClick={() => void saveService()} disabled={!serviceForm.name.trim() || savingService}
                                  className="w-full rounded-lg bg-[var(--accent)] px-3 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50 transition-opacity">
                                  {savingService ? '…' : 'Spara'}
                                </button>
                              </div>
                            </div>
                          </div>
                          {services.length > 0 && (
                            <div className="rounded-lg border border-[var(--border)] overflow-hidden">
                              {services.map((p, i) => (
                                <div key={p.id} className={cn('flex items-center gap-3 px-3 py-2.5', i > 0 && 'border-t border-[var(--border)]')}>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium text-[var(--text-primary)] truncate">{p.name}{p.unit ? ` / ${p.unit}` : ''}</p>
                                  </div>
                                  <p className="text-xs font-semibold text-[var(--text-primary)] shrink-0">{fmtSEK(p.unitPrice)}</p>
                                  <p className="text-[10px] text-[var(--text-muted)] shrink-0">{Math.round(p.vatRate * 100)}% moms</p>
                                  <button onClick={() => void removeService(p.id)} className="text-[var(--text-muted)] hover:text-red-500 transition-colors shrink-0">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
                                    </svg>
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                          {services.length === 0 && (
                            <p className="text-xs text-[var(--text-muted)]">Inga tjänster ännu. Lägg till ovan.</p>
                          )}
                        </div>
                      )}
                    </div>

                    </div>
                    </div>

                    {/* ── Sticky footer: totals + actions ── */}
                    <div className="shrink-0 border-t border-[var(--border)] bg-[var(--surface-alt)]">
                      {/* Totals summary */}
                      <div className="px-5 py-2.5 space-y-1 border-b border-[var(--border)]/60">
                        <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
                          <span>Summa ex. moms</span>
                          <span className="tabular-nums font-medium">{fmtSEK(tots.exVat)}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
                          <span>Moms</span>
                          <span className="tabular-nums">{fmtSEK(tots.vat)}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm font-semibold text-[var(--text-primary)] pt-1 border-t border-[var(--border)]">
                          <span>Totalt inkl. moms</span>
                          <span className="tabular-nums text-[var(--accent)]">{fmtSEK(tots.incVat)}</span>
                        </div>
                      </div>
                      {/* Action buttons */}
                      <div className="px-4 py-3 flex items-center gap-2">
                        <button onClick={() => { saveAndSendRef.current = true; void createOffer(); }} disabled={saving}
                          className="flex-1 rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center justify-center gap-2">
                          {saving && saveAndSendRef.current ? (
                            <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>Sparar…</>
                          ) : (
                            <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>{editingOfferId ? 'Uppdatera & skicka' : 'Spara & skicka'}</>
                          )}
                        </button>
                        <button onClick={() => void createOffer()} disabled={saving}
                          className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm text-[var(--text-secondary)] hover:bg-[var(--surface-active)] disabled:opacity-50 transition-colors whitespace-nowrap">
                          {saving && !saveAndSendRef.current ? '…' : (editingOfferId ? 'Spara' : 'Utkast')}
                        </button>
                        <button onClick={closeWizard}
                          className="shrink-0 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-2.5 text-[var(--text-muted)] hover:bg-[var(--surface-active)] transition-colors" title="Avbryt">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                          </svg>
                        </button>
                      </div>
                    </div>
                  </>
                )}



              </div>
            </div>
          </motion.div>
        </>
      )}
      </AnimatePresence>

      {/* Floating bulk action bar */}
      {selected.size > 0 && (
        <div className="mb-4 flex items-center gap-3 rounded-xl border border-[var(--accent)]/30 bg-[var(--surface)] px-4 py-3 shadow-md">
          <span className="text-sm font-medium text-[var(--text-primary)]">
            {selected.size} vald{selected.size !== 1 ? 'a' : ''}
            {selectedDraftCount > 0 && selectedDraftCount < selected.size && ` · ${selectedDraftCount} utkast`}
          </span>
          <div className="flex-1"/>
          {selectedDraftCount > 0 && (
            <button
              onClick={() => void doBulkSend()}
              disabled={bulkSending}
              className="flex items-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {bulkSending ? (
                <>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                  </svg>
                  Skickar…
                </>
              ) : (
                `Skicka ${selectedDraftCount} offert${selectedDraftCount !== 1 ? 'er' : ''}`
              )}
            </button>
          )}
          <button
            onClick={() => setSelected(new Set())}
            className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          >
            Rensa urval
          </button>
        </div>
      )}

      {/* Status tabs + filters */}
      <div className="flex flex-col gap-3 mb-4">
        {/* Row 1: pipeline pills */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {STATUS_TABS.map((t) => {
            const count = t.id === 'all' ? allOffers.length : allOffers.filter((o) => o.status === t.id).length;
            const isActive = tab === t.id;
            return (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all shrink-0',
                  isActive
                    ? 'bg-[var(--accent)] text-white shadow-sm'
                    : 'bg-[var(--surface-alt)] text-[var(--text-secondary)] hover:bg-[var(--surface-active)] border border-[var(--border)]',
                )}>
                {t.label}
                {count > 0 && (
                  <span className={cn(
                    'text-xs tabular-nums px-1.5 py-0.5 rounded-full leading-none',
                    isActive ? 'bg-white/25 text-white' : 'bg-[var(--surface)] text-[var(--text-muted)]',
                  )}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        {/* Row 2: search + date range */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Sök offert…"
              className="pl-8 pr-4 py-1.5 rounded border border-[var(--border)] bg-[var(--surface)] text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] transition-colors w-44"/>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-[var(--text-muted)] shrink-0">Från</span>
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
              className="py-1.5 px-2 rounded border border-[var(--border)] bg-[var(--surface)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] transition-colors"/>
            <span className="text-[11px] text-[var(--text-muted)] shrink-0">Till</span>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
              className="py-1.5 px-2 rounded border border-[var(--border)] bg-[var(--surface)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] transition-colors"/>
            {(dateFrom || dateTo) && (
              <button onClick={() => { setDateFrom(''); setDateTo(''); }}
                className="text-[11px] text-[var(--text-muted)] hover:text-red-500 transition-colors px-1">
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Offers table */}
      {loading ? (
        <div className="flex items-center justify-center py-20 gap-3">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin text-[var(--text-muted)]">
            <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
          </svg>
          <p className="text-sm text-[var(--text-muted)]">Laddar offerter…</p>
        </div>
      ) : (
        <>
        {/* Mobile cards */}
        <div className="sm:hidden space-y-3">
          {offers.length === 0 && (
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-12 text-center">
              <p className="text-sm font-medium text-[var(--text-primary)] mb-1">Inga offerter</p>
              <p className="text-xs text-[var(--text-muted)]">Klicka på &ldquo;Ny offert&rdquo; för att komma igång.</p>
            </div>
          )}
          {offers.map((offer) => (
            <div key={offer.id} className={cn('rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4', offer.status === 'expired' && 'bg-amber-50/40 dark:bg-amber-900/10')}>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="min-w-0">
                  <p className="font-semibold text-sm text-[var(--text-primary)] truncate">{offer.title}</p>
                  <p className="text-[11px] text-[var(--text-muted)] font-mono">{fmtOfferNumber(offer)}</p>
                </div>
                <span className={cn('shrink-0 text-[10px] px-2.5 py-1 rounded-full font-semibold', STATUS_STYLES[offer.status])}>
                  {STATUS_LABEL[offer.status]}
                </span>
              </div>
              <div className="flex items-end justify-between gap-3">
                <div>
                  <p className="text-sm text-[var(--text-secondary)]">{offer.recipientName}</p>
                  <p className="text-xs text-[var(--text-muted)]">{offer.recipientCompany ?? offer.recipientEmail}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-[var(--text-primary)]">{fmtSEK(offer.totalIncVat)}</p>
                  <p className="text-[11px] text-[var(--text-muted)]">ex. {fmtSEK(offer.totalExVat)}</p>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-[var(--border)] flex items-center justify-between gap-2">
                <p className="text-[11px] text-[var(--text-muted)]">Giltig t.o.m. {fmtDate(offer.validUntil)}</p>
                <div className="flex items-center gap-2">
                  {offer.status === 'draft' && (
                    <button type="button" onClick={() => openEdit(offer)} title="Redigera" className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                  )}
                  {offer.status === 'draft' && (
                    <button type="button" onClick={() => setConfirmSend(offer)} disabled={acting === offer.id} title="Skicka" className="text-[var(--text-muted)] hover:text-blue-500 transition-colors disabled:opacity-40">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                    </button>
                  )}
                  {(offer.status === 'sent' || offer.status === 'viewed') && canRemind(offer) && (
                    <button type="button" onClick={() => void doAction(offer.id, 'remind')} disabled={acting === offer.id} title="Skicka påminnelse" className="text-[var(--text-muted)] hover:text-amber-500 transition-colors disabled:opacity-40">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                    </button>
                  )}
                  {(offer.status === 'sent' || offer.status === 'viewed') && (
                    <button type="button" onClick={() => void copyLink(offer)} title="Kopiera länk" className="text-[var(--text-muted)] hover:text-violet-500 transition-colors">
                      {copied === offer.id
                        ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                        : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                      }
                    </button>
                  )}
                  <button type="button" onClick={() => void doAction(offer.id, 'duplicate')} disabled={acting === offer.id} title="Duplicera" className="text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors disabled:opacity-40">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                  </button>
                  <button type="button" onClick={() => setConfirmDeleteOffer(offer.id)} title="Ta bort" className="text-[var(--text-muted)] hover:text-red-500 transition-colors">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop table */}
        <div className="hidden sm:block rounded border border-[var(--border)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b-2 border-[var(--border)] bg-[var(--surface-alt)]">
                  <th className="px-3 py-2.5 w-8">
                    {draftOffers.length > 0 && (
                      <input type="checkbox" checked={allDraftsSelected} onChange={toggleSelectAllDrafts}
                        title="Välj alla utkast" className="rounded border-[var(--border)] accent-[var(--accent)] cursor-pointer"/>
                    )}
                  </th>
                  <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">Rubrik</th>
                  <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">Mottagare</th>
                  <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">Status</th>
                  <th className="px-3 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">Belopp</th>
                  <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">Giltigt t.o.m.</th>
                  <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                    <button onClick={() => setSortAsc((v) => !v)} className="flex items-center gap-1 hover:text-[var(--text-primary)] transition-colors">
                      Skapad
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        {sortAsc
                          ? <><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></>
                          : <><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></>
                        }
                      </svg>
                    </button>
                  </th>
                  <th className="px-3 py-2.5 w-24"></th>
                </tr>
              </thead>
              <tbody>
                {offers.map((offer, i) => (
                  <tr key={offer.id} className={cn('group hover:bg-[var(--surface-alt)] transition-colors', i > 0 && 'border-t border-[var(--border)]', offer.status === 'expired' && 'bg-amber-50/40 dark:bg-amber-900/10')}>
                    {/* Checkbox */}
                    <td className="px-3 py-3 w-8">
                      {offer.status === 'draft' && (
                        <input type="checkbox" checked={selected.has(offer.id)} onChange={() => toggleSelect(offer.id)}
                          className="rounded border-[var(--border)] accent-[var(--accent)] cursor-pointer"/>
                      )}
                    </td>

                    {/* Title */}
                    <td className="px-3 py-3 max-w-[220px]">
                      <p className="text-xs font-semibold text-[var(--text-primary)] truncate leading-tight">{offer.title}</p>
                      <p className="text-[10px] text-[var(--text-muted)] font-mono leading-tight mt-0.5">{fmtOfferNumber(offer)}</p>
                    </td>

                    {/* Recipient */}
                    <td className="px-3 py-3 max-w-[180px]">
                      <p className="text-xs font-medium text-[var(--text-primary)] truncate leading-tight">{offer.recipientName}</p>
                      <p className="text-[10px] text-[var(--text-muted)] truncate leading-tight">{offer.recipientCompany ?? offer.recipientEmail}</p>
                    </td>

                    {/* Status pill + quick-send for drafts */}
                    <td className="px-3 py-3">
                      <div className="flex flex-col gap-1.5">
                        <span className={cn('inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold w-fit', STATUS_STYLES[offer.status])}>
                          {STATUS_LABEL[offer.status]}
                        </span>
                        {offer.status === 'draft' && (
                          <button type="button" onClick={() => setConfirmSend(offer)} disabled={acting === offer.id}
                            className="text-[10px] font-medium text-[var(--accent)] hover:underline transition-colors text-left disabled:opacity-40 flex items-center gap-0.5">
                            Skicka
                            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                            </svg>
                          </button>
                        )}
                      </div>
                    </td>

                    {/* Amount */}
                    <td className="px-3 py-3 text-right tabular-nums whitespace-nowrap">
                      <p className="text-xs font-semibold text-[var(--text-primary)]">{fmtSEK(offer.totalIncVat)}</p>
                      <p className="text-[10px] text-[var(--text-muted)]">ex. {fmtSEK(offer.totalExVat)}</p>
                    </td>

                    {/* Valid until */}
                    <td className="px-3 py-3 whitespace-nowrap">
                      {offer.status === 'expired' ? (
                        <span className="inline-flex items-center gap-1 text-xs text-red-600 dark:text-red-400 font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                          Utgången {fmtDate(offer.validUntil)}
                        </span>
                      ) : (
                        <p className="text-xs leading-tight text-[var(--text-secondary)]">
                          {fmtDate(offer.validUntil) ?? '—'}
                        </p>
                      )}
                    </td>

                    {/* Created */}
                    <td className="px-3 py-3 whitespace-nowrap">
                      <p className="text-xs text-[var(--text-secondary)] leading-tight">{fmtDate(offer.createdAt)}</p>
                    </td>

                    {/* Actions — appear on hover */}
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity duration-100">
                        {/* PDF / preview — show for all sent/viewed/accepted; fetch doc on-demand */}
                        {(offer.status === 'sent' || offer.status === 'viewed' || offer.status === 'accepted') && (
                          <>
                            <button type="button"
                              onClick={() => void fetchAndPreviewDoc(offer.id)}
                              disabled={fetchingDocId === offer.id}
                              title="Förhandsgranska dokument"
                              className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors disabled:opacity-40">
                              {fetchingDocId === offer.id ? (
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin">
                                  <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                                </svg>
                              ) : (
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                                </svg>
                              )}
                            </button>
                            <button type="button" onClick={() => window.open(`/api/offers/${offer.id}/pdf`, '_blank')}
                              title="Öppna PDF"
                              className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
                              </svg>
                            </button>
                          </>
                        )}
                        {/* Copy link */}
                        {(offer.status === 'sent' || offer.status === 'viewed') && (
                          <button type="button" onClick={() => void copyLink(offer)} title="Kopiera signeringslänk"
                            className="text-[var(--text-muted)] hover:text-violet-500 transition-colors">
                            {copied === offer.id
                              ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                              : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                            }
                          </button>
                        )}
                        {/* Edit draft */}
                        {offer.status === 'draft' && (
                          <button type="button" onClick={() => openEdit(offer)}
                            title="Redigera utkast" className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                            </svg>
                          </button>
                        )}
                        {/* Send */}
                        {offer.status === 'draft' && (
                          <button type="button" onClick={() => setConfirmSend(offer)} disabled={acting === offer.id}
                            title="Skicka offert" className="text-[var(--text-muted)] hover:text-blue-500 transition-colors disabled:opacity-40">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                            </svg>
                          </button>
                        )}
                        {/* Remind */}
                        {(offer.status === 'sent' || offer.status === 'viewed') && canRemind(offer) && (
                          <button type="button" onClick={() => void doAction(offer.id, 'remind')} disabled={acting === offer.id}
                            title="Skicka påminnelse" className="text-[var(--text-muted)] hover:text-amber-500 transition-colors disabled:opacity-40">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                            </svg>
                          </button>
                        )}
                        {/* Accept */}
                        {(offer.status === 'sent' || offer.status === 'viewed') && (
                          <button type="button" onClick={() => void doAction(offer.id, 'accept')} disabled={acting === offer.id}
                            title="Markera som accepterad" className="text-[var(--text-muted)] hover:text-emerald-500 transition-colors disabled:opacity-40">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12"/>
                            </svg>
                          </button>
                        )}
                        {/* Duplicate */}
                        <button type="button" onClick={() => void doAction(offer.id, 'duplicate')} disabled={acting === offer.id}
                          title="Duplicera" className="text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors disabled:opacity-40">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                          </svg>
                        </button>
                        {/* Delete */}
                        <button type="button" onClick={() => setConfirmDeleteOffer(offer.id)}
                          title="Ta bort" className="text-[var(--text-muted)] hover:text-red-500 transition-colors">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {offers.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-16 text-center">
                      <p className="text-sm font-medium text-[var(--text-primary)] mb-1">Inga offerter</p>
                      <p className="text-xs text-[var(--text-muted)]">Klicka på &ldquo;Ny offert&rdquo; för att komma igång.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {/* Pagination footer */}
          <div className="flex items-center justify-between px-4 py-2.5 border-t border-[var(--border)] bg-[var(--surface-alt)]">
            <span className="text-[11px] text-[var(--text-muted)]">
              {totalFiltered === 0 ? 'Inga resultat' : `Visar ${currentPage * PAGE_SIZE + 1}–${Math.min((currentPage + 1) * PAGE_SIZE, totalFiltered)} av ${totalFiltered}`}
              {total !== totalFiltered && ` (filtrerat från ${total})`}
            </span>
            {totalPages > 1 && (
              <div className="flex items-center gap-1">
                <button onClick={() => setCurrentPage((p) => Math.max(0, p - 1))} disabled={currentPage === 0}
                  className="px-2 py-1 rounded border border-[var(--border)] bg-[var(--surface)] text-[11px] text-[var(--text-secondary)] hover:bg-[var(--surface-alt)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                  ‹
                </button>
                {Array.from({ length: totalPages }, (_, i) => i).filter((i) => Math.abs(i - currentPage) <= 2 || i === 0 || i === totalPages - 1).map((i, idx, arr) => (
                  <span key={i}>
                    {idx > 0 && arr[idx - 1] !== i - 1 && <span className="text-[11px] text-[var(--text-muted)] px-0.5">…</span>}
                    <button onClick={() => setCurrentPage(i)}
                      className={cn('w-6 h-6 rounded text-[11px] font-medium transition-colors', i === currentPage ? 'bg-[var(--accent)] text-white' : 'text-[var(--text-secondary)] hover:bg-[var(--surface-alt)] border border-[var(--border)]')}>
                      {i + 1}
                    </button>
                  </span>
                ))}
                <button onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))} disabled={currentPage >= totalPages - 1}
                  className="px-2 py-1 rounded border border-[var(--border)] bg-[var(--surface)] text-[11px] text-[var(--text-secondary)] hover:bg-[var(--surface-alt)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                  ›
                </button>
              </div>
            )}
          </div>
        </div>
        </>
      )}

      {/* Draft saved toast */}
      {draftSaved && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 rounded-xl bg-[var(--surface-0)] border border-[var(--border)] shadow-lg px-4 py-3 text-sm text-[var(--text-primary)] animate-in fade-in slide-in-from-bottom-2 duration-200">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500 shrink-0">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
          Offert sparad som utkast — hittas under fliken{' '}
          <button type="button" onClick={() => { setTab('draft'); setDraftSaved(false); }}
            className="font-semibold underline hover:no-underline text-[var(--accent)]">
            Utkast
          </button>
        </div>
      )}

      {/* Send confirmation modal */}
      {confirmSend && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setConfirmSend(null)}>
          <div className="relative w-full max-w-sm bg-[var(--surface)] rounded-xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-[var(--border)]">
              <h2 className="text-sm font-semibold text-[var(--text-primary)]">Bekräfta utskick</h2>
            </div>
            <div className="px-6 py-5 space-y-4">
              <p className="text-sm text-[var(--text-secondary)]">
                Offerten skickas via e-post och kan inte redigeras efter utskick.
              </p>
              <div className="rounded-xl bg-[var(--surface-alt)] border border-[var(--border)] p-4 space-y-2 text-sm">
                <div className="flex justify-between gap-4">
                  <span className="text-[var(--text-muted)]">Mottagare</span>
                  <span className="font-medium text-[var(--text-primary)] text-right">{confirmSend.recipientName}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-[var(--text-muted)]">E-post</span>
                  <span className="text-[var(--text-primary)] text-right">{confirmSend.recipientEmail}</span>
                </div>
                {confirmSend.recipientCompany && (
                  <div className="flex justify-between gap-4">
                    <span className="text-[var(--text-muted)]">Företag</span>
                    <span className="text-[var(--text-primary)] text-right">{confirmSend.recipientCompany}</span>
                  </div>
                )}
                <div className="flex justify-between gap-4 pt-2 border-t border-[var(--border)] font-semibold">
                  <span className="text-[var(--text-secondary)]">Totalt inkl. moms</span>
                  <span className="text-[var(--text-primary)]">{fmtSEK(confirmSend.totalIncVat)}</span>
                </div>
              </div>
            </div>
            <div className="px-6 pb-5 flex gap-2">
              <button
                onClick={() => { void doAction(confirmSend.id, 'send'); setConfirmSend(null); }}
                disabled={acting === confirmSend.id}
                className="flex-1 rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                Skicka offert
              </button>
              <button
                onClick={() => setConfirmSend(null)}
                className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--surface-active)] transition-colors"
              >
                Avbryt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Template preview modal */}
      {tplPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setTplPreview(null)}>
          <div className="relative w-full max-w-4xl max-h-[90vh] bg-[var(--surface-0)] rounded-xl shadow-2xl overflow-hidden flex flex-col border border-[var(--border)]"
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--border)] bg-[var(--surface-alt)] shrink-0">
              <span className="text-sm font-semibold text-[var(--text-primary)]">Förhandsvisning av mall</span>
              <button onClick={() => setTplPreview(null)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors p-1">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-auto relative">
              {tplPreview.loading ? (
                <div className="flex items-center justify-center h-64 text-[var(--text-muted)] text-sm">Laddar förhandsvisning…</div>
              ) : (
                <iframe srcDoc={tplPreview.html ?? ''} title="Mallförhandsvisning" className="w-full h-full min-h-[70vh] border-0"/>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete offer confirmation modal */}
      {confirmDeleteOffer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setConfirmDeleteOffer(null)}>
          <div className="relative w-full max-w-sm bg-[var(--surface-0)] rounded-xl shadow-2xl border border-[var(--border)] p-6 flex flex-col gap-4"
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start gap-3">
              <div className="shrink-0 w-9 h-9 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-600 dark:text-red-400">
                  <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-1">Ta bort offert?</h3>
                <p className="text-xs text-[var(--text-secondary)]">Offerten tas bort permanent och kan inte återställas.</p>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => setConfirmDeleteOffer(null)}
                className="px-3 py-1.5 text-xs font-medium rounded-lg border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--surface-active)] transition-colors">
                Avbryt
              </button>
              <button type="button" onClick={() => void deleteOffer(confirmDeleteOffer)}
                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors">
                Ta bort
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Document preview modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setPreviewDoc(null)}>
          <div className="relative w-full max-w-4xl max-h-[90vh] bg-[var(--surface-0)] rounded-xl shadow-2xl overflow-hidden flex flex-col border border-[var(--border)]"
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--border)] bg-[var(--surface-alt)] shrink-0">
              <span className="text-sm font-semibold text-[var(--text-primary)]">Förhandsvisning av offertdokument</span>
              <button onClick={() => setPreviewDoc(null)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors p-1">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-auto">
              <iframe srcDoc={previewDoc} title="Offertdokument" className="w-full h-full min-h-[70vh] border-0"/>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
