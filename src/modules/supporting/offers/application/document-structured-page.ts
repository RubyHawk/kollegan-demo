import type { Offer } from '../domain/offer.entity';
import type { OfferBrandingProfile } from './company-branding';
import { sanitizeUrl } from '@platform/security/sanitize';
import {
  DEFAULT_DOCUMENT_NOTES_HEADING,
  DEFAULT_DOCUMENT_TERMS_BODY,
  DEFAULT_DOCUMENT_TERMS_HEADING,
  buildCustomerLines,
  escapeHtml,
  getCompactBrandingAddressLines,
  renderRichPlainText,
} from './document-formatting';
import { renderPublicOfferFooterHtml } from './document-footer';
import { buildStructuredLineItems } from './document-line-items';
import { fixOfferHtmlText, stripLegacyStructuredIntroHtml } from './document-legacy-cleanup';
import { renderPublicOfferSummaryHtml } from './document-summary';
import {
  type TipTapNode,
  getNodeTextContent,
  nodeToHtml,
  normalizeNodeText,
} from './document-tiptap-renderer';

export function containsFillPageImage(node: TipTapNode): boolean {
  if (node.type === 'image') {
    const a = node.attrs ?? {};
    return String(a.position) === 'free'
      && Number(a.width)  === 816
      && Number(a.height) === 1056;
  }
  return (node.content ?? []).some(containsFillPageImage);
}

export function isImageOnlyPresentationPage(node: TipTapNode): boolean {
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

export interface V3PageDoc {
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

export function isLegacyStructuredDocumentPage(page: V3PageDoc): boolean {
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

function normalizeSummaryPlacement(): 'below' {
  return 'below';
}

export function renderStructuredDocumentPage(
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
