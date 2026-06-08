'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@shared/ui/card';
import { ConfirmDestructiveDialog } from '@shared/ui/confirm-destructive-dialog';
import { SendIcon, TrashIcon } from '@shared/ui/icons';
import { deleteInvoice, sendInvoice, type Invoice } from '@shared/lib/api/invoices.api';
import { fmtMoney } from '../../_lib/invoice-display';
import { lineIncVat } from '../../_lib/invoice-pricing';

interface Props {
  invoice: Invoice;
  onReload: () => Promise<void>;
}

/**
 * A credit note is created as a draft with reversed (negative) lines and is
 * issued — never line-edited — so it gets a review-and-issue view rather than the
 * standard draft editor (whose update path rejects negative quantities).
 */
export function CreditNoteDraftView({ invoice, onReload }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmSend, setConfirmSend] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function doSend() {
    setBusy(true);
    setError(null);
    try {
      await sendInvoice(invoice.id);
      setConfirmSend(false);
      await onReload();
    } catch (e) {
      setError((e as Error).message || 'Kunde inte utfärda kreditfakturan.');
      setConfirmSend(false);
    } finally {
      setBusy(false);
    }
  }

  async function doDelete() {
    setBusy(true);
    setError(null);
    try {
      await deleteInvoice(invoice.id);
      router.push('/fakturor');
    } catch (e) {
      setError((e as Error).message || 'Kunde inte ta bort kreditfakturan.');
      setConfirmDelete(false);
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

      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
        Detta är ett utkast till kreditfaktura som speglar originalfakturan med omvända belopp.
        Granska och utfärda den för att tilldela löpnummer och skapa PDF.
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Mottagare</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-[var(--text-secondary)]">
          <p className="font-medium text-[var(--text-primary)]">{invoice.recipientName}</p>
          {invoice.recipientEmail && <p>{invoice.recipientEmail}</p>}
          {invoice.recipientCompany && <p>{invoice.recipientCompany}</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Rader (krediteras)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-xl border border-[var(--border)]">
            <table className="min-w-full divide-y divide-[var(--border)] text-sm">
              <thead className="bg-[var(--surface-alt)]">
                <tr className="text-left text-xs uppercase tracking-[0.12em] text-[var(--text-muted)]">
                  <th className="px-4 py-2">Beskrivning</th>
                  <th className="px-4 py-2 text-right">Antal</th>
                  <th className="px-4 py-2 text-right">À-pris</th>
                  <th className="px-4 py-2 text-right">Summa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {invoice.lineItems.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-2 text-[var(--text-primary)]">{item.description}</td>
                    <td className="px-4 py-2 text-right text-[var(--text-secondary)]">{item.quantity} {item.unit ?? ''}</td>
                    <td className="px-4 py-2 text-right text-[var(--text-secondary)]">{fmtMoney(item.unitPrice, invoice.currency)}</td>
                    <td className="px-4 py-2 text-right font-medium text-[var(--text-primary)]">{fmtMoney(lineIncVat(item), invoice.currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex justify-end">
            <div className="flex w-64 justify-between text-base font-semibold text-[var(--text-primary)]">
              <span>Krediteras totalt</span>
              <span>{fmtMoney(invoice.totalIncVat, invoice.currency)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border)] pt-4">
        <Button type="button" variant="ghost" onClick={() => setConfirmDelete(true)} disabled={busy}>
          <TrashIcon />
          Ta bort utkast
        </Button>
        <Button type="button" onClick={() => setConfirmSend(true)} disabled={busy}>
          <SendIcon />
          Utfärda kreditfaktura
        </Button>
      </div>

      <ConfirmDestructiveDialog
        open={confirmSend}
        onOpenChange={setConfirmSend}
        title="Utfärda kreditfakturan?"
        description="Kreditfakturan tilldelas nästa löpnummer i serien och låses. Den kan inte ändras efteråt."
        confirmLabel="Utfärda"
        loading={busy}
        onConfirm={doSend}
      />
      <ConfirmDestructiveDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Ta bort utkastet?"
        description="Utkastet till kreditfaktura tas bort permanent."
        loading={busy}
        onConfirm={doDelete}
      />
    </div>
  );
}
