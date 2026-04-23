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
export const PUBLIC_OFFER_PDF_RENDERER_VERSION = '2026-04-11-print-approved-layout-v5-hide-item-details-apris';
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
        .replace(/\u00c3\u2026/g, 'Å')
        .replace(/\u00c3\u201e/g, 'Ä')
        .replace(/\u00c3\u2013/g, 'Ö')
        .replace(/\u00c3\u00a5/g, 'å')
        .replace(/\u00c3\u00a4/g, 'ä')
        .replace(/\u00c3\u00b6/g, 'ö')
        .replace(/\u00c2\u00a0/g, '\\u00a0')
        .replace(/\u00c2\u00b7/g, '·')
        .replace(/\u00e2\u20ac\u201d/g, '—')
        .replace(/\u00e2\u20ac\u201c/g, '–')
        .replace(/\u00e2\u20ac\u0153/g, '“')
        .replace(/\u00e2\u20ac\u009d/g, '”')
        .replace(/\u00e2\u20ac\u2122/g, '’');
    }

    var statusLabel = ${JSON.stringify(
      offer.status === 'accepted'
        ? 'Signerad'
        : offer.status === 'declined'
          ? 'Avvisad'
          : offer.status === 'expired'
            ? 'Utgången'
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
        .replace(/Å-pris/g, 'À-pris')
        .replace(/\bA-pris\b/g, 'À-pris')
        .replace(/\u00c3\u2026/g, 'Å')
        .replace(/\u00c3\u201e/g, 'Ä')
        .replace(/\u00c3\u2013/g, 'Ö')
        .replace(/\u00c3\u00a5/g, 'å')
        .replace(/\u00c3\u00a4/g, 'ä')
        .replace(/\u00c3\u00b6/g, 'ö')
        .replace(/\u00c2\u00a0/g, '\\u00a0')
        .replace(/\u00c2\u00b7/g, '·')
        .replace(/\u00c2(?=[\\u00a0 0-9%.,:;|kr])/g, '');
    }

    function compactDateText(value) {
      var trimmed = normalizeOfferText(value).trim();
      var parts = trimmed.match(/^(\d{1,2})\s+([A-Za-zÅÄÖåäö.]+)\s+(\d{4})$/);
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

    document.querySelectorAll('.offer-summary__row').forEach(function (row) {
      var label = normalizeOfferText((row.querySelector('span')?.textContent || '')).replace(/\\s+/g, ' ').trim().toLocaleLowerCase('sv-SE');
      if (row.classList.contains('offer-summary__row--total')) return;
      if (label.indexOf('delsumma') === 0) row.classList.add('offer-summary__row--subtotal');
      else if (label === 'rabatt') {
        row.classList.add('offer-summary__row--discount');
        var amount = row.querySelector('strong');
        if (amount && !/^[−-]/.test((amount.textContent || '').trim())) {
          amount.textContent = '− ' + (amount.textContent || '').trim();
        }
      } else if (label.indexOf('moms') === 0) row.classList.add('offer-summary__row--vat');
    });

    document.querySelectorAll('.offer-summary').forEach(function (summary) {
      var rows = Array.from(summary.querySelectorAll(':scope > .offer-summary__row'));
      var ordered = rows
        .filter(function (row) { return row.classList.contains('offer-summary__row--subtotal'); })
        .concat(rows.filter(function (row) { return row.classList.contains('offer-summary__row--discount'); }))
        .concat(rows.filter(function (row) { return row.classList.contains('offer-summary__row--vat'); }))
        .concat(rows.filter(function (row) { return row.classList.contains('offer-summary__row--total'); }));
      if (ordered.length === rows.length && ordered.some(function (row, index) { return row !== rows[index]; })) {
        ordered.forEach(function (row) { summary.appendChild(row); });
      }
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
    gap: 24px !important;
    color: #1f335b !important;
  }
  .offer-shell__header {
    grid-template-columns: minmax(0, 1.15fr) minmax(0, 0.9fr) !important;
    gap: 28px !important;
    align-items: center !important;
    padding-bottom: 22px !important;
    border-bottom: 1px solid #dbe5f1 !important;
  }
  .offer-shell__topline {
    grid-template-columns: minmax(0, 1fr) minmax(220px, 260px) !important;
    gap: 24px !important;
    align-items: end !important;
    padding-bottom: 0 !important;
    border-bottom: 0 !important;
  }
  .offer-shell__topline h1 {
    margin: 0 !important;
    font-family: "Times New Roman", Times, serif !important;
    font-size: 54px !important;
    font-weight: 700 !important;
    line-height: 0.95 !important;
    letter-spacing: -0.03em !important;
    color: #1e3158 !important;
  }
  .offer-shell__lead,
  .offer-shell__eyebrow,
  .offer-shell__customer-label,
  .offer-shell__status,
  .offer-shell__title {
    display: none !important;
  }
  .offer-shell__sender {
    gap: 16px !important;
    align-items: flex-start !important;
  }
  .offer-shell__logo {
    width: 72px !important;
    height: 72px !important;
    border-radius: 20px !important;
    object-fit: cover !important;
    box-shadow: 0 8px 22px rgba(142, 169, 205, 0.2) !important;
  }
  .offer-shell__sender-copy {
    display: grid !important;
    gap: 4px !important;
    font-size: 13px !important;
    line-height: 1.38 !important;
    color: #111827 !important;
  }
  .offer-shell__sender-name {
    margin-bottom: 6px !important;
    font-size: 16px !important;
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
    border-radius: 0 !important;
    background: transparent !important;
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
    grid-template-columns: 1fr !important;
    gap: 6px !important;
    padding: 0 14px !important;
    border-left: 1px solid #dbe5f1 !important;
    border-bottom: none !important;
  }
  .offer-shell__meta dl div:first-child {
    border-left: none !important;
    padding-left: 0 !important;
  }
  .offer-shell__meta dl div:last-child {
    padding-right: 0 !important;
  }
  .offer-shell__meta dt {
    font-size: 10px !important;
    font-weight: 700 !important;
    line-height: 1.3 !important;
    letter-spacing: 0 !important;
    text-transform: none !important;
    text-align: center !important;
    color: #657b9c !important;
  }
  .offer-shell__meta dd {
    font-size: 14px !important;
    line-height: 1.2 !important;
    color: #1f335b !important;
    font-weight: 700 !important;
    white-space: nowrap !important;
    text-align: center !important;
  }
  .offer-shell__customer-card {
    display: grid !important;
    gap: 8px !important;
    min-width: 0 !important;
    padding: 0 !important;
    border: 0 !important;
    border-radius: 0 !important;
    background: transparent !important;
    text-align: right !important;
    justify-self: end !important;
    align-self: center !important;
  }
  .offer-shell__customer-card p {
    margin: 0 !important;
  }
  .offer-shell__customer-primary {
    font-size: 15px !important;
    line-height: 1.2 !important;
    font-weight: 700 !important;
    color: #1f335b !important;
  }
  .offer-shell__customer-secondary {
    font-size: 11px !important;
    line-height: 1.4 !important;
    color: #334b70 !important;
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
  .offer-item-card__detail {
    display: none !important;
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
    width: min(332px, 100%) !important;
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
    width: min(332px, 100%) !important;
    margin-top: 18px !important;
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
    font-size: 13px !important;
    line-height: 1.35 !important;
    border: 0 !important;
    border-radius: 0 !important;
  }
  .offer-summary__row span {
    font-weight: 600 !important;
    color: #445a7a !important;
  }
  .offer-summary__row strong {
    color: #1f335b !important;
    font-size: 13px !important;
    font-weight: 700 !important;
    font-variant-numeric: tabular-nums !important;
    white-space: nowrap !important;
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
  .offer-summary__row--discount span,
  .offer-summary__row--discount strong {
    color: #b42318 !important;
  }
  .offer-summary__row--vat span {
    color: #42576f !important;
  }
  .offer-item-card__metric--total {
    color: #0f172a !important;
    font-weight: 700 !important;
  }
  .offer-summary__row--total {
    margin-top: 10px !important;
    padding: 15px 18px !important;
    background: #2d4a83 !important;
    color: #ffffff !important;
  }
  .offer-summary__row--total span {
    color: #ffffff !important;
  }
  .offer-summary__total-copy {
    display: grid !important;
    gap: 4px !important;
  }
  .offer-summary__total-label {
    font-size: 18px !important;
    font-weight: 700 !important;
    line-height: 1 !important;
  }
  .offer-summary__total-subcopy {
    font-size: 10px !important;
    font-weight: 700 !important;
    line-height: 1.2 !important;
    text-transform: uppercase !important;
  }
  .offer-summary__row--total strong,
  .offer-item-card__metric--total dd {
    color: #ffffff !important;
  }
  .offer-summary__row--total strong {
    font-size: 16px !important;
    font-weight: 700 !important;
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
