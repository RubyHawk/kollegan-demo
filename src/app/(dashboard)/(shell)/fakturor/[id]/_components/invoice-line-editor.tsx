'use client';

import { Button } from '@shared/ui/button';
import { Input } from '@shared/ui/input';
import { PlusIcon, TrashIcon } from '@shared/ui/icons';
import { fmtMoney } from '../../_lib/invoice-display';
import { computeTotals, lineIncVat } from '../../_lib/invoice-pricing';
import { blankRow, type EditableLineRow } from './editor-types';

interface Props {
  rows: EditableLineRow[];
  currency: string;
  onChange: (rows: EditableLineRow[]) => void;
}

const VAT_OPTIONS = [
  { value: 0.25, label: '25 %' },
  { value: 0.12, label: '12 %' },
  { value: 0.06, label: '6 %' },
  { value: 0, label: '0 %' },
];

export function InvoiceLineEditor({ rows, currency, onChange }: Props) {
  const totals = computeTotals(rows);

  function update(key: string, patch: Partial<EditableLineRow>) {
    onChange(rows.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  }
  function remove(key: string) {
    onChange(rows.filter((r) => r.key !== key));
  }
  function add() {
    onChange([...rows, blankRow()]);
  }

  return (
    <div className="space-y-3">
      <div className="space-y-3">
        {rows.map((row) => (
          <div
            key={row.key}
            className="rounded-xl border border-[var(--border)] bg-[var(--surface-alt)] p-3"
          >
            <div className="grid gap-2 sm:grid-cols-12">
              <div className="sm:col-span-12">
                <Input
                  placeholder="Beskrivning"
                  value={row.description}
                  onChange={(e) => update(row.key, { description: e.target.value })}
                />
              </div>
              <label className="sm:col-span-2">
                <span className="mb-1 block text-xs text-[var(--text-muted)]">Antal</span>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={row.quantity}
                  onChange={(e) => update(row.key, { quantity: Number(e.target.value) })}
                />
              </label>
              <label className="sm:col-span-2">
                <span className="mb-1 block text-xs text-[var(--text-muted)]">Enhet</span>
                <Input
                  placeholder="st"
                  value={row.unit}
                  onChange={(e) => update(row.key, { unit: e.target.value })}
                />
              </label>
              <label className="sm:col-span-3">
                <span className="mb-1 block text-xs text-[var(--text-muted)]">À-pris (exkl. moms)</span>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={row.unitPrice}
                  onChange={(e) => update(row.key, { unitPrice: Number(e.target.value) })}
                />
              </label>
              <label className="sm:col-span-2">
                <span className="mb-1 block text-xs text-[var(--text-muted)]">Rabatt %</span>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  step="1"
                  value={row.discount}
                  onChange={(e) => update(row.key, { discount: Number(e.target.value) })}
                />
              </label>
              <label className="sm:col-span-3">
                <span className="mb-1 block text-xs text-[var(--text-muted)]">Moms</span>
                <select
                  value={row.vatRate}
                  onChange={(e) => update(row.key, { vatRate: Number(e.target.value) })}
                  className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--text-primary)]"
                >
                  {VAT_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </label>
            </div>

            <div className="mt-2 flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                <input
                  type="checkbox"
                  checked={row.rotRutEligible}
                  onChange={(e) => update(row.key, { rotRutEligible: e.target.checked })}
                  className="h-4 w-4 rounded border-[var(--border)]"
                />
                Arbete (ROT/RUT-grundande)
              </label>
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-[var(--text-primary)]">
                  {fmtMoney(lineIncVat(row), currency)}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => remove(row.key)}
                  aria-label="Ta bort rad"
                >
                  <TrashIcon />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Button type="button" variant="outline" size="sm" onClick={add}>
        <PlusIcon />
        Lägg till rad
      </Button>

      <div className="flex flex-col items-end gap-1 border-t border-[var(--border)] pt-3 text-sm">
        <div className="flex w-56 justify-between text-[var(--text-secondary)]">
          <span>Summa exkl. moms</span>
          <span>{fmtMoney(totals.totalExVat, currency)}</span>
        </div>
        <div className="flex w-56 justify-between text-[var(--text-secondary)]">
          <span>Moms</span>
          <span>{fmtMoney(totals.totalVat, currency)}</span>
        </div>
        <div className="flex w-56 justify-between text-base font-semibold text-[var(--text-primary)]">
          <span>Att betala</span>
          <span>{fmtMoney(totals.totalIncVat, currency)}</span>
        </div>
      </div>
    </div>
  );
}
