'use client';

import { useState } from 'react';
import { Button } from '@shared/ui/button';
import { Input } from '@shared/ui/input';
import { Label } from '@shared/ui/label';
import type { Invoice, RotRutType, SetRotRutPayload } from '@shared/lib/api/invoices.api';
import { fmtMoney } from '../../_lib/invoice-display';

interface Props {
  invoice: Invoice;
  busy: boolean;
  /** True when there are unsaved line changes — deduction is computed from saved lines. */
  dirtyLines: boolean;
  onApply: (payload: SetRotRutPayload) => Promise<void>;
}

type TypeChoice = '' | RotRutType;

export function RotRutPanel({ invoice, busy, dirtyLines, onApply }: Props) {
  const [type, setType] = useState<TypeChoice>((invoice.rotRutType ?? '') as TypeChoice);
  const [pnr, setPnr] = useState(invoice.buyerPersonalNumber ?? '');
  const [property, setProperty] = useState(invoice.propertyDesignation ?? '');
  const [brf, setBrf] = useState(invoice.housingSocietyOrgNumber ?? '');

  const isRot = type === 'ROT';
  const hasDeduction = invoice.rotRutType && invoice.rotRutDeductionAmount > 0;

  function apply() {
    void onApply({
      rotRutType: type === '' ? null : type,
      buyerPersonalNumber: pnr.trim() || undefined,
      propertyDesignation: isRot ? property.trim() || undefined : undefined,
      housingSocietyOrgNumber: isRot ? brf.trim() || undefined : undefined,
    });
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-[var(--text-secondary)]">
        Skatteavdrag på arbetskostnad (ROT 30 % / RUT 50 %). Markera arbetsrader som
        ROT/RUT-grundande och spara fakturan — avdraget beräknas på de sparade raderna.
      </p>

      {dirtyLines && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
          Du har osparade radändringar. Spara fakturan innan du beräknar avdraget.
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="rotrut-type">Avdragstyp</Label>
          <select
            id="rotrut-type"
            value={type}
            onChange={(e) => setType(e.target.value as TypeChoice)}
            className="mt-1 h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--surface-alt)] px-3 text-sm text-[var(--text-primary)]"
          >
            <option value="">Inget avdrag</option>
            <option value="ROT">ROT (renovering, 30 %)</option>
            <option value="RUT">RUT (hushållsnära, 50 %)</option>
          </select>
        </div>

        {type !== '' && (
          <div>
            <Label htmlFor="rotrut-pnr">Personnummer (köpare)</Label>
            <Input
              id="rotrut-pnr"
              value={pnr}
              onChange={(e) => setPnr(e.target.value)}
              placeholder="ÅÅÅÅMMDD-XXXX"
              className="mt-1"
            />
          </div>
        )}

        {isRot && (
          <>
            <div>
              <Label htmlFor="rotrut-property">Fastighetsbeteckning</Label>
              <Input
                id="rotrut-property"
                value={property}
                onChange={(e) => setProperty(e.target.value)}
                placeholder="t.ex. Kommunen Kvarteret 1:23"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="rotrut-brf">eller BRF org.nr</Label>
              <Input
                id="rotrut-brf"
                value={brf}
                onChange={(e) => setBrf(e.target.value)}
                placeholder="org.nr för bostadsrättsförening"
                className="mt-1"
              />
            </div>
          </>
        )}
      </div>

      {hasDeduction && (
        <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-alt)] p-3 text-sm">
          <div className="flex justify-between text-[var(--text-secondary)]">
            <span>Arbetskostnad (inkl. moms)</span>
            <span>{fmtMoney(invoice.rotRutLaborAmount, invoice.currency)}</span>
          </div>
          <div className="mt-1 flex justify-between font-medium text-[var(--text-primary)]">
            <span>{invoice.rotRutType}-avdrag</span>
            <span>−{fmtMoney(invoice.rotRutDeductionAmount, invoice.currency)}</span>
          </div>
          <div className="mt-1 flex justify-between text-[var(--text-secondary)]">
            <span>Kunden betalar</span>
            <span>{fmtMoney(invoice.totalIncVat - invoice.rotRutDeductionAmount, invoice.currency)}</span>
          </div>
        </div>
      )}

      <Button type="button" variant="secondary" size="sm" onClick={apply} disabled={busy}>
        {type === '' ? 'Ta bort avdrag' : 'Beräkna och spara avdrag'}
      </Button>
    </div>
  );
}
