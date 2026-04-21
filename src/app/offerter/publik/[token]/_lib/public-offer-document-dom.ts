import type { SignatureFields } from '../_types/public-offer.types';
import { SWEDISH_MONTHS_SHORT } from './public-offer-formatters';

function normalizeBrokenSwedish(text: string): string {
  return text
    .replace(/\u00c3\u2026/g, '\u00c5')
    .replace(/\u00c3\u201e/g, '\u00c4')
    .replace(/\u00c3\u2013/g, '\u00d6')
    .replace(/\u00c3\u00a5/g, '\u00e5')
    .replace(/\u00c3\u00a4/g, '\u00e4')
    .replace(/\u00c3\u00b6/g, '\u00f6')
    .replace(/\u00c2\u00a0/g, '\u00a0')
    .replace(/\u00c2\u00b7/g, '\u00b7')
    .replace(/\u00e2\u20ac\u201d/g, '\u2014')
    .replace(/\u00e2\u20ac\u201c/g, '\u2013')
    .replace(/\u00e2\u20ac\u0153/g, '\u201c')
    .replace(/\u00e2\u20ac\u009d/g, '\u201d')
    .replace(/\u00e2\u20ac\u2122/g, '\u2019');
}

export function normalizeOfferText(text: string): string {
  return normalizeBrokenSwedish(text)
    .replace(/\u00c3\u2026/g, '\u00c5')
    .replace(/\u00c3\u201e/g, '\u00c4')
    .replace(/\u00c3\u2013/g, '\u00d6')
    .replace(/\u00c3\u00a5/g, '\u00e5')
    .replace(/\u00c3\u00a4/g, '\u00e4')
    .replace(/\u00c3\u00b6/g, '\u00f6')
    .replace(/\u00c2\u00a0/g, '\u00a0')
    .replace(/\u00c2\u00b7/g, '\u00b7')
    .replace(/\u00c2(?=[\u00a0 0-9%.,:;|kr])/g, '');
}

export function compactDateText(value: string): string {
  const trimmed = normalizeOfferText(value).trim();
  const parts = trimmed.match(/^(\d{1,2})\s+([A-Za-zÅÄÖåäö.]+)\s+(\d{4})$/);
  if (!parts) return trimmed;

  const [, dayValue, monthValue, yearValue] = parts;
  const normalizedMonth = monthValue.toLocaleLowerCase('sv-SE').replace(/\.$/, '');
  const monthMap: Record<string, number> = {
    januari: 0, jan: 0,
    februari: 1, feb: 1,
    mars: 2, mar: 2,
    april: 3, apr: 3,
    maj: 4,
    juni: 5, jun: 5,
    juli: 6, jul: 6,
    augusti: 7, aug: 7,
    september: 8, sep: 8,
    oktober: 9, okt: 9,
    november: 10, nov: 10,
    december: 11, dec: 11,
  };
  const monthIndex = monthMap[normalizedMonth];
  if (monthIndex == null) return trimmed;

  return `${Number(dayValue)} ${SWEDISH_MONTHS_SHORT[monthIndex]} ${yearValue}`;
}

export function isPromoPageBlock(pageBlock: HTMLElement): boolean {
  const pageContent = pageBlock.querySelector<HTMLElement>('.page-content') ?? pageBlock;
  const text = pageContent.innerText.replace(/\s+/g, ' ').trim();
  const topLevelChildren = Array.from(pageContent.children) as HTMLElement[];
  const hasEdgeToEdgeAbsoluteImage = topLevelChildren.some((child) => child.style.position === 'absolute');
  const hasMeaningfulInlineContent = topLevelChildren.some((child) => {
    if (child.style.position === 'absolute') return false;
    const childText = child.innerText.replace(/\s+/g, ' ').trim();
    return childText.length >= 40 || /^(H[1-6]|UL|OL|TABLE)$/.test(child.tagName);
  });
  const hasStructuredOfferContent = !!pageContent.querySelector(
    '.offer-shell, .offer-items, .offer-summary, [data-var="lineItems"], table',
  );

  return hasEdgeToEdgeAbsoluteImage && !hasMeaningfulInlineContent && !hasStructuredOfferContent && text.length < 40;
}

export function findFirstOfferPageIndex(pageBlocks: HTMLElement[]): number {
  const firstOfferPageIndex = pageBlocks.findIndex((pageBlock) => !isPromoPageBlock(pageBlock));
  return firstOfferPageIndex === -1 ? 0 : firstOfferPageIndex;
}

export function findOfferAnchor(pageBlock: HTMLElement | null): HTMLElement | null {
  if (!pageBlock) return null;

  return pageBlock.querySelector<HTMLElement>(
    '.offer-shell__topline, .offer-shell, .offer-section, .offer-items, .offer-summary, h1, h2, table',
  );
}

function looksLikeLegacyLineItemTableText(text: string): boolean {
  const normalized = text
    .replace(/\s+/g, ' ')
    .trim()
    .toLocaleUpperCase('sv-SE');

  const hasHeader = normalized.includes('BESKRIVNING') || normalized.includes('PRODUKT ELLER TJÄNST');
  const hasColumns = normalized.includes('ANTAL')
    && (normalized.includes('À-PRIS') || normalized.includes('Å-PRIS') || normalized.includes('A-PRIS'))
    && normalized.includes('MOMS')
    && normalized.includes('BELOPP');

  return hasHeader && hasColumns;
}

export function stripLegacyLineItemTables(root: ParentNode): void {
  const hasStructuredItems = !!root.querySelector('.offer-items, .offer-items__table, .offer-items__cards, .offer-item-card');
  if (!hasStructuredItems) return;

  root.querySelectorAll<HTMLTableSectionElement>('thead').forEach((section) => {
    if (looksLikeLegacyLineItemTableText(section.innerText)) {
      section.parentElement?.remove();
    }
  });

  root.querySelectorAll<HTMLTableElement>('table').forEach((table) => {
    if (looksLikeLegacyLineItemTableText(table.innerText)) {
      table.remove();
    }
  });
}

export function applySignatureFields(root: ParentNode, signature?: SignatureFields) {
  root.querySelectorAll('[data-sig-field]').forEach((el) => {
    const field = el.getAttribute('data-sig-field');
    const container = el as HTMLElement;

    if (!signature?.image && !signature?.name && !signature?.date) {
      container.style.display = 'none';
      return;
    }

    container.replaceChildren();
    container.style.border = 'none';
    container.style.borderRadius = '0';
    container.style.background = 'transparent';
    container.style.padding = '4px 0';
    container.style.minHeight = '0';
    container.style.display = 'block';

    if (field === 'signature') {
      if (!signature.image) {
        container.style.display = 'none';
        return;
      }
      const img = document.createElement('img');
      img.src = signature.image;
      img.alt = 'Signatur';
      img.style.maxWidth = '260px';
      img.style.maxHeight = '80px';
      img.style.display = 'block';
      container.appendChild(img);
      return;
    }

    if (field === 'name') {
      if (!signature.name) {
        container.style.display = 'none';
        return;
      }
      const name = document.createElement('span');
      name.textContent = signature.name;
      name.style.fontSize = '15px';
      name.style.color = '#1e293b';
      name.style.fontWeight = '500';
      container.appendChild(name);
      return;
    }

    if (field === 'date') {
      if (!signature.date) {
        container.style.display = 'none';
        return;
      }
      const date = document.createElement('span');
      date.textContent = signature.date;
      date.style.fontSize = '14px';
      date.style.color = '#475569';
      container.appendChild(date);
      return;
    }

    container.style.display = 'none';
  });
}
