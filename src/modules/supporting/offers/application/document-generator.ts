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
  getDisplayModeLabel,
  getDisplayUnitPrice,
  normalizeVatRate,
  summarizeOfferPricing,
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

function buildOfferSummary(offer: Offer) {
  return summarizeOfferPricing(offer.lineItems, offer.priceDisplayMode);
}

function getOfferStatusLabel(status: Offer['status']): string {
  const labels: Record<Offer['status'], string> = {
    draft: 'Offert',
    sent: 'Offert',
    viewed: 'Offert',
    accepted: 'Signerad',
    declined: 'Avvisad',
    expired: 'Utgången',
  };
  return labels[status] ?? 'Offert';
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

function formatOfferStatus(status: Offer['status']): string {
  const labels: Record<Offer['status'], string> = {
    draft: 'Utkast',
    sent: 'Skickad',
    viewed: 'Visad',
    accepted: 'Accepterad',
    declined: 'Avvisad',
    expired: 'Utgången',
  };
  return labels[status] ?? 'Offert';
}

function splitLineItemDescription(description: string): { title: string; detail?: string } {
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

function resolveFreeImageRenderZIndex(zIndex: number): number {
  if (zIndex < 0) return 0;
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
          return `<div style="float:${wrapText};${ml}${mr}${mt}margin-bottom:8px;line-height:0;position:relative;z-index:${resolveFreeImageRenderZIndex(zIdx)};"><img src="${src}" alt="${alt}" title="${title}" style="${imgStyle}" /></div>`;
        }
        // Pure overlay (absolute)
        const w = imgW ? `${imgW}px` : '200px';
        return `<div style="position:absolute;left:${posX}px;top:${posY}px;width:${w};z-index:${resolveFreeImageRenderZIndex(zIdx)};line-height:0;"><img src="${src}" alt="${alt}" title="${title}" style="${imgStyle}" /></div>`;
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
      && (normalizedText.includes('Å-PRIS') || normalizedText.includes('A-PRIS'))
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
    'minmax(0, 1.85fr)',
    '72px',
    '112px',
    ...(showDiscountColumn ? ['92px'] : []),
    ...(showVatColumn ? ['92px'] : []),
    '116px',
  ].join(' ');

  const headerCells = [
    '<span>Produkt eller tj\u00e4nst</span>',
    '<span>Antal</span>',
    '<span>&Aring;-pris</span>',
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
        <div class="offer-item-row__value">${item.quantity}</div>
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
    const mobileRows = [
      `<div class="offer-item-card__metric"><dt>Antal</dt><dd>${item.quantity}</dd></div>`,
      `<div class="offer-item-card__metric"><dt>&Aring;-pris</dt><dd>${fmtSEKPrecise(displayUnitPrice)}</dd></div>`,
      ...(showDiscountColumn ? [`<div class="offer-item-card__metric"><dt>Rabatt</dt><dd>${item.discount ? `${item.discount}%` : '—'}</dd></div>`] : []),
      ...(showVatColumn ? [`<div class="offer-item-card__metric"><dt>Moms</dt><dd>${mobileVatLabel}</dd></div>`] : []),
      `<div class="offer-item-card__metric offer-item-card__metric--total"><dt>Belopp</dt><dd>${fmtSEKPrecise(displayLineTotal)}</dd></div>`,
    ].join('');

    return `
      <article class="offer-item-card">
        <div class="offer-item-card__top">
          <div class="offer-item-card__eyebrow">Produkt eller tj\u00e4nst</div>
          <div class="offer-item-card__title">${escapeHtml(description.title)}</div>
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
  const offerNumberStr = offer.offerNumber
    ? `${new Date(offer.createdAt).getFullYear()}-${String(offer.offerNumber).padStart(3, '0')}`
    : offer.id.slice(0, 8).toUpperCase();

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
    .replace(/ÃƒÆ’Ã¢â‚¬Â¦-pris/g, '\u00c5-pris')
    .replace(/ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦-pris/g, '\u00c5-pris')
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
    showLineItems?: boolean;
    showSummary?: boolean;
    showNotes?: boolean;
    showTerms?: boolean;
    showFooter?: boolean;
    summaryPlacement?: 'right' | 'below';
  };
}

function renderDocumentSummary(offer: Offer, placement: 'right' | 'below'): string {
  const summary = buildOfferSummary(offer);
  const boxClass = placement === 'below' ? 'offer-summary offer-summary--below' : 'offer-summary';
  const discountRow = summary.discountAmount > 0 ? `
    <div class="offer-summary__row">
      <span>Rabatt</span>
      <strong>${fmtSEKPrecise(summary.discountAmount)}</strong>
    </div>` : '';
  const vatRow = summary.hasVat ? `
    <div class="offer-summary__row">
      <span>${summary.vatLabel}</span>
      <strong>${fmtSEKPrecise(summary.vatAmount)}</strong>
    </div>` : '';

  return `
    <aside class="${boxClass}">
      <div class="offer-summary__row">
        <span>${summary.subtotalLabel}</span>
        <strong>${fmtSEKPrecise(offer.totalExVat)}</strong>
      </div>
      ${discountRow}
      ${vatRow}
      <div class="offer-summary__row offer-summary__row--total">
        <span>${summary.totalLabel}</span>
        <strong>${fmtSEKPrecise(summary.totalAmount)}</strong>
      </div>
    </aside>`;
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
    showLineItems: true,
    showSummary: true,
    showNotes: true,
    showTerms: true,
    showFooter: true,
    summaryPlacement: 'right',
    ...(page.document ?? {}),
  };

  const offerNumber = replacements['{{offerNumber}}'];
  const companyName = branding?.companyName?.trim() || branding?.senderName?.trim() || 'Avs\u00e4ndare';
  const responsibleName = branding?.responsibleName?.trim() || branding?.senderName?.trim() || '';
  const responsibleEmail = branding?.responsibleEmail?.trim() || branding?.senderEmail?.trim() || '';
  const senderWebsite = branding?.website?.trim()?.replace(/^https?:\/\//, '') || '';
  const logoUrl = branding?.logoUrl?.trim() || '';
  const statusLabel = getOfferStatusLabel(offer.status);
  const customerLines = buildCustomerLines(offer);
  const addressLines = branding?.addressLines ?? [];
  const headerSenderDetailsHtml = [
    `<p class="offer-shell__sender-name">${escapeHtml(companyName)}</p>`,
    ...addressLines.map((line) => `<p>${escapeHtml(line)}</p>`),
    senderWebsite ? `<p>${escapeHtml(senderWebsite)}</p>` : '',
  ]
    .filter(Boolean)
    .join('');
  const noteHtml = offer.notes ? `<section class="offer-section"><h3>Anteckningar</h3><p>${secureEscapeHtml(offer.notes)}</p></section>` : '';
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
  const introHtml = stripLegacyStructuredIntroHtml(nodeToHtml(page.body, introReplacements));
  const hasIntroVisualContent = /<(img|hr|table|ul|ol)\b/i.test(introHtml);
  const hasIntroTextContent = introHtml
    .replace(/<p[^>]*>(?:&nbsp;|\s|<br\s*\/?>)*<\/p>/gi, '')
    .replace(/<[^>]+>/g, '')
    .trim()
    .length > 0;
  const hasIntroContent = settings.showIntro && (hasIntroVisualContent || hasIntroTextContent);
  const tableHtml = buildStructuredLineItems(offer.lineItems, offer.priceDisplayMode);
  const summaryHtml = renderDocumentSummary(
    offer,
    (settings.summaryPlacement ?? 'right') as 'right' | 'below',
  );
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
              <p class="offer-shell__status offer-shell__status--${offer.status}">${escapeHtml(statusLabel)}</p>
              <dl>
                <div><dt>Offertnummer</dt><dd>${offerNumber}</dd></div>
                <div><dt>Offertdatum</dt><dd>${replacements['{{createdDate}}']}</dd></div>
                <div><dt>Giltig till</dt><dd>${replacements['{{validUntil}}']}</dd></div>
              </dl>
            </div>
          </header>

          <section class="offer-shell__topline">
            <div>
              <h1>${escapeHtml(offer.title)}</h1>
            </div>
            ${settings.showCustomerBlock ? `
              <div class="offer-shell__customer">
                ${customerLines.map((line: string, index: number) => `<p class="${index === 0 ? 'offer-shell__customer-name' : ''}">${escapeHtml(line)}</p>`).join('')}
              </div>` : ''}
          </section>

          ${hasIntroContent ? `<section class="offer-section offer-section--intro">${introHtml}</section>` : ''}

          ${settings.showLineItems ? `
            <section class="offer-section">
              <div class="offer-table-header">
                <h2>Produkter och tj\u00e4nster</h2>
              </div>
              ${tableHtml}
            </section>` : ''}

          ${settings.showSummary ? summaryHtml : ''}
          ${settings.showTerms ? `
            <section class="offer-section offer-section--terms">
              <h3>Juridiska villkor</h3>
              <p>Offerten g\u00e4ller till angivet datum. Arbetet utf\u00f6rs enligt \u00f6verenskommen omfattning och faktureras enligt summeringen ovan. Eventuella \u00e4ndringar eller till\u00e4gg hanteras som separat till\u00e4ggsbest\u00e4llning.</p>
            </section>` : ''}
          ${settings.showNotes ? noteHtml : ''}
          ${settings.showFooter ? `
            <footer class="offer-shell__footer">
              <div><strong>${escapeHtml(companyName)}</strong><span>${escapeHtml(senderWebsite || '-')}</span></div>
              <div><strong>Ansvarig</strong><span>${escapeHtml(responsibleName || responsibleEmail || '-')}</span></div>
              <div><strong>Kontakt</strong><span>${escapeHtml(responsibleEmail || '-')}</span></div>
            </footer>` : ''}
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
  const offerNumberStr = offer.offerNumber
    ? `${new Date(offer.createdAt).getFullYear()}-${String(offer.offerNumber).padStart(3, '0')}`
    : offer.id.slice(0, 8).toUpperCase();
  const fallbackLineItemsHtml = buildStructuredLineItems(offer.lineItems, offer.priceDisplayMode);
  const fallbackSummaryHtml = renderDocumentSummary(offer, 'below');
  const companyName = branding?.companyName?.trim() || branding?.senderName?.trim() || 'Avs\u00e4ndare';
  const responsibleName = branding?.responsibleName?.trim() || branding?.senderName?.trim() || '';
  const responsibleEmail = branding?.responsibleEmail?.trim() || branding?.senderEmail?.trim() || '';
  const senderWebsite = branding?.website?.trim()?.replace(/^https?:\/\//, '') || '';
  const logoUrl = branding?.logoUrl?.trim() || '';
  const statusLabel = getOfferStatusLabel(offer.status);
  const customerLines = buildCustomerLines(offer);

  const fallbackAddressLines = branding?.addressLines ?? [];
  const headerSenderBlockHtml = [
    `<p style="margin:0;font-weight:700;color:#0f172a;">${escapeHtml(companyName)}</p>`,
    ...fallbackAddressLines.map((line) => `<p style="margin:2px 0 0 0;color:#64748b;">${escapeHtml(line)}</p>`),
    senderWebsite ? `<p style="margin:2px 0 0 0;color:#64748b;">${escapeHtml(senderWebsite)}</p>` : '',
  ]
    .filter(Boolean)
    .join('');

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
    .doc-wrapper { max-width: 816px; margin: 40px auto; padding: 40px 48px; background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; }
    .offer-section { display: grid; gap: 8px; }
    .offer-table-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
    .offer-table-header h2 { margin: 0; font-size: 13px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: #475569; }
    .offer-items { display: grid; gap: 12px; }
    .offer-items__table { display: block; border: 1px solid #dbe4ee; border-radius: 18px; background: #ffffff; overflow: hidden; }
    .offer-items__head, .offer-item-row { display: grid; grid-template-columns: var(--offer-columns); align-items: start; }
    .offer-items__head { gap: 14px; padding: 11px 16px; background: linear-gradient(180deg, #f8fbff 0%, #eef4fb 100%); border-bottom: 1px solid #dbe4ee; color: #64748b; font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; }
    .offer-item-row { gap: 14px; padding: 16px; border-bottom: 1px solid #eef2f7; }
    .offer-item-row:last-child { border-bottom: none; }
    .offer-item-row__product { display: grid; gap: 5px; min-width: 0; }
    .offer-item-row__title { font-size: 15px; line-height: 1.35; font-weight: 700; color: #0f172a; }
    .offer-item-row__detail { font-size: 13px; line-height: 1.68; color: #64748b; }
    .offer-item-row__value { text-align: right; font-size: 14px; line-height: 1.5; color: #334155; }
    .offer-item-row__value--strong { font-weight: 700; color: #0f172a; }
    .offer-items__cards { display: none; }
    .offer-item-card { border: 1px solid #dbe4ee; border-radius: 18px; background: #ffffff; overflow: hidden; box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04); }
    .offer-item-card__top { display: grid; gap: 6px; padding: 15px 16px 14px; background: linear-gradient(180deg, #fcfdff 0%, #f8fbff 100%); border-bottom: 1px solid #eef2f7; }
    .offer-item-card__eyebrow { font-size: 10px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #94a3b8; }
    .offer-item-card__title { font-size: 16px; line-height: 1.3; font-weight: 700; color: #0f172a; }
    .offer-item-card__detail { font-size: 13px; line-height: 1.7; color: #64748b; }
    .offer-item-card__grid { display: grid; gap: 0; margin: 0; }
    .offer-item-card__metric { display: flex; justify-content: space-between; gap: 16px; padding: 11px 16px; border-bottom: 1px solid #eef2f7; }
    .offer-item-card__metric:last-child { border-bottom: none; }
    .offer-item-card__metric dt, .offer-item-card__metric dd { margin: 0; }
    .offer-item-card__metric dt { font-size: 12px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: #94a3b8; }
    .offer-item-card__metric dd { text-align: right; font-size: 14px; font-weight: 600; color: #0f172a; }
    .offer-item-card__metric--total { background: #f8fafc; }
    .offer-item-card__metric--total dt { color: #475569; }
    .offer-item-card__metric--total dd { font-size: 18px; font-weight: 800; letter-spacing: -0.02em; color: #0f172a; }
    .offer-summary { margin-left: auto; width: min(240px, 100%); border: 1px solid #dbe4ee; border-radius: 14px; background: #ffffff; padding: 8px 0; display: grid; gap: 0; box-shadow: 0 1px 2px rgba(15, 23, 42, 0.03); }
    .offer-summary--below { width: min(360px, 100%); margin-left: auto; }
    .offer-summary__row { display: flex; justify-content: space-between; align-items: baseline; gap: 16px; padding: 7px 14px; font-size: 13px; line-height: 1.5; color: #475569; }
    .offer-summary__row strong { white-space: nowrap; color: #0f172a; }
    .offer-summary__row--total { margin-top: 6px; padding: 11px 14px 10px; border-top: 1px solid #e8eef5; background: #f8fafc; font-size: 14px; font-weight: 700; color: #0f172a; }
    .offer-summary__row--total strong { color: #0f172a; font-size: 18px; }
    @media (max-width: 640px) {
      .doc-wrapper { margin: 0; padding: 24px 16px; border: none; border-radius: 0; }
      .offer-items__table { display: none; }
      .offer-items__cards { display: grid; gap: 16px; }
      .offer-item-card { border-color: #cfdbe8; box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06); }
      .offer-item-card__title { font-size: 17px; line-height: 1.35; }
      .offer-item-card__detail { display: none; }
      .offer-item-card__metric { background: #ffffff; }
      .offer-item-card__metric:nth-child(even) { background: #fbfdff; }
      .offer-item-card__metric--total { background: linear-gradient(180deg, #eef5ff 0%, #e2eeff 100%); border-top: 1px solid #c7d9ee; }
      .offer-item-card__metric--total dd { font-size: 20px; font-weight: 800; color: #0f172a; }
      .offer-summary { width: 100%; border-radius: 16px; padding: 8px 0; margin-top: 18px; border-color: #cfdbe8; box-shadow: 0 8px 24px rgba(15, 23, 42, 0.05); }
      .offer-summary--below { width: 100%; margin-top: 18px; }
      .offer-summary__row { font-size: 14px; padding: 8px 12px; line-height: 1.55; }
      .offer-summary__row--total { font-size: 16px; padding: 12px; background: #0f172a; color: #f8fafc; }
      .offer-summary__row--total strong { font-size: 19px; color: #ffffff; }
    }
    @media print { .doc-wrapper { margin: 0; padding: 0; border: none; } }
  </style>
</head>
<body>
  <div class="doc-wrapper">
    ${(logoUrl || companyName || responsibleName || responsibleEmail || senderWebsite || fallbackAddressLines.length > 0) ? `
    <div style="display:flex;justify-content:space-between;gap:24px;align-items:flex-start;margin-bottom:28px;">
      <div style="display:flex;gap:14px;align-items:flex-start;">
        ${logoUrl ? `<img src="${sanitizeUrl(logoUrl)}" alt="${escapeHtml(companyName)}" style="width:54px;height:54px;object-fit:contain;border-radius:12px;"/>` : ''}
        <div>${headerSenderBlockHtml}</div>
      </div>
      <div style="min-width:220px;text-align:right;display:grid;gap:8px;">
        <p style="margin:0 0 4px auto;display:inline-flex;align-items:center;justify-content:center;padding:6px 12px;border-radius:999px;background:#eef2ff;color:#3730a3;font-size:12px;font-weight:700;">${escapeHtml(statusLabel)}</p>
        <div style="display:grid;gap:6px;">
          <p style="margin:0;color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:0.08em;font-weight:700;">Offertnummer</p>
              <p style="margin:0;color:#0f172a;font-weight:700;">${escapeHtml(offerNumberStr)}</p>
          <p style="margin:4px 0 0 0;color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:0.08em;font-weight:700;">Offertdatum</p>
          <p style="margin:0;color:#0f172a;font-weight:600;">${fmtDate(offer.createdAt)}</p>
          <p style="margin:4px 0 0 0;color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:0.08em;font-weight:700;">Giltig till</p>
          <p style="margin:0;color:#0f172a;font-weight:600;">${fmtDate(offer.validUntil)}</p>
        </div>
      </div>
    </div>` : ''}
    <h1 style="font-size:1.8em;font-weight:700;margin:0 0 6px 0;">${escapeHtml(offer.title)}</h1>
          <p style="color:#64748b;font-size:13px;margin:0 0 32px 0;">Offert ${escapeHtml(offerNumberStr)} &middot; Giltig till ${fmtDate(offer.validUntil)}</p>

    <p style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:#64748b;margin:0 0 4px 0;">Till</p>
    ${customerLines.map((line: string, index: number) => `<p style="margin:0 0 2px 0;${index === 0 ? 'font-weight:600;color:#0f172a;' : 'color:#64748b;'}">${escapeHtml(line)}</p>`).join('')}
    <div style="height:30px;"></div>

    <hr style="border:none;border-top:1px solid #e2e8f0;margin:0 0 24px 0;"/>

    <section class="offer-section">
      <div class="offer-table-header">
        <h2>Produkter och tj\u00e4nster</h2>
      </div>
      ${fallbackLineItemsHtml}
    </section>

    ${fallbackSummaryHtml}

    ${offer.notes ? `
    <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;"/>
    <p style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:#64748b;margin:0 0 8px 0;">Anteckningar</p>
    <p style="color:#334155;margin:0;">${escapeHtml(offer.notes)}</p>` : ''}

    ${(responsibleName || responsibleEmail) ? `
    <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;"/>
    <div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;">
      <div style="display:grid;gap:4px;font-size:12px;color:#475569;">
        <strong>Ansvarig</strong>
        <span>${escapeHtml(responsibleName || responsibleEmail || '—')}</span>
      </div>
      <div style="display:grid;gap:4px;font-size:12px;color:#475569;">
        <strong>Kontakt</strong>
        <span>${escapeHtml(responsibleEmail || '—')}</span>
      </div>
    </div>` : ''}

    ${SIGNATURE_FIELD_HTML}
  </div>
</body>
</html>`;

  return fixOfferHtmlText(html);
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
    if (page.kind === 'document') {
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

    if (parsed._v === 3) {
      // TemplateDoc v3: multi-page format
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

  return `<!DOCTYPE html>
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
    .page-content { padding: 40px 48px; }
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
    .offer-shell { min-height: 100%; display: flex; flex-direction: column; gap: 18px; color: #0f172a; }
    .offer-shell__header, .offer-shell__topline { display: grid; grid-template-columns: minmax(0, 1fr) minmax(196px, 232px); gap: 18px; align-items: flex-start; }
    .offer-shell__sender { display: flex; gap: 12px; align-items: flex-start; min-width: 0; }
    .offer-shell__logo { width: 48px; height: 48px; object-fit: contain; }
    .offer-shell__sender-copy { display: grid; gap: 2px; font-size: 13px; line-height: 1.5; color: #475569; }
    .offer-shell__sender-copy p, .offer-shell__meta dt, .offer-shell__meta dd, .offer-shell__customer p { margin: 0; }
    .offer-shell__sender-name, .offer-shell__customer-name { font-weight: 700; }
    .offer-shell__meta { min-width: 0; display: grid; gap: 10px; justify-items: end; text-align: right; }
    .offer-shell__status { margin: 0; display: inline-flex; align-items: center; justify-content: center; padding: 5px 11px; border-radius: 999px; font-size: 11px; font-weight: 700; }
    .offer-shell__status--draft { background: #e2e8f0; color: #334155; }
    .offer-shell__status--sent, .offer-shell__status--viewed { background: #dbeafe; color: #1d4ed8; }
    .offer-shell__status--accepted { background: #dcfce7; color: #166534; }
    .offer-shell__status--declined { background: #fee2e2; color: #b91c1c; }
    .offer-shell__status--expired { background: #f3f4f6; color: #6b7280; }
    .offer-shell__meta dl { margin: 0; display: grid; gap: 6px; width: 100%; }
    .offer-shell__meta dl div { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 12px; align-items: start; justify-content: flex-end; }
    .offer-shell__meta dt { font-size: 12px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #64748b; line-height: 1.45; }
    .offer-shell__meta dd { font-size: 14px; font-weight: 600; color: #0f172a; white-space: nowrap; line-height: 1.45; }
    .offer-shell__topline { align-items: flex-start; padding-bottom: 14px; border-bottom: 1px solid #dbe4ee; }
    .offer-shell__topline h1 { margin: 0; font-size: 19px; line-height: 1.2; font-weight: 700; }
    .offer-shell__customer { display: grid; gap: 2px; padding-left: 14px; border-left: 1px solid #e2e8f0; font-size: 12px; color: #475569; }
    .offer-section { display: grid; gap: 8px; }
    .offer-section h2, .offer-section h3 { margin: 0; font-size: 13px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: #475569; }
    .offer-section p { margin: 0; font-size: 13px; line-height: 1.72; color: #334155; }
    .offer-table-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
    .offer-items { display: grid; gap: 12px; }
    .offer-items__table { display: block; border: 1px solid #dbe4ee; border-radius: 18px; background: #ffffff; overflow: hidden; }
    .offer-items__head, .offer-item-row { display: grid; grid-template-columns: var(--offer-columns); align-items: start; }
    .offer-items__head { gap: 14px; padding: 11px 16px; background: linear-gradient(180deg, #f8fbff 0%, #eef4fb 100%); border-bottom: 1px solid #dbe4ee; color: #64748b; font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; }
    .offer-item-row { gap: 14px; padding: 16px; border-bottom: 1px solid #eef2f7; }
    .offer-item-row:last-child { border-bottom: none; }
    .offer-item-row__product { display: grid; gap: 5px; min-width: 0; }
    .offer-item-row__title { font-size: 15px; line-height: 1.35; font-weight: 700; color: #0f172a; }
    .offer-item-row__detail { font-size: 13px; line-height: 1.68; color: #64748b; }
    .offer-item-row__value { text-align: right; font-size: 14px; line-height: 1.5; color: #334155; }
    .offer-item-row__value--strong { font-weight: 700; color: #0f172a; }
    .offer-items__cards { display: none; }
    .offer-item-card { border: 1px solid #dbe4ee; border-radius: 18px; background: #ffffff; overflow: hidden; box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04); }
    .offer-item-card__top { display: grid; gap: 6px; padding: 15px 16px 14px; background: linear-gradient(180deg, #fcfdff 0%, #f8fbff 100%); border-bottom: 1px solid #eef2f7; }
    .offer-item-card__eyebrow { font-size: 10px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #94a3b8; }
    .offer-item-card__title { font-size: 16px; line-height: 1.3; font-weight: 700; color: #0f172a; }
    .offer-item-card__detail { font-size: 13px; line-height: 1.7; color: #64748b; }
    .offer-item-card__grid { display: grid; gap: 0; margin: 0; }
    .offer-item-card__metric { display: flex; justify-content: space-between; gap: 16px; padding: 11px 16px; border-bottom: 1px solid #eef2f7; }
    .offer-item-card__metric:last-child { border-bottom: none; }
    .offer-item-card__metric dt, .offer-item-card__metric dd { margin: 0; }
    .offer-item-card__metric dt { font-size: 12px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: #94a3b8; }
    .offer-item-card__metric dd { text-align: right; font-size: 14px; font-weight: 600; color: #0f172a; }
    .offer-item-card__metric--total { background: #f8fafc; }
    .offer-summary { margin-left: auto; width: min(240px, 100%); border: 1px solid #dbe4ee; border-radius: 14px; background: #ffffff; padding: 8px 0; display: grid; gap: 0; box-shadow: 0 1px 2px rgba(15, 23, 42, 0.03); }
    .offer-summary--below { width: min(360px, 100%); margin-left: auto; }
    .offer-summary__row { display: flex; justify-content: space-between; align-items: baseline; gap: 16px; padding: 7px 14px; font-size: 13px; line-height: 1.5; color: #475569; }
    .offer-summary__row strong { white-space: nowrap; color: #0f172a; }
    .offer-summary__row--total { margin-top: 6px; padding: 11px 14px 10px; border-top: 1px solid #e8eef5; background: #f8fafc; font-size: 14px; font-weight: 700; color: #0f172a; }
    .offer-summary__row--total strong { color: #0f172a; font-size: 18px; }
    .offer-section--terms { margin-top: auto; }
    .offer-shell__footer { display: grid; grid-template-columns: minmax(0, 1.35fr) repeat(2, minmax(0, 1fr)); gap: 14px; padding-top: 14px; border-top: 1px solid #dbe4ee; }
    .offer-shell__footer div { display: grid; gap: 4px; font-size: 13px; line-height: 1.55; color: #475569; }
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
      .offer-shell__header, .offer-shell__topline { display: grid; grid-template-columns: minmax(0, 1fr) 168px; gap: 12px; }
      .offer-shell__footer { grid-template-columns: 1fr; gap: 10px; }
      .offer-shell__meta { min-width: 0; justify-items: end; text-align: right; }
      .offer-shell__meta dl div { grid-template-columns: 1fr; gap: 2px; justify-items: end; }
      .offer-shell__meta dt { font-size: 12.5px; line-height: 1.5; }
      .offer-shell__meta dd { font-size: 14px; line-height: 1.5; white-space: normal; }
      .offer-shell__topline h1 { font-size: 17px; }
      .offer-shell__customer { min-width: 0; border-left: 1px solid #e2e8f0; border-top: none; padding-left: 10px; padding-top: 0; font-size: 14px; line-height: 1.55; }
      .offer-shell__sender-copy { font-size: 14px; line-height: 1.55; }
      .offer-section p { font-size: 14px; line-height: 1.78; }
      .offer-item-card__title { font-size: 17px; line-height: 1.35; }
      .offer-item-card__detail { display: none; }
      .offer-items__table { display: none; }
      .offer-items__cards { display: grid; gap: 16px; }
      .offer-item-card { border-color: #cfdbe8; box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06); background: #ffffff; }
      .offer-item-card__metric { background: #ffffff; }
      .offer-item-card__metric:nth-child(even) { background: #fbfdff; }
      .offer-item-card__metric--total { background: linear-gradient(180deg, #eef5ff 0%, #e2eeff 100%); border-top: 1px solid #c7d9ee; }
      .offer-item-card__metric--total dd { font-size: 20px; font-weight: 800; color: #0f172a; }
      .offer-summary { width: 100%; border-radius: 16px; padding: 8px 0; margin-top: 18px; border-color: #cfdbe8; box-shadow: 0 8px 24px rgba(15, 23, 42, 0.05); }
      .offer-summary--below { width: 100%; margin-top: 18px; }
      .offer-summary__row { font-size: 14px; padding: 8px 12px; line-height: 1.55; }
      .offer-summary__row--total { font-size: 16px; padding: 12px; background: #0f172a; color: #f8fafc; }
      .offer-summary__row--total strong { font-size: 19px; color: #ffffff; }
      .offer-shell__footer div { font-size: 14px; line-height: 1.6; }
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
</html>`;
}


