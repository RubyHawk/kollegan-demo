import type { Offer } from '../domain/offer.entity';
import { escapeHtml, formatOfferLineItemQuantityHtml } from './document-formatting';
import { buildStructuredLineItems } from './document-line-items';

/** Legacy generated-document cleanup helpers for old persisted offer HTML. */
export function stripLegacyStructuredIntroHtml(html: string): string {
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

export function fixOfferHtmlText(html: string): string {
  return stripLegacyLineItemTables(stripEmptyLegacyTables(html))
    .replace(/Avs\u00c3\u0192\u00c6\u2019\u00c3\u201a\u00c2\u00a4ndare/g, 'Avs\u00e4ndare')
    .replace(/Avs\u00c3\u0192\u00c6\u2019\u00c3\u2020\u00e2\u20ac\u2122\u00c3\u0192\u00e2\u20ac\u0161\u00c3\u201a\u00c2\u00a4ndare/g, 'Avs\u00e4ndare')
    .replace(/Avs\u00c3\u0192\u00c6\u2019\u00c3\u2020\u00e2\u20ac\u2122\u00c3\u0192\u00e2\u20ac\u00a0\u00c3\u00a2\u00e2\u201a\u00ac\u00e2\u201e\u00a2\u00c3\u0192\u00c6\u2019\u00c3\u00a2\u00e2\u201a\u00ac\u00c5\u00a1\u00c3\u0192\u00e2\u20ac\u0161\u00c3\u201a\u00c2\u00a4ndare/g, 'Avs\u00e4ndare')
    .replace(/Produkt eller tj\u00c3\u0192\u00c6\u2019\u00c3\u201a\u00c2\u00a4nst/g, 'Produkt eller tj\u00e4nst')
    .replace(/Produkt eller tj\u00c3\u0192\u00c6\u2019\u00c3\u2020\u00e2\u20ac\u2122\u00c3\u0192\u00e2\u20ac\u0161\u00c3\u201a\u00c2\u00a4nst/g, 'Produkt eller tj\u00e4nst')
    .replace(/Produkter och tj\u00c3\u0192\u00c6\u2019\u00c3\u201a\u00c2\u00a4nster/g, 'Produkter och tj\u00e4nster')
    .replace(/Produkter och tj\u00c3\u0192\u00c6\u2019\u00c3\u2020\u00e2\u20ac\u2122\u00c3\u0192\u00e2\u20ac\u0161\u00c3\u201a\u00c2\u00a4nster/g, 'Produkter och tj\u00e4nster')
    .replace(/Utg\u00c3\u0192\u00c6\u2019\u00c3\u201a\u00c2\u00a5ngen/g, 'Utg\u00e5ngen')
    .replace(/&Aring;-pris/gi, '&Agrave;-pris')
    .replace(/\u00c5-pris/g, '\u00c0-pris')
    .replace(/\bA-pris\b/g, '\u00c0-pris')
    .replace(/\u00c3\u0192\u00c6\u2019\u00c3\u00a2\u00e2\u201a\u00ac\u00c2\u00a6-pris/g, '\u00c0-pris')
    .replace(/\u00c3\u0192\u00c6\u2019\u00c3\u2020\u00e2\u20ac\u2122\u00c3\u0192\u00c2\u00a2\u00c3\u00a2\u00e2\u20ac\u0161\u00c2\u00ac\u00c3\u201a\u00c2\u00a6-pris/g, '\u00c0-pris')
    .replace(/g\u00c3\u0192\u00c6\u2019\u00c3\u201a\u00c2\u00a4ller/g, 'g\u00e4ller')
    .replace(/g\u00c3\u0192\u00c6\u2019\u00c3\u2020\u00e2\u20ac\u2122\u00c3\u0192\u00e2\u20ac\u0161\u00c3\u201a\u00c2\u00a4ller/g, 'g\u00e4ller')
    .replace(/utf\u00c3\u0192\u00c6\u2019\u00c3\u201a\u00c2\u00b6rs/g, 'utf\u00f6rs')
    .replace(/utf\u00c3\u0192\u00c6\u2019\u00c3\u2020\u00e2\u20ac\u2122\u00c3\u0192\u00e2\u20ac\u0161\u00c3\u201a\u00c2\u00b6rs/g, 'utf\u00f6rs')
    .replace(/\u00c3\u0192\u00c6\u2019\u00c3\u201a\u00c2\u00b6verenskommen/g, '\u00f6verenskommen')
    .replace(/\u00c3\u0192\u00c6\u2019\u00c3\u2020\u00e2\u20ac\u2122\u00c3\u0192\u00e2\u20ac\u0161\u00c3\u201a\u00c2\u00b6verenskommen/g, '\u00f6verenskommen')
    .replace(/\u00c3\u0192\u00c6\u2019\u00c3\u201a\u00c2\u00a4ndringar/g, '\u00e4ndringar')
    .replace(/\u00c3\u0192\u00c6\u2019\u00c3\u2020\u00e2\u20ac\u2122\u00c3\u0192\u00e2\u20ac\u0161\u00c3\u201a\u00c2\u00a4ndringar/g, '\u00e4ndringar')
    .replace(/till\u00c3\u0192\u00c6\u2019\u00c3\u201a\u00c2\u00a4ggsbest\u00c3\u0192\u00c6\u2019\u00c3\u201a\u00c2\u00a4llning/g, 'till\u00e4ggsbest\u00e4llning')
    .replace(/till\u00c3\u0192\u00c6\u2019\u00c3\u2020\u00e2\u20ac\u2122\u00c3\u0192\u00e2\u20ac\u0161\u00c3\u201a\u00c2\u00a4ggsbest\u00c3\u0192\u00c6\u2019\u00c3\u2020\u00e2\u20ac\u2122\u00c3\u0192\u00e2\u20ac\u0161\u00c3\u201a\u00c2\u00a4llning/g, 'till\u00e4ggsbest\u00e4llning')
    .replace(/till\u00c3\u0192\u00c6\u2019\u00c3\u201a\u00c2\u00a4gg/g, 'till\u00e4gg')
    .replace(/till\u00c3\u0192\u00c6\u2019\u00c3\u2020\u00e2\u20ac\u2122\u00c3\u0192\u00e2\u20ac\u0161\u00c3\u201a\u00c2\u00a4gg/g, 'till\u00e4gg')
    .replace(/\u00c3\u0192\u00c6\u2019\u00c3\u00a2\u00e2\u201a\u00ac\u00c5\u00a1\u00c3\u0192\u00e2\u20ac\u0161\u00c3\u201a\u00c2\u00b7/g, '\u00b7')
    .replace(/\u00c3\u0192\u00e2\u20ac\u0161\u00c3\u201a\u00c2\u00b7/g, '\u00b7')
    .replace(/\u00c3\u0192\u00c2\u00a2\u00c3\u00a2\u00e2\u20ac\u0161\u00c2\u00ac\u00c3\u00a2\u00e2\u201a\u00ac\u00c2\u009d/g, '\u2014');
}

export function normalizeLegacyOfferMeta(
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

export function replaceLegacyLineItemsTable(html: string, offer: Offer): string {
  if (!/\bclass="[^"]*\bline-items\b/i.test(html)) return html;
  return html.replace(
    /<table\b[^>]*class="[^"]*\bline-items\b[^"]*"[^>]*>[\s\S]*?<\/table>/gi,
    buildStructuredLineItems(offer.lineItems, offer.priceDisplayMode),
  );
}

export function syncStructuredLineItemQuantities(html: string, offer: Offer): string {
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
