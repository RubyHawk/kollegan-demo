'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Badge } from '@shared/ui/badge';
import { getInvoice, type Invoice } from '@shared/lib/api/invoices.api';
import {
  INVOICE_STATUS_LABEL,
  INVOICE_STATUS_VARIANT,
  documentLabel,
  invoiceRef,
} from '../../_lib/invoice-display';
import { canEdit } from '../../_lib/invoice-actions';
import { InvoiceDraftEditor } from './invoice-draft-editor';
import { InvoiceReadonlyView } from './invoice-readonly-view';
import { CreditNoteDraftView } from './credit-note-draft-view';

export function InvoiceDetail({ id }: { id: string }) {
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await getInvoice(id);
      setInvoice(data);
      setError(null);
    } catch (e) {
      setError((e as Error).message || 'Kunde inte ladda fakturan.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <div className="h-8 w-48 animate-pulse rounded bg-[var(--surface-alt)]" />
        <div className="mt-6 space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-[var(--surface-alt)]" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error ?? 'Fakturan kunde inte hittas.'}
        </div>
        <Link href="/fakturor" className="mt-4 inline-block text-sm text-[var(--accent)] hover:underline">
          ← Tillbaka till fakturor
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
      <Link
        href="/fakturor"
        className="inline-flex items-center gap-2 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
      >
        <span aria-hidden="true">←</span>
        Tillbaka till fakturor
      </Link>

      <div className="mb-6 mt-3 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--text-primary)]">
          {documentLabel(invoice.documentType)} {invoiceRef(invoice)}
        </h1>
        <Badge variant={INVOICE_STATUS_VARIANT[invoice.status]}>
          {INVOICE_STATUS_LABEL[invoice.status]}
        </Badge>
      </div>

      {!canEdit(invoice.status)
        ? <InvoiceReadonlyView invoice={invoice} onReload={load} />
        : invoice.documentType === 'credit_note'
          ? <CreditNoteDraftView invoice={invoice} onReload={load} />
          : <InvoiceDraftEditor invoice={invoice} onReload={load} />}
    </div>
  );
}
