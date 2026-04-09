import { createHash } from 'crypto';
import { chromium, type Browser } from 'playwright';

export type OfferPdfVariantStatus = 'draft' | 'sent' | 'viewed' | 'accepted' | 'declined' | 'expired';

export interface OfferPdfVariant {
  status: OfferPdfVariantStatus;
  signatureImage?: string | null;
  signerName?: string | null;
  acceptedAt?: string | Date | null;
}

const PDF_CACHE_MAX_ENTRIES = 24;
const SWEDISH_MONTHS_SHORT = ['jan', 'feb', 'mar', 'apr', 'maj', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'] as const;
export const PUBLIC_OFFER_PDF_RENDERER_VERSION = '2026-04-10-print-polish-v2';
const pdfCache = new Map<string, Uint8Array>();
let browserPromise: Promise<Browser> | null = null;

function formatCompactSwedishDate(value: string | Date): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return `${date.getDate()} ${SWEDISH_MONTHS_SHORT[date.getMonth()]} ${date.getFullYear()}`;
}

function buildSignatureHydrationScript(offer: OfferPdfVariant): string {
  const acceptedDate = offer.acceptedAt
    ? formatCompactSwedishDate(offer.acceptedAt)
    : '';

  return `
<script>
  (function () {
    var sig = {
      image: ${JSON.stringify(offer.signatureImage ?? '')},
      name: ${JSON.stringify(offer.signerName ?? '')},
      date: ${JSON.stringify(acceptedDate)}
    };
    document.querySelectorAll('[data-sig-field]').forEach(function (el) {
      var field = el.getAttribute('data-sig-field');
      if (!field) return;

      while (el.firstChild) {
        el.removeChild(el.firstChild);
      }

      el.style.border = 'none';
      el.style.borderRadius = '0';
      el.style.background = 'transparent';
      el.style.padding = '4px 0';
      el.style.minHeight = '0';
      el.style.display = 'block';

      if (field === 'signature') {
        if (!sig.image) {
          el.style.display = 'none';
          return;
        }
        var img = document.createElement('img');
        img.src = sig.image;
        img.alt = 'Signatur';
        img.style.maxWidth = '260px';
        img.style.maxHeight = '80px';
        img.style.display = 'block';
        el.appendChild(img);
        return;
      }

      if (field === 'name') {
        if (!sig.name) {
          el.style.display = 'none';
          return;
        }
        var nameSpan = document.createElement('span');
        nameSpan.textContent = sig.name;
        nameSpan.style.fontSize = '15px';
        nameSpan.style.color = '#1e293b';
        nameSpan.style.fontWeight = '500';
        el.appendChild(nameSpan);
        return;
      }

      if (field === 'date') {
        if (!sig.date) {
          el.style.display = 'none';
          return;
        }
        var dateSpan = document.createElement('span');
        dateSpan.textContent = sig.date;
        dateSpan.style.fontSize = '14px';
        dateSpan.style.color = '#475569';
        el.appendChild(dateSpan);
        return;
      }

      el.style.display = 'none';
    });
  })();
</script>`;
}

export function buildPublicPdfHtml(
  documentHtml: string,
  origin: string,
  offer: OfferPdfVariant,
): string {
  const baseTag = `<base href="${origin}/" />`;
  const signatureScript = buildSignatureHydrationScript(offer);
  const behaviorScript = `
<script>
  (function () {
    function normalizeBrokenSwedish(text) {
      return text
        .replace(/Ãƒâ€¦/g, 'Ã…')
        .replace(/Ãƒâ€ž/g, 'Ã„')
        .replace(/Ãƒâ€“/g, 'Ã–')
        .replace(/ÃƒÂ¥/g, 'Ã¥')
        .replace(/ÃƒÂ¤/g, 'Ã¤')
        .replace(/ÃƒÂ¶/g, 'Ã¶')
        .replace(/Ã‚Â /g, '\\u00a0')
        .replace(/Ã‚Â·/g, 'Â·')
        .replace(/Ã¢â‚¬â€/g, 'â€”')
        .replace(/Ã¢â‚¬â€œ/g, 'â€“')
        .replace(/Ã¢â‚¬Å“/g, 'â€œ')
        .replace(/Ã¢â‚¬\\u009d/g, 'â€')
        .replace(/Ã¢â‚¬â„¢/g, 'â€™');
    }

    var statusLabel = ${JSON.stringify(
      offer.status === 'accepted'
        ? 'Signerad'
        : offer.status === 'declined'
          ? 'Avvisad'
          : offer.status === 'expired'
            ? 'UtgÃ¥ngen'
            : 'Offert',
    )};
    var statusClass = ${JSON.stringify(
      offer.status === 'accepted' || offer.status === 'declined' || offer.status === 'expired'
        ? 'offer-shell__status offer-shell__status--' + offer.status
        : 'offer-shell__title',
    )};

    document.querySelectorAll('.offer-section--intro').forEach(function (section) {
      var text = (section.textContent || '').replace(/\\u00a0/g, ' ').trim();
      if (!text && !section.querySelector('img, hr, table, ul, ol')) section.remove();
    });

    var senderCopy = document.querySelector('.offer-shell__sender-copy');
    if (senderCopy) {
      senderCopy.querySelectorAll('p').forEach(function (line) {
        if (line.textContent) line.textContent = normalizeBrokenSwedish(line.textContent);
        var text = (line.textContent || '').trim().toLocaleLowerCase('sv-SE');
        if (text.startsWith('ansvarig:') || text.startsWith('kontakt:')) line.remove();
      });
    }

    var customerBlock = document.querySelector('.offer-shell__customer');
    if (customerBlock) {
      var seen = new Set();
      customerBlock.querySelectorAll('p').forEach(function (line) {
        if (line.textContent) line.textContent = normalizeBrokenSwedish(line.textContent);
        var text = (line.textContent || '').trim();
        var key = text.toLocaleLowerCase('sv-SE');
        if (!text || seen.has(key)) line.remove();
        else seen.add(key);
      });
    }

    document.querySelectorAll('.offer-shell__footer > div').forEach(function (item) {
      var labelNode = item.querySelector('strong');
      if (labelNode && labelNode.textContent) labelNode.textContent = normalizeBrokenSwedish(labelNode.textContent);
      item.querySelectorAll('span').forEach(function (span) {
        if (span.textContent) span.textContent = normalizeBrokenSwedish(span.textContent);
      });
      var label = ((labelNode && labelNode.textContent) || '').trim().toLocaleLowerCase('sv-SE');
      if (label === 'prisvisning') item.remove();
    });

    function normalizeOfferText(text) {
      return normalizeBrokenSwedish(text)
        .replace(/Ãƒâ€¦/g, 'Ã…')
        .replace(/Ãƒâ€ž/g, 'Ã„')
        .replace(/Ãƒâ€“/g, 'Ã–')
        .replace(/ÃƒÂ¥/g, 'Ã¥')
        .replace(/ÃƒÂ¤/g, 'Ã¤')
        .replace(/ÃƒÂ¶/g, 'Ã¶')
        .replace(/Ã‚Â /g, '\\u00a0')
        .replace(/Ã‚Â·/g, 'Â·')
        .replace(/Ã‚(?=[\\u00a0 0-9%.,:;|kr])/g, '');
    }

    function compactDateText(value) {
      var trimmed = normalizeOfferText(value).trim();
      var parts = trimmed.match(/^(\\d{1,2})\\s+([A-Za-zÃ…Ã„Ã–Ã¥Ã¤Ã¶.]+)\\s+(\\d{4})$/);
      if (!parts) return trimmed;

      var monthValue = parts[2].toLocaleLowerCase('sv-SE').replace(/\\.$/, '');
      var monthMap = {
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
        december: 11, dec: 11
      };
      var monthIndex = monthMap[monthValue];
      if (monthIndex == null) return trimmed;

      var monthsShort = ${JSON.stringify(SWEDISH_MONTHS_SHORT)};
      return String(Number(parts[1])) + ' ' + monthsShort[monthIndex] + ' ' + parts[3];
    }

    document.querySelectorAll('.offer-shell__status, .offer-shell__title').forEach(function (item) {
      item.remove();
    });

    var offerTitleHeading = document.querySelector('.offer-shell__topline h1');
    var offerTitleText = (offerTitleHeading && offerTitleHeading.textContent || '').trim();
    var customerCard = document.querySelector('.offer-shell__customer-card');
    var metaList = document.querySelector('.offer-shell__meta dl');
    if (customerCard && metaList) {
      var customerName = '';
      var nameNode = customerCard.querySelector('.offer-shell__customer-primary, .offer-shell__customer-name');
      if (nameNode && nameNode.textContent) customerName = nameNode.textContent.trim();
      if (!customerName) {
        var firstParagraph = customerCard.querySelector('p');
        if (firstParagraph && firstParagraph.textContent) customerName = firstParagraph.textContent.trim();
      }

      var customerEmail = '';
      customerCard.querySelectorAll('p, span').forEach(function (line) {
        var text = (line.textContent || '').trim();
        if (!customerEmail && text.indexOf('@') >= 0) customerEmail = text;
      });

      if (customerName || customerEmail) {
        var customerRow = document.createElement('div');
        customerRow.className = 'offer-shell__meta-row--recipient';
        var customerLabel = document.createElement('dt');
        customerLabel.textContent = 'Offert till';
        var customerValue = document.createElement('dd');
        customerValue.appendChild(document.createTextNode(normalizeOfferText(customerName || '')));
        if (customerEmail) {
          var customerEmailText = document.createElement('small');
          customerEmailText.textContent = normalizeOfferText(customerEmail);
          customerValue.appendChild(customerEmailText);
        }
        customerRow.appendChild(customerLabel);
        customerRow.appendChild(customerValue);
        metaList.appendChild(customerRow);
      }
      customerCard.remove();
    }

    if (offerTitleText) {
      Array.from(document.querySelectorAll('.offer-section h2, .offer-table-header h2')).some(function (heading) {
        var normalizedHeading = normalizeOfferText(heading.textContent || '').replace(/\\s+/g, ' ').trim().toLocaleLowerCase('sv-SE');
        if (normalizedHeading === 'produkter och tjänster') {
          heading.textContent = offerTitleText;
          return true;
        }
        return false;
      });
    }

    document.querySelectorAll('.offer-shell__topline').forEach(function (item) {
      item.remove();
    });

    document.querySelectorAll('.offer-shell__meta dd').forEach(function (item) {
      var text = item.childNodes.length === 1 ? (item.textContent || '').trim() : '';
      if (!text) return;
      var compact = compactDateText(text);
      if (compact !== text) item.textContent = compact;
    });

    var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      var node = walker.currentNode;
      node.nodeValue = normalizeOfferText(node.nodeValue || '');
    }
  })();
</script>`;

  const printStyles = `
<style>
  @page { size: A4; margin: 0; }
  html, body {
    margin: 0;
    padding: 0;
    background: #ffffff;
    color: #14263f;
    font-family: Aptos, "Segoe UI", "Helvetica Neue", Arial, sans-serif;
  }
  body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  *, *::before, *::after {
    box-shadow: none !important;
    text-shadow: none !important;
    filter: none !important;
    backdrop-filter: none !important;
    animation: none !important;
    transition: none !important;
  }
  .doc-wrapper { margin: 0 !important; border: none !important; border-radius: 0 !important; box-shadow: none !important; max-width: none !important; }
  .page-separator { display: none !important; }
  .page-block { page-break-after: always; break-after: page; }
  .page-block:last-child { page-break-after: auto; break-after: auto; }
  .page-block--document {
    min-height: auto !important;
    page-break-after: auto !important;
    break-after: auto !important;
  }
  .page-block--document::before {
    content: none !important;
    background: none !important;
    background-image: none !important;
    display: none !important;
  }
  .page-content--document {
    min-height: auto !important;
    padding: 30px 36px 26px !important;
    background: #ffffff !important;
  }
  .offer-shell {
    gap: 16px !important;
    color: #14263f !important;
  }
  .offer-shell__header,
  .offer-shell__topline {
    grid-template-columns: minmax(0, 1fr) minmax(220px, 250px) !important;
    gap: 16px !important;
  }
  .offer-shell__header {
    padding-bottom: 16px !important;
    border-bottom: 1px solid #dce6f0 !important;
  }
  .offer-shell__topline {
    padding-bottom: 14px !important;
    border-bottom: 1px solid #dce6f0 !important;
  }
  .offer-shell__topline h1 {
    font-size: 18px !important;
    line-height: 1.2 !important;
    color: #10233b !important;
  }
  .offer-shell__lead {
    display: none !important;
  }
  .offer-shell__sender {
    gap: 12px !important;
  }
  .offer-shell__logo {
    width: 58px !important;
    height: 58px !important;
    object-fit: contain !important;
  }
  .offer-shell__sender-copy {
    gap: 3px !important;
    font-size: 11px !important;
    line-height: 1.45 !important;
    color: #465a73 !important;
  }
  .offer-shell__sender-name {
    color: #10233b !important;
  }
  .offer-shell__meta {
    gap: 8px !important;
    justify-items: end !important;
    text-align: right !important;
    padding: 14px 16px !important;
    border: 1px solid #d9e3ee !important;
    border-radius: 12px !important;
    background: #ffffff !important;
  }
  .offer-shell__meta dl {
    gap: 6px !important;
    width: 100% !important;
  }
  .offer-shell__meta dl div {
    display: grid !important;
    grid-template-columns: minmax(0, 1fr) auto !important;
    gap: 10px !important;
    padding: 4px 0 !important;
    border-bottom: 1px solid #edf2f7 !important;
  }
  .offer-shell__meta dl div:first-child {
    padding-top: 0 !important;
  }
  .offer-shell__meta dl div:last-child {
    padding-bottom: 0 !important;
    border-bottom: none !important;
  }
  .offer-shell__meta dt {
    font-size: 10px !important;
    line-height: 1.35 !important;
    letter-spacing: 0.08em !important;
    text-transform: uppercase !important;
    color: #6b7e95 !important;
  }
  .offer-shell__meta dd {
    font-size: 12px !important;
    line-height: 1.35 !important;
    color: #10233b !important;
    font-weight: 700 !important;
    white-space: nowrap !important;
  }
  .offer-shell__meta dd small {
    display: block !important;
    margin-top: 2px !important;
    font-size: 10.5px !important;
    line-height: 1.35 !important;
    font-weight: 500 !important;
    color: #5f738a !important;
  }
  .offer-shell__meta .offer-shell__meta-row--recipient dd {
    white-space: normal !important;
  }
  .offer-shell__status,
  .offer-shell__title {
    display: none !important;
  }
  .offer-shell__customer-card {
    padding: 13px 14px !important;
    border-radius: 12px !important;
    border-color: #d7e2ee !important;
    background: #ffffff !important;
  }
  .offer-shell__customer-card p {
    font-size: 11px !important;
    line-height: 1.45 !important;
    color: #465a73 !important;
  }
  .offer-section {
    gap: 8px !important;
  }
  .offer-section h2,
  .offer-section h3 {
    font-size: 12px !important;
    letter-spacing: 0.08em !important;
    text-transform: uppercase !important;
    color: #6b7e95 !important;
  }
  .offer-table-header h2 {
    font-size: 22px !important;
    line-height: 1.18 !important;
    letter-spacing: -0.03em !important;
    text-transform: none !important;
    color: #10233b !important;
  }
  .offer-section p {
    font-size: 12px !important;
    line-height: 1.55 !important;
    color: #34485f !important;
  }
  .offer-table-header {
    margin-bottom: 6px !important;
  }
  .offer-items {
    gap: 10px !important;
  }
  .page-content--document,
  .offer-shell,
  .offer-shell__header,
  .offer-shell__topline,
  .offer-shell__meta,
  .offer-shell__customer-card,
  .offer-items__table,
  .offer-items__head,
  .offer-item-card,
  .offer-item-card__top,
  .offer-item-card__metric,
  .offer-item-card__metric--total,
  .offer-summary,
  .offer-summary__row,
  .offer-summary__row--total,
  .offer-shell__status {
    background: #ffffff !important;
    background-image: none !important;
  }
  .offer-items__head {
    gap: 12px !important;
    padding: 10px 13px !important;
    font-size: 10px !important;
    background: linear-gradient(180deg, #f7faff 0%, #edf3fb 100%) !important;
    border-bottom: 1px solid #d9e4ef !important;
    color: #6b7e95 !important;
    letter-spacing: 0.08em !important;
    text-transform: uppercase !important;
  }
  .offer-item-row {
    gap: 12px !important;
    padding: 11px 13px !important;
    border-bottom: 1px solid #edf2f7 !important;
  }
  .offer-item-row:last-child {
    border-bottom: none !important;
  }
  .offer-item-row__title {
    font-size: 13px !important;
    line-height: 1.35 !important;
    color: #10233b !important;
  }
  .offer-item-row__detail,
  .offer-item-row__value {
    font-size: 11.5px !important;
    line-height: 1.42 !important;
    color: #465a73 !important;
  }
  .offer-shell__meta,
  .offer-shell__customer-card,
  .offer-items__table,
  .offer-item-card,
  .offer-summary,
  .offer-shell__status,
  .offer-shell__title {
    border-radius: 12px !important;
  }
  .offer-summary {
    width: min(268px, 100%) !important;
    padding: 0 !important;
    border: 1px solid #d7e2ee !important;
    box-shadow: none !important;
  }
  .offer-summary--below {
    width: min(276px, 100%) !important;
    margin-top: 12px !important;
  }
  .offer-summary__row {
    padding: 10px 14px !important;
    font-size: 12px !important;
    line-height: 1.45 !important;
    color: #465a73 !important;
    border-bottom: 1px solid #e5ecf3 !important;
  }
  .offer-summary__row--total,
  .offer-item-card__metric--total {
    color: #0f172a !important;
    font-weight: 700 !important;
  }
  .offer-summary__row--total {
    margin-top: 0 !important;
    padding: 12px 14px !important;
    border-top: 1px solid #142742 !important;
    border-bottom: none !important;
    background: linear-gradient(135deg, #13233a 0%, #223b63 100%) !important;
    color: #ffffff !important;
  }
  .offer-summary__row--total strong,
  .offer-item-card__metric--total dd {
    color: #ffffff !important;
  }
  .offer-summary__row--total strong {
    font-size: 16px !important;
    letter-spacing: -0.02em !important;
  }
  .offer-item-card__metric:nth-child(even) {
    background: #ffffff !important;
  }
  .offer-section--terms,
  .offer-section--notes {
    margin-top: 6px !important;
    padding: 12px 14px !important;
    border: 1px solid #dce6f0 !important;
    border-radius: 14px !important;
    background: #ffffff !important;
  }
  .offer-shell__footer {
    grid-template-columns: minmax(0, 1.35fr) repeat(2, minmax(0, 1fr)) !important;
    gap: 10px !important;
    padding-top: 12px !important;
    margin-top: 10px !important;
    border-top: 1px solid #dce6f0 !important;
  }
  .offer-shell__footer div {
    gap: 2px !important;
    font-size: 11px !important;
    line-height: 1.4 !important;
    color: #465a73 !important;
  }
  .offer-shell__logo,
  img {
    image-rendering: auto !important;
  }
</style>`;

  return documentHtml
    .replace('</head>', `${baseTag}\n${printStyles}\n</head>`)
    .replace('</body>', `${signatureScript}\n${behaviorScript}\n</body>`);
}

function getBrowser(): Promise<Browser> {
  if (!browserPromise) {
    browserPromise = chromium.launch({ headless: true })
      .then((browser) => {
        browser.on('disconnected', () => {
          browserPromise = null;
        });
        return browser;
      })
      .catch((error) => {
        browserPromise = null;
        throw error;
      });
  }

  return browserPromise;
}

function getCachedPdf(key: string): Uint8Array | undefined {
  const cached = pdfCache.get(key);
  if (!cached) return undefined;

  pdfCache.delete(key);
  pdfCache.set(key, cached);
  return cached;
}

function setCachedPdf(key: string, pdf: Uint8Array): void {
  if (pdfCache.has(key)) {
    pdfCache.delete(key);
  }
  pdfCache.set(key, pdf);

  while (pdfCache.size > PDF_CACHE_MAX_ENTRIES) {
    const oldestKey = pdfCache.keys().next().value;
    if (!oldestKey) break;
    pdfCache.delete(oldestKey);
  }
}

export function resolvePdfOrigin(explicitOrigin?: string): string {
  const candidates = [
    explicitOrigin,
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.APP_URL,
    process.env.PUBLIC_OFFER_BASE_URL,
    'http://localhost:3000',
  ];

  for (const candidate of candidates) {
    if (!candidate) continue;
    try {
      return new URL(candidate).origin;
    } catch {
      continue;
    }
  }

  return 'http://localhost:3000';
}

export function buildPublicOfferPdfFingerprint(
  documentHtml: string,
  origin: string,
  offer: OfferPdfVariant,
): string {
  return createHash('sha1')
    .update(PUBLIC_OFFER_PDF_RENDERER_VERSION)
    .update('\n')
    .update(origin)
    .update('\n')
    .update(documentHtml)
    .update('\n')
    .update(JSON.stringify({
      status: offer.status,
      signatureImage: offer.signatureImage ?? '',
      signerName: offer.signerName ?? '',
      acceptedAt: offer.acceptedAt ? new Date(offer.acceptedAt).toISOString() : '',
    }))
    .digest('hex');
}

export async function renderPublicOfferPdf(input: {
  documentHtml: string;
  origin?: string;
  offer: OfferPdfVariant;
}): Promise<{ pdfBytes: Uint8Array; fingerprint: string; cacheStatus: 'memory-hit' | 'rendered' }> {
  const origin = resolvePdfOrigin(input.origin);
  const fingerprint = buildPublicOfferPdfFingerprint(input.documentHtml, origin, input.offer);
  const cachedPdf = getCachedPdf(fingerprint);
  if (cachedPdf) {
    return { pdfBytes: cachedPdf, fingerprint, cacheStatus: 'memory-hit' };
  }

  const html = buildPublicPdfHtml(input.documentHtml, origin, input.offer);
  const browser = await getBrowser();
  const context = await browser.newContext({
    viewport: { width: 816, height: 1200 },
    deviceScaleFactor: 1,
  });

  try {
    const page = await context.newPage();
    await page.setContent(html, { waitUntil: 'domcontentloaded' });
    await page.emulateMedia({ media: 'print' });
    await page.evaluate(async () => {
      await (document.fonts?.ready ?? Promise.resolve());

      const images = Array.from(document.images);
      await Promise.all(
        images.map((img) => (
          img.complete
            ? Promise.resolve()
            : new Promise<void>((resolve) => {
                img.addEventListener('load', () => resolve(), { once: true });
                img.addEventListener('error', () => resolve(), { once: true });
              })
        )),
      );
    });

    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: '0mm', right: '0mm', bottom: '0mm', left: '0mm' },
    });
    const pdfBytes = new Uint8Array(pdf);
    setCachedPdf(fingerprint, pdfBytes);
    return { pdfBytes, fingerprint, cacheStatus: 'rendered' };
  } finally {
    await context.close();
  }
}
