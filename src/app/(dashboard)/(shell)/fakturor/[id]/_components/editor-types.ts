import type { InvoiceLineItem, InvoiceLineItemInput } from '@shared/lib/api/invoices.api';

/** A line in the editor — client-only `key` keeps React list identity stable. */
export interface EditableLineRow {
  key: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  vatRate: number;       // stored as a fraction (0.25)
  discount: number;      // percent 0–100
  /** Labour line that grounds the ROT/RUT deduction (lineType 'labour' + eligible). */
  rotRutEligible: boolean;
}

let counter = 0;
function nextKey(): string {
  counter += 1;
  return `line-${Date.now()}-${counter}`;
}

export function rowFromLineItem(item: InvoiceLineItem): EditableLineRow {
  return {
    key: item.id || nextKey(),
    description: item.description,
    quantity: item.quantity,
    unit: item.unit ?? '',
    unitPrice: item.unitPrice,
    vatRate: item.vatRate,
    discount: item.discount,
    rotRutEligible: item.lineType === 'labour' && item.rotRutEligible,
  };
}

export function blankRow(): EditableLineRow {
  return {
    key: nextKey(),
    description: '',
    quantity: 1,
    unit: '',
    unitPrice: 0,
    vatRate: 0.25,
    discount: 0,
    rotRutEligible: false,
  };
}

/** Maps editor rows to the API line-item input shape. */
export function rowsToInput(rows: EditableLineRow[]): InvoiceLineItemInput[] {
  return rows
    .filter((r) => r.description.trim() && r.quantity > 0)
    .map((r, index) => ({
      description: r.description.trim(),
      quantity: r.quantity,
      unit: r.unit.trim() || null,
      unitPrice: r.unitPrice,
      vatRate: r.vatRate,
      discount: r.discount || 0,
      sortOrder: index,
      lineType: r.rotRutEligible ? 'labour' : 'standard',
      rotRutEligible: r.rotRutEligible,
    }));
}
