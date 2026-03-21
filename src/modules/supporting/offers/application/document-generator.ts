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
      const widthStyle  = imgW ? `width:${imgW}px;max-width:100%;` : 'max-width:100%;';
      const heightStyle = imgH ? `height:${imgH}px;object-fit:cover;` : 'height:auto;';
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
      return value ?? escapeHtml(label);
    }

    case 'signatureBlock': {
      const fieldType = String(node.attrs?.fieldType ?? 'signature');
      const label     = escapeHtml(String(node.attrs?.label ?? 'Signatur'));
      const icons: Record<string, string> = { signature: '✍', name: '👤', date: '📅' };
      const subtext: Record<string, string> = {
        signature: 'Underteckna med e-signatur via länken',
        name:      'Fullständigt namn',
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

function buildLineItemsTable(items: OfferLineItem[]): string {
  const headerStyle = 'padding:8px 12px;text-align:left;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:#64748b;background:#f8fafc;border-bottom:2px solid #e2e8f0;';
  const cellStyle   = 'padding:8px 12px;font-size:13px;border-bottom:1px solid #e2e8f0;vertical-align:top;';
  const numStyle    = `${cellStyle}text-align:right;`;

  const vatLabel = (r: number) => `${Math.round(r * 100)}%`;
  const discountLabel = (d?: number) => d ? `${d}%` : '–';

  const rows = items.map((item) => {
    const disc      = 1 - ((item.discount ?? 0) / 100);
    const lineExVat = item.quantity * item.unitPrice * disc;
    return `
      <tr>
        <td data-label="Beskrivning" style="${cellStyle}">${escapeHtml(item.description)}</td>
        <td data-label="Antal"       style="${numStyle}">${item.quantity}</td>
        <td data-label="Á-pris"      style="${numStyle}">${fmtSEK(item.unitPrice)}</td>
        <td data-label="Moms"        style="${numStyle}">${vatLabel(item.vatRate)}</td>
        <td data-label="Rabatt"      style="${numStyle}">${discountLabel(item.discount)}</td>
        <td data-label="Summa"       style="${numStyle};font-weight:600;">${fmtSEK(lineExVat)}</td>
      </tr>`;
  }).join('');

  return `
    <table class="line-items" style="width:100%;border-collapse:collapse;margin-bottom:1em;">
      <thead>
        <tr>
          <th style="${headerStyle}">Beskrivning</th>
          <th style="${headerStyle}text-align:right;">Antal</th>
          <th style="${headerStyle}text-align:right;">Á-pris</th>
          <th style="${headerStyle}text-align:right;">Moms</th>
          <th style="${headerStyle}text-align:right;">Rabatt</th>
          <th style="${headerStyle}text-align:right;">Summa</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;
}

// ─── Signature placeholder HTML ────────────────────────────────────────────────

const SIGNATURE_FIELD_HTML = `
  <div data-sig-field="signature" style="border:2px dashed #cbd5e1;border-radius:8px;padding:24px 20px;margin:24px 0;text-align:center;min-height:80px;background:#f8fafc;">
    <p style="color:#94a3b8;font-size:12px;margin:0 0 4px 0;text-transform:uppercase;letter-spacing:0.1em;font-weight:600;">Signatur</p>
    <p style="color:#cbd5e1;font-size:11px;margin:0;">Underteckna med e-signatur via länken du mottog</p>
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

// ─── Main generator ────────────────────────────────────────────────────────────

/**
 * Generates a clean fallback HTML document from offer data alone (no template).
 * Used when an offer is sent without a linked template.
 */
export function generateFallbackDocument(offer: Offer): string {
  const vatAmount      = offer.totalIncVat - offer.totalExVat;
  const offerNumberStr = offer.offerNumber
    ? `${new Date(offer.createdAt).getFullYear()}-${String(offer.offerNumber).padStart(3, '0')}`
    : offer.id.slice(0, 8).toUpperCase();

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
    .doc-wrapper { max-width: 700px; margin: 40px auto; padding: 40px 48px; background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; }
    @media (max-width: 640px) {
      .doc-wrapper { margin: 0; padding: 24px 0; border: none; border-radius: 0; }${MOBILE_TABLE_CSS}
    }
    @media print { .doc-wrapper { margin: 0; padding: 0; border: none; } }
  </style>
</head>
<body>
  <div class="doc-wrapper">
    <h1 style="font-size:1.8em;font-weight:700;margin:0 0 6px 0;">${escapeHtml(offer.title)}</h1>
    <p style="color:#64748b;font-size:13px;margin:0 0 32px 0;">Offert ${escapeHtml(offerNumberStr)} · Giltig till ${fmtDate(offer.validUntil)}</p>

    <p style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:#64748b;margin:0 0 4px 0;">Till</p>
    <p style="font-weight:600;margin:0 0 2px 0;">${escapeHtml(offer.recipientName)}</p>
    ${offer.recipientCompany ? `<p style="color:#64748b;margin:0 0 2px 0;">${escapeHtml(offer.recipientCompany)}</p>` : ''}
    <p style="color:#64748b;margin:0 0 32px 0;">${escapeHtml(offer.recipientEmail)}</p>

    <hr style="border:none;border-top:1px solid #e2e8f0;margin:0 0 24px 0;"/>

    ${buildLineItemsTable(offer.lineItems)}

    <table class="totals" style="width:100%;border-collapse:collapse;margin-top:8px;">
      <tr>
        <td style="text-align:right;padding:4px 12px;font-size:13px;color:#64748b;">Totalt exkl. moms</td>
        <td style="text-align:right;padding:4px 12px;font-size:13px;font-weight:600;white-space:nowrap;">${fmtSEK(offer.totalExVat)}</td>
      </tr>
      <tr>
        <td style="text-align:right;padding:4px 12px;font-size:13px;color:#64748b;">Moms</td>
        <td style="text-align:right;padding:4px 12px;font-size:13px;white-space:nowrap;">${fmtSEK(vatAmount)}</td>
      </tr>
      <tr>
        <td style="text-align:right;padding:8px 12px;font-size:15px;font-weight:700;border-top:2px solid #e2e8f0;">Totalt inkl. moms</td>
        <td style="text-align:right;padding:8px 12px;font-size:15px;font-weight:700;border-top:2px solid #e2e8f0;white-space:nowrap;">${fmtSEK(offer.totalIncVat)}</td>
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
export function generateDocument(templateContent: string, offer: Offer): string {
  // Build replacements map from the shared helper (already HTML-escaped),
  // then extend with the document-only HTML entries that have no email equivalent.
  const replacements: Record<string, string> = {
    ...buildReplacements(offer),
    '{{lineItems}}': buildLineItemsTable(offer.lineItems),
    '{{signature}}': SIGNATURE_FIELD_HTML,
  };

  // ─── Parse TipTap JSON (supports TemplateDoc v3, v2, and legacy v1) ─────────

  // Inner helper: render a single page to its HTML string (header + body + footer)
  interface V3PageDoc {
    body:   TipTapNode;
    header: { enabled: boolean; useDefault: boolean; content: TipTapNode };
    footer: { enabled: boolean; useDefault: boolean; content: TipTapNode };
  }

  function renderPage(
    page:          V3PageDoc,
    defaultHeader: TipTapNode,
    defaultFooter: TipTapNode,
    pageIndex:     number,
  ): string {
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

    return `<div class="page-block" data-page="${pageIndex + 1}">${hdrSection}${bodyHtml}${ftrSection}</div>`;
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

      bodyHtml = `${hdrSection}${html}${ftrSection}`;
    } else {
      // Legacy v1: the whole JSON is the body doc
      const rootNode = parsed as unknown as TipTapNode;
      let html = nodeToHtml(rootNode, replacements);
      for (const [key, value] of Object.entries(replacements)) {
        html = html.split(key).join(value);
      }
      bodyHtml = html;
    }
  } catch {
    // Unparseable — treat as plain text
    const escaped = escapeHtml(templateContent);
    bodyHtml = `<p>${escaped}</p>`;
    for (const [key, value] of Object.entries(replacements)) {
      bodyHtml = bodyHtml.split(key).join(value);
    }
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
    .doc-wrapper { max-width: 700px; margin: 40px auto; padding: 40px 48px; background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; }
    .doc-header { font-size: 12px; color: #64748b; margin-bottom: 0; }
    .doc-footer { font-size: 12px; color: #64748b; margin-top: 0; }
    .doc-divider { border: none; border-top: 1px solid #e2e8f0; margin: 16px 0; }
    .page-separator { border: none; border-top: 2px dashed #e2e8f0; margin: 32px 0; }
    .page-block { position: relative; }
    @media (max-width: 640px) {
      .doc-wrapper { margin: 0; padding: 24px 0; border: none; border-radius: 0; }${MOBILE_TABLE_CSS}
    }
    @media print {
      .doc-wrapper { margin: 0; padding: 0; border: none; }
      .page-separator { display: none; }
      .page-block { page-break-after: always; }
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
