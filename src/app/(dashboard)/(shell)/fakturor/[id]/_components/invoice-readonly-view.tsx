'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@shared/ui/card';
import { ConfirmDestructiveDialog } from '@shared/ui/confirm-destructive-dialog';
import {
  createCreditNote,
  getInvoicePdfUrl,
  getInvoiceRotRutExportUrl,
  markInvoicePaid,
  type Invoice,
} from '@shared/lib/api/invoices.api';
import { canMarkPaid, canCredit } from '../../_lib/invoice-actions';
import { fmtMoney, fmtDate } from '../../_lib/invoice-display';
import { lineIncVat } from '../../_lib/invoice-pricing';

interface Props {
  invoice: Invoice;
  onReload: () => Promise<void>;
}

export function InvoiceReadonlyView({ invoice, onReload }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmCredit, setConfirmCredit] = useState(false);

  const hasRotRut = Boolean(invoice.rotRutType) && invoice.rotRutDeductionAmount > 0;

  async function doMarkPaid() {
    setBusy(true);
    setError(null);
    try {
      await markInvoicePaid(invoice.id);
      await onReload();
    } catch (e) {
      setError((e as Error).message || 'Kunde inte markera fakturan som betald.');
    } finally {
      setBusy(false);
    }
  }

  async function doCredit() {
    setBusy(true);
    setError(null);
    try {
      const creditNote = await createCreditNote(invoice.id);
      setConfirmCredit(false);
      router.push(`/fakturor/${creditNote.id}`);
    } catch (e) {
      setError((e as Error).message || 'Kunde inte skapa kreditfaktura.');
      setConfirmCredit(false);
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        <Button asChild variant="outline">
          <a href={getInvoicePdfUrl(invoice.id)} target="_blank" rel="noreferrer">Öppna PDF</a>
        </Button>
        {canMarkPaid(invoice.status) && (
          <Button type="button" onClick={doMarkPaid} disabled={busy}>
            Markera som betald
          </Button>
        )}
        {canCredit(invoice) && (
          <Button type="button" variant="secondary" onClick={() => setConfirmCredit(true)} disabled={busy}>
            Skapa kreditfaktura
          </Button>
        )}
        {hasRotRut && (
          <Button asChild variant="outline">
            <a href={getInvoiceRotRutExportUrl(invoice.id)} target="_blank" rel="noreferrer">
              Husarbete-XML (Skatteverket)
            </a>
          </Button>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <InfoCard label="Mottagare" lines={[invoice.recipientName, invoice.recipientEmail, invoice.recipientCompany]} />
        <InfoCard label="Datum" lines={[`Faktura ${fmtDate(invoice.issueDate)}`, `Förfaller ${fmtDate(invoice.dueDate)}`, invoice.paidAt ? `Betald ${fmtDate(invoice.paidAt)}` : undefined]} />
        <InfoCard label="Referens" lines={[invoice.paymentReference ? `OCR ${invoice.paymentReference}` : 'Ingen betalreferens', `Valuta ${invoice.currency}`]} />
        <InfoCard label="Belopp" lines={[fmtMoney(invoice.totalIncVat, invoice.currency), `varav moms ${fmtMoney(invoice.totalVat, invoice.currency)}`]} emphasizeFirst />
      </div>

      {invoice.creditedInvoiceId && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          Detta är en kreditfaktura som krediterar en tidigare faktura.
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Rader</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-xl border border-[var(--border)]">
            <table className="min-w-full divide-y divide-[var(--border)] text-sm">
              <thead className="bg-[var(--surface-alt)]">
                <tr className="text-left text-xs uppercase tracking-[0.12em] text-[var(--text-muted)]">
                  <th className="px-4 py-2">Beskrivning</th>
                  <th className="px-4 py-2 text-right">Antal</th>
                  <th className="px-4 py-2 text-right">À-pris</th>
                  <th className="px-4 py-2 text-right">Moms</th>
                  <th className="px-4 py-2 text-right">Summa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {invoice.lineItems.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-2 text-[var(--text-primary)]">
                      {item.description}
                      {item.lineType === 'labour' && item.rotRutEligible && (
                        <span className="ml-2 text-xs text-[var(--accent)]">Arbete</span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-right text-[var(--text-secondary)]">
                      {item.quantity} {item.unit ?? ''}
                    </td>
                    <td className="px-4 py-2 text-right text-[var(--text-secondary)]">
                      {fmtMoney(item.unitPrice, invoice.currency)}
                    </td>
                    <td className="px-4 py-2 text-right text-[var(--text-secondary)]">
                      {Math.round((item.vatRate <= 1 ? item.vatRate * 100 : item.vatRate))} %
                    </td>
                    <td className="px-4 py-2 text-right font-medium text-[var(--text-primary)]">
                      {fmtMoney(lineIncVat(item), invoice.currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex flex-col items-end gap-1 text-sm">
            <Row label="Summa exkl. moms" value={fmtMoney(invoice.totalExVat, invoice.currency)} />
            <Row label="Moms" value={fmtMoney(invoice.totalVat, invoice.currency)} />
            {hasRotRut && (
              <>
                <Row label={`${invoice.rotRutType}-avdrag`} value={`−${fmtMoney(invoice.rotRutDeductionAmount, invoice.currency)}`} />
                <Row
                  label="Att betala (efter avdrag)"
                  value={fmtMoney(invoice.totalIncVat - invoice.rotRutDeductionAmount, invoice.currency)}
                  strong
                />
              </>
            )}
            {!hasRotRut && (
              <Row label="Att betala" value={fmtMoney(invoice.totalIncVat, invoice.currency)} strong />
            )}
          </div>
        </CardContent>
      </Card>

      {invoice.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Meddelande</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm leading-6 text-[var(--text-secondary)]">{invoice.notes}</p>
          </CardContent>
        </Card>
      )}

      <ConfirmDestructiveDialog
        open={confirmCredit}
        onOpenChange={setConfirmCredit}
        title="Skapa kreditfaktura?"
        description="En kreditfaktura med omvända belopp skapas och får nästa nummer i serien. Originalfakturan markeras som krediterad."
        confirmLabel="Skapa kreditfaktura"
        loading={busy}
        onConfirm={doCredit}
      />
    </div>
  );
}

function InfoCard({ label, lines, emphasizeFirst }: { label: string; lines: Array<string | undefined>; emphasizeFirst?: boolean }) {
  const visible = lines.filter(Boolean) as string[];
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">{label}</p>
      {visible.map((line, i) => (
        <p
          key={i}
          className={
            i === 0 && emphasizeFirst
              ? 'mt-2 text-lg font-semibold text-[var(--text-primary)]'
              : `mt-1 text-sm ${i === 0 ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`
          }
        >
          {line}
        </p>
      ))}
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`flex w-64 justify-between ${strong ? 'text-base font-semibold text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
