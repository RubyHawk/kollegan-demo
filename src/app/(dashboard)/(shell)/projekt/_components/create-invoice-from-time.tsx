'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ReceiptIcon } from '@phosphor-icons/react';
import { Button } from '@shared/ui/button';
import { Input } from '@shared/ui/input';
import { Label } from '@shared/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@shared/ui/dialog';
import { createInvoice } from '@shared/lib/api/invoices.api';

interface Props {
  projectId: string;
  /** Ids of billable, still-unbilled time entries to bill. */
  entryIds: string[];
  /** Total unbilled billable hours, for the dialog copy. */
  unbilledHours: number;
}

function fmtHours(hours: number): string {
  return `${new Intl.NumberFormat('sv-SE', { maximumFractionDigits: 2 }).format(hours)} h`;
}

/**
 * Creates a draft invoice from a project's billable, unbilled time entries
 * (grouped server-side into labour lines), then opens the invoice editor where
 * the recipient, prices, and any ROT/RUT deduction are finalised before issuing.
 */
export function CreateInvoiceFromTime({ projectId, entryIds, unbilledHours }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [hourlyRate, setHourlyRate] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function create() {
    setCreating(true);
    setError(null);
    try {
      const rate = Number(hourlyRate);
      const invoice = await createInvoice({
        source: 'time',
        projectId,
        timeEntryIds: entryIds,
        hourlyRate: Number.isFinite(rate) && rate > 0 ? rate : undefined,
      });
      router.push(`/fakturor/${invoice.id}`);
    } catch (e) {
      setError((e as Error).message || 'Kunde inte skapa faktura från tid.');
      setCreating(false);
    }
  }

  return (
    <>
      <Button
        variant="secondary"
        size="sm"
        disabled={entryIds.length === 0}
        onClick={() => { setError(null); setOpen(true); }}
      >
        <ReceiptIcon />
        {'Skapa faktura från tid'}
      </Button>

      <Dialog open={open} onOpenChange={(next) => { if (!creating) setOpen(next); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{'Skapa faktura från tid'}</DialogTitle>
            <DialogDescription>
              {`${fmtHours(unbilledHours)} ej fakturerad debiterbar tid grupperas till arbetsrader. Ange ett timpris — du kan justera priser, mottagare och ROT/RUT i fakturan efteråt.`}
            </DialogDescription>
          </DialogHeader>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <div>
            <Label htmlFor="hourly-rate">{'Timpris (exkl. moms)'}</Label>
            <Input
              id="hourly-rate"
              type="number"
              min={0}
              step="1"
              value={hourlyRate}
              onChange={(e) => setHourlyRate(e.target.value)}
              placeholder="t.ex. 850"
              className="mt-1"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={creating}>
              {'Avbryt'}
            </Button>
            <Button type="button" onClick={create} disabled={creating}>
              {creating ? 'Skapar…' : 'Skapa utkast'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
