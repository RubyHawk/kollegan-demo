/**
 * Server-side document generation for immutable offer snapshots.
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

import type { Offer } from '../domain/offer.entity';
import type { OfferBrandingProfile } from './company-branding';
import { sanitizeUrl, escapeHtml as secureEscapeHtml } from '@platform/security/sanitize';
import {
  DEFAULT_DOCUMENT_NOTES_HEADING,
  buildCustomerLines,
  escapeHtml,
  fmtDate,
  fmtSEK,
  getCompactBrandingAddressLines,
  renderRichPlainText,
} from './document-formatting';
import { renderPublicOfferFooterHtml } from './document-footer';
import { buildStructuredLineItems } from './document-line-items';
import {
  fixOfferHtmlText,
  normalizeLegacyOfferMeta,
  replaceLegacyLineItemsTable,
  syncStructuredLineItemQuantities,
} from './document-legacy-cleanup';
import { renderPublicOfferSummaryHtml } from './document-summary';
import { injectStructuredLineItemStyles } from './document-line-item-styles';
import { injectDocumentPatchStyles } from './document-styles';
import {
  type TipTapNode,
  nodeToHtml,
} from './document-tiptap-renderer';
import {
  type V3PageDoc,
  containsFillPageImage,
  isImageOnlyPresentationPage,
  isLegacyStructuredDocumentPage,
  renderStructuredDocumentPage,
} from './document-structured-page';
import {
  FALLBACK_DOCUMENT_STYLES,
  GENERATED_DOCUMENT_SHELL_STYLES,
} from './document-generator-styles';

export { renderPublicOfferFooterHtml } from './document-footer';
export { renderPublicOfferSummaryHtml } from './document-summary';






const SIGNATURE_FIELD_HTML = `
  <div data-sig-field="signature" style="border:2px dashed #cbd5e1;border-radius:8px;padding:24px 20px;margin:24px 0;text-align:center;min-height:80px;background:#f8fafc;">
    <p style="color:#94a3b8;font-size:12px;margin:0 0 4px 0;text-transform:uppercase;letter-spacing:0.1em;font-weight:600;">Signatur</p>
    <p style="color:#cbd5e1;font-size:11px;margin:0;">Underteckna med e-signatur via l&auml;nken du mottog</p>
  </div>`;


/**
 * Builds the {{placeholder}} -> value map for a given offer.
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




/**
 * Generates a clean fallback HTML document from offer data alone.
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
${FALLBACK_DOCUMENT_STYLES}
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
  const replacements: Record<string, string> = {
    ...buildReplacements(offer),
    '{{lineItems}}': buildStructuredLineItems(offer.lineItems, offer.priceDisplayMode),
    '{{signature}}': SIGNATURE_FIELD_HTML,
  };

  // Parse TipTap JSON (supports TemplateDoc v3, v2, and legacy v1)

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
      const pages         = (parsed.pages ?? []) as V3PageDoc[];
      const defaultHeader = (parsed.defaultHeader ?? { type: 'doc', content: [] }) as TipTapNode;
      const defaultFooter = (parsed.defaultFooter ?? { type: 'doc', content: [] }) as TipTapNode;

      bodyHtml = pages
        .map((page, i) => renderPage(page, defaultHeader, defaultFooter, i))
        .join('<hr class="page-separator" />');
    } else if (parsed._v === 2) {
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
      const rootNode = parsed as unknown as TipTapNode;
      let html = nodeToHtml(rootNode, replacements);
      for (const [key, value] of Object.entries(replacements)) {
        html = html.split(key).join(value);
      }
      bodyHtml = `<div class="page-content">${html}</div>`;
    }
  } catch {
    const escaped = escapeHtml(templateContent);
    let fallbackHtml = `<p>${escaped}</p>`;
    for (const [key, value] of Object.entries(replacements)) {
      fallbackHtml = fallbackHtml.split(key).join(value);
    }
    bodyHtml = `<div class="page-content">${fallbackHtml}</div>`;
  }

  // Wrap in a styled document shell

  return sanitizeGeneratedOfferDocument(`<!DOCTYPE html>
<html lang="sv">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>${escapeHtml(offer.title)}</title>
  <style>
${GENERATED_DOCUMENT_SHELL_STYLES}
  </style>
</head>
<body>
  <div class="doc-wrapper">
    ${bodyHtml}
  </div>
</body>
</html>`, offer, branding);
}

