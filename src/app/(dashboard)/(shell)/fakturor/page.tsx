'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@shared/ui/button';
import { Badge } from '@shared/ui/badge';
import { PlusIcon, ReceiptIcon } from '@shared/ui/icons';
import { useInvoicesListStore, PAGE_SIZE } from './_store/invoices-list.store';
import {
  INVOICE_STATUS_TABS,
  INVOICE_STATUS_LABEL,
  INVOICE_STATUS_VARIANT,
  fmtMoney,
  fmtDate,
  documentLabel,
  invoiceRef,
} from './_lib/invoice-display';

export default function InvoicesPage() {
  const router = useRouter();
  const {
    invoices, total, loading, error,
    tab, dateFrom, dateTo, currentPage,
    setTab, setDateFrom, setDateTo, setCurrentPage, resetFilters, load,
  } = useInvoicesListStore();

  useEffect(() => {
    void load();
  }, [tab, dateFrom, dateTo, currentPage, load]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const hasFilters = tab !== 'all' || Boolean(dateFrom || dateTo);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--text-primary)]">Fakturor</h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Skapa, skicka och följ upp fakturor och kreditfakturor.
          </p>
        </div>
        <Button asChild>
          <Link href="/fakturor/ny">
            <PlusIcon />
            Ny faktura
          </Link>
        </Button>
      </div>

      {/* Status tabs */}
      <div className="mb-4 flex flex-wrap gap-2">
        {INVOICE_STATUS_TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
              tab === t.id
                ? 'bg-[var(--accent)] text-white'
                : 'bg-[var(--surface-alt)] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Date range */}
      <div className="mb-6 flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-xs font-medium text-[var(--text-muted)]">
          Från
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="h-9 rounded-lg border border-[var(--border)] bg-[var(--surface-alt)] px-3 text-sm text-[var(--text-primary)]"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-[var(--text-muted)]">
          Till
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="h-9 rounded-lg border border-[var(--border)] bg-[var(--surface-alt)] px-3 text-sm text-[var(--text-primary)]"
          />
        </label>
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={resetFilters}>
            Rensa filter
          </Button>
        )}
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-14 animate-pulse rounded-xl bg-[var(--surface-alt)]" />
          ))}
        </div>
      ) : invoices.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface)] px-6 py-14 text-center">
          <ReceiptIcon className="mx-auto mb-3 text-[var(--text-muted)]" size={28} />
          <p className="text-sm font-medium text-[var(--text-primary)]">Inga fakturor ännu</p>
          <p className="mx-auto mt-1 max-w-md text-sm text-[var(--text-secondary)]">
            Skapa en faktura från grunden, från en accepterad offert eller från loggad projekttid.
          </p>
          <Button asChild className="mt-4">
            <Link href="/fakturor/ny">
              <PlusIcon />
              Ny faktura
            </Link>
          </Button>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-hidden rounded-2xl border border-[var(--border)] md:block">
            <table className="min-w-full divide-y divide-[var(--border)] text-sm">
              <thead className="bg-[var(--surface-alt)]">
                <tr className="text-left text-xs uppercase tracking-[0.12em] text-[var(--text-muted)]">
                  <th className="px-4 py-3">Nr</th>
                  <th className="px-4 py-3">Mottagare</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Fakturadatum</th>
                  <th className="px-4 py-3">Förfaller</th>
                  <th className="px-4 py-3 text-right">Belopp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)] bg-[var(--surface)]">
                {invoices.map((inv) => (
                  <tr
                    key={inv.id}
                    onClick={() => router.push(`/fakturor/${inv.id}`)}
                    className="cursor-pointer transition-colors hover:bg-[var(--surface-alt)]"
                  >
                    <td className="px-4 py-3">
                      <span className="font-medium text-[var(--text-primary)]">{invoiceRef(inv)}</span>
                      {inv.documentType === 'credit_note' && (
                        <span className="ml-2 text-xs text-amber-600">Kredit</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[var(--text-primary)]">
                      {inv.recipientName}
                      {inv.recipientCompany && (
                        <span className="block text-xs text-[var(--text-muted)]">{inv.recipientCompany}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={INVOICE_STATUS_VARIANT[inv.status]}>
                        {INVOICE_STATUS_LABEL[inv.status]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-[var(--text-secondary)]">{fmtDate(inv.issueDate)}</td>
                    <td className="px-4 py-3 text-[var(--text-secondary)]">{fmtDate(inv.dueDate)}</td>
                    <td className="px-4 py-3 text-right font-medium text-[var(--text-primary)]">
                      {fmtMoney(inv.totalIncVat, inv.currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="space-y-3 md:hidden">
            {invoices.map((inv) => (
              <Link
                key={inv.id}
                href={`/fakturor/${inv.id}`}
                className="block rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-[var(--text-primary)]">
                    {documentLabel(inv.documentType)} {invoiceRef(inv)}
                  </span>
                  <Badge variant={INVOICE_STATUS_VARIANT[inv.status]}>
                    {INVOICE_STATUS_LABEL[inv.status]}
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">{inv.recipientName}</p>
                <div className="mt-2 flex items-center justify-between text-sm">
                  <span className="text-[var(--text-muted)]">{fmtDate(inv.issueDate)}</span>
                  <span className="font-medium text-[var(--text-primary)]">
                    {fmtMoney(inv.totalIncVat, inv.currency)}
                  </span>
                </div>
              </Link>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <span className="text-sm text-[var(--text-muted)]">
                Sida {currentPage + 1} av {totalPages} · {total} fakturor
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 0}
                  onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                >
                  Föregående
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage >= totalPages - 1}
                  onClick={() => setCurrentPage(currentPage + 1)}
                >
                  Nästa
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
