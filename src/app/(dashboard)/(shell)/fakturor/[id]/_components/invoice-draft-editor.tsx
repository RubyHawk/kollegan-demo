'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@shared/ui/button';
import { Input } from '@shared/ui/input';
import { Label } from '@shared/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@shared/ui/card';
import { ConfirmDestructiveDialog } from '@shared/ui/confirm-destructive-dialog';
import { SendIcon, TrashIcon } from '@shared/ui/icons';
import {
  deleteInvoice,
  sendInvoice,
  setInvoiceRotRut,
  updateInvoice,
  type Invoice,
  type SetRotRutPayload,
} from '@shared/lib/api/invoices.api';
import { InvoiceLineEditor } from './invoice-line-editor';
import { RotRutPanel } from './rotrut-panel';
import { rowFromLineItem, rowsToInput, type EditableLineRow } from './editor-types';

interface Props {
  invoice: Invoice;
  onReload: () => Promise<void>;
}

export function InvoiceDraftEditor({ invoice, onReload }: Props) {
  const router = useRouter();
  const [recipientName, setRecipientName] = useState(invoice.recipientName ?? '');
  const [recipientEmail, setRecipientEmail] = useState(invoice.recipientEmail ?? '');
  const [recipientCompany, setRecipientCompany] = useState(invoice.recipientCompany ?? '');
  const [issueDate, setIssueDate] = useState(invoice.issueDate);
  const [dueDate, setDueDate] = useState(invoice.dueDate);
  const [paymentReference, setPaymentReference] = useState(invoice.paymentReference ?? '');
  const [notes, setNotes] = useState(invoice.notes ?? '');
  const [rows, setRows] = useState<EditableLineRow[]>(invoice.lineItems.map(rowFromLineItem));

  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmSend, setConfirmSend] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  function touch<T>(setter: (v: T) => void) {
    return (value: T) => { setDirty(true); setter(value); };
  }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      await updateInvoice(invoice.id, {
        recipientName: recipientName.trim() || undefined,
        recipientEmail: recipientEmail.trim() || undefined,
        recipientCompany: recipientCompany.trim() || undefined,
        issueDate,
        dueDate,
        paymentReference: paymentReference.trim() || undefined,
        notes: notes.trim() || undefined,
        lineItems: rowsToInput(rows),
      });
      setDirty(false);
      await onReload();
    } catch (e) {
      setError((e as Error).message || 'Kunde inte spara fakturan.');
    } finally {
      setSaving(false);
    }
  }

  async function applyRotRut(payload: SetRotRutPayload) {
    setBusy(true);
    setError(null);
    try {
      await setInvoiceRotRut(invoice.id, payload);
      await onReload();
    } catch (e) {
      setError((e as Error).message || 'Kunde inte spara ROT/RUT-avdraget.');
    } finally {
      setBusy(false);
    }
  }

  async function doSend() {
    setBusy(true);
    setError(null);
    try {
      // Persist edits first so the issued invoice freezes the latest content.
      if (dirty) {
        await updateInvoice(invoice.id, {
          recipientName: recipientName.trim() || undefined,
          recipientEmail: recipientEmail.trim() || undefined,
          recipientCompany: recipientCompany.trim() || undefined,
          issueDate,
          dueDate,
          paymentReference: paymentReference.trim() || undefined,
          notes: notes.trim() || undefined,
          lineItems: rowsToInput(rows),
        });
        setDirty(false);
      }
      await sendInvoice(invoice.id);
      setConfirmSend(false);
      await onReload();
    } catch (e) {
      setError((e as Error).message || 'Kunde inte skicka fakturan.');
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
      setError((e as Error).message || 'Kunde inte ta bort fakturan.');
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

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Mottagare</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="rec-name">Namn</Label>
            <Input id="rec-name" value={recipientName} onChange={(e) => touch(setRecipientName)(e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label htmlFor="rec-email">E-post</Label>
            <Input id="rec-email" type="email" value={recipientEmail} onChange={(e) => touch(setRecipientEmail)(e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label htmlFor="rec-company">Företag</Label>
            <Input id="rec-company" value={recipientCompany} onChange={(e) => touch(setRecipientCompany)(e.target.value)} className="mt-1" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Detaljer</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-3">
          <div>
            <Label htmlFor="issue-date">Fakturadatum</Label>
            <Input id="issue-date" type="date" value={issueDate} onChange={(e) => touch(setIssueDate)(e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label htmlFor="due-date">Förfallodatum</Label>
            <Input id="due-date" type="date" value={dueDate} onChange={(e) => touch(setDueDate)(e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label htmlFor="pay-ref">Betalreferens (OCR/bankgiro)</Label>
            <Input id="pay-ref" value={paymentReference} onChange={(e) => touch(setPaymentReference)(e.target.value)} className="mt-1" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Rader</CardTitle>
        </CardHeader>
        <CardContent>
          <InvoiceLineEditor
            rows={rows}
            currency={invoice.currency}
            onChange={(next) => { setDirty(true); setRows(next); }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">ROT/RUT-avdrag</CardTitle>
        </CardHeader>
        <CardContent>
          <RotRutPanel invoice={invoice} busy={busy} dirtyLines={dirty} onApply={applyRotRut} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Meddelande</CardTitle>
        </CardHeader>
        <CardContent>
          <textarea
            value={notes}
            onChange={(e) => touch(setNotes)(e.target.value)}
            rows={4}
            placeholder="Frivillig text som visas på fakturan"
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-alt)] px-3 py-2 text-sm text-[var(--text-primary)]"
          />
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border)] pt-4">
        <Button type="button" variant="ghost" onClick={() => setConfirmDelete(true)} disabled={busy}>
          <TrashIcon />
          Ta bort utkast
        </Button>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={save} disabled={saving || busy}>
            {saving ? 'Sparar…' : 'Spara utkast'}
          </Button>
          <Button type="button" onClick={() => setConfirmSend(true)} disabled={busy || saving}>
            <SendIcon />
            Skicka faktura
          </Button>
        </div>
      </div>

      <ConfirmDestructiveDialog
        open={confirmSend}
        onOpenChange={setConfirmSend}
        title="Skicka fakturan?"
        description="Fakturan tilldelas ett löpnummer och låses. Den kan inte längre ändras — korrigeringar görs med en kreditfaktura."
        confirmLabel="Skicka"
        loading={busy}
        onConfirm={doSend}
      />
      <ConfirmDestructiveDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Ta bort utkastet?"
        description="Utkastet tas bort permanent. Endast utkast kan tas bort."
        loading={busy}
        onConfirm={doDelete}
      />
    </div>
  );
}
