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

import { useState, useEffect, useCallback, useRef } from 'react';
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
  generatedDocument?:   string;
  publicToken:          string;
  publicTokenExpiresAt?: string;
}

interface OfferTemplate {
  id:   string;
  name: string;
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

const EMPTY_FORM = {
  templateId: '', contactId: '',
  title: '', recipientName: '', recipientEmail: '', recipientCompany: '',
  notes: '', validUntil: '', lineItems: [{ ...EMPTY_LINE }],
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
  const [offers,     setOffers]     = useState<Offer[]>([]);
  const [total,      setTotal]      = useState(0);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState<string | null>(null);
  const [tab,        setTab]        = useState<OfferStatus | 'all'>('all');
  const [search,     setSearch]     = useState('');
  const [showForm,   setShowForm]   = useState(false);
  const [form,       setForm]       = useState(EMPTY_FORM);
  const [saving,     setSaving]     = useState(false);
  const [acting,     setActing]     = useState<string | null>(null);
  const [templates,   setTemplates]   = useState<OfferTemplate[]>([]);
  const [previewDoc,  setPreviewDoc]  = useState<string | null>(null); // HTML to preview
  const [copied,      setCopied]      = useState<string | null>(null); // offerId copied
  const [confirmSend, setConfirmSend] = useState<Offer | null>(null);  // offer pending send confirmation
  const [selected,       setSelected]       = useState<Set<string>>(new Set()); // bulk-selected offer ids
  const [bulkSending,    setBulkSending]    = useState(false);
  const [bulkResult,     setBulkResult]     = useState<{ sent: number; failed: number } | null>(null);
  const [contactSearch,  setContactSearch]  = useState('');
  const [contactResults, setContactResults] = useState<ContactResult[]>([]);
  const [contactLoading, setContactLoading] = useState(false);
  const contactSearchRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Product library state
  const [products,        setProducts]        = useState<OfferProduct[]>([]);
  const [productPickerRow, setProductPickerRow] = useState<number | null>(null);
  const [productSearch,   setProductSearch]   = useState('');
  const [showProducts,    setShowProducts]    = useState(false);
  const [productForm,     setProductForm]     = useState({ name: '', description: '', unitPrice: 0, vatRate: 0.25, unit: '' });
  const [savingProduct,   setSavingProduct]   = useState(false);

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
  const loadProducts = useCallback(async () => {
    const r = await fetch('/api/offers/products');
    if (r.ok) {
      const j = await r.json() as { data: { products: OfferProduct[] } };
      setProducts(j.data.products);
    }
  }, []);

  useEffect(() => { void loadProducts(); }, [loadProducts]);

  // ── Load offers ───────────────────────────────────────────────────────────────
  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ limit: '50', offset: '0' });
      if (tab !== 'all') params.set('status', tab);
      if (search.trim()) params.set('search', search.trim());
      const res = await fetch(`/api/offers?${params}`);
      if (!res.ok) throw new Error(`Fel ${res.status}`);
      const json = await res.json().catch(() => null) as { data: { offers: Offer[]; total: number } } | null;
      if (!json) throw new Error('Serverfel — försök igen.');
      setOffers(json.data.offers);
      setTotal(json.data.total);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [tab, search]);

  useEffect(() => { void load(); setSelected(new Set()); setBulkResult(null); }, [load]);

  // ── Create offer ──────────────────────────────────────────────────────────────
  const createOffer = useCallback(async () => {
    if (!form.title || !form.recipientName || !form.recipientEmail || !form.validUntil) {
      setError('Fyll i alla obligatoriska fält (titel, mottagare, e-post, giltig till).');
      return;
    }
    const validItems = form.lineItems.filter((i) => i.description.trim() && i.quantity > 0);
    if (validItems.length === 0) {
      setError('Minst en rad måste ha beskrivning och kvantitet.');
      return;
    }
    setSaving(true); setError(null);
    try {
      const body: Record<string, unknown> = {
        title:            form.title,
        recipientName:    form.recipientName,
        recipientEmail:   form.recipientEmail,
        recipientCompany: form.recipientCompany || undefined,
        notes:            form.notes || undefined,
        validUntil:       new Date(form.validUntil).toISOString(),
        lineItems:        validItems,
      };
      if (form.templateId) body.templateId = form.templateId;
      if (form.contactId)  body.customerId  = form.contactId;

      const res = await fetch('/api/offers', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body:   JSON.stringify(body),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({})) as { detail?: string };
        throw new Error(j.detail ?? `Fel ${res.status}`);
      }
      setShowForm(false); setForm(EMPTY_FORM);
      await load(true);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }, [form, load]);

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
    if (!confirm('Ta bort detta offert?')) return;
    try {
      await fetch(`/api/offers/${id}`, { method: 'DELETE' });
      await load(true);
    } catch (e) {
      setError((e as Error).message);
    }
  }, [load]);

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
      const o = offers.find((o) => o.id === id);
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
  }, [selected, offers, load]);

  // ── Selection helpers ─────────────────────────────────────────────────────
  const draftOffers = offers.filter((o) => o.status === 'draft');
  const selectedDraftCount = Array.from(selected).filter((id) => offers.find((o) => o.id === id)?.status === 'draft').length;
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

  const saveProduct = useCallback(async () => {
    if (!productForm.name.trim() || productForm.unitPrice < 0) return;
    setSavingProduct(true);
    try {
      const res = await fetch('/api/offers/products', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name:        productForm.name,
          description: productForm.description || undefined,
          unitPrice:   productForm.unitPrice,
          vatRate:     productForm.vatRate,
          unit:        productForm.unit || undefined,
        }),
      });
      if (!res.ok) throw new Error(`Fel ${res.status}`);
      setProductForm({ name: '', description: '', unitPrice: 0, vatRate: 0.25, unit: '' });
      await loadProducts();
    } catch { /* ignore */ } finally {
      setSavingProduct(false);
    }
  }, [productForm, loadProducts]);

  const removeProduct = useCallback(async (id: string) => {
    if (!confirm('Ta bort produkt?')) return;
    await fetch(`/api/offers/products/${id}`, { method: 'DELETE' });
    await loadProducts();
  }, [loadProducts]);

  const filteredProducts = products.filter((p) =>
    !productSearch.trim() || p.name.toLowerCase().includes(productSearch.toLowerCase())
  );

  // ── Line item helpers ─────────────────────────────────────────────────────────
  function updateLine(idx: number, field: keyof LineItem, value: string | number) {
    setForm((f) => { const items = [...f.lineItems]; items[idx] = { ...items[idx], [field]: value }; return { ...f, lineItems: items }; });
  }
  function addLine() { setForm((f) => ({ ...f, lineItems: [...f.lineItems, { ...EMPTY_LINE }] })); }
  function removeLine(idx: number) { setForm((f) => ({ ...f, lineItems: f.lineItems.filter((_, i) => i !== idx) })); }

  const tots = computeTotals(form.lineItems);

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className="px-8 py-10 max-w-7xl mx-auto">

      {/* Header */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-[var(--text-primary)] mb-1">Offerter</h1>
          <p className="text-sm text-[var(--text-muted)]">Skapa, skicka och följ upp offerter direkt från plattformen.</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setShowProducts((v) => !v)}
            className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] transition-colors"
          >
            Produktbibliotek
          </button>
          <button
            onClick={() => { setShowForm(true); setError(null); }}
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

      {/* Product library panel */}
      {showProducts && (
        <div className="mb-8 rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">Produktbibliotek</h2>
            <button onClick={() => setShowProducts(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
          <div className="p-6 space-y-5">
            {/* Add new product form */}
            <div>
              <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-3">Lägg till produkt</p>
              <div className="grid gap-3 sm:grid-cols-5">
                <div className="sm:col-span-2">
                  <input value={productForm.name} onChange={(e) => setProductForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="Produktnamn *"
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-alt)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] transition-colors"/>
                </div>
                <div>
                  <input type="number" min={0} value={productForm.unitPrice} onChange={(e) => setProductForm((f) => ({ ...f, unitPrice: parseFloat(e.target.value) || 0 }))}
                    placeholder="Á-pris (SEK)"
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-alt)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] transition-colors"/>
                </div>
                <div>
                  <select value={productForm.vatRate} onChange={(e) => setProductForm((f) => ({ ...f, vatRate: parseFloat(e.target.value) }))}
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-alt)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] transition-colors">
                    <option value={0}>0% moms</option><option value={0.06}>6% moms</option>
                    <option value={0.12}>12% moms</option><option value={0.25}>25% moms</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  <input value={productForm.unit} onChange={(e) => setProductForm((f) => ({ ...f, unit: e.target.value }))}
                    placeholder="Enhet (tim, st…)"
                    className="flex-1 min-w-0 rounded-xl border border-[var(--border)] bg-[var(--surface-alt)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] transition-colors"/>
                  <button onClick={() => void saveProduct()} disabled={!productForm.name.trim() || savingProduct}
                    className="shrink-0 rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50 transition-opacity">
                    {savingProduct ? '…' : 'Spara'}
                  </button>
                </div>
              </div>
            </div>
            {/* Existing products list */}
            {products.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">Dina produkter ({products.length})</p>
                <div className="rounded-xl border border-[var(--border)] overflow-hidden">
                  {products.map((p, i) => (
                    <div key={p.id} className={cn('flex items-center gap-3 px-4 py-3 text-sm', i > 0 && 'border-t border-[var(--border)]')}>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-[var(--text-primary)] truncate">{p.name}{p.unit ? ` / ${p.unit}` : ''}</p>
                        {p.description && <p className="text-xs text-[var(--text-muted)] truncate">{p.description}</p>}
                      </div>
                      <p className="text-sm font-semibold text-[var(--text-primary)] shrink-0">{fmtSEK(p.unitPrice)}</p>
                      <p className="text-xs text-[var(--text-muted)] shrink-0">{Math.round(p.vatRate * 100)}% moms</p>
                      <button onClick={() => void removeProduct(p.id)} className="text-[var(--text-muted)] hover:text-red-500 transition-colors shrink-0">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {products.length === 0 && (
              <p className="text-xs text-[var(--text-muted)]">Inga produkter ännu. Lägg till en produkt ovan för att kunna välja den vid offertsskapande.</p>
            )}
          </div>
        </div>
      )}

      {/* Create form panel */}
      {showForm && (
        <div className="mb-8 rounded-2xl border border-[var(--accent)]/30 bg-[var(--surface)] shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">Ny offert</h2>
            <button onClick={() => { setShowForm(false); setForm(EMPTY_FORM); setError(null); setContactSearch(''); setContactResults([]); }} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          <div className="p-6 space-y-6">

            {/* Contact picker */}
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
                Sök kontakt
                <span className="ml-1 font-normal text-[var(--text-muted)]">— fyller i mottagarfälten automatiskt</span>
              </label>
              <div className="relative">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                <input
                  value={form.contactId
                    ? (contactResults.find((c) => c.id === form.contactId)?.name ?? (contactSearch || 'Kontakt vald ✓'))
                    : contactSearch}
                  onChange={(e) => { if (form.contactId) setForm((f) => ({ ...f, contactId: '' })); searchContacts(e.target.value); }}
                  placeholder="Sök på namn, e-post eller företag…"
                  className="w-full pl-9 pr-10 py-2 rounded-xl border border-[var(--border)] bg-[var(--surface-alt)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] transition-colors"
                />
                {(contactSearch || form.contactId) && (
                  <button type="button" onClick={() => { setForm((f) => ({ ...f, contactId: '' })); setContactSearch(''); setContactResults([]); }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                )}
                {/* Dropdown */}
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
                          className="w-full text-left px-4 py-2.5 hover:bg-[var(--surface-hover)] transition-colors flex items-center gap-3 border-b border-[var(--border)] last:border-0">
                          <div className="w-8 h-8 rounded-full bg-[var(--accent)]/15 flex items-center justify-center text-[var(--accent)] text-xs font-semibold shrink-0">
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
                <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  Fält ifyllda från kontakt
                </p>
              )}
            </div>

            {/* Template selector */}
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
                Offertmall
                <a href="/templates" target="_blank" rel="noreferrer"
                  className="ml-2 font-normal text-[var(--accent)] hover:underline">
                  {templates.length === 0 ? 'Skapa mall →' : 'Hantera mallar →'}
                </a>
              </label>
              <select
                value={form.templateId}
                onChange={(e) => setForm((f) => ({ ...f, templateId: e.target.value }))}
                disabled={templates.length === 0}
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-alt)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] transition-colors disabled:opacity-50"
              >
                <option value="">{templates.length === 0 ? 'Inga mallar skapade ännu' : 'Ingen mall (fritext)'}</option>
                {templates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
              {form.templateId && (
                <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  Dokumentet genereras med vald mall när offerten skickas.
                </p>
              )}
            </div>

            {/* Basic info */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">Rubrik *</label>
                <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="t.ex. Hotellprojekt Q2 2026"
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-alt)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] transition-colors"/>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">Mottagarens namn *</label>
                <input value={form.recipientName} onChange={(e) => setForm((f) => ({ ...f, recipientName: e.target.value }))} placeholder="Anna Lindström"
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-alt)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] transition-colors"/>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">E-postadress *</label>
                <input type="email" value={form.recipientEmail} onChange={(e) => setForm((f) => ({ ...f, recipientEmail: e.target.value }))} placeholder="anna@example.com"
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-alt)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] transition-colors"/>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">Företag</label>
                <input value={form.recipientCompany} onChange={(e) => setForm((f) => ({ ...f, recipientCompany: e.target.value }))} placeholder="Lindström AB"
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-alt)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] transition-colors"/>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">Giltig till *</label>
                <input type="date" value={form.validUntil} onChange={(e) => setForm((f) => ({ ...f, validUntil: e.target.value }))}
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-alt)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] transition-colors"/>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">Anteckningar</label>
                <textarea value={form.notes} rows={2} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} placeholder="Eventuella villkor eller kommentarer…"
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-alt)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] transition-colors resize-none"/>
              </div>
            </div>

            {/* Line items */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Rader</p>
                <button onClick={addLine} className="text-xs text-[var(--accent)] font-medium hover:opacity-80 transition-opacity flex items-center gap-1">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                  Lägg till rad
                </button>
              </div>
              {products.length > 0 && (
                <p className="text-[10px] text-[var(--text-muted)] mb-2">
                  Tips: Klicka på <span className="font-semibold">«</span> i beskrivningsfältet för att välja från produktbiblioteket.
                </p>
              )}

              <div className="rounded-xl border border-[var(--border)] overflow-hidden">
                <div className="grid grid-cols-12 gap-2 px-3 py-2 bg-[var(--surface-alt)] text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                  <span className="col-span-4">Beskrivning</span>
                  <span className="col-span-2 text-right">Antal</span>
                  <span className="col-span-2 text-right">Á-pris (SEK)</span>
                  <span className="col-span-1 text-right">Moms %</span>
                  <span className="col-span-1 text-right">Rabatt %</span>
                  <span className="col-span-1 text-right">Summa</span>
                  <span className="col-span-1"/>
                </div>
                {form.lineItems.map((item, idx) => {
                  const disc = 1 - (item.discount / 100);
                  const lineExVat = item.quantity * item.unitPrice * disc;
                  return (
                    <div key={idx} className="grid grid-cols-12 gap-2 px-3 py-2 border-t border-[var(--border)] items-center">
                      <div className="col-span-4 relative">
                        <div className="flex gap-1">
                          <input value={item.description} onChange={(e) => updateLine(idx, 'description', e.target.value)} placeholder="Tjänst eller produkt"
                            className="flex-1 min-w-0 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] transition-colors"/>
                          {products.length > 0 && (
                            <button type="button" onClick={() => { setProductPickerRow(productPickerRow === idx ? null : idx); setProductSearch(''); }}
                              title="Välj från produktbibliotek"
                              className="shrink-0 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-1.5 py-1.5 text-[10px] text-[var(--text-muted)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors">
                              «
                            </button>
                          )}
                        </div>
                        {productPickerRow === idx && (
                          <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-lg overflow-hidden">
                            <div className="p-2 border-b border-[var(--border)]">
                              <input autoFocus value={productSearch} onChange={(e) => setProductSearch(e.target.value)}
                                placeholder="Sök produkt…"
                                className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-alt)] px-2 py-1.5 text-xs focus:outline-none focus:border-[var(--accent)] transition-colors"/>
                            </div>
                            <div className="max-h-40 overflow-y-auto">
                              {filteredProducts.length === 0 ? (
                                <div className="px-3 py-2 text-xs text-[var(--text-muted)]">Inga produkter hittades</div>
                              ) : filteredProducts.map((p) => (
                                <button key={p.id} type="button" onClick={() => pickProduct(idx, p)}
                                  className="w-full text-left px-3 py-2 hover:bg-[var(--surface-hover)] transition-colors border-b border-[var(--border)] last:border-0 text-xs">
                                  <p className="font-medium text-[var(--text-primary)]">{p.name}{p.unit ? ` / ${p.unit}` : ''}</p>
                                  <p className="text-[var(--text-muted)]">{fmtSEK(p.unitPrice)} · moms {Math.round(p.vatRate * 100)}%</p>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="col-span-2">
                        <input type="number" min={0} step={0.1} value={item.quantity} onChange={(e) => updateLine(idx, 'quantity', parseFloat(e.target.value) || 0)}
                          className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 py-1.5 text-xs text-right text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] transition-colors"/>
                      </div>
                      <div className="col-span-2">
                        <input type="number" min={0} value={item.unitPrice} onChange={(e) => updateLine(idx, 'unitPrice', parseFloat(e.target.value) || 0)}
                          className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 py-1.5 text-xs text-right text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] transition-colors"/>
                      </div>
                      <div className="col-span-1">
                        <select value={item.vatRate} onChange={(e) => updateLine(idx, 'vatRate', parseFloat(e.target.value))}
                          className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-1.5 py-1.5 text-xs text-right text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] transition-colors">
                          <option value={0}>0%</option><option value={0.06}>6%</option>
                          <option value={0.12}>12%</option><option value={0.25}>25%</option>
                        </select>
                      </div>
                      <div className="col-span-1">
                        <input type="number" min={0} max={100} value={item.discount} onChange={(e) => updateLine(idx, 'discount', parseFloat(e.target.value) || 0)}
                          className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 py-1.5 text-xs text-right text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] transition-colors"/>
                      </div>
                      <div className="col-span-1 text-right text-xs font-medium text-[var(--text-primary)]">{fmtSEK(lineExVat)}</div>
                      <div className="col-span-1 flex justify-end">
                        {form.lineItems.length > 1 && (
                          <button onClick={() => removeLine(idx)} className="text-[var(--text-muted)] hover:text-red-500 transition-colors">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/>
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Totals */}
              <div className="mt-4 flex justify-end">
                <div className="space-y-1.5 text-sm min-w-[220px]">
                  <div className="flex justify-between gap-8 text-[var(--text-secondary)]">
                    <span>Summa ex. moms</span><span className="font-medium">{fmtSEK(tots.exVat)}</span>
                  </div>
                  <div className="flex justify-between gap-8 text-[var(--text-muted)] text-xs">
                    <span>Moms</span><span>{fmtSEK(tots.vat)}</span>
                  </div>
                  <div className="flex justify-between gap-8 text-[var(--text-primary)] font-semibold border-t border-[var(--border)] pt-2 mt-2">
                    <span>Totalt inkl. moms</span><span>{fmtSEK(tots.incVat)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-2 border-t border-[var(--border-light)]">
              <button onClick={() => void createOffer()} disabled={saving}
                className="rounded-xl bg-[var(--accent)] px-5 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50 transition-opacity">
                {saving ? 'Sparar…' : 'Spara som utkast'}
              </button>
              <button onClick={() => { setShowForm(false); setForm(EMPTY_FORM); setError(null); setContactSearch(''); setContactResults([]); }}
                className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] transition-colors">
                Avbryt
              </button>
            </div>
          </div>
        </div>
      )}

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

      {/* Status tabs + search */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
        <div className="flex gap-0 border-b border-[var(--border)] overflow-x-auto scrollbar-none flex-1">
          {STATUS_TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={cn('px-3.5 py-2.5 text-xs font-medium whitespace-nowrap shrink-0 border-b-2 -mb-px transition-all duration-150',
                tab === t.id ? 'border-[var(--accent)] text-[var(--accent)]' : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--border)]')}>
              {t.label}
            </button>
          ))}
        </div>
        <div className="relative shrink-0">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Sök offert…"
            className="pl-9 pr-4 py-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] transition-colors w-48"/>
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
        <div className="rounded-2xl border border-[var(--border)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[var(--border)] text-sm">
              <thead className="bg-[var(--surface-alt)]">
                <tr>
                  <th className="px-4 py-3 w-8">
                    {draftOffers.length > 0 && (
                      <input
                        type="checkbox"
                        checked={allDraftsSelected}
                        onChange={toggleSelectAllDrafts}
                        title="Välj alla utkast"
                        className="rounded border-[var(--border)] accent-[var(--accent)] cursor-pointer"
                      />
                    )}
                  </th>
                  {['Rubrik', 'Mottagare', 'Status', 'Totalt inkl. moms', 'Giltig till', 'Skapad', ''].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)] bg-[var(--surface)]">
                {offers.map((offer) => (
                  <tr key={offer.id} className="hover:bg-[var(--surface-hover)] transition-colors">
                    <td className="px-4 py-3.5 w-8">
                      {offer.status === 'draft' && (
                        <input
                          type="checkbox"
                          checked={selected.has(offer.id)}
                          onChange={() => toggleSelect(offer.id)}
                          className="rounded border-[var(--border)] accent-[var(--accent)] cursor-pointer"
                        />
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="font-medium text-[var(--text-primary)]">{offer.title}</p>
                      <p className="text-[10px] text-[var(--text-muted)] mt-0.5 font-mono">{fmtOfferNumber(offer)}</p>
                      {offer.templateId && <p className="text-[10px] text-[var(--accent)] mt-0.5">Mallbaserad</p>}
                      {offer.leadId    && <p className="text-[10px] text-[var(--text-muted)] mt-0.5">Kopplad till lead</p>}
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="text-[var(--text-primary)]">{offer.recipientName}</p>
                      <p className="text-xs text-[var(--text-muted)]">{offer.recipientEmail}</p>
                      {offer.recipientCompany && <p className="text-[10px] text-[var(--text-muted)]">{offer.recipientCompany}</p>}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[offer.status]}`}>
                        {STATUS_LABEL[offer.status]}
                      </span>
                      {/* Activity timeline — key timestamps */}
                      <div className="mt-1.5 space-y-0.5">
                        {offer.sentAt && (
                          <p className="text-[10px] text-[var(--text-muted)]">
                            Skickad {fmtDate(offer.sentAt)}
                          </p>
                        )}
                        {offer.viewedAt && (
                          <p className="text-[10px] text-violet-500 dark:text-violet-400">
                            Öppnad {fmtDate(offer.viewedAt)}
                          </p>
                        )}
                        {offer.acceptedAt && (
                          <p className="text-[10px] text-emerald-600 dark:text-emerald-400">
                            Accepterad {fmtDate(offer.acceptedAt)}
                          </p>
                        )}
                        {offer.declinedAt && (
                          <p className="text-[10px] text-red-500">
                            Avvisad {fmtDate(offer.declinedAt)}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-[var(--text-primary)]">
                      {fmtSEK(offer.totalIncVat)}
                      <p className="text-[10px] font-normal text-[var(--text-muted)]">ex. moms: {fmtSEK(offer.totalExVat)}</p>
                    </td>
                    <td className="px-4 py-3.5 text-[var(--text-muted)]">{fmtDate(offer.validUntil)}</td>
                    <td className="px-4 py-3.5 text-[var(--text-muted)]">{fmtDate(offer.createdAt)}</td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5 justify-end flex-wrap">
                        {/* Preview document */}
                        {offer.generatedDocument && (
                          <>
                            <button type="button" onClick={() => setPreviewDoc(offer.generatedDocument!)}
                              className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:underline">
                              Förhandsgranska
                            </button>
                            <span className="text-[var(--border)]">·</span>
                            <button type="button"
                              onClick={() => window.open(`/api/offers/${offer.id}/pdf`, '_blank')}
                              className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:underline">
                              PDF
                            </button>
                          </>
                        )}
                        {/* Copy public link */}
                        {(offer.status === 'sent' || offer.status === 'viewed') && (
                          <button type="button" onClick={() => void copyLink(offer)}
                            className="text-xs text-violet-500 hover:underline">
                            {copied === offer.id ? 'Kopierat!' : 'Kopiera länk'}
                          </button>
                        )}
                        {offer.status === 'draft' && (
                          <button type="button" onClick={() => setConfirmSend(offer)} disabled={acting === offer.id}
                            className="text-xs text-blue-600 dark:text-blue-400 hover:underline disabled:opacity-40">
                            Skicka
                          </button>
                        )}
                        {(offer.status === 'sent' || offer.status === 'viewed') && (
                          <>
                            {canRemind(offer) && (
                              <>
                                <span className="text-[var(--border)]">·</span>
                                <button type="button" onClick={() => void doAction(offer.id, 'remind')} disabled={acting === offer.id}
                                  className="text-xs text-amber-600 dark:text-amber-400 hover:underline disabled:opacity-40"
                                  title="Skicka påminnelse till mottagaren">
                                  Påminn{offer.reminderCount > 0 ? ` (${offer.reminderCount})` : ''}
                                </button>
                              </>
                            )}
                            <span className="text-[var(--border)]">·</span>
                            <button type="button" onClick={() => void doAction(offer.id, 'accept')} disabled={acting === offer.id}
                              className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline disabled:opacity-40">
                              Acceptera
                            </button>
                            <span className="text-[var(--border)]">·</span>
                            <button type="button" onClick={() => void doAction(offer.id, 'decline')} disabled={acting === offer.id}
                              className="text-xs text-red-500 hover:underline disabled:opacity-40">
                              Avvisa
                            </button>
                          </>
                        )}
                        <span className="text-[var(--border)] mx-0.5">·</span>
                        <button type="button" onClick={() => void doAction(offer.id, 'duplicate')} disabled={acting === offer.id}
                          className="text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:underline transition-colors disabled:opacity-40">
                          Duplicera
                        </button>
                        <span className="text-[var(--border)] mx-0.5">·</span>
                        <button type="button" onClick={() => void deleteOffer(offer.id)}
                          className="text-xs text-[var(--text-muted)] hover:text-red-500 transition-colors">
                          Ta bort
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {offers.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-[var(--accent)]/10 flex items-center justify-center">
                          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1z"/>
                            <line x1="8" y1="9" x2="16" y2="9"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="12" y2="17"/>
                          </svg>
                        </div>
                        <p className="text-sm font-medium text-[var(--text-primary)]">Inga offerter ännu</p>
                        <p className="text-xs text-[var(--text-muted)]">Klicka på &ldquo;Ny offert&rdquo; för att komma igång.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {total > offers.length && (
            <div className="px-4 py-3 border-t border-[var(--border)] bg-[var(--surface-alt)] text-xs text-[var(--text-muted)] text-center">
              Visar {offers.length} av {total} offerter
            </div>
          )}
        </div>
      )}

      {/* Send confirmation modal */}
      {confirmSend && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setConfirmSend(null)}>
          <div className="relative w-full max-w-sm bg-[var(--surface)] rounded-2xl shadow-2xl overflow-hidden"
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
                className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] transition-colors"
              >
                Avbryt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Document preview modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setPreviewDoc(null)}>
          <div className="relative w-full max-w-4xl max-h-[90vh] bg-white dark:bg-[var(--surface)] rounded-2xl shadow-2xl overflow-hidden flex flex-col"
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
