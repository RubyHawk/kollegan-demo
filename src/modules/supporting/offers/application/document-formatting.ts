import { escapeHtml as secureEscapeHtml } from '@platform/security/sanitize';
import type { Offer, OfferLineItem } from '../domain/offer.entity';

export const DEFAULT_DOCUMENT_TERMS_HEADING = 'Juridiska villkor';
export const DEFAULT_DOCUMENT_TERMS_BODY = 'Offerten gäller till angivet datum. Arbetet utförs enligt överenskommen omfattning och faktureras enligt summeringen ovan. Eventuella ändringar eller tillägg hanteras som separat tilläggsbeställning.';
export const DEFAULT_DOCUMENT_NOTES_HEADING = 'Anteckningar';

export function fmtSEK(n: number): string {
  return new Intl.NumberFormat('sv-SE', {
    style: 'currency', currency: 'SEK', maximumFractionDigits: 0,
  }).format(n);
}

export function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('sv-SE', {
    day: '2-digit', month: 'long', year: 'numeric',
  });
}

export function fmtSEKPrecise(n: number): string {
  return new Intl.NumberFormat('sv-SE', {
    style: 'currency', currency: 'SEK', minimumFractionDigits: 2, maximumFractionDigits: 2,
  }).format(n);
}

function fmtQuantity(n: number): string {
  return new Intl.NumberFormat('sv-SE', {
    minimumFractionDigits: Number.isInteger(n) ? 0 : 2,
    maximumFractionDigits: Number.isInteger(n) ? 0 : 2,
  }).format(n);
}

function normalizeLineItemUnit(unit: string): string {
  return unit
    .trim()
    .replace(/\u00c2(?=[\u00b2\u00b3])/g, '')
    .toLocaleLowerCase('sv-SE');
}

function formatLineItemUnitHtml(unit: string): string {
  const cleanedUnit = unit.trim().replace(/\u00c2(?=[\u00b2\u00b3])/g, '');
  const normalized = normalizeLineItemUnit(cleanedUnit);
  if (!normalized) return '';
  if (['m2', 'm^2', 'm²', 'kvm'].includes(normalized)) return 'm&sup2;';
  if (['m3', 'm^3', 'm³'].includes(normalized)) return 'm&sup3;';
  return escapeHtml(cleanedUnit);
}

export function formatOfferLineItemQuantityHtml(item: OfferLineItem): string {
  const quantity = fmtQuantity(item.quantity);
  const maybeUnit = typeof (item as OfferLineItem & { unit?: unknown }).unit === 'string'
    ? String((item as OfferLineItem & { unit?: unknown }).unit).trim().replace(/\u00c2(?=[\u00b2\u00b3])/g, '')
    : '';

  if (!maybeUnit) return `${quantity} st`;
  return `${quantity} ${formatLineItemUnitHtml(maybeUnit)}`;
}

export function getOfferLineItemDescription(description: string): { title: string; detail?: string } {
  const value = description.trim();
  const separator = [' — ', ' – ', ' - ', ' â€” '].find((candidate) => value.includes(candidate)) ?? '';
  if (!separator) return { title: value };

  const [title, ...rest] = value.split(separator);
  const detail = rest.join(separator).trim();
  return {
    title: title.trim(),
    detail: detail || undefined,
  };
}

export function buildCustomerLines(offer: Offer): string[] {
  const lines = [
    offer.recipientCompany ?? '',
    offer.recipientName,
    offer.recipientEmail,
  ];

  const seen = new Set<string>();
  return lines
    .map((value) => value.trim())
    .filter((value) => value.length > 0)
    .filter((value) => {
      const key = value.toLocaleLowerCase('sv-SE');
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

export function renderRichPlainText(value: string): string {
  return secureEscapeHtml(value).replace(/\r?\n/g, '<br />');
}

export function resolveFreeImageRenderZIndex(zIndex: number, background = false): number {
  if (background || zIndex < 0) return 0;
  return 20 + zIndex;
}

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function getCompactBrandingAddressLines(addressLines: string[] = []): string[] {
  const seen = new Set<string>();
  return addressLines
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .filter((line) => !/^(sverige|sweden)$/i.test(line))
    .filter((line) => {
      const key = line.toLocaleLowerCase('sv-SE');
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}
