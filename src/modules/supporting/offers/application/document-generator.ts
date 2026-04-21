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

import type { Offer } from '../domain/offer.entity';
import type { OfferBrandingProfile } from './company-branding';
import { sanitizeUrl, escapeHtml as secureEscapeHtml } from '@platform/security/sanitize';
import {
  DEFAULT_DOCUMENT_NOTES_HEADING,
  DEFAULT_DOCUMENT_TERMS_BODY,
  DEFAULT_DOCUMENT_TERMS_HEADING,
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
  stripLegacyStructuredIntroHtml,
  syncStructuredLineItemQuantities,
} from './document-legacy-cleanup';
import { renderPublicOfferSummaryHtml } from './document-summary';
import { injectStructuredLineItemStyles } from './document-line-item-styles';
import { injectDocumentPatchStyles } from './document-styles';
import {
  type TipTapNode,
  getNodeTextContent,
  nodeToHtml,
  normalizeNodeText,
} from './document-tiptap-renderer';

export { renderPublicOfferFooterHtml } from './document-footer';
export { renderPublicOfferSummaryHtml } from './document-summary';

// ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ SEK formatter ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬

// ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ TipTap JSON ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢ HTML ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬



// ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ Line items table ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬

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

function normalizeSummaryPlacement(): 'below' {
  return 'below';
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

