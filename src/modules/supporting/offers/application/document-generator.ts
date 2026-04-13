/**
 * Document Generator ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â server-side only.
 *
 * Converts a TipTap JSON template to HTML and replaces {{placeholder}} variables
 * with offer data. Called at offer-send time to create an immutable HTML snapshot
 * stored in Offer.generatedDocument.
 *
 * Available template variables: {{offerNumber}}, {{offerTitle}}, {{quoteNumber}},
 * {{createdDate}}, {{validUntil}}, {{recipientName}}, {{recipientEmail}},
 * {{recipientCompany}}, {{totalExVat}}, {{totalIncVat}}, {{vatAmount}},
 * {{notes}}, {{lineItems}}, {{signature}}.
 *
 * TipTap JSON node types handled:
 *   doc, paragraph, heading (levels 1-3), bulletList, orderedList, listItem,
 *   text (with bold / italic / underline / color marks), hardBreak, horizontalRule,
 *   image (with width / align attrs)
 */

import type { Offer, OfferLineItem } from '../domain/offer.entity';
import {
  formatVatRate,
  getDisplayLineTotal,
  getDisplayUnitPrice,
  normalizeVatRate,
  summarizeOfferPricing,
  summarizePersistedOfferPricing,
} from '../domain/pricing';
import type { OfferBrandingProfile } from './company-branding';
import { sanitizeUrl, escapeHtml as secureEscapeHtml } from '@platform/security/sanitize';

// ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ SEK formatter ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬

function fmtSEK(n: number): string {
  return new Intl.NumberFormat('sv-SE', {
    style: 'currency', currency: 'SEK', maximumFractionDigits: 0,
  }).format(n);
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('sv-SE', {
    day: '2-digit', month: 'long', year: 'numeric',
  });
}

function fmtSEKPrecise(n: number): string {
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

function formatOfferLineItemQuantityHtml(item: OfferLineItem): string {
  const quantity = fmtQuantity(item.quantity);
  const maybeUnit = typeof (item as OfferLineItem & { unit?: unknown }).unit === 'string'
    ? String((item as OfferLineItem & { unit?: unknown }).unit).trim().replace(/\u00c2(?=[\u00b2\u00b3])/g, '')
    : '';

  if (!maybeUnit) return `${quantity} st`;
  return `${quantity} ${formatLineItemUnitHtml(maybeUnit)}`;
}

function buildOfferSummary(offer: Offer) {
  return summarizePersistedOfferPricing(offer);
}

function getOfferLineItemDescription(description: string): { title: string; detail?: string } {
  const value = description.trim();
  const separator = [' — ', ' – ', ' - ', ' ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â '].find((candidate) => value.includes(candidate)) ?? '';
  if (!separator) return { title: value };

  const [title, ...rest] = value.split(separator);
  const detail = rest.join(separator).trim();
  return {
    title: title.trim(),
    detail: detail || undefined,
  };
}

function buildCustomerLines(offer: Offer): string[] {
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

const DEFAULT_DOCUMENT_TERMS_HEADING = 'Juridiska villkor';
const DEFAULT_DOCUMENT_TERMS_BODY = 'Offerten gäller till angivet datum. Arbetet utförs enligt överenskommen omfattning och faktureras enligt summeringen ovan. Eventuella ändringar eller tillägg hanteras som separat tilläggsbeställning.';
const DEFAULT_DOCUMENT_NOTES_HEADING = 'Anteckningar';

function renderRichPlainText(value: string): string {
  return secureEscapeHtml(value).replace(/\r?\n/g, '<br />');
}

function resolveFreeImageRenderZIndex(zIndex: number, background = false): number {
  if (background || zIndex < 0) return 0;
  return 20 + zIndex;
}

// ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ TipTap JSON ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢ HTML ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬

interface TipTapNode {
  type:    string;
  attrs?:  Record<string, unknown>;
  content?: TipTapNode[];
  text?:   string;
  marks?:  Array<{ type: string; attrs?: Record<string, unknown> }>;
}

function getNodeTextContent(node: TipTapNode): string {
  if (node.type === 'text') return String(node.text ?? '');
  return (node.content ?? []).map(getNodeTextContent).join('');
}

function normalizeNodeText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLocaleLowerCase('sv-SE');
}

function nodeToHtml(node: TipTapNode, replacements?: Record<string, string>): string {
  // Curry replacements into recursive calls
  const r = (n: TipTapNode) => nodeToHtml(n, replacements);

  switch (node.type) {
    case 'doc':
      return (node.content ?? []).map(r).join('');

    case 'paragraph': {
      const inner      = (node.content ?? []).map(r).join('');
      const align      = (node.attrs?.textAlign as string | undefined) ?? '';
      const alignStyle = align ? `text-align:${align};` : '';
      return `<p style="margin:0 0 0.75em 0;${alignStyle}">${inner || '&nbsp;'}</p>`;
    }

    case 'heading': {
      const level      = (node.attrs?.level as number) ?? 1;
      const tag        = `h${Math.min(level, 6)}`;
      const sizes: Record<number, string> = { 1: '1.8em', 2: '1.4em', 3: '1.2em' };
      const size       = sizes[level] ?? '1em';
      const align      = (node.attrs?.textAlign as string | undefined) ?? '';
      const alignStyle = align ? `text-align:${align};` : '';
      const inner      = (node.content ?? []).map(r).join('');
      return `<${tag} style="margin:0.5em 0;font-size:${size};font-weight:700;${alignStyle}">${inner}</${tag}>`;
    }

    case 'image': {
      const a        = node.attrs ?? {};
      const src      = sanitizeUrl(String(a.src ?? ''));
      const alt      = escapeHtml(String(a.alt ?? ''));
      const title    = escapeHtml(String(a.title ?? ''));
      const imgPos   = String(a.position ?? 'inline');
      const wrapText = String(a.wrapText ?? 'none');
      const posX     = Number(a.posX ?? 0);
      const posY     = Number(a.posY ?? 0);
      const zIdx     = Number(a.zIndex ?? 0);
      const isBackground = a.background === true || a.background === 'true';
      const imgW     = a.width  ? Number(a.width)  : null;
      const imgH     = a.height ? Number(a.height) : null;
      const fit      = String(a.fit ?? (imgH ? 'cover' : 'contain'));
      const widthStyle  = imgW ? `width:${imgW}px;max-width:100%;` : 'max-width:100%;';
      const heightStyle = imgH ? `height:${imgH}px;object-fit:${fit};` : 'height:auto;';
      const imgStyle = `display:block;${widthStyle}${heightStyle}border-radius:4px;`;

      if (imgPos === 'free') {
        if (wrapText === 'left' || wrapText === 'right') {
          // Float-based: participates in text flow
          const ml = wrapText === 'left'  ? `margin-left:${posX}px;`                                              : '';
          const mr = wrapText === 'right' ? `margin-right:${Math.max(0, 816 - posX - (imgW ?? 200))}px;`          : '';
          const mt = posY > 0 ? `margin-top:${posY}px;` : '';
          return `<div style="float:${wrapText};${ml}${mr}${mt}margin-bottom:8px;line-height:0;position:relative;z-index:${resolveFreeImageRenderZIndex(zIdx, isBackground)};"><img src="${src}" alt="${alt}" title="${title}" style="${imgStyle}" /></div>`;
        }
        // Pure overlay (absolute)
        const w = imgW ? `${imgW}px` : '200px';
        return `<div style="position:absolute;left:${posX}px;top:${posY}px;width:${w};z-index:${resolveFreeImageRenderZIndex(zIdx, isBackground)};line-height:0;"><img src="${src}" alt="${alt}" title="${title}" style="${imgStyle}" /></div>`;
      }

      // Inline/float modes
      if (a.float === 'left' || a.float === 'right') {
        const margin = a.float === 'left' ? '4px 20px 8px 0' : '4px 0 8px 20px';
        return `<div style="float:${a.float};margin:${margin};line-height:0;"><img src="${src}" alt="${alt}" title="${title}" style="${imgStyle}" /></div>`;
      }

      const align = String(a.align ?? 'left');
      const justifyMap: Record<string, string> = { center: 'center', right: 'flex-end', left: 'flex-start' };
      const justify = justifyMap[align] ?? 'flex-start';
      return `<div style="display:flex;justify-content:${justify};margin:12px 0;"><img src="${src}" alt="${alt}" title="${title}" style="${imgStyle}" /></div>`;
    }

    case 'bulletList':
      return `<ul style="margin:0 0 0.75em 1.5em;padding:0;">${(node.content ?? []).map(r).join('')}</ul>`;

    case 'orderedList':
      return `<ol style="margin:0 0 0.75em 1.5em;padding:0;">${(node.content ?? []).map(r).join('')}</ol>`;

    case 'listItem':
      return `<li style="margin-bottom:0.25em;">${(node.content ?? []).map(r).join('')}</li>`;

    case 'hardBreak':
      return '<br/>';

    case 'horizontalRule':
      return '<hr style="border:none;border-top:1px solid #e2e8f0;margin:1em 0;"/>';

    case 'text': {
      let text = escapeHtml(node.text ?? '');
      for (const mark of (node.marks ?? [])) {
        if (mark.type === 'bold')      text = `<strong>${text}</strong>`;
        if (mark.type === 'italic')    text = `<em>${text}</em>`;
        if (mark.type === 'underline') text = `<u>${text}</u>`;
        if (mark.type === 'code')      text = `<code style="background:#f1f5f9;padding:0.1em 0.3em;border-radius:3px;font-family:monospace;">${text}</code>`;
        if (mark.type === 'textStyle' && mark.attrs?.color) {
          text = `<span style="color:${String(mark.attrs.color)};">${text}</span>`;
        }
      }
      return text;
    }

    // ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ New node types ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬

    case 'variable': {
      // Resolve variable value from replacements map; fall back to chip label
      const key   = String(node.attrs?.key ?? '');
      const label = String(node.attrs?.label ?? key);
      const value = replacements?.[`{{${key}}}`];
      const content = value ?? escapeHtml(label);
      // Wrap in a span so the live preview can highlight/scroll to this variable
      return `<span data-var="${escapeHtml(key)}">${content}</span>`;
    }

    case 'signatureBlock': {
      const fieldType = String(node.attrs?.fieldType ?? 'signature');
      const label     = escapeHtml(String(node.attrs?.label ?? 'Signatur'));
      const icons: Record<string, string> = { signature: '&#9997;', name: '&#128100;', date: '&#128197;' };
      const subtext: Record<string, string> = {
        signature: 'Underteckna med e-signatur via l&auml;nken',
        name:      'Fullst&auml;ndigt namn',
        date:      'Signeringsdatum fylls i automatiskt',
      };
      return `
        <div data-sig-field="${fieldType}" style="display:flex;align-items:center;gap:12px;border:2px dashed #cbd5e1;border-radius:10px;padding:20px 24px;margin:16px 0;background:#f8fafc;">
          <span style="font-size:20px;">${icons[fieldType] ?? 'ÃƒÂ¢Ã…â€œÃ‚Â'}</span>
          <div style="flex:1;">
            <p style="font-weight:600;color:#334155;margin:0 0 2px;">${label}</p>
            <p style="font-size:11px;color:#94a3b8;margin:0;">${escapeHtml(subtext[fieldType] ?? '')}</p>
          </div>
        </div>`;
    }

    case 'table':
      return `<table style="width:100%;border-collapse:collapse;margin-bottom:1em;">${(node.content ?? []).map(r).join('')}</table>`;

    case 'tableRow':
      return `<tr>${(node.content ?? []).map(r).join('')}</tr>`;

    case 'tableHeader': {
      const inner = (node.content ?? []).map(r).join('');
      return `<th style="padding:8px 12px;background:#f8fafc;border:1px solid #e2e8f0;font-size:12px;font-weight:600;text-align:left;">${inner}</th>`;
    }

    case 'tableCell': {
      const inner = (node.content ?? []).map(r).join('');
      return `<td style="padding:8px 12px;border:1px solid #e2e8f0;font-size:13px;vertical-align:top;">${inner}</td>`;
    }

    default:
      // Unknown node type ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â render children if any
      return (node.content ?? []).map(r).join('');
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function stripLegacyStructuredIntroHtml(html: string): string {
  return html
    // Old table-based offer blocks should never render inside the new document page intro.
    .replace(/<table\b[\s\S]*?<\/table>/gi, '')
    // Remove standalone metadata paragraphs/headings from older templates.
    .replace(
      /<(p|div|h[1-6])[^>]*>\s*(?:<span[^>]*>\s*<\/span>\s*)*(?:offert\s*#|offertnummer|offertdatum|giltig\s+till)\b[\s\S]*?<\/\1>/gi,
      '',
    )
    // Remove old section headers that duplicate the structured table block.
    .replace(/<(p|div|h[1-6])[^>]*>\s*produkter\s+och\s+tj(?:ä|&auml;)nster\s*<\/\1>/gi, '')
    // Drop now-empty variable wrappers.
    .replace(/<span[^>]*data-var="(?:lineItems|offerNumber|quoteNumber|createdDate|validUntil)"[^>]*>\s*<\/span>/gi, '')
    // Remove empty blocks left after cleanup.
    .replace(/<(p|div|section|article|h[1-6])[^>]*>(?:\s|&nbsp;|<br\s*\/?>|<span[^>]*>\s*<\/span>)*<\/\1>/gi, '')
    .trim();
}

function stripEmptyLegacyTables(html: string): string {
  return html.replace(/<table\b[^>]*>[\s\S]*?<\/table>/gi, (tableHtml) => {
    if (!/<thead\b/i.test(tableHtml)) return tableHtml;

    const tbodyText = (tableHtml.match(/<tbody\b[^>]*>([\s\S]*?)<\/tbody>/i)?.[1] ?? '')
      .replace(/<p[^>]*>(?:\s|&nbsp;|<br\s*\/?>)*<\/p>/gi, '')
      .replace(/<br\s*\/?>/gi, '')
      .replace(/&nbsp;/gi, ' ')
      .replace(/<[^>]+>/g, '')
      .trim();

    return tbodyText.length === 0 ? '' : tableHtml;
  });
}

function stripLegacyLineItemTables(html: string): string {
  if (!html.includes('class="offer-items"')) return html;

  return html.replace(/<table\b[^>]*>[\s\S]*?<\/table>/gi, (tableHtml) => {
    const normalizedText = tableHtml
      .replace(/&Agrave;/gi, 'À')
      .replace(/&Aring;/gi, 'Å')
      .replace(/&nbsp;/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .toUpperCase();

    const looksLikeLegacyLineItemTable = (
      normalizedText.includes('BESKRIVNING')
      || normalizedText.includes('PRODUKT ELLER TJÄNST')
    ) && normalizedText.includes('ANTAL')
      && (normalizedText.includes('À-PRIS') || normalizedText.includes('Å-PRIS') || normalizedText.includes('A-PRIS'))
      && normalizedText.includes('MOMS')
      && normalizedText.includes('BELOPP');

    return looksLikeLegacyLineItemTable ? '' : tableHtml;
  });
}

// ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ Line items table ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬

function buildStructuredLineItems(items: OfferLineItem[], mode: Offer['priceDisplayMode']): string {
  const pricing = summarizeOfferPricing(items, mode);
  const showVatColumn = pricing.hasVat;
  const showDiscountColumn = items.some((item) => (item.discount ?? 0) > 0);
  const gridTemplate = [
    'minmax(0, 1fr)',
    '64px',
    '104px',
    ...(showDiscountColumn ? ['64px'] : []),
    ...(showVatColumn ? ['64px'] : []),
    '132px',
  ].join(' ');

  const headerCells = [
    '<span>Produkt eller tj\u00e4nst</span>',
    '<span>Antal</span>',
    '<span>&Agrave;-pris</span>',
    ...(showDiscountColumn ? ['<span>Rabatt</span>'] : []),
    ...(showVatColumn ? ['<span>Moms</span>'] : []),
    '<span>Belopp</span>',
  ].join('');

  const desktopRows = items.map((item) => {
    const displayUnitPrice = getDisplayUnitPrice(item, mode);
    const displayLineTotal = getDisplayLineTotal(item, mode);
    const description = getOfferLineItemDescription(item.description);
    return `
      <article class="offer-item-row" style="--offer-columns:${gridTemplate}">
        <div class="offer-item-row__product">
          <div class="offer-item-row__title">${escapeHtml(description.title)}</div>
          ${description.detail ? `<div class="offer-item-row__detail">${escapeHtml(description.detail)}</div>` : ''}
        </div>
        <div class="offer-item-row__value">${formatOfferLineItemQuantityHtml(item)}</div>
        <div class="offer-item-row__value">${fmtSEKPrecise(displayUnitPrice)}</div>
        ${showDiscountColumn ? `<div class="offer-item-row__value">${item.discount ? `${item.discount}%` : '—'}</div>` : ''}
        ${showVatColumn ? `<div class="offer-item-row__value">${formatVatRate(item.vatRate)}</div>` : ''}
        <div class="offer-item-row__value offer-item-row__value--strong">${fmtSEKPrecise(displayLineTotal)}</div>
      </article>`;
  }).join('');

  const mobileCards = items.map((item) => {
    const displayUnitPrice = getDisplayUnitPrice(item, mode);
    const displayLineTotal = getDisplayLineTotal(item, mode);
    const description = getOfferLineItemDescription(item.description);
    const mobileVatLabel = normalizeVatRate(item.vatRate) > 0
      ? `${Math.round(normalizeVatRate(item.vatRate) * 100)}%`
      : 'Momsfri';
    const mobileMetrics = [
      { label: 'Antal', value: formatOfferLineItemQuantityHtml(item) },
      { label: '&Agrave;-pris', value: fmtSEKPrecise(displayUnitPrice) },
      ...(showDiscountColumn ? [{ label: 'Rabatt', value: item.discount ? `${item.discount}%` : '—' }] : []),
      ...(showVatColumn ? [{ label: 'Moms', value: mobileVatLabel }] : []),
    ];
    const mobileMetricCount = mobileMetrics.length;
    const mobileRows = [
      ...mobileMetrics.map((metric, index) => {
        const metricClasses = [
          'offer-item-card__metric',
          mobileMetricCount % 2 === 1 && index === mobileMetricCount - 1 ? 'offer-item-card__metric--full' : '',
        ].filter(Boolean).join(' ');
        return `<div class="${metricClasses}"><dt>${metric.label}</dt><dd>${metric.value}</dd></div>`;
      }),
      `<div class="offer-item-card__metric offer-item-card__metric--total"><dt>Belopp</dt><dd>${fmtSEKPrecise(displayLineTotal)}</dd></div>`,
    ].join('');

    return `
      <article class="offer-item-card">
        <div class="offer-item-card__top">
          <div class="offer-item-card__eyebrow">Produkt eller tj\u00e4nst</div>
          <div class="offer-item-card__title">${escapeHtml(description.title)}</div>
          ${description.detail ? `<div class="offer-item-card__detail">${escapeHtml(description.detail)}</div>` : ''}
        </div>
        <dl class="offer-item-card__grid">
          ${mobileRows}
        </dl>
      </article>`;
  }).join('');

  return `
    <div class="offer-items">
      <div class="offer-items__table" style="display:block;">
        <div class="offer-items__head" style="--offer-columns:${gridTemplate}">
          ${headerCells}
        </div>
        <div class="offer-items__body">
          ${desktopRows}
        </div>
      </div>
      <div class="offer-items__cards" style="display:none;">
        ${mobileCards}
      </div>
    </div>`;
}

// ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ Signature placeholder HTML ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬

const SIGNATURE_FIELD_HTML = `
  <div data-sig-field="signature" style="border:2px dashed #cbd5e1;border-radius:8px;padding:24px 20px;margin:24px 0;text-align:center;min-height:80px;background:#f8fafc;">
    <p style="color:#94a3b8;font-size:12px;margin:0 0 4px 0;text-transform:uppercase;letter-spacing:0.1em;font-weight:600;">Signatur</p>
    <p style="color:#cbd5e1;font-size:11px;margin:0;">Underteckna med e-signatur via l&auml;nken du mottog</p>
  </div>`;

// ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ Shared placeholder builder ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬

/**
 * Builds the {{placeholder}} ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢ value map for a given offer.
 * All user-controlled text values are HTML-escaped so the map is safe to
 * interpolate directly into HTML contexts (email bodies, document templates).
 * Numeric/date values come from controlled formatters and need no escaping.
 */
export function buildReplacements(offer: Offer): Record<string, string> {
  const vatAmount = offer.totalIncVat - offer.totalExVat;
  const offerNumberStr = getOfferNumberString(offer);

  return {
    '{{offerTitle}}':       secureEscapeHtml(offer.title),
    '{{offerNumber}}':      offerNumberStr,
    '{{quoteNumber}}':      offerNumberStr,
    '{{createdDate}}':      fmtDate(offer.createdAt),
    '{{validUntil}}':       fmtDate(offer.validUntil),
    '{{recipientName}}':    secureEscapeHtml(offer.recipientName),
    '{{recipientEmail}}':   secureEscapeHtml(offer.recipientEmail),
    '{{recipientCompany}}': secureEscapeHtml(offer.recipientCompany ?? ''),
    '{{totalExVat}}':       fmtSEK(offer.totalExVat),
    '{{totalIncVat}}':      fmtSEK(offer.totalIncVat),
    '{{vatAmount}}':        fmtSEK(vatAmount),
    '{{notes}}':            secureEscapeHtml(offer.notes ?? ''),
  };
}

function getOfferNumberString(offer: Pick<Offer, 'offerNumber' | 'createdAt' | 'id'>): string {
  return offer.offerNumber
    ? `${new Date(offer.createdAt).getFullYear()}-${String(offer.offerNumber).padStart(3, '0')}`
    : offer.id.slice(0, 8).toUpperCase();
}

/**
 * Builds HTML-safe replacements for email interpolation.
 * buildReplacements already returns HTML-escaped values; no further escaping needed.
 */
function buildEmailReplacements(offer: Offer): Record<string, string> {
  return buildReplacements(offer);
}

function fixOfferHtmlText(html: string): string {
  return stripLegacyLineItemTables(stripEmptyLegacyTables(html))
    .replace(/AvsÃƒÆ’Ã‚Â¤ndare/g, 'Avs\u00e4ndare')
    .replace(/AvsÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¤ndare/g, 'Avs\u00e4ndare')
    .replace(/AvsÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ndare/g, 'Avs\u00e4ndare')
    .replace(/Produkt eller tjÃƒÆ’Ã‚Â¤nst/g, 'Produkt eller tj\u00e4nst')
    .replace(/Produkt eller tjÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¤nst/g, 'Produkt eller tj\u00e4nst')
    .replace(/Produkter och tjÃƒÆ’Ã‚Â¤nster/g, 'Produkter och tj\u00e4nster')
    .replace(/Produkter och tjÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¤nster/g, 'Produkter och tj\u00e4nster')
    .replace(/UtgÃƒÆ’Ã‚Â¥ngen/g, 'Utg\u00e5ngen')
    .replace(/&Aring;-pris/gi, '&Agrave;-pris')
    .replace(/\u00c5-pris/g, '\u00c0-pris')
    .replace(/\bA-pris\b/g, '\u00c0-pris')
    .replace(/ÃƒÆ’Ã¢â‚¬Â¦-pris/g, '\u00c0-pris')
    .replace(/ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦-pris/g, '\u00c0-pris')
    .replace(/gÃƒÆ’Ã‚Â¤ller/g, 'g\u00e4ller')
    .replace(/gÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¤ller/g, 'g\u00e4ller')
    .replace(/utfÃƒÆ’Ã‚Â¶rs/g, 'utf\u00f6rs')
    .replace(/utfÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¶rs/g, 'utf\u00f6rs')
    .replace(/ÃƒÆ’Ã‚Â¶verenskommen/g, '\u00f6verenskommen')
    .replace(/ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¶verenskommen/g, '\u00f6verenskommen')
    .replace(/ÃƒÆ’Ã‚Â¤ndringar/g, '\u00e4ndringar')
    .replace(/ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¤ndringar/g, '\u00e4ndringar')
    .replace(/tillÃƒÆ’Ã‚Â¤ggsbestÃƒÆ’Ã‚Â¤llning/g, 'till\u00e4ggsbest\u00e4llning')
    .replace(/tillÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¤ggsbestÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¤llning/g, 'till\u00e4ggsbest\u00e4llning')
    .replace(/tillÃƒÆ’Ã‚Â¤gg/g, 'till\u00e4gg')
    .replace(/tillÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¤gg/g, 'till\u00e4gg')
    .replace(/ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â·/g, '\u00b7')
    .replace(/Ãƒâ€šÃ‚Â·/g, '\u00b7')
    .replace(/ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â/g, '\u2014');
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function upsertStyleTag(html: string, marker: string, styleTag: string): string {
  const existingPattern = new RegExp(`<style[^>]*${escapeRegExp(marker)}[^>]*>[\\s\\S]*?<\\/style>`, 'i');
  if (existingPattern.test(html)) {
    return html.replace(existingPattern, styleTag);
  }
  if (html.includes('</head>')) return html.replace('</head>', `${styleTag}\n</head>`);
  return `${styleTag}\n${html}`;
}

function injectDocumentPatchStyles(html: string): string {
  const patchStyles = `
<style data-offer-document-patch>
  body {
    font-family: "Aptos", "Avenir Next", "Segoe UI", "Helvetica Neue", Arial, sans-serif !important;
    color: #1f335b !important;
  }
  .page-content--document {
    min-height: 960px !important;
    padding: 52px 52px 44px !important;
    background: #ffffff !important;
  }
  .offer-shell {
    gap: 28px !important;
    color: #1f335b !important;
  }
  .offer-shell__header {
    display: grid !important;
    grid-template-columns: minmax(0, 1.15fr) minmax(0, 0.9fr) !important;
    gap: 36px !important;
    align-items: center !important;
    padding-bottom: 30px !important;
    border-bottom: 2px solid #dbe5f1 !important;
  }
  .offer-shell__sender {
    gap: 18px !important;
    align-items: flex-start !important;
  }
  .offer-shell__logo {
    width: 92px !important;
    height: 92px !important;
    border-radius: 24px !important;
    object-fit: cover !important;
    box-shadow: 0 10px 28px rgba(142, 169, 205, 0.22) !important;
  }
  .offer-shell__sender-copy {
    display: grid !important;
    gap: 6px !important;
    color: #111827 !important;
    font-size: 15px !important;
    line-height: 1.38 !important;
  }
  .offer-shell__sender-copy p {
    margin: 0 !important;
  }
  .offer-shell__sender-name {
    margin-bottom: 8px !important;
    font-size: 18px !important;
    font-weight: 700 !important;
    color: #1f335b !important;
  }
  .offer-shell__meta {
    display: grid !important;
    justify-items: stretch !important;
    text-align: center !important;
    gap: 0 !important;
    padding: 0 !important;
    border: 0 !important;
    background: transparent !important;
    box-shadow: none !important;
  }
  .offer-shell__status {
    display: none !important;
  }
  .offer-shell__meta dl {
    display: grid !important;
    grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
    gap: 0 !important;
    width: 100% !important;
    margin: 0 !important;
  }
  .offer-shell__meta dl div {
    display: grid !important;
    gap: 8px !important;
    padding: 0 18px !important;
    border-left: 1px solid #dbe5f1 !important;
  }
  .offer-shell__meta dl div:first-child {
    border-left: none !important;
    padding-left: 0 !important;
  }
  .offer-shell__meta dl div:last-child {
    padding-right: 0 !important;
  }
  .offer-shell__meta dt {
    margin: 0 !important;
    font-size: 12px !important;
    font-weight: 700 !important;
    letter-spacing: 0 !important;
    text-transform: none !important;
    color: #657b9c !important;
  }
  .offer-shell__meta dd {
    margin: 0 !important;
    font-size: 18px !important;
    font-weight: 700 !important;
    line-height: 1.2 !important;
    color: #1f335b !important;
    white-space: nowrap !important;
  }
  .offer-shell__topline {
    display: grid !important;
    grid-template-columns: minmax(0, 1fr) minmax(220px, 280px) !important;
    gap: 28px !important;
    align-items: end !important;
    padding-bottom: 0 !important;
    border-bottom: 0 !important;
  }
  .offer-shell__eyebrow,
  .offer-shell__lead,
  .offer-shell__customer-label {
    display: none !important;
  }
  .offer-shell__topline h1 {
    margin: 0 !important;
    font-family: "Times New Roman", Times, serif !important;
    font-size: 76px !important;
    font-weight: 700 !important;
    line-height: 0.95 !important;
    letter-spacing: -0.03em !important;
    color: #1e3158 !important;
  }
  .offer-shell__customer-card {
    display: grid !important;
    gap: 10px !important;
    min-width: 0 !important;
    padding: 0 !important;
    border: 0 !important;
    background: transparent !important;
    box-shadow: none !important;
    text-align: right !important;
    justify-self: end !important;
    align-self: center !important;
  }
  .offer-shell__customer-card p {
    margin: 0 !important;
  }
  .offer-shell__customer-primary {
    font-size: 18px !important;
    line-height: 1.2 !important;
    font-weight: 700 !important;
    color: #1f335b !important;
  }
  .offer-shell__customer-secondary {
    font-size: 13px !important;
    line-height: 1.4 !important;
    color: #334b70 !important;
  }
  .offer-table-header {
    display: none !important;
  }
  .offer-pricing-layout {
    display: block !important;
  }
  .offer-summary {
    width: min(380px, 100%) !important;
    max-width: none !important;
    margin-left: auto !important;
    padding: 0 !important;
    border: 0 !important;
    border-radius: 0 !important;
    background: transparent !important;
    box-shadow: none !important;
    gap: 6px !important;
    overflow: visible !important;
  }
  .offer-summary--below {
    width: min(380px, 100%) !important;
    margin-top: 26px !important;
    margin-left: auto !important;
    clear: both !important;
  }
  .offer-summary__row {
    position: relative !important;
    display: grid !important;
    grid-template-columns: minmax(0, 1fr) auto !important;
    align-items: center !important;
    gap: 18px !important;
    padding: 11px 16px !important;
    background: #f4f7fb !important;
    color: #1f335b !important;
    font-size: 14px !important;
    line-height: 1.35 !important;
    border-radius: 0 !important;
  }
  .offer-summary__row strong {
    color: #1f335b !important;
    font-size: 14px !important;
    font-weight: 700 !important;
    font-variant-numeric: tabular-nums !important;
    white-space: nowrap !important;
  }
  .offer-summary__row--discount {
    background: #fff1f1 !important;
    color: #be3d35 !important;
  }
  .offer-summary__row--discount::before {
    content: '' !important;
    position: absolute !important;
    left: 0 !important;
    top: 8px !important;
    bottom: 8px !important;
    width: 4px !important;
    border-radius: 999px !important;
    background: #c83d35 !important;
  }
  .offer-summary__row--subtotal {
    background: linear-gradient(180deg, #f8fbff 0%, #fdfefe 100%) !important;
  }
  .offer-summary__row--subtotal span,
  .offer-summary__row--subtotal strong {
    color: #10233b !important;
    font-weight: 800 !important;
  }
  .offer-summary__row--discount {
    background: #fff6f5 !important;
  }
  .offer-summary__row--discount span,
  .offer-summary__row--discount strong {
    color: #b42318 !important;
  }
  .offer-summary__row--vat span {
    color: #42576f !important;
  }
  .offer-summary__row--total {
    margin-top: 10px !important;
    padding: 16px 18px !important;
    background: #2d4a83 !important;
    color: #ffffff !important;
  }
  .offer-summary__row--total strong,
  .offer-summary__row--total span {
    color: #ffffff !important;
  }
  .offer-summary__total-copy {
    display: grid !important;
    gap: 4px !important;
  }
  .offer-summary__total-label {
    font-size: 22px !important;
    font-weight: 700 !important;
    line-height: 1 !important;
  }
  .offer-summary__total-subcopy {
    font-size: 11px !important;
    font-weight: 700 !important;
    line-height: 1.1 !important;
  }
  .offer-summary__row--total strong {
    font-size: 18px !important;
    font-weight: 700 !important;
    letter-spacing: -0.02em !important;
  }
  .offer-section--terms,
  .offer-section--notes {
    clear: both !important;
  }
  .offer-section--terms {
    gap: 16px !important;
    margin-top: 28px !important;
    padding: 0 !important;
    border: 0 !important;
    background: transparent !important;
  }
  .offer-section--terms h3,
  .offer-section--notes h3 {
    display: flex !important;
    align-items: center !important;
    gap: 16px !important;
    margin: 0 !important;
    font-size: 18px !important;
    font-weight: 700 !important;
    letter-spacing: 0 !important;
    text-transform: none !important;
    color: #1f335b !important;
  }
  .offer-section--terms h3::after,
  .offer-section--notes h3::after {
    content: '' !important;
    flex: 1 1 auto !important;
    height: 1px !important;
    background: #dbe5f1 !important;
  }
  .offer-section--terms p,
  .offer-section--notes p,
  .offer-section--terms li,
  .offer-section--notes li {
    font-size: 14px !important;
    line-height: 1.72 !important;
    color: #334b70 !important;
  }
  .offer-section--terms ul,
  .offer-section--notes ul {
    display: grid !important;
    gap: 12px !important;
    margin: 0 !important;
    padding-left: 28px !important;
  }
  .offer-section--terms li::marker,
  .offer-section--notes li::marker {
    color: #a8b9d4 !important;
  }
  .offer-shell__footer {
    display: grid !important;
    grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
    gap: 28px !important;
    padding-top: 28px !important;
    margin-top: 42px !important;
    border-top: 1px solid #dbe5f1 !important;
  }
  .offer-shell__footer div {
    display: grid !important;
    justify-items: center !important;
    gap: 10px !important;
    text-align: center !important;
    color: #334b70 !important;
    font-size: 14px !important;
    line-height: 1.35 !important;
  }
  .offer-shell__footer strong {
    display: inline-flex !important;
    align-items: center !important;
    justify-content: center !important;
    gap: 8px !important;
    margin: 0 !important;
    color: #1f335b !important;
    font-size: 13px !important;
    font-weight: 700 !important;
  }
  .offer-shell__footer-icon {
    width: 17px !important;
    height: 17px !important;
    stroke: currentColor !important;
    fill: none !important;
    stroke-width: 16 !important;
    stroke-linecap: round !important;
    stroke-linejoin: round !important;
    flex: 0 0 17px !important;
  }
  .offer-shell__footer a {
    color: #2563eb !important;
    text-decoration: none !important;
    font-weight: 500 !important;
  }
  @media (max-width: 640px) {
    .page-content--document {
      padding: 26px 18px 24px !important;
    }
    .offer-shell__header,
    .offer-shell__topline {
      grid-template-columns: minmax(0, 1fr) !important;
      gap: 20px !important;
    }
    .offer-shell__meta dl {
      grid-template-columns: 1fr !important;
      gap: 14px !important;
    }
    .offer-shell__meta dl div {
      padding: 0 !important;
      border-left: 0 !important;
      border-top: 1px solid #dbe5f1 !important;
      padding-top: 14px !important;
    }
    .offer-shell__meta dl div:first-child {
      border-top: 0 !important;
      padding-top: 0 !important;
    }
    .offer-shell__topline h1 {
      font-size: 54px !important;
    }
    .offer-shell__customer-card {
      justify-self: start !important;
      text-align: left !important;
    }
    .offer-summary,
    .offer-summary--below {
      width: 100% !important;
      margin-top: 18px !important;
    }
    .offer-shell__footer {
      grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
      gap: 12px !important;
      text-align: left !important;
    }
    .offer-shell__footer div {
      justify-items: start !important;
      text-align: left !important;
      font-size: 12px !important;
      gap: 6px !important;
    }
    .offer-shell__footer-item--company { grid-column: 1 / -1 !important; grid-template-columns: minmax(0, 1fr) !important; row-gap: 4px !important; align-items: start !important; }
    .offer-shell__footer-item--company strong { justify-content: flex-start !important; }
    .offer-shell__footer-item--company > a, .offer-shell__footer-item--company > span:last-child { overflow-wrap: anywhere !important; }
    .offer-shell__footer-item--responsible,
    .offer-shell__footer-item--contact {
      padding-top: 10px !important;
      border-top: 1px solid rgba(219, 229, 241, 0.9) !important;
    }
    .offer-shell__footer-icon {
      width: 14px !important;
      height: 14px !important;
      flex: 0 0 14px !important;
    }
  }
</style>`;

  return upsertStyleTag(html, 'data-offer-document-patch', patchStyles);
}

function injectStructuredLineItemStyles(html: string): string {
  if (!html.includes('class="offer-items"')) return html;

  const lineItemStyles = `
<style data-offer-line-item-patch>
  .offer-items { display: grid; gap: 18px; }
  .offer-items__table {
    display: block;
    border: 1px solid #d4e2f1;
    border-radius: 28px;
    background: #ffffff;
    overflow: hidden;
    box-shadow: 8px 8px 0 #e8eff8;
  }
  .offer-items__head,
  .offer-item-row {
    display: grid;
    grid-template-columns: var(--offer-columns, minmax(0, 2.1fr) 92px 136px 86px 86px 152px);
    align-items: start;
  }
  .offer-items__head {
    gap: 0;
    padding: 18px 22px 12px;
    background: #ffffff;
    color: #1f335b;
    font-size: 16px;
    font-weight: 700;
    letter-spacing: 0;
    text-transform: none;
  }
  .offer-items__head span {
    display: flex;
    min-height: 46px;
    align-items: center;
    justify-content: flex-end;
    padding: 0 14px;
    border-left: 1px solid #dbe5f1;
  }
  .offer-items__head span:first-child {
    justify-content: flex-start;
    padding-left: 0;
    border-left: none;
  }
  .offer-items__body {
    border-top: 1px solid #dbe5f1;
  }
  .offer-item-row {
    gap: 0;
    padding: 24px 22px 26px;
    border-bottom: 0;
  }
  .offer-item-row:last-child { border-bottom: none; }
  .offer-item-row__product {
    display: grid;
    gap: 12px;
    min-width: 0;
    padding-right: 18px;
  }
  .offer-item-row__title {
    font-size: 18px;
    line-height: 1.22;
    font-weight: 700;
    color: #1f335b;
  }
  .offer-item-row__detail {
    max-width: 30ch;
    font-size: 12px;
    line-height: 1.46;
    color: #3d557b;
  }
  .offer-item-row__value {
    display: flex;
    align-items: flex-start;
    justify-content: flex-end;
    padding: 8px 14px 0;
    text-align: right;
    font-size: 15px;
    line-height: 1.2;
    font-weight: 700;
    color: #1f335b;
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
  }
  .offer-item-row__value--strong {
    font-size: 17px;
    font-weight: 800;
  }
  .offer-items__cards { display: none; }
  .offer-item-card { border: 1px solid #dbe4ee; border-radius: 18px; background: #ffffff; overflow: hidden; box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04); }
  .offer-item-card__top { display: grid; gap: 6px; padding: 15px 16px 14px; background: linear-gradient(180deg, #fcfdff 0%, #f8fbff 100%); border-bottom: 1px solid #eef2f7; }
  .offer-item-card__eyebrow { font-size: 10px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #94a3b8; }
  .offer-item-card__title { font-size: 16px; line-height: 1.3; font-weight: 700; color: #0f172a; }
  .offer-item-card__detail { font-size: 13px; line-height: 1.7; color: #64748b; }
  .offer-item-card__grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0; margin: 0; }
  .offer-item-card__metric { display: grid; justify-items: center; align-content: center; gap: 7px; min-height: 78px; padding: 14px 12px 13px; text-align: center; background: #ffffff; }
  .offer-item-card__metric dt,
  .offer-item-card__metric dd { margin: 0; }
  .offer-item-card__metric dt { font-size: 11px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: #94a3b8; }
  .offer-item-card__metric dd { text-align: center; font-size: 14px; font-weight: 700; color: #0f172a; }
  .offer-item-card__metric:not(.offer-item-card__metric--total):not(.offer-item-card__metric--full):nth-child(odd) { border-right: 1px solid #eef2f7; }
  .offer-item-card__metric:nth-child(n + 3):not(.offer-item-card__metric--total) { border-top: 1px solid #eef2f7; }
  .offer-item-card__metric--full { grid-column: 1 / -1; border-top: 1px solid #eef2f7; }
  .offer-item-card__metric--total { grid-column: 1 / -1; gap: 8px; min-height: 0; padding: 16px 14px 15px; border-top: 1px solid #142742; background: linear-gradient(135deg, #13233a 0%, #223b63 100%); }
  .offer-item-card__metric--total dt,
  .offer-item-card__metric--total dd { color: #ffffff; }
  .offer-item-card__metric--total dd { font-size: 18px; font-weight: 800; letter-spacing: -0.02em; }
  @media (max-width: 640px) {
    .offer-items__table { display: none; }
    .offer-items__cards { display: grid; gap: 16px; }
    .offer-item-card__detail { display: block; }
  }
</style>`;

  return upsertStyleTag(html, 'data-offer-line-item-patch', lineItemStyles);
}

function injectSenderBranding(
  html: string,
  branding?: OfferBrandingProfile,
): string {
  if (!branding) return html;

  const companyName = branding.companyName?.trim() || branding.senderName?.trim() || '';
  const organizationNumber = branding.organizationNumber?.trim() || '';
  const addressLines = getCompactBrandingAddressLines(branding.addressLines ?? []);
  const logoUrl = branding.logoUrl?.trim() || '';

  const detailLines = [
    companyName ? `<p class="offer-shell__sender-name">${escapeHtml(companyName)}</p>` : '',
    ...addressLines.map((line) => `<p>${escapeHtml(line)}</p>`),
    organizationNumber ? `<p>Org.nr ${escapeHtml(organizationNumber)}</p>` : '',
  ].filter(Boolean);

  let nextHtml = html;

  if (detailLines.length > 0) {
    const senderCopyHtml = `<div class="offer-shell__sender-copy">${detailLines.join('')}</div>`;

    if (/<div class="offer-shell__sender-copy">[\s\S]*?<\/div>/i.test(nextHtml)) {
      nextHtml = nextHtml.replace(
        /<div class="offer-shell__sender-copy">[\s\S]*?<\/div>/i,
        senderCopyHtml,
      );
    } else if (/<div class="offer-shell__sender">/i.test(nextHtml)) {
      nextHtml = nextHtml.replace(
        /(<div class="offer-shell__sender">)/i,
        `$1${senderCopyHtml}`,
      );
    }
  }

  if (
    logoUrl
    && !/<img[^>]*class="[^"]*\boffer-shell__logo\b/i.test(nextHtml)
    && /<div class="offer-shell__sender">/i.test(nextHtml)
  ) {
    nextHtml = nextHtml.replace(
      /(<div class="offer-shell__sender">)/i,
      `$1<img class="offer-shell__logo" src="${sanitizeUrl(logoUrl)}" alt="${escapeHtml(companyName || 'Avsändare')}" />`,
    );
  }

  return nextHtml;
}

function normalizeLegacyOfferMeta(
  html: string,
  offerNumber: string,
): string {
  const metaRowPattern = /(<div>\s*<dt[^>]*>)\s*Offert(?:nummer| nr)?\s*#?\s*(<\/dt>\s*<dd[^>]*>)\s*#?([^<]+?)\s*(<\/dd>\s*<\/div>)/i;
  if (metaRowPattern.test(html)) {
    return html.replace(
      metaRowPattern,
      `$1Offertnummer$2${escapeHtml(offerNumber)}$4`,
    );
  }

  return html
    .replace(/(<dt[^>]*>)\s*Offert(?:nummer| nr)?\s*#?\s*(<\/dt>)/i, '$1Offertnummer$2')
    .replace(/(<dd[^>]*>\s*)##?(?=\d{4}-\d+)/i, '$1');
}

function replaceLegacyLineItemsTable(html: string, offer: Offer): string {
  if (!/\bclass="[^"]*\bline-items\b/i.test(html)) return html;
  return html.replace(
    /<table\b[^>]*class="[^"]*\bline-items\b[^"]*"[^>]*>[\s\S]*?<\/table>/gi,
    buildStructuredLineItems(offer.lineItems, offer.priceDisplayMode),
  );
}

function syncStructuredLineItemQuantities(html: string, offer: Offer): string {
  let desktopIndex = 0;
  let syncedHtml = html.replace(
    /<article\b[^>]*class="[^"]*\boffer-item-row\b[^"]*"[^>]*>[\s\S]*?<\/article>/gi,
    (rowHtml) => {
      const item = offer.lineItems[desktopIndex++];
      if (!item) return rowHtml;
      return rowHtml.replace(
        /(<div\b[^>]*class="[^"]*\boffer-item-row__value\b[^"]*"[^>]*>)[\s\S]*?(<\/div>)/i,
        `$1${formatOfferLineItemQuantityHtml(item)}$2`,
      );
    },
  );

  let mobileIndex = 0;
  syncedHtml = syncedHtml.replace(
    /<article\b[^>]*class="[^"]*\boffer-item-card\b[^"]*"[^>]*>[\s\S]*?<\/article>/gi,
    (cardHtml) => {
      const item = offer.lineItems[mobileIndex++];
      if (!item) return cardHtml;
      return cardHtml.replace(
        /(<div\b[^>]*class="[^"]*\boffer-item-card__metric\b[^"]*"[^>]*>\s*<dt>\s*Antal\s*<\/dt>\s*<dd>)[\s\S]*?(<\/dd>)/i,
        `$1${formatOfferLineItemQuantityHtml(item)}$2`,
      );
    },
  );

  return syncedHtml;
}

export function sanitizeGeneratedOfferDocument(
  documentHtml: string,
  offer: Offer,
  branding?: OfferBrandingProfile,
): string {
  let html = documentHtml;
  html = replaceLegacyLineItemsTable(html, offer);
  html = injectStructuredLineItemStyles(html);
  html = syncStructuredLineItemQuantities(html, offer);
  html = normalizeLegacyOfferMeta(html, getOfferNumberString(offer));
  html = injectSenderBranding(html, branding);
  html = injectDocumentPatchStyles(html);
  return fixOfferHtmlText(html);
}
/**
 * Interpolates {{placeholder}} variables in a plain-text or HTML string.
 * Used for custom email subject / body.
 * Values are HTML-escaped to prevent XSS injection via offer data.
 */
export function interpolateEmailText(text: string, offer: Offer): string {
  const replacements = buildEmailReplacements(offer);
  let result = text;
  for (const [key, value] of Object.entries(replacements)) {
    result = result.split(key).join(value);
  }
  return result;
}

// ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ Shared mobile CSS for table card layout ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬


// ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ Fill-page image detection ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬

/**
 * Returns true if the TipTap node tree contains a fill-page free image
 * (width=816, height=1056).  Used to cap page-block height at exactly 1056px
 * so no white space appears below the image in the generated document.
 */
function containsFillPageImage(node: TipTapNode): boolean {
  if (node.type === 'image') {
    const a = node.attrs ?? {};
    return String(a.position) === 'free'
      && Number(a.width)  === 816
      && Number(a.height) === 1056;
  }
  return (node.content ?? []).some(containsFillPageImage);
}

function isImageOnlyPresentationPage(node: TipTapNode): boolean {
  const content = node.content ?? [];
  let hasImage = false;

  for (const child of content) {
    if (child.type === 'image') {
      hasImage = true;
      continue;
    }

    if (child.type === 'paragraph') {
      const text = (child.content ?? [])
        .map((entry) => entry.type === 'text' ? String(entry.text ?? '') : '')
        .join('')
        .trim();
      if (!text) continue;
    }

    return false;
  }

  return hasImage;
}

interface V3PageDoc {
  kind?: 'presentation' | 'document';
  role?: 'cover' | 'introduction' | 'offer' | 'scope' | 'references' | 'terms' | 'appendix' | 'custom';
  label?: string;
  includeInCustomerPdf?: boolean;
  body:   TipTapNode;
  header: { enabled: boolean; useDefault: boolean; content: TipTapNode };
  footer: { enabled: boolean; useDefault: boolean; content: TipTapNode };
  document?: {
    backgroundImageSrc?: string;
    backgroundOpacity?: number;
    watermarkMode?: 'none' | 'top' | 'bottom' | 'full';
    showLogo?: boolean;
    showSenderDetails?: boolean;
    showCustomerBlock?: boolean;
    showIntro?: boolean;
    introLayout?: 'compact' | 'roomy';
    showLineItems?: boolean;
    showSummary?: boolean;
    showNotes?: boolean;
    showTerms?: boolean;
    showFooter?: boolean;
    termsHeading?: string;
    termsBody?: string;
    notesHeading?: string;
    summaryPlacement?: 'below';
  };
}

function pageContainsNodeType(node: TipTapNode, type: string): boolean {
  if (node.type === type) return true;
  return (node.content ?? []).some((child) => pageContainsNodeType(child, type));
}

function isLegacyStructuredDocumentPage(page: V3PageDoc): boolean {
  if (page.kind === 'document' || page.document) return true;

  const content = page.body.content ?? [];
  const hasSignatureFields = content.some((node) => pageContainsNodeType(node, 'signatureBlock'));
  const hasDocumentLikeHeading = content.some((node) => {
    if (node.type !== 'heading') return false;
    const text = normalizeNodeText(getNodeTextContent(node));
    return [
      'prissattning',
      'sammanstallning',
      'betalnings- och leveransvillkor',
      'juridiska villkor',
      'godkannande och underskrift',
    ].includes(text);
  });

  return hasSignatureFields || hasDocumentLikeHeading;
}

function extractLegacyDocumentIntroHtml(
  page: V3PageDoc,
  introReplacements: Record<string, string>,
  offer: Offer,
): string {
  const offerTitle = normalizeNodeText(offer.title);
  const content = page.body.content ?? [];
  const introNodes: TipTapNode[] = [];

  for (const node of content) {
    if (node.type === 'signatureBlock') break;

    if (node.type === 'heading') {
      const headingText = normalizeNodeText(getNodeTextContent(node));
      if ([
        'prissattning',
        'sammanstallning',
        'betalnings- och leveransvillkor',
        'juridiska villkor',
        'godkannande och underskrift',
      ].includes(headingText)) {
        break;
      }
    }

    const text = normalizeNodeText(getNodeTextContent(node));
    if (!text && node.type === 'paragraph') continue;

    const isBoilerplateParagraph = text === offerTitle
      || text.startsWith('till:')
      || text.startsWith('offert nr:')
      || text.startsWith('offertnummer')
      || (text.includes('datum:') && text.includes('giltig till'));

    if (isBoilerplateParagraph) continue;
    introNodes.push(node);
  }

  if (introNodes.length === 0) return '';
  return stripLegacyStructuredIntroHtml(nodeToHtml({ type: 'doc', content: introNodes }, introReplacements));
}

export function renderPublicOfferSummaryHtml(offer: Offer): string {
  const summary = buildOfferSummary(offer);
  const subtotalBeforeDiscount = summary.discountAmount > 0
    ? offer.totalExVat + summary.discountAmount
    : offer.totalExVat;
  const boxClass = 'offer-summary offer-summary--below';
  const totalSubcopy = summary.displayModeLabel;
  const discountRow = summary.discountAmount > 0 ? `
    <div class="offer-summary__row offer-summary__row--discount">
      <span>Rabatt</span>
      <strong>- ${fmtSEKPrecise(summary.discountAmount).replace(/^-+\s*/, '')}</strong>
    </div>` : '';
  const vatRow = summary.hasVat ? `
    <div class="offer-summary__row offer-summary__row--vat">
      <span>${summary.vatLabel}</span>
      <strong>${fmtSEKPrecise(summary.vatAmount)}</strong>
    </div>` : '';

  return `
    <aside class="${boxClass}">
      <div class="offer-summary__row offer-summary__row--subtotal">
        <span>${summary.subtotalLabel}</span>
        <strong>${fmtSEKPrecise(subtotalBeforeDiscount)}</strong>
      </div>
      ${discountRow}
      ${vatRow}
      <div class="offer-summary__row offer-summary__row--total">
        <span class="offer-summary__total-copy">
          <span class="offer-summary__total-label">Totalsumma</span>
          <span class="offer-summary__total-subcopy">${escapeHtml(totalSubcopy)}</span>
        </span>
        <strong>${fmtSEKPrecise(summary.totalAmount)}</strong>
      </div>
    </aside>`;
}

function renderFooterIcon(kind: 'website' | 'user' | 'mail'): string {
  const pathByKind = {
    website: '<circle cx="128" cy="128" r="84"></circle><path d="M44 96h168"></path><path d="M44 160h168"></path><path d="M128 44c22 22 36 52 36 84s-14 62-36 84c-22-22-36-52-36-84s14-62 36-84z"></path>',
    user: '<circle cx="128" cy="96" r="36"></circle><path d="M60 204c12-34 40-52 68-52s56 18 68 52"></path>',
    mail: '<rect x="44" y="68" width="168" height="120" rx="18"></rect><path d="m56 84 72 56 72-56"></path>',
  } as const;

  return `
    <svg class="offer-shell__footer-icon" viewBox="0 0 256 256" aria-hidden="true" focusable="false">
      ${pathByKind[kind]}
    </svg>`;
}

export function renderPublicOfferFooterHtml(branding?: OfferBrandingProfile): string {
  const companyName = branding?.companyName?.trim() || branding?.senderName?.trim() || 'Soleria';
  const website = branding?.website?.trim() || '';
  const responsibleName = branding?.responsibleName?.trim() || branding?.senderName?.trim() || '-';
  const responsibleEmail = branding?.responsibleEmail?.trim() || branding?.senderEmail?.trim() || '-';
  const websiteHref = website ? sanitizeUrl(/^https?:\/\//i.test(website) ? website : `https://${website}`) : '';
  const websiteLabel = website
    ? escapeHtml(website.replace(/^https?:\/\//i, '').replace(/\/+$/, ''))
    : '-';

  return `
    <footer class="offer-shell__footer">
      <div class="offer-shell__footer-item offer-shell__footer-item--company">
        <strong>${renderFooterIcon('website')}<span>${escapeHtml(companyName)}</span></strong>
        ${websiteHref ? `<a href="${websiteHref}" target="_blank" rel="noreferrer noopener">${websiteLabel}</a>` : '<span>-</span>'}
      </div>
      <div class="offer-shell__footer-item offer-shell__footer-item--responsible">
        <strong>${renderFooterIcon('user')}<span>Ansvarig</span></strong>
        <span>${escapeHtml(responsibleName)}</span>
      </div>
      <div class="offer-shell__footer-item offer-shell__footer-item--contact">
        <strong>${renderFooterIcon('mail')}<span>Kontakt</span></strong>
        <span>${escapeHtml(responsibleEmail)}</span>
      </div>
    </footer>`;
}

function normalizeSummaryPlacement(): 'below' {
  return 'below';
}

function getCompactBrandingAddressLines(addressLines: string[] = []): string[] {
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

function renderStructuredDocumentPage(
  page: V3PageDoc,
  offer: Offer,
  replacements: Record<string, string>,
  pageIndex: number,
  branding?: OfferBrandingProfile,
): string {
  const settings = {
    backgroundOpacity: 0.08,
    watermarkMode: 'bottom',
    showLogo: true,
    showSenderDetails: true,
    showCustomerBlock: true,
    showIntro: true,
    introLayout: 'compact',
    showLineItems: true,
    showSummary: true,
    showNotes: true,
    showTerms: true,
    showFooter: true,
    termsHeading: DEFAULT_DOCUMENT_TERMS_HEADING,
    termsBody: DEFAULT_DOCUMENT_TERMS_BODY,
    notesHeading: DEFAULT_DOCUMENT_NOTES_HEADING,
    ...(page.document ?? {}),
    summaryPlacement: normalizeSummaryPlacement(),
  };

  const offerNumber = replacements['{{offerNumber}}'];
  const companyName = branding?.companyName?.trim() || branding?.senderName?.trim() || 'Avs\u00e4ndare';
  const responsibleName = branding?.responsibleName?.trim() || branding?.senderName?.trim() || '';
  const responsibleEmail = branding?.responsibleEmail?.trim() || branding?.senderEmail?.trim() || '';
  const organizationNumber = branding?.organizationNumber?.trim() || '';
  const logoUrl = branding?.logoUrl?.trim() || '';
  const customerLines = buildCustomerLines(offer);
  const addressLines = getCompactBrandingAddressLines(branding?.addressLines ?? []);
  const isLegacyDocumentPage = !page.kind && !page.document;
  const customerCardHtml = settings.showCustomerBlock && customerLines.length > 0
    ? `<aside class="offer-shell__customer-card">
        <p class="offer-shell__customer-primary">${escapeHtml(customerLines[0] ?? '')}</p>
        ${customerLines.slice(1).map((line) => `<p class="offer-shell__customer-secondary">${escapeHtml(line)}</p>`).join('')}
      </aside>`
    : '';
  const headerSenderDetailsHtml = [
    `<p class="offer-shell__sender-name">${escapeHtml(companyName)}</p>`,
    ...addressLines.map((line) => `<p>${escapeHtml(line)}</p>`),
    organizationNumber ? `<p>Org.nr ${escapeHtml(organizationNumber)}</p>` : '',
  ]
    .filter(Boolean)
    .join('');
  const noteHeading = (settings.notesHeading ?? DEFAULT_DOCUMENT_NOTES_HEADING).trim();
  const termsHeading = (settings.termsHeading ?? DEFAULT_DOCUMENT_TERMS_HEADING).trim();
  const termsBody = settings.termsBody ?? DEFAULT_DOCUMENT_TERMS_BODY;
  const noteHtml = offer.notes
    ? `<section class="offer-section offer-section--notes"><h3>${escapeHtml(noteHeading || DEFAULT_DOCUMENT_NOTES_HEADING)}</h3><p>${renderRichPlainText(offer.notes)}</p></section>`
    : '';
  const introReplacements: Record<string, string> = {
    ...replacements,
    '{{lineItems}}': '',
    '{{offerNumber}}': '',
    '{{quoteNumber}}': '',
    '{{createdDate}}': '',
    '{{validUntil}}': '',
    '{{totalExVat}}': '',
    '{{totalIncVat}}': '',
    '{{vatAmount}}': '',
  };
  const introHtml = isLegacyDocumentPage
    ? extractLegacyDocumentIntroHtml(page, introReplacements, offer)
    : stripLegacyStructuredIntroHtml(nodeToHtml(page.body, introReplacements));
  const hasIntroVisualContent = /<(img|hr|table|ul|ol)\b/i.test(introHtml);
  const hasIntroTextContent = introHtml
    .replace(/<p[^>]*>(?:&nbsp;|\s|<br\s*\/?>)*<\/p>/gi, '')
    .replace(/<[^>]+>/g, '')
    .trim()
    .length > 0;
  const hasIntroContent = settings.showIntro && (hasIntroVisualContent || hasIntroTextContent);
  const tableHtml = buildStructuredLineItems(offer.lineItems, offer.priceDisplayMode);
  const summaryHtml = renderPublicOfferSummaryHtml(offer);
  const pricingSectionHtml = settings.showLineItems
    ? `<section class="offer-section offer-section--pricing">
        <div class="offer-pricing-layout">
          <div class="offer-pricing-layout__items">
            ${tableHtml}
          </div>
        </div>
      </section>`
    : '';
  const backgroundStyle = settings.backgroundImageSrc
    ? `style="--doc-bg:url('${sanitizeUrl(settings.backgroundImageSrc)}');--doc-bg-opacity:${settings.backgroundOpacity};--doc-bg-position:${
        settings.watermarkMode === 'top' ? 'center top' : settings.watermarkMode === 'full' ? 'center center' : 'center bottom'
      };--doc-bg-size:${settings.watermarkMode === 'full' ? '100% 100%' : '78% auto'};"`
    : '';

  const html = `
    <div class="page-block page-block--document" ${backgroundStyle} data-page="${pageIndex + 1}"${page.includeInCustomerPdf === false ? ' data-customer-pdf="false"' : ''}>
      <div class="page-content page-content--document">
        <section class="offer-shell">
          <header class="offer-shell__header">
            <div class="offer-shell__sender">
              ${settings.showLogo && logoUrl ? `<img class="offer-shell__logo" src="${sanitizeUrl(logoUrl)}" alt="${escapeHtml(companyName)}" />` : ''}
              ${settings.showSenderDetails ? `
                <div class="offer-shell__sender-copy">
                  ${headerSenderDetailsHtml}
                </div>` : ''}
            </div>
            <div class="offer-shell__meta">
              <dl>
                <div><dt>Offertnummer</dt><dd>${offerNumber}</dd></div>
                <div><dt>Offertdatum</dt><dd>${replacements['{{createdDate}}']}</dd></div>
                <div><dt>Giltig till</dt><dd>${replacements['{{validUntil}}']}</dd></div>
              </dl>
            </div>
          </header>

          <section class="offer-shell__topline${isLegacyDocumentPage ? ' offer-shell__topline--legacy' : ''}">
            <div>
              <h1>${escapeHtml(offer.title)}</h1>
            </div>
            ${customerCardHtml}
          </section>

          ${hasIntroContent ? `<section class="offer-section offer-section--intro offer-section--intro-${settings.introLayout ?? 'compact'}">${introHtml}</section>` : ''}

          ${pricingSectionHtml}
          ${settings.showSummary ? summaryHtml : ''}
          ${settings.showTerms ? `
            <section class="offer-section offer-section--terms">
              <h3>${escapeHtml(termsHeading || DEFAULT_DOCUMENT_TERMS_HEADING)}</h3>
              <p>${renderRichPlainText(termsBody)}</p>
            </section>` : ''}
          ${settings.showNotes ? noteHtml : ''}
          ${settings.showFooter ? renderPublicOfferFooterHtml({
            ...branding,
            companyName,
            senderName: branding?.senderName ?? companyName,
            responsibleName,
            responsibleEmail,
            website: branding?.website,
          }) : ''}
        </section>
      </div>
    </div>`;

  return fixOfferHtmlText(html);
}

// ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ Main generator ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬

/**
 * Generates a clean fallback HTML document from offer data alone (no template).
 * Used when an offer is sent without a linked template.
 */
export function generateFallbackDocument(offer: Offer, branding?: OfferBrandingProfile): string {
  const offerNumberStr = getOfferNumberString(offer);
  const fallbackLineItemsHtml = buildStructuredLineItems(offer.lineItems, offer.priceDisplayMode);
  const fallbackSummaryHtml = renderPublicOfferSummaryHtml(offer);
  const companyName = branding?.companyName?.trim() || branding?.senderName?.trim() || 'Avs\u00e4ndare';
  const responsibleName = branding?.responsibleName?.trim() || branding?.senderName?.trim() || '';
  const responsibleEmail = branding?.responsibleEmail?.trim() || branding?.senderEmail?.trim() || '';
  const organizationNumber = branding?.organizationNumber?.trim() || '';
  const logoUrl = branding?.logoUrl?.trim() || '';
  const customerLines = buildCustomerLines(offer);
  const fallbackAddressLines = getCompactBrandingAddressLines(branding?.addressLines ?? []);
  const headerSenderBlockHtml = [
    `<p class="offer-shell__sender-name">${escapeHtml(companyName)}</p>`,
    ...fallbackAddressLines.map((line) => `<p>${escapeHtml(line)}</p>`),
    organizationNumber ? `<p>Org.nr ${escapeHtml(organizationNumber)}</p>` : '',
  ]
    .filter(Boolean)
    .join('');
  const customerCardHtml = customerLines.length > 0
    ? `<aside class="offer-shell__customer-card">
        <p class="offer-shell__customer-primary">${escapeHtml(customerLines[0] ?? '')}</p>
        ${customerLines.slice(1).map((line) => `<p class="offer-shell__customer-secondary">${escapeHtml(line)}</p>`).join('')}
      </aside>`
    : '';
  const noteHtml = offer.notes
    ? `<section class="offer-section offer-section--notes">
        <h3>${DEFAULT_DOCUMENT_NOTES_HEADING}</h3>
        <p>${renderRichPlainText(offer.notes)}</p>
      </section>`
    : '';
  const footerHtml = renderPublicOfferFooterHtml({
    ...branding,
    companyName,
    senderName: branding?.senderName ?? companyName,
    responsibleName,
    responsibleEmail,
    website: branding?.website,
  });

  const html = `<!DOCTYPE html>
<html lang="sv">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>${escapeHtml(offer.title)}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 14px; line-height: 1.6; color: #1e293b; background: #fff; margin: 0; padding: 0; }
    img { max-width: 100%; height: auto; }
    .doc-wrapper { max-width: 816px; margin: 40px auto; padding: 48px 56px; background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; }
    .offer-section { display: grid; gap: 12px; }
    .offer-section--intro-compact { max-width: 60ch; }
    .offer-section--intro-roomy { max-width: 74ch; }
    .offer-table-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
    .offer-table-header h2 { margin: 0; font-size: 13px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: #475569; }
    .offer-items { display: grid; gap: 18px; }
    .offer-items__table { display: block; border: 1px solid #dbe4ee; border-radius: 18px; background: #ffffff; overflow: hidden; }
    .offer-items__head, .offer-item-row { display: grid; grid-template-columns: var(--offer-columns); align-items: start; }
    .offer-items__head { gap: 12px; padding: 12px 16px; background: linear-gradient(180deg, #f8fbff 0%, #eef4fb 100%); border-bottom: 1px solid #dbe4ee; color: #64748b; font-size: 10px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; }
    .offer-items__head span:first-child { text-align: left; }
    .offer-items__head span:not(:first-child) { text-align: right; }
    .offer-item-row { gap: 12px; padding: 16px; border-bottom: 1px solid #eef2f7; }
    .offer-item-row:last-child { border-bottom: none; }
    .offer-item-row__product { display: grid; gap: 7px; min-width: 0; }
    .offer-item-row__title { font-size: 15px; line-height: 1.45; font-weight: 700; color: #0f172a; }
    .offer-item-row__detail { max-width: none; font-size: 13px; line-height: 1.62; color: #556a89; }
    .offer-item-row__value { text-align: right; font-size: 13px; line-height: 1.45; color: #334155; white-space: nowrap; }
    .offer-item-row__value--strong { font-weight: 700; color: #0f172a; }
    .offer-items__cards { display: none; }
    .offer-item-card { border: 1px solid #dbe4ee; border-radius: 18px; background: #ffffff; overflow: hidden; box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04); }
    .offer-item-card__top { display: grid; gap: 6px; padding: 15px 16px 14px; background: linear-gradient(180deg, #fcfdff 0%, #f8fbff 100%); border-bottom: 1px solid #eef2f7; }
    .offer-item-card__eyebrow { font-size: 10px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #94a3b8; }
    .offer-item-card__title { font-size: 16px; line-height: 1.3; font-weight: 700; color: #0f172a; }
    .offer-item-card__detail { font-size: 13px; line-height: 1.7; color: #64748b; }
    .offer-item-card__grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0; margin: 0; }
    .offer-item-card__metric { display: grid; justify-items: center; align-content: center; gap: 7px; min-height: 78px; padding: 14px 12px 13px; text-align: center; background: #ffffff; }
    .offer-item-card__metric dt, .offer-item-card__metric dd { margin: 0; }
    .offer-item-card__metric dt { font-size: 11px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: #94a3b8; }
    .offer-item-card__metric dd { text-align: center; font-size: 14px; font-weight: 700; color: #0f172a; }
    .offer-item-card__metric:not(.offer-item-card__metric--total):not(.offer-item-card__metric--full):nth-child(odd) { border-right: 1px solid #eef2f7; }
    .offer-item-card__metric:nth-child(n + 3):not(.offer-item-card__metric--total) { border-top: 1px solid #eef2f7; }
    .offer-item-card__metric--full { grid-column: 1 / -1; border-top: 1px solid #eef2f7; }
    .offer-item-card__metric--total { grid-column: 1 / -1; gap: 8px; min-height: 0; padding: 16px 14px 15px; border-top: 1px solid #142742; background: linear-gradient(135deg, #13233a 0%, #223b63 100%); }
    .offer-item-card__metric--total dt, .offer-item-card__metric--total dd { color: #ffffff; }
    .offer-item-card__metric--total dd { font-size: 18px; font-weight: 800; letter-spacing: -0.02em; }
    .offer-summary { margin-left: auto; width: min(260px, 100%); border: 1px solid #dbe4ee; border-radius: 16px; background: #ffffff; padding: 0; display: grid; gap: 0; overflow: hidden; box-shadow: 0 1px 2px rgba(15, 23, 42, 0.03); }
    .offer-summary--below { width: min(332px, 100%); margin-top: 16px; margin-left: auto; clear: both; }
    .offer-summary__row { display: flex; justify-content: space-between; align-items: baseline; gap: 16px; padding: 12px 16px; font-size: 13px; line-height: 1.55; color: #475569; border-bottom: 1px solid #e5ecf3; }
    .offer-summary__row span { font-weight: 600; color: #5b7088; }
    .offer-summary__row strong { white-space: nowrap; color: #10233b; font-weight: 700; }
    .offer-summary__row--subtotal { background: linear-gradient(180deg, #f8fbff 0%, #fdfefe 100%); }
    .offer-summary__row--subtotal span, .offer-summary__row--subtotal strong { color: #10233b; font-weight: 800; }
    .offer-summary__row--discount { background: #fff6f5; }
    .offer-summary__row--discount span, .offer-summary__row--discount strong { color: #b42318; }
    .offer-summary__row--vat span { color: #42576f; }
    .offer-summary__row--total { margin-top: 0; padding: 15px 16px 14px; border-top: 1px solid #142742; border-bottom: none; background: linear-gradient(135deg, #13233a 0%, #223b63 100%); font-size: 15px; color: #f8fafc; }
    .offer-summary__row--total span, .offer-summary__row--total strong { color: #ffffff; }
    .offer-summary__row--total span { font-size: 12px; font-weight: 700; letter-spacing: 0.02em; text-transform: uppercase; }
    .offer-summary__row--total strong { font-size: 22px; letter-spacing: -0.03em; }
    @media (max-width: 640px) {
      .doc-wrapper { margin: 0; padding: 24px 16px; border: none; border-radius: 0; }
      .offer-items__table { display: none; }
      .offer-items__cards { display: grid; gap: 16px; }
      .offer-item-card { border-color: #cfdbe8; box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06); }
      .offer-item-card__title { font-size: 17px; line-height: 1.35; }
      .offer-item-card__detail { display: block; }
      .offer-item-card__metric { min-height: 82px; }
      .offer-item-card__metric--total { padding: 16px 12px 15px; }
      .offer-item-card__metric--total dd { font-size: 20px; color: #ffffff; }
      .offer-summary { width: 100%; border-radius: 16px; padding: 0; margin-top: 18px; border-color: #cfdbe8; box-shadow: 0 8px 24px rgba(15, 23, 42, 0.05); }
      .offer-summary--below { width: 100%; margin-top: 18px; }
      .offer-summary__row { font-size: 14px; padding: 12px; line-height: 1.55; }
      .offer-summary__row--total { font-size: 16px; padding: 14px 12px; }
      .offer-summary__row--total span { font-size: 11px; }
      .offer-summary__row--total strong { font-size: 20px; color: #ffffff; }
      .offer-shell__footer { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px 14px; }
      .offer-shell__footer div { justify-items: start; text-align: left; }
      .offer-shell__footer-item--company { grid-column: 1 / -1; grid-template-columns: minmax(0, 1fr); row-gap: 4px; align-items: start; }
      .offer-shell__footer-item--company strong { justify-content: flex-start; }
      .offer-shell__footer-item--company > a, .offer-shell__footer-item--company > span:last-child { overflow-wrap: anywhere; }
      .offer-shell__footer-item--responsible, .offer-shell__footer-item--contact { padding-top: 10px; border-top: 1px solid #e2e8f0; }
    }
    @media print { .doc-wrapper { margin: 0; padding: 0; border: none; } }
  </style>
</head>
<body>
  <div class="doc-wrapper">
    <div class="page-block page-block--document" data-page="1">
      <div class="page-content page-content--document">
        <section class="offer-shell">
          <header class="offer-shell__header">
            <div class="offer-shell__sender">
              ${logoUrl ? `<img class="offer-shell__logo" src="${sanitizeUrl(logoUrl)}" alt="${escapeHtml(companyName)}" />` : ''}
              <div class="offer-shell__sender-copy">
                ${headerSenderBlockHtml}
              </div>
            </div>
            <div class="offer-shell__meta">
              <dl>
                <div><dt>Offertnummer</dt><dd>${escapeHtml(offerNumberStr)}</dd></div>
                <div><dt>Offertdatum</dt><dd>${fmtDate(offer.createdAt)}</dd></div>
                <div><dt>Giltig till</dt><dd>${fmtDate(offer.validUntil)}</dd></div>
              </dl>
            </div>
          </header>

          <section class="offer-shell__topline">
            <div>
              <h1>${escapeHtml(offer.title)}</h1>
            </div>
            ${customerCardHtml}
          </section>

          <section class="offer-section offer-section--pricing">
            <div class="offer-pricing-layout">
              <div class="offer-pricing-layout__items">
                ${fallbackLineItemsHtml}
              </div>
            </div>
          </section>

          ${fallbackSummaryHtml}
          ${noteHtml}
          ${footerHtml}
          ${SIGNATURE_FIELD_HTML}
        </section>
      </div>
    </div>
  </div>
</body>
</html>`;

  return sanitizeGeneratedOfferDocument(html, offer, branding);
}

/**
 * Generates an HTML document by:
 * 1. Parsing the TipTap JSON template to HTML
 * 2. Replacing all {{placeholder}} variables with offer data
 *
 * The result is stored as Offer.generatedDocument (immutable after send).
 */
export function generateDocument(templateContent: string, offer: Offer, branding?: OfferBrandingProfile): string {
  // Build replacements map from the shared helper (already HTML-escaped),
  // then extend with the document-only HTML entries that have no email equivalent.
  const replacements: Record<string, string> = {
    ...buildReplacements(offer),
    '{{lineItems}}': buildStructuredLineItems(offer.lineItems, offer.priceDisplayMode),
    '{{signature}}': SIGNATURE_FIELD_HTML,
  };

  // ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ Parse TipTap JSON (supports TemplateDoc v3, v2, and legacy v1) ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬

  function renderPage(
    page:          V3PageDoc,
    defaultHeader: TipTapNode,
    defaultFooter: TipTapNode,
    pageIndex:     number,
  ): string {
    if (isLegacyStructuredDocumentPage(page)) {
      return renderStructuredDocumentPage(page, offer, replacements, pageIndex, branding);
    }

    let pageHeaderHtml = '';
    let pageFooterHtml = '';

    if (page.header.enabled) {
      const hdrNode = page.header.useDefault ? defaultHeader : page.header.content;
      pageHeaderHtml = nodeToHtml(hdrNode, replacements);
    }
    if (page.footer.enabled) {
      const ftrNode = page.footer.useDefault ? defaultFooter : page.footer.content;
      pageFooterHtml = nodeToHtml(ftrNode, replacements);
    }

    let bodyHtml = nodeToHtml(page.body, replacements);

    // Legacy {{}} substitution for this page's content
    for (const [key, value] of Object.entries(replacements)) {
      bodyHtml       = bodyHtml.split(key).join(value);
      if (pageHeaderHtml) pageHeaderHtml = pageHeaderHtml.split(key).join(value);
      if (pageFooterHtml) pageFooterHtml = pageFooterHtml.split(key).join(value);
    }

    const hdrSection = pageHeaderHtml
      ? `<div class="doc-header">${pageHeaderHtml}</div><hr class="doc-divider"/>`
      : '';
    const ftrSection = pageFooterHtml
      ? `<hr class="doc-divider"/><div class="doc-footer">${pageFooterHtml}</div>`
      : '';

    // If a fill-page image (816ÃƒÆ’Ã¢â‚¬â€1056) exists, fix the block to exactly 1056px so
    // there is no empty white space below the image in the generated document.
    const fillPage = containsFillPageImage(page.body);
    const edgeToEdge = isImageOnlyPresentationPage(page.body);
    const customPageHeight = Number(page.body.attrs?.pageHeight ?? 0);
    const blockStyle = customPageHeight > 0
      ? ` style="min-height:${customPageHeight}px;"`
      : fillPage
        ? ' style="height:1056px;overflow:hidden;"'
        : '';
    const customerPdfAttr = page.includeInCustomerPdf === false ? ' data-customer-pdf="false"' : '';
    return `<div class="page-block"${blockStyle}${customerPdfAttr} data-page="${pageIndex + 1}"><div class="page-content${edgeToEdge ? ' page-content--edge-to-edge' : ''}">${hdrSection}${bodyHtml}${ftrSection}</div></div>`;
  }

  let bodyHtml = '';

  try {
    const parsed = JSON.parse(templateContent) as Record<string, unknown>;

    if (parsed._v === 4 || parsed._v === 3) {
      // TemplateDoc v4/v3: multi-page format
      const pages         = (parsed.pages ?? []) as V3PageDoc[];
      const defaultHeader = (parsed.defaultHeader ?? { type: 'doc', content: [] }) as TipTapNode;
      const defaultFooter = (parsed.defaultFooter ?? { type: 'doc', content: [] }) as TipTapNode;

      bodyHtml = pages
        .map((page, i) => renderPage(page, defaultHeader, defaultFooter, i))
        .join('<hr class="page-separator" />');
    } else if (parsed._v === 2) {
      // TemplateDoc v2 format: body + optional header/footer zones
      const rootNode = (parsed.body as TipTapNode) ?? { type: 'doc', content: [] };
      const settings = (parsed.settings ?? {}) as {
        headerEnabled?: boolean;
        footerEnabled?: boolean;
      };

      let headerHtml = '';
      let footerHtml = '';

      if (settings.headerEnabled) {
        const hdr = (parsed.header as { default?: TipTapNode } | undefined)?.default;
        if (hdr) headerHtml = nodeToHtml(hdr, replacements);
      }
      if (settings.footerEnabled) {
        const ftr = (parsed.footer as { default?: TipTapNode } | undefined)?.default;
        if (ftr) footerHtml = nodeToHtml(ftr, replacements);
      }

      let html = nodeToHtml(rootNode, replacements);
      for (const [key, value] of Object.entries(replacements)) {
        html      = html.split(key).join(value);
        if (headerHtml) headerHtml = headerHtml.split(key).join(value);
        if (footerHtml) footerHtml = footerHtml.split(key).join(value);
      }

      const hdrSection = headerHtml
        ? `<div class="doc-header">${headerHtml}</div><hr class="doc-divider"/>`
        : '';
      const ftrSection = footerHtml
        ? `<hr class="doc-divider"/><div class="doc-footer">${footerHtml}</div>`
        : '';

      bodyHtml = `<div class="page-content">${hdrSection}${html}${ftrSection}</div>`;
    } else {
      // Legacy v1: the whole JSON is the body doc
      const rootNode = parsed as unknown as TipTapNode;
      let html = nodeToHtml(rootNode, replacements);
      for (const [key, value] of Object.entries(replacements)) {
        html = html.split(key).join(value);
      }
      bodyHtml = `<div class="page-content">${html}</div>`;
    }
  } catch {
    // Unparseable ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â treat as plain text
    const escaped = escapeHtml(templateContent);
    let fallbackHtml = `<p>${escaped}</p>`;
    for (const [key, value] of Object.entries(replacements)) {
      fallbackHtml = fallbackHtml.split(key).join(value);
    }
    bodyHtml = `<div class="page-content">${fallbackHtml}</div>`;
  }

  // ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ Wrap in a styled document shell ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬

  return sanitizeGeneratedOfferDocument(`<!DOCTYPE html>
<html lang="sv">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>${escapeHtml(offer.title)}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 14px; line-height: 1.6; color: #1e293b; background: #fff; margin: 0; padding: 0; }
    img { max-width: 100%; height: auto; }
    /* doc-wrapper: 816px container ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â no horizontal padding so page-block fills full width */
    .doc-wrapper { max-width: 816px; margin: 40px auto; background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; }
    /* page-content: carries the horizontal padding; position:static so absolute images */
    /* inside it still anchor to page-block (the nearest position:relative ancestor)    */
    .page-content { padding: 48px 56px 44px; }
    .page-content--edge-to-edge { padding: 0; }
    /* Keep regular content above absolute background/overlay images on mixed pages. */
    .page-content > *:not(div[style*="position:absolute"]) { position: relative; z-index: 30; }
    .page-block--document { background: #ffffff; }
    .page-block--document::before {
      content: '';
      position: absolute;
      inset: 0;
      background-image: var(--doc-bg, none);
      background-repeat: no-repeat;
      background-position: var(--doc-bg-position, center bottom);
      background-size: var(--doc-bg-size, 78% auto);
      opacity: var(--doc-bg-opacity, 0.08);
      pointer-events: none;
    }
    .page-content--document { position: relative; z-index: 1; min-height: 1056px; }
    .offer-shell { min-height: 100%; display: flex; flex-direction: column; gap: 24px; color: #0f172a; }
    .offer-shell__header, .offer-shell__topline { display: grid; grid-template-columns: minmax(0, 1fr) minmax(220px, 256px); gap: 26px; align-items: flex-start; }
    .offer-shell__sender { display: flex; gap: 16px; align-items: flex-start; min-width: 0; }
    .offer-shell__logo { width: 54px; height: 54px; object-fit: contain; }
    .offer-shell__sender-copy { display: grid; gap: 4px; font-size: 13px; line-height: 1.6; color: #475569; }
    .offer-shell__sender-copy p, .offer-shell__meta dt, .offer-shell__meta dd, .offer-shell__customer p { margin: 0; }
    .offer-shell__sender-name, .offer-shell__customer-name { font-weight: 700; }
    .offer-shell__meta { min-width: 0; display: grid; gap: 14px; justify-items: end; text-align: right; }
    .offer-shell__status { margin: 0; display: inline-flex; align-items: center; justify-content: center; padding: 5px 11px; border-radius: 999px; font-size: 11px; font-weight: 700; }
    .offer-shell__status--draft { background: #e2e8f0; color: #334155; }
    .offer-shell__status--sent, .offer-shell__status--viewed { background: #dbeafe; color: #1d4ed8; }
    .offer-shell__status--accepted { background: #dcfce7; color: #166534; }
    .offer-shell__status--declined { background: #fee2e2; color: #b91c1c; }
    .offer-shell__status--expired { background: #f3f4f6; color: #6b7280; }
    .offer-shell__meta dl { margin: 0; display: grid; gap: 10px; width: 100%; }
    .offer-shell__meta dl div { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 14px; align-items: start; justify-content: flex-end; }
    .offer-shell__meta dt { font-size: 12px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #64748b; line-height: 1.45; }
    .offer-shell__meta dd { font-size: 14px; font-weight: 600; color: #0f172a; white-space: nowrap; line-height: 1.45; }
    .offer-shell__topline { grid-template-columns: minmax(0, 1fr); align-items: flex-start; gap: 14px; padding-bottom: 20px; border-bottom: 1px solid #dbe4ee; }
    .offer-shell__topline--legacy { gap: 14px; }
    .offer-shell__topline h1 { margin: 0; font-size: 22px; line-height: 1.25; font-weight: 700; }
    .offer-shell__recipient-details { display: grid; gap: 4px; margin-top: 14px; font-size: 14px; line-height: 1.7; color: #475569; }
    .offer-shell__recipient-details p { margin: 0; }
    .offer-shell__recipient-details strong { color: #0f172a; }
    .offer-shell__recipient-details--legacy { margin-top: 10px; }
    .offer-shell__customer { display: grid; gap: 4px; padding-left: 16px; border-left: 1px solid #e2e8f0; font-size: 12px; line-height: 1.55; color: #475569; }
    .offer-section { display: grid; gap: 12px; }
    .offer-section--intro-compact { max-width: 60ch; }
    .offer-section--intro-roomy { max-width: 74ch; }
    .offer-section h2, .offer-section h3 { margin: 0; font-size: 13px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: #475569; }
    .offer-section p { margin: 0; font-size: 13px; line-height: 1.72; color: #334155; }
    .offer-table-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
    .offer-items { display: grid; gap: 18px; }
    .offer-items__table { display: block; border: 1px solid #dbe4ee; border-radius: 18px; background: #ffffff; overflow: hidden; }
    .offer-items__head, .offer-item-row { display: grid; grid-template-columns: var(--offer-columns); align-items: start; }
    .offer-items__head { gap: 18px; padding: 14px 20px; background: linear-gradient(180deg, #f8fbff 0%, #eef4fb 100%); border-bottom: 1px solid #dbe4ee; color: #64748b; font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; }
    .offer-items__head span:first-child { text-align: left; }
    .offer-items__head span:not(:first-child) { text-align: right; }
    .offer-item-row { gap: 18px; padding: 20px; border-bottom: 1px solid #eef2f7; }
    .offer-item-row:last-child { border-bottom: none; }
    .offer-item-row__product { display: grid; gap: 7px; min-width: 0; }
    .offer-item-row__title { font-size: 16px; line-height: 1.4; font-weight: 700; color: #0f172a; }
    .offer-item-row__detail { font-size: 13px; line-height: 1.68; color: #64748b; }
    .offer-item-row__value { text-align: right; font-size: 14px; line-height: 1.5; color: #334155; }
    .offer-item-row__value--strong { font-weight: 700; color: #0f172a; }
    .offer-items__cards { display: none; }
    .offer-item-card { border: 1px solid #dbe4ee; border-radius: 18px; background: #ffffff; overflow: hidden; box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04); }
    .offer-item-card__top { display: grid; gap: 6px; padding: 15px 16px 14px; background: linear-gradient(180deg, #fcfdff 0%, #f8fbff 100%); border-bottom: 1px solid #eef2f7; }
    .offer-item-card__eyebrow { font-size: 10px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #94a3b8; }
    .offer-item-card__title { font-size: 16px; line-height: 1.3; font-weight: 700; color: #0f172a; }
    .offer-item-card__detail { font-size: 13px; line-height: 1.7; color: #64748b; }
    .offer-item-card__grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0; margin: 0; }
    .offer-item-card__metric { display: grid; justify-items: center; align-content: center; gap: 7px; min-height: 78px; padding: 14px 12px 13px; text-align: center; background: #ffffff; }
    .offer-item-card__metric dt, .offer-item-card__metric dd { margin: 0; }
    .offer-item-card__metric dt { font-size: 11px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: #94a3b8; }
    .offer-item-card__metric dd { text-align: center; font-size: 14px; font-weight: 700; color: #0f172a; }
    .offer-item-card__metric:not(.offer-item-card__metric--total):not(.offer-item-card__metric--full):nth-child(odd) { border-right: 1px solid #eef2f7; }
    .offer-item-card__metric:nth-child(n + 3):not(.offer-item-card__metric--total) { border-top: 1px solid #eef2f7; }
    .offer-item-card__metric--full { grid-column: 1 / -1; border-top: 1px solid #eef2f7; }
    .offer-item-card__metric--total { grid-column: 1 / -1; gap: 8px; min-height: 0; padding: 16px 14px 15px; border-top: 1px solid #142742; background: linear-gradient(135deg, #13233a 0%, #223b63 100%); }
    .offer-item-card__metric--total dt, .offer-item-card__metric--total dd { color: #ffffff; }
    .offer-item-card__metric--total dd { font-size: 18px; font-weight: 800; letter-spacing: -0.02em; }
    .offer-summary { margin-left: auto; width: min(260px, 100%); border: 1px solid #dbe4ee; border-radius: 16px; background: #ffffff; padding: 0; display: grid; gap: 0; overflow: hidden; box-shadow: 0 1px 2px rgba(15, 23, 42, 0.03); }
    .offer-summary--below { width: min(360px, 100%); margin-top: 14px; margin-left: auto; }
    .offer-summary__row { display: flex; justify-content: space-between; align-items: baseline; gap: 16px; padding: 12px 16px; font-size: 13px; line-height: 1.55; color: #475569; border-bottom: 1px solid #e5ecf3; }
    .offer-summary__row span { font-weight: 600; color: #5b7088; }
    .offer-summary__row strong { white-space: nowrap; color: #10233b; font-weight: 700; }
    .offer-summary__row--subtotal { background: linear-gradient(180deg, #f8fbff 0%, #fdfefe 100%); }
    .offer-summary__row--subtotal span, .offer-summary__row--subtotal strong { color: #10233b; font-weight: 800; }
    .offer-summary__row--discount { background: #fff6f5; }
    .offer-summary__row--discount span, .offer-summary__row--discount strong { color: #b42318; }
    .offer-summary__row--vat span { color: #42576f; }
    .offer-summary__row--total { margin-top: 0; padding: 15px 16px 14px; border-top: 1px solid #142742; border-bottom: none; background: linear-gradient(135deg, #13233a 0%, #223b63 100%); font-size: 15px; color: #f8fafc; }
    .offer-summary__row--total span, .offer-summary__row--total strong { color: #ffffff; }
    .offer-summary__row--total span { font-size: 12px; font-weight: 700; letter-spacing: 0.02em; text-transform: uppercase; }
    .offer-summary__row--total strong { font-size: 22px; letter-spacing: -0.03em; }
    .offer-section--terms { margin-top: 14px; clear: both; }
    .offer-section--notes { clear: both; }
    .offer-shell__footer { display: grid; grid-template-columns: minmax(0, 1.35fr) repeat(2, minmax(0, 1fr)); gap: 22px; padding-top: 20px; margin-top: 22px; border-top: 1px solid #dbe4ee; }
    .offer-shell__footer div { display: grid; gap: 7px; font-size: 14px; line-height: 1.55; color: #475569; }
    .doc-header { font-size: 12px; color: #64748b; margin-bottom: 0; }
    .doc-footer { font-size: 12px; color: #64748b; margin-top: 0; }
    .doc-divider { border: none; border-top: 1px solid #e2e8f0; margin: 16px 0; }
    .page-separator { border: none; border-top: 2px dashed #e2e8f0; margin: 0; }
    /* page-block is exactly 816px wide ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â matches the editor's data-a4-page dimensions */
    /* so fill-page images (posX:0, posY:0, width:816, height:1056) render without crop */
    .page-block { position: relative; min-height: 1056px; overflow: hidden; }
    @media (max-width: 640px) {
      .doc-wrapper { margin: 0; border: none; border-radius: 0; }
      .page-content { padding: 20px 16px; }
      .page-block { min-height: 0; overflow: visible; }
      .page-content--edge-to-edge > div[style*="position:absolute"] { position: relative !important; left: auto !important; top: auto !important; width: 100% !important; }
      .offer-shell { gap: 16px; }
      .offer-shell__header { display: grid; grid-template-columns: minmax(0, 1fr) 168px; gap: 12px; }
      .offer-shell__topline { display: grid; grid-template-columns: minmax(0, 1fr); gap: 10px; }
      .offer-shell__footer { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px 14px; }
      .offer-shell__meta { min-width: 0; justify-items: end; text-align: right; }
      .offer-shell__meta dl div { grid-template-columns: 1fr; gap: 2px; justify-items: end; }
      .offer-shell__meta dt { font-size: 12.5px; line-height: 1.5; }
      .offer-shell__meta dd { font-size: 14px; line-height: 1.5; white-space: normal; }
      .offer-shell__topline h1 { font-size: 17px; }
      .offer-shell__recipient-details { margin-top: 8px; font-size: 14px; line-height: 1.7; }
      .offer-shell__customer { min-width: 0; border-left: 1px solid #e2e8f0; border-top: none; padding-left: 10px; padding-top: 0; font-size: 14px; line-height: 1.55; }
      .offer-shell__sender-copy { font-size: 14px; line-height: 1.55; }
      .offer-section p { font-size: 14px; line-height: 1.78; }
      .offer-item-card__title { font-size: 17px; line-height: 1.35; }
      .offer-item-card__detail { display: block; }
      .offer-items__table { display: none; }
      .offer-items__cards { display: grid; gap: 16px; }
      .offer-item-card { border-color: #cfdbe8; box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06); background: #ffffff; }
      .offer-item-card__metric { min-height: 82px; }
      .offer-item-card__metric--total { padding: 16px 12px 15px; }
      .offer-item-card__metric--total dd { font-size: 20px; color: #ffffff; }
      .offer-summary { width: 100%; border-radius: 16px; padding: 0; margin-top: 18px; border-color: #cfdbe8; box-shadow: 0 8px 24px rgba(15, 23, 42, 0.05); }
      .offer-summary--below { width: 100%; margin-top: 18px; }
      .offer-summary__row { font-size: 14px; padding: 12px; line-height: 1.55; }
      .offer-summary__row--total { font-size: 16px; padding: 14px 12px; }
      .offer-summary__row--total span { font-size: 11px; }
      .offer-summary__row--total strong { font-size: 20px; color: #ffffff; }
      .offer-shell__footer div { justify-items: start; text-align: left; font-size: 13px; line-height: 1.6; }
      .offer-shell__footer-item--company { grid-column: 1 / -1; grid-template-columns: minmax(0, 1fr); row-gap: 4px; align-items: start; }
      .offer-shell__footer-item--company strong { justify-content: flex-start; }
      .offer-shell__footer-item--company > a, .offer-shell__footer-item--company > span:last-child { overflow-wrap: anywhere; }
      .offer-shell__footer-item--responsible, .offer-shell__footer-item--contact { padding-top: 10px; border-top: 1px solid #e2e8f0; }
    }
    @media print {
      .doc-wrapper { margin: 0; border: none; }
      .page-content { padding: 0; }
      .page-separator { display: none; }
      .page-block { page-break-after: always; min-height: 0; }
      .page-block:last-child { page-break-after: auto; }
      .doc-header { position: running(header); }
      .doc-footer { position: running(footer); }
    }
  </style>
</head>
<body>
  <div class="doc-wrapper">
    ${bodyHtml}
  </div>
</body>
</html>`, offer, branding);
}


