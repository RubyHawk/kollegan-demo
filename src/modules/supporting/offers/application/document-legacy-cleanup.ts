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
