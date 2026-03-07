'use client';

/**
 * /offers
 *
 * Offer / Quotation Builder.
 * - List of all offers with status tabs
 * - Slide-out panel to create a new offer with line-item editor
 * - Real-time totals (ex VAT, VAT amount, total inc VAT)
 * - Send / Accept / Decline actions
 */

import { useState, useEffect, useCallback } from 'react';
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
  id:               string;
  title:            string;
  status:           OfferStatus;
  recipientName:    string;
  recipientEmail:   string;
  recipientCompany?: string;
  notes?:           string;
  validUntil:       string;
  totalExVat:       number;
  totalIncVat:      number;
  lineItems:        LineItem[];
  createdAt:        string;
  sentAt?:          string;
  acceptedAt?:      string;
  leadId?:          string;
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
  let exVat = 0;
  let vatAmt = 0;
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

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function OffersPage() {
  const [offers,   setOffers]   = useState<Offer[]>([]);
  const [total,    setTotal]    = useState(0);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);
  const [tab,      setTab]      = useState<OfferStatus | 'all'>('all');
  const [search,   setSearch]   = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form,     setForm]     = useState(EMPTY_FORM);
  const [saving,   setSaving]   = useState(false);
  const [acting,   setActing]   = useState<string | null>(null); // offerId being actioned

  // ── Load offers ─────────────────────────────────────────────────────────────
  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ limit: '50', offset: '0' });
      if (tab !== 'all') params.set('status', tab);
      if (search.trim()) params.set('search', search.trim());
      const res = await fetch(`/api/offers?${params}`);
      if (!res.ok) throw new Error(`Fel ${res.status}`);
      const json = await res.json() as { data: { offers: Offer[]; total: number } };
      setOffers(json.data.offers);
      setTotal(json.data.total);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [tab, search]);

  useEffect(() => { void load(); }, [load]);

  // ── Create offer ─────────────────────────────────────────────────────────────
  const createOffer = useCallback(async () => {
    const tots = computeTotals(form.lineItems);
    if (!form.title || !form.recipientName || !form.recipientEmail || !form.validUntil) {
      setError('Fyll i alla obligatoriska fält (titel, mottagare, e-post, giltig till).');
      return;
    }
    const validItems = form.lineItems.filter((i) => i.description.trim() && i.quantity > 0);
    if (validItems.length === 0) {
      setError('Minst en raden måste ha beskrivning och kvantitet.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/offers', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title:            form.title,
          recipientName:    form.recipientName,
          recipientEmail:   form.recipientEmail,
          recipientCompany: form.recipientCompany || undefined,
          notes:            form.notes || undefined,
          validUntil:       new Date(form.validUntil).toISOString(),
          lineItems:        validItems,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({})) as { detail?: string };
        throw new Error(j.detail ?? `Fel ${res.status}`);
      }
      setShowForm(false);
      setForm(EMPTY_FORM);
      await load(true);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }, [form, load]);

  // ── Status action (send / accept / decline) ──────────────────────────────────
  const doAction = useCallback(async (id: string, action: 'send' | 'accept' | 'decline') => {
    setActing(id);
    try {
      const res = await fetch(`/api/offers/${id}?action=${action}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({}),
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

  // ── Line item helpers ─────────────────────────────────────────────────────────
  function updateLine(idx: number, field: keyof LineItem, value: string | number) {
    setForm((f) => {
      const items = [...f.lineItems];
      items[idx] = { ...items[idx], [field]: value };
      return { ...f, lineItems: items };
    });
  }
  function addLine() {
    setForm((f) => ({ ...f, lineItems: [...f.lineItems, { ...EMPTY_LINE }] }));
  }
  function removeLine(idx: number) {
    setForm((f) => ({ ...f, lineItems: f.lineItems.filter((_, i) => i !== idx) }));
  }

  const tots = computeTotals(form.lineItems);

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className="px-8 py-10 max-w-7xl mx-auto">

      {/* Header */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-[var(--text-primary)] mb-1">Offerter</h1>
          <p className="text-sm text-[var(--text-muted)]">
            Skapa, skicka och följ upp offerter direkt från plattformen.
          </p>
        </div>
        <button
          onClick={() => { setShowForm(true); setError(null); }}
          className="flex items-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity shrink-0"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Ny offert
        </button>
      </div>

      {/* Error banner */}
      {error && (
        <div className="mb-6 rounded-xl border border-red-200 dark:border-red-800/40 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-400 flex items-center justify-between gap-3">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="shrink-0 opacity-60 hover:opacity-100">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      )}

      {/* Create form panel */}
      {showForm && (
        <div className="mb-8 rounded-2xl border border-[var(--accent)]/30 bg-[var(--surface)] shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">Ny offert</h2>
            <button
              onClick={() => { setShowForm(false); setForm(EMPTY_FORM); setError(null); }}
              className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Basic info */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">Rubrik *</label>
                <input
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="t.ex. Hotellprojekt Q2 2026"
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-alt)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">Mottagarens namn *</label>
                <input
                  value={form.recipientName}
                  onChange={(e) => setForm((f) => ({ ...f, recipientName: e.target.value }))}
                  placeholder="Anna Lindström"
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-alt)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">E-postadress *</label>
                <input
                  type="email"
                  value={form.recipientEmail}
                  onChange={(e) => setForm((f) => ({ ...f, recipientEmail: e.target.value }))}
                  placeholder="anna@example.com"
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-alt)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">Företag</label>
                <input
                  value={form.recipientCompany}
                  onChange={(e) => setForm((f) => ({ ...f, recipientCompany: e.target.value }))}
                  placeholder="Lindström AB"
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-alt)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">Giltig till *</label>
                <input
                  type="date"
                  value={form.validUntil}
                  onChange={(e) => setForm((f) => ({ ...f, validUntil: e.target.value }))}
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-alt)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] transition-colors"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">Anteckningar</label>
                <textarea
                  value={form.notes}
                  rows={2}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  placeholder="Eventuella villkor eller kommentarer…"
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-alt)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] transition-colors resize-none"
                />
              </div>
            </div>

            {/* Line items */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Rader</p>
                <button
                  onClick={addLine}
                  className="text-xs text-[var(--accent)] font-medium hover:opacity-80 transition-opacity flex items-center gap-1"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  Lägg till rad
                </button>
              </div>

              <div className="rounded-xl border border-[var(--border)] overflow-hidden">
                {/* Header row */}
                <div className="grid grid-cols-12 gap-2 px-3 py-2 bg-[var(--surface-alt)] text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                  <span className="col-span-4">Beskrivning</span>
                  <span className="col-span-2 text-right">Antal</span>
                  <span className="col-span-2 text-right">Á-pris (SEK)</span>
                  <span className="col-span-1 text-right">Moms %</span>
                  <span className="col-span-1 text-right">Rabatt %</span>
                  <span className="col-span-1 text-right">Summa</span>
                  <span className="col-span-1" />
                </div>

                {form.lineItems.map((item, idx) => {
                  const disc = 1 - (item.discount / 100);
                  const lineExVat = item.quantity * item.unitPrice * disc;
                  return (
                    <div key={idx} className="grid grid-cols-12 gap-2 px-3 py-2 border-t border-[var(--border)] items-center">
                      <div className="col-span-4">
                        <input
                          value={item.description}
                          onChange={(e) => updateLine(idx, 'description', e.target.value)}
                          placeholder="Tjänst eller produkt"
                          className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] transition-colors"
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number" min={0} step={0.1}
                          value={item.quantity}
                          onChange={(e) => updateLine(idx, 'quantity', parseFloat(e.target.value) || 0)}
                          className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 py-1.5 text-xs text-right text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] transition-colors"
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number" min={0}
                          value={item.unitPrice}
                          onChange={(e) => updateLine(idx, 'unitPrice', parseFloat(e.target.value) || 0)}
                          className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 py-1.5 text-xs text-right text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] transition-colors"
                        />
                      </div>
                      <div className="col-span-1">
                        <select
                          value={item.vatRate}
                          onChange={(e) => updateLine(idx, 'vatRate', parseFloat(e.target.value))}
                          className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-1.5 py-1.5 text-xs text-right text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] transition-colors"
                        >
                          <option value={0}>0%</option>
                          <option value={0.06}>6%</option>
                          <option value={0.12}>12%</option>
                          <option value={0.25}>25%</option>
                        </select>
                      </div>
                      <div className="col-span-1">
                        <input
                          type="number" min={0} max={100}
                          value={item.discount}
                          onChange={(e) => updateLine(idx, 'discount', parseFloat(e.target.value) || 0)}
                          className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 py-1.5 text-xs text-right text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] transition-colors"
                        />
                      </div>
                      <div className="col-span-1 text-right text-xs font-medium text-[var(--text-primary)]">
                        {fmtSEK(lineExVat)}
                      </div>
                      <div className="col-span-1 flex justify-end">
                        {form.lineItems.length > 1 && (
                          <button
                            onClick={() => removeLine(idx)}
                            className="text-[var(--text-muted)] hover:text-red-500 transition-colors"
                          >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6l-1 14H6L5 6" />
                              <path d="M10 11v6M14 11v6" />
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
                    <span>Summa ex. moms</span>
                    <span className="font-medium">{fmtSEK(tots.exVat)}</span>
                  </div>
                  <div className="flex justify-between gap-8 text-[var(--text-muted)] text-xs">
                    <span>Moms</span>
                    <span>{fmtSEK(tots.vat)}</span>
                  </div>
                  <div className="flex justify-between gap-8 text-[var(--text-primary)] font-semibold border-t border-[var(--border)] pt-2 mt-2">
                    <span>Totalt inkl. moms</span>
                    <span>{fmtSEK(tots.incVat)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-2 border-t border-[var(--border-light)]">
              <button
                onClick={() => void createOffer()}
                disabled={saving}
                className="rounded-xl bg-[var(--accent)] px-5 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                {saving ? 'Sparar…' : 'Spara som utkast'}
              </button>
              <button
                onClick={() => { setShowForm(false); setForm(EMPTY_FORM); setError(null); }}
                className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] transition-colors"
              >
                Avbryt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status tabs + search */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
        <div className="flex gap-0 border-b border-[var(--border)] overflow-x-auto scrollbar-none flex-1">
          {STATUS_TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                'px-3.5 py-2.5 text-xs font-medium whitespace-nowrap shrink-0 border-b-2 -mb-px transition-all duration-150',
                tab === t.id
                  ? 'border-[var(--accent)] text-[var(--accent)]'
                  : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--border)]',
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="relative shrink-0">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Sök offert…"
            className="pl-9 pr-4 py-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] transition-colors w-48"
          />
        </div>
      </div>

      {/* Offers table */}
      {loading ? (
        <div className="flex items-center justify-center py-20 gap-3">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin text-[var(--text-muted)]">
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
          <p className="text-sm text-[var(--text-muted)]">Laddar offerter…</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-[var(--border)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[var(--border)] text-sm">
              <thead className="bg-[var(--surface-alt)]">
                <tr>
                  {['Rubrik', 'Mottagare', 'Status', 'Totalt inkl. moms', 'Giltig till', 'Skapad', ''].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)] bg-[var(--surface)]">
                {offers.map((offer) => (
                  <tr key={offer.id} className="hover:bg-[var(--surface-hover)] transition-colors">
                    <td className="px-4 py-3.5">
                      <p className="font-medium text-[var(--text-primary)]">{offer.title}</p>
                      {offer.leadId && (
                        <p className="text-[10px] text-[var(--text-muted)] mt-0.5">Kopplad till lead</p>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="text-[var(--text-primary)]">{offer.recipientName}</p>
                      <p className="text-xs text-[var(--text-muted)]">{offer.recipientEmail}</p>
                      {offer.recipientCompany && (
                        <p className="text-[10px] text-[var(--text-muted)]">{offer.recipientCompany}</p>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[offer.status]}`}>
                        {STATUS_LABEL[offer.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-[var(--text-primary)]">
                      {fmtSEK(offer.totalIncVat)}
                      <p className="text-[10px] font-normal text-[var(--text-muted)]">
                        ex. moms: {fmtSEK(offer.totalExVat)}
                      </p>
                    </td>
                    <td className="px-4 py-3.5 text-[var(--text-muted)]">{fmtDate(offer.validUntil)}</td>
                    <td className="px-4 py-3.5 text-[var(--text-muted)]">{fmtDate(offer.createdAt)}</td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5 justify-end">
                        {offer.status === 'draft' && (
                          <button
                            type="button"
                            onClick={() => void doAction(offer.id, 'send')}
                            disabled={acting === offer.id}
                            className="text-xs text-blue-600 dark:text-blue-400 hover:underline disabled:opacity-40"
                          >
                            Skicka
                          </button>
                        )}
                        {(offer.status === 'sent' || offer.status === 'viewed') && (
                          <>
                            <button
                              type="button"
                              onClick={() => void doAction(offer.id, 'accept')}
                              disabled={acting === offer.id}
                              className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline disabled:opacity-40"
                            >
                              Acceptera
                            </button>
                            <span className="text-[var(--border)]">·</span>
                            <button
                              type="button"
                              onClick={() => void doAction(offer.id, 'decline')}
                              disabled={acting === offer.id}
                              className="text-xs text-red-500 hover:underline disabled:opacity-40"
                            >
                              Avvisa
                            </button>
                          </>
                        )}
                        <span className="text-[var(--border)] mx-0.5">·</span>
                        <button
                          type="button"
                          onClick={() => void deleteOffer(offer.id)}
                          className="text-xs text-[var(--text-muted)] hover:text-red-500 transition-colors"
                        >
                          Ta bort
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {offers.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-[var(--accent)]/10 flex items-center justify-center">
                          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1z" />
                            <line x1="8" y1="9" x2="16" y2="9" />
                            <line x1="8" y1="13" x2="16" y2="13" />
                            <line x1="8" y1="17" x2="12" y2="17" />
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
    </div>
  );
}
