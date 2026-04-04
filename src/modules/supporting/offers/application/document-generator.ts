/**
 * Document Generator — server-side only.
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
  summarizeOfferPricing,
} from '../domain/pricing';
import type { OfferBrandingProfile } from './company-branding';
import { sanitizeUrl, escapeHtml as secureEscapeHtml } from '@platform/security/sanitize';

// ─── SEK formatter ─────────────────────────────────────────────────────────────

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
  const separator = value.includes(' — ') ? ' — ' : value.includes(' - ') ? ' - ' : '';
  if (!separator) return { title: value };

  const [title, ...rest] = value.split(separator);
  const detail = rest.join(separator).trim();
  return {
    title: title.trim(),
    detail: detail || undefined,
  };
}

// ─── TipTap JSON → HTML ─────────────────────────────────────────────────────────

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
          return `<div style="float:${wrapText};${ml}${mr}${mt}margin-bottom:8px;line-height:0;"><img src="${src}" alt="${alt}" title="${title}" style="${imgStyle}" /></div>`;
        }
        // Pure overlay (absolute)
        const w = imgW ? `${imgW}px` : '200px';
        return `<div style="position:absolute;left:${posX}px;top:${posY}px;width:${w};z-index:${zIdx};line-height:0;"><img src="${src}" alt="${alt}" title="${title}" style="${imgStyle}" /></div>`;
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

    // ── New node types ────────────────────────────────────────────────────────

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
          <span style="font-size:20px;">${icons[fieldType] ?? '✍'}</span>
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
      // Unknown node type — render children if any
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

// ─── Line items table ──────────────────────────────────────────────────────────

function buildLineItemsTable(items: OfferLineItem[], mode: Offer['priceDisplayMode']): string {
  const pricing = summarizeOfferPricing(items, mode);
  const showVatColumn = pricing.hasVat;
  const showDiscountColumn = items.some((item) => (item.discount ?? 0) > 0);
  const headerStyle = 'padding:10px 12px;text-align:left;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#475569;background:#eef2f7;border-bottom:1px solid #d9e2ec;';
  const cellStyle   = 'padding:10px 12px;font-size:13px;border-bottom:1px solid #e2e8f0;vertical-align:top;';
  const numStyle    = `${cellStyle}text-align:right;`;

  const rows = items.map((item) => {
    const displayUnitPrice = getDisplayUnitPrice(item, mode);
    const displayLineTotal = getDisplayLineTotal(item, mode);
    const description = splitLineItemDescription(item.description);
    return `
      <tr>
        <td data-label="Beskrivning" style="${cellStyle}">
          <div style="font-weight:600;color:#0f172a;margin-bottom:${description.detail ? '4px' : '0'};">${escapeHtml(description.title)}</div>
          ${description.detail ? `<div style="font-size:12px;line-height:1.45;color:#64748b;">${escapeHtml(description.detail)}</div>` : ''}
        </td>
        <td data-label="Antal"       style="${numStyle}">${item.quantity}</td>
        <td data-label="&Agrave;-pris" style="${numStyle}">${fmtSEKPrecise(displayUnitPrice)}</td>
        ${showDiscountColumn ? `<td data-label="Rabatt" style="${numStyle}">${item.discount ? `${item.discount}%` : '—'}</td>` : ''}
        ${showVatColumn ? `<td data-label="Moms" style="${numStyle}">${formatVatRate(item.vatRate)}</td>` : ''}
        <td data-label="Belopp"      style="${numStyle};font-weight:600;">${fmtSEKPrecise(displayLineTotal)}</td>
      </tr>`;
  }).join('');

  return `
    <table class="line-items" style="width:100%;border-collapse:collapse;margin-bottom:1em;">
      <thead>
        <tr>
          <th style="${headerStyle}">Beskrivning</th>
          <th style="${headerStyle}text-align:right;">Antal</th>
          <th style="${headerStyle}text-align:right;">&Agrave;-pris</th>
          ${showDiscountColumn ? `<th style="${headerStyle}text-align:right;">Rabatt</th>` : ''}
          ${showVatColumn ? `<th style="${headerStyle}text-align:right;">Moms</th>` : ''}
          <th style="${headerStyle}text-align:right;">Belopp</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;
}

// ─── Signature placeholder HTML ────────────────────────────────────────────────

const SIGNATURE_FIELD_HTML = `
  <div data-sig-field="signature" style="border:2px dashed #cbd5e1;border-radius:8px;padding:24px 20px;margin:24px 0;text-align:center;min-height:80px;background:#f8fafc;">
    <p style="color:#94a3b8;font-size:12px;margin:0 0 4px 0;text-transform:uppercase;letter-spacing:0.1em;font-weight:600;">Signatur</p>
    <p style="color:#cbd5e1;font-size:11px;margin:0;">Underteckna med e-signatur via l&auml;nken du mottog</p>
  </div>`;

// ─── Shared placeholder builder ─────────────────────────────────────────────────

/**
 * Builds the {{placeholder}} → value map for a given offer.
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

// ─── Shared mobile CSS for table card layout ───────────────────────────────────

const MOBILE_TABLE_CSS = `
      .line-items { display: block; width: 100%; }
      .line-items thead { display: none; }
      .line-items tbody { display: block; }
      .line-items tr { display: block; background: #fff; border-radius: 10px; box-shadow: 0 1px 3px rgba(0,0,0,0.07), 0 0 0 1px #e2e8f0; margin-bottom: 8px; overflow: hidden; }
      .line-items td { display: flex; justify-content: space-between; align-items: baseline; padding: 9px 14px; border-bottom: 1px solid #f1f5f9; font-size: 13px; text-align: left !important; }
      .line-items td:last-child { border-bottom: none; }
      .line-items td::before { content: attr(data-label); color: #94a3b8; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; flex-shrink: 0; margin-right: 12px; padding-top: 1px; }
      .totals { display: block; width: 100%; }
      .totals tr { display: flex; justify-content: space-between; }
      .totals td { border: none !important; flex: 1; }
      table:not(.line-items):not(.totals) { display: block; overflow-x: auto; -webkit-overflow-scrolling: touch; }`;

// ─── Fill-page image detection ─────────────────────────────────────────────────

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
  const companyName = branding?.companyName?.trim() || branding?.senderName?.trim() || 'Avsändare';
  const responsibleName = branding?.responsibleName?.trim() || branding?.senderName?.trim() || '';
  const responsibleEmail = branding?.responsibleEmail?.trim() || branding?.senderEmail?.trim() || '';
  const senderWebsite = branding?.website?.trim()?.replace(/^https?:\/\//, '') || '';
  const logoUrl = branding?.logoUrl?.trim() || '';
  const addressLines = branding?.addressLines ?? [];
  const senderDetailsHtml = [
    `<p class="offer-shell__sender-name">${escapeHtml(companyName)}</p>`,
    ...addressLines.map((line) => `<p>${escapeHtml(line)}</p>`),
    responsibleName ? `<p><strong>Ansvarig:</strong> ${escapeHtml(responsibleName)}</p>` : '',
    responsibleEmail ? `<p><strong>Kontakt:</strong> ${escapeHtml(responsibleEmail)}</p>` : '',
    senderWebsite ? `<p>${escapeHtml(senderWebsite)}</p>` : '',
  ]
    .filter(Boolean)
    .join('');
  const noteHtml = offer.notes ? `<section class="offer-section"><h3>Anteckningar</h3><p>${secureEscapeHtml(offer.notes)}</p></section>` : '';
  const introHtml = nodeToHtml(page.body, replacements);
  const tableHtml = buildLineItemsTable(offer.lineItems, offer.priceDisplayMode);
  const summaryHtml = renderDocumentSummary(
    offer,
    (settings.summaryPlacement ?? 'right') as 'right' | 'below',
  );
  const backgroundStyle = settings.backgroundImageSrc
    ? `style="--doc-bg:url('${sanitizeUrl(settings.backgroundImageSrc)}');--doc-bg-opacity:${settings.backgroundOpacity};--doc-bg-position:${
        settings.watermarkMode === 'top' ? 'center top' : settings.watermarkMode === 'full' ? 'center center' : 'center bottom'
      };--doc-bg-size:${settings.watermarkMode === 'full' ? '100% 100%' : '78% auto'};"`
    : '';

  return `
    <div class="page-block page-block--document" ${backgroundStyle} data-page="${pageIndex + 1}"${page.includeInCustomerPdf === false ? ' data-customer-pdf="false"' : ''}>
      <div class="page-content page-content--document">
        <section class="offer-shell">
          <header class="offer-shell__header">
            <div class="offer-shell__sender">
              ${settings.showLogo && logoUrl ? `<img class="offer-shell__logo" src="${sanitizeUrl(logoUrl)}" alt="${escapeHtml(companyName)}" />` : ''}
              ${settings.showSenderDetails ? `
                <div class="offer-shell__sender-copy">
                  ${senderDetailsHtml}
                </div>` : ''}
            </div>
            <div class="offer-shell__meta">
              <p class="offer-shell__title">Offert</p>
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
                <p class="offer-shell__customer-name">${escapeHtml(offer.recipientCompany || offer.recipientName)}</p>
                <p>${escapeHtml(offer.recipientName)}</p>
                <p>${escapeHtml(offer.recipientEmail)}</p>
              </div>` : ''}
          </section>

          ${settings.showIntro ? `<section class="offer-section offer-section--intro">${introHtml}</section>` : ''}

          ${settings.showLineItems ? `
            <section class="offer-section">
              <div class="offer-table-header">
                <h2>Produkter och tjänster</h2>
              </div>
              ${tableHtml}
            </section>` : ''}

          ${settings.showSummary ? summaryHtml : ''}
          ${settings.showNotes ? noteHtml : ''}
          ${settings.showTerms ? `
            <section class="offer-section offer-section--terms">
              <h3>Juridiska villkor</h3>
              <p>Offerten gäller till angivet datum. Arbetet utförs enligt överenskommen omfattning och faktureras enligt summeringen ovan. Eventuella ändringar eller tillägg hanteras som separat tilläggsbeställning.</p>
            </section>` : ''}
          ${settings.showFooter ? `
            <footer class="offer-shell__footer">
              <div><strong>${escapeHtml(companyName)}</strong><span>${escapeHtml(senderWebsite || '—')}</span></div>
              <div><strong>Ansvarig</strong><span>${escapeHtml(responsibleName || responsibleEmail || '—')}</span></div>
              <div><strong>Kontakt</strong><span>${escapeHtml(responsibleEmail || '—')}</span></div>
              <div><strong>Prisvisning</strong><span>${getDisplayModeLabel(buildOfferSummary(offer).hasVat, offer.priceDisplayMode)}</span></div>
            </footer>` : ''}
        </section>
      </div>
    </div>`;
}

// ─── Main generator ────────────────────────────────────────────────────────────

/**
 * Generates a clean fallback HTML document from offer data alone (no template).
 * Used when an offer is sent without a linked template.
 */
export function generateFallbackDocument(offer: Offer, branding?: OfferBrandingProfile): string {
  const pricing        = buildOfferSummary(offer);
  const offerNumberStr = offer.offerNumber
    ? `${new Date(offer.createdAt).getFullYear()}-${String(offer.offerNumber).padStart(3, '0')}`
    : offer.id.slice(0, 8).toUpperCase();
  const companyName = branding?.companyName?.trim() || branding?.senderName?.trim() || 'Avsändare';
  const responsibleName = branding?.responsibleName?.trim() || branding?.senderName?.trim() || '';
  const responsibleEmail = branding?.responsibleEmail?.trim() || branding?.senderEmail?.trim() || '';
  const senderWebsite = branding?.website?.trim()?.replace(/^https?:\/\//, '') || '';
  const logoUrl = branding?.logoUrl?.trim() || '';

  const fallbackAddressLines = branding?.addressLines ?? [];
  const senderBlockHtml = [
    `<p style="margin:0;font-weight:700;color:#0f172a;">${escapeHtml(companyName)}</p>`,
    ...fallbackAddressLines.map((line) => `<p style="margin:2px 0 0 0;color:#64748b;">${escapeHtml(line)}</p>`),
    responsibleName ? `<p style="margin:4px 0 0 0;color:#64748b;"><strong>Ansvarig:</strong> ${escapeHtml(responsibleName)}</p>` : '',
    responsibleEmail ? `<p style="margin:2px 0 0 0;color:#64748b;"><strong>Kontakt:</strong> ${escapeHtml(responsibleEmail)}</p>` : '',
    senderWebsite ? `<p style="margin:2px 0 0 0;color:#64748b;">${escapeHtml(senderWebsite)}</p>` : '',
  ]
    .filter(Boolean)
    .join('');

  return `<!DOCTYPE html>
<html lang="sv">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>${escapeHtml(offer.title)}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 14px; line-height: 1.6; color: #1e293b; background: #fff; margin: 0; padding: 0; }
    img { max-width: 100%; height: auto; }
    .doc-wrapper { max-width: 816px; margin: 40px auto; padding: 40px 48px; background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; }
    @media (max-width: 640px) {
      .doc-wrapper { margin: 0; padding: 24px 16px; border: none; border-radius: 0; }${MOBILE_TABLE_CSS}
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
        <div>${senderBlockHtml}</div>
      </div>
      <div style="text-align:right;">
        <p style="margin:0;color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:0.08em;font-weight:700;">Offert</p>
        <p style="margin:8px 0 0 0;color:#0f172a;font-weight:700;">${escapeHtml(offerNumberStr)}</p>
      </div>
    </div>` : ''}
    <h1 style="font-size:1.8em;font-weight:700;margin:0 0 6px 0;">${escapeHtml(offer.title)}</h1>
    <p style="color:#64748b;font-size:13px;margin:0 0 32px 0;">Offert ${escapeHtml(offerNumberStr)} · Giltig till ${fmtDate(offer.validUntil)}</p>

    <p style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:#64748b;margin:0 0 4px 0;">Till</p>
    <p style="font-weight:600;margin:0 0 2px 0;">${escapeHtml(offer.recipientName)}</p>
    ${offer.recipientCompany ? `<p style="color:#64748b;margin:0 0 2px 0;">${escapeHtml(offer.recipientCompany)}</p>` : ''}
    <p style="color:#64748b;margin:0 0 32px 0;">${escapeHtml(offer.recipientEmail)}</p>

    <hr style="border:none;border-top:1px solid #e2e8f0;margin:0 0 24px 0;"/>

    ${buildLineItemsTable(offer.lineItems, offer.priceDisplayMode)}

    <table class="totals" style="width:100%;border-collapse:collapse;margin-top:8px;">
      <tr>
        <td style="text-align:right;padding:4px 12px;font-size:13px;color:#64748b;">${pricing.subtotalLabel}</td>
        <td style="text-align:right;padding:4px 12px;font-size:13px;font-weight:600;white-space:nowrap;">${fmtSEK(offer.totalExVat)}</td>
      </tr>
      ${pricing.hasVat ? `<tr>
        <td style="text-align:right;padding:4px 12px;font-size:13px;color:#64748b;">${pricing.vatLabel}</td>
        <td style="text-align:right;padding:4px 12px;font-size:13px;white-space:nowrap;">${fmtSEK(pricing.vatAmount)}</td>
      </tr>` : ''}
      <tr>
        <td style="text-align:right;padding:8px 12px;font-size:15px;font-weight:700;border-top:2px solid #e2e8f0;">${pricing.totalLabel}</td>
        <td style="text-align:right;padding:8px 12px;font-size:15px;font-weight:700;border-top:2px solid #e2e8f0;white-space:nowrap;">${fmtSEK(pricing.totalAmount)}</td>
      </tr>
    </table>

    ${offer.notes ? `
    <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;"/>
    <p style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:#64748b;margin:0 0 8px 0;">Anteckningar</p>
    <p style="color:#334155;margin:0;">${escapeHtml(offer.notes)}</p>` : ''}

    ${SIGNATURE_FIELD_HTML}
  </div>
</body>
</html>`;
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
    '{{lineItems}}': buildLineItemsTable(offer.lineItems, offer.priceDisplayMode),
    '{{signature}}': SIGNATURE_FIELD_HTML,
  };

  // ─── Parse TipTap JSON (supports TemplateDoc v3, v2, and legacy v1) ─────────

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

    // If a fill-page image (816×1056) exists, fix the block to exactly 1056px so
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
    // Unparseable — treat as plain text
    const escaped = escapeHtml(templateContent);
    let fallbackHtml = `<p>${escaped}</p>`;
    for (const [key, value] of Object.entries(replacements)) {
      fallbackHtml = fallbackHtml.split(key).join(value);
    }
    bodyHtml = `<div class="page-content">${fallbackHtml}</div>`;
  }

  // ─── Wrap in a styled document shell ────────────────────────────────────────

  return `<!DOCTYPE html>
<html lang="sv">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>${escapeHtml(offer.title)}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 14px; line-height: 1.6; color: #1e293b; background: #fff; margin: 0; padding: 0; }
    img { max-width: 100%; height: auto; }
    /* doc-wrapper: 816px container — no horizontal padding so page-block fills full width */
    .doc-wrapper { max-width: 816px; margin: 40px auto; background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; }
    /* page-content: carries the horizontal padding; position:static so absolute images */
    /* inside it still anchor to page-block (the nearest position:relative ancestor)    */
    .page-content { padding: 40px 48px; }
    .page-content--edge-to-edge { padding: 0; }
    /* Keep regular content above absolute background/overlay images on mixed pages. */
    .page-content > *:not(div[style*="position:absolute"]) { position: relative; z-index: 1; }
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
    .offer-shell__header, .offer-shell__topline { display: flex; justify-content: space-between; gap: 40px; }
    .offer-shell__sender { display: flex; gap: 16px; align-items: flex-start; }
    .offer-shell__logo { width: 54px; height: 54px; object-fit: contain; }
    .offer-shell__sender-copy p, .offer-shell__meta dt, .offer-shell__meta dd, .offer-shell__customer p { margin: 0; }
    .offer-shell__sender-name, .offer-shell__customer-name { font-weight: 700; }
    .offer-shell__meta { min-width: 220px; text-align: right; }
    .offer-shell__title { margin: 0 0 12px 0; font-size: 28px; font-weight: 700; }
    .offer-shell__meta dl { margin: 0; display: grid; gap: 8px; }
    .offer-shell__meta dl div { display: grid; gap: 2px; }
    .offer-shell__meta dt { font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; color: #64748b; }
    .offer-shell__meta dd { font-size: 13px; font-weight: 600; }
    .offer-shell__topline { align-items: flex-start; padding-bottom: 18px; border-bottom: 1px solid #dbe4ee; }
    .offer-shell__topline h1 { margin: 0; font-size: 22px; font-weight: 700; }
    .offer-shell__customer { min-width: 220px; display: grid; gap: 3px; }
    .offer-section { display: grid; gap: 10px; }
    .offer-section h2, .offer-section h3 { margin: 0; font-size: 13px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: #475569; }
    .offer-section p { margin: 0; font-size: 13px; line-height: 1.7; color: #334155; }
    .offer-table-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
    .offer-summary { margin-left: auto; width: min(320px, 100%); border: 1px solid #dbe4ee; border-radius: 18px; background: rgba(248, 250, 252, 0.92); padding: 18px 20px; display: grid; gap: 12px; }
    .offer-summary--below { width: 100%; margin-left: 0; }
    .offer-summary__row { display: flex; justify-content: space-between; gap: 24px; font-size: 13px; color: #334155; }
    .offer-summary__row strong { white-space: nowrap; }
    .offer-summary__row--total { padding-top: 12px; border-top: 1px solid #dbe4ee; font-size: 15px; font-weight: 700; color: #0f172a; }
    .offer-section--terms { margin-top: auto; }
    .offer-shell__footer { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; padding-top: 16px; border-top: 1px solid #dbe4ee; }
    .offer-shell__footer div { display: grid; gap: 4px; font-size: 12px; color: #475569; }
    .doc-header { font-size: 12px; color: #64748b; margin-bottom: 0; }
    .doc-footer { font-size: 12px; color: #64748b; margin-top: 0; }
    .doc-divider { border: none; border-top: 1px solid #e2e8f0; margin: 16px 0; }
    .page-separator { border: none; border-top: 2px dashed #e2e8f0; margin: 0; }
    /* page-block is exactly 816px wide — matches the editor's data-a4-page dimensions */
    /* so fill-page images (posX:0, posY:0, width:816, height:1056) render without crop */
    .page-block { position: relative; min-height: 1056px; overflow: hidden; }
    @media (max-width: 640px) {
      .doc-wrapper { margin: 0; border: none; border-radius: 0; }
      .page-content { padding: 20px 16px; }
      .page-block { min-height: 0; overflow: visible; }
      .page-block > div[style*="position:absolute"] { position: relative !important; left: auto !important; top: auto !important; width: 100% !important; }
      .offer-shell__header, .offer-shell__topline, .offer-shell__footer { grid-template-columns: 1fr; display: grid; }
      .offer-shell__header, .offer-shell__topline { gap: 20px; }
      .offer-shell__meta, .offer-shell__customer { min-width: 0; text-align: left; }
      .offer-summary { width: 100%; }
      ${MOBILE_TABLE_CSS}
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


