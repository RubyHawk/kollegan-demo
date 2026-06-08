'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@shared/ui/button';
import { Input } from '@shared/ui/input';
import { Label } from '@shared/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@shared/ui/card';
import { useActiveCompany } from '@shared/hooks/use-active-company';
import { listOffers, type Offer } from '@shared/lib/api/offers.api';
import { createInvoice } from '@shared/lib/api/invoices.api';
import { fmtMoney } from '../_lib/invoice-display';

type Mode = 'blank' | 'offer';

export default function NewInvoicePage() {
  const router = useRouter();
  const { companies, selectedCompanyId, setSelectedCompanyId } = useActiveCompany();
  const [mode, setMode] = useState<Mode>('blank');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Blank
  const [recipientName, setRecipientName] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [recipientCompany, setRecipientCompany] = useState('');

  // From offer
  const [acceptedOffers, setAcceptedOffers] = useState<Offer[]>([]);
  const [offersLoading, setOffersLoading] = useState(false);

  useEffect(() => {
    if (mode !== 'offer') return;
    let active = true;
    const run = async () => {
      setOffersLoading(true);
      try {
        const res = await listOffers({ status: 'accepted', limit: 100 });
        if (active) setAcceptedOffers(res.offers);
      } catch {
        if (active) setError('Kunde inte ladda accepterade offerter.');
      } finally {
        if (active) setOffersLoading(false);
      }
    };
    void run();
    return () => { active = false; };
  }, [mode]);

  async function createBlank() {
    if (!selectedCompanyId) {
      setError('Välj ett företag för fakturan.');
      return;
    }
    setCreating(true);
    setError(null);
    try {
      const invoice = await createInvoice({
        source: 'blank',
        companyId: selectedCompanyId,
        recipientName: recipientName.trim() || undefined,
        recipientEmail: recipientEmail.trim() || undefined,
        recipientCompany: recipientCompany.trim() || undefined,
      });
      router.push(`/fakturor/${invoice.id}`);
    } catch (e) {
      setError((e as Error).message || 'Kunde inte skapa fakturan.');
      setCreating(false);
    }
  }

  async function createFromOffer(offerId: string) {
    setCreating(true);
    setError(null);
    try {
      const invoice = await createInvoice({ source: 'offer', offerId });
      router.push(`/fakturor/${invoice.id}`);
    } catch (e) {
      setError((e as Error).message || 'Kunde inte skapa fakturan från offerten.');
      setCreating(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
      <Link
        href="/fakturor"
        className="inline-flex items-center gap-2 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
      >
        <span aria-hidden="true">←</span>
        Tillbaka till fakturor
      </Link>

      <h1 className="mb-1 mt-3 text-2xl font-semibold tracking-tight text-[var(--text-primary)]">Ny faktura</h1>
      <p className="mb-6 text-sm text-[var(--text-secondary)]">
        Skapa en tom faktura eller utgå från en accepterad offert. Tid kan faktureras från projektets tidkort.
      </p>

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mb-6 flex gap-2">
        <button
          type="button"
          onClick={() => setMode('blank')}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
            mode === 'blank' ? 'bg-[var(--accent)] text-white' : 'bg-[var(--surface-alt)] text-[var(--text-secondary)]'
          }`}
        >
          Tom faktura
        </button>
        <button
          type="button"
          onClick={() => setMode('offer')}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
            mode === 'offer' ? 'bg-[var(--accent)] text-white' : 'bg-[var(--surface-alt)] text-[var(--text-secondary)]'
          }`}
        >
          Från accepterad offert
        </button>
      </div>

      {mode === 'blank' ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tom faktura</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="company">Företag (avsändare)</Label>
              <select
                id="company"
                value={selectedCompanyId}
                onChange={(e) => setSelectedCompanyId(e.target.value)}
                className="mt-1 h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--surface-alt)] px-3 text-sm text-[var(--text-primary)]"
              >
                <option value="">Välj företag…</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label htmlFor="rname">Mottagarens namn</Label>
                <Input id="rname" value={recipientName} onChange={(e) => setRecipientName(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="remail">E-post</Label>
                <Input id="remail" type="email" value={recipientEmail} onChange={(e) => setRecipientEmail(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="rcompany">Företag</Label>
                <Input id="rcompany" value={recipientCompany} onChange={(e) => setRecipientCompany(e.target.value)} className="mt-1" />
              </div>
            </div>
            <Button type="button" onClick={createBlank} disabled={creating}>
              {creating ? 'Skapar…' : 'Skapa utkast'}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Accepterade offerter</CardTitle>
          </CardHeader>
          <CardContent>
            {offersLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-14 animate-pulse rounded-lg bg-[var(--surface-alt)]" />
                ))}
              </div>
            ) : acceptedOffers.length === 0 ? (
              <p className="py-6 text-center text-sm text-[var(--text-secondary)]">
                Inga accepterade offerter att fakturera ännu.
              </p>
            ) : (
              <div className="divide-y divide-[var(--border)]">
                {acceptedOffers.map((offer) => (
                  <div key={offer.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-[var(--text-primary)]">{offer.title}</p>
                      <p className="truncate text-xs text-[var(--text-muted)]">
                        {offer.recipientName} · {fmtMoney(offer.totalIncVat)}
                      </p>
                    </div>
                    <Button type="button" size="sm" variant="outline" disabled={creating} onClick={() => createFromOffer(offer.id)}>
                      Skapa faktura
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
