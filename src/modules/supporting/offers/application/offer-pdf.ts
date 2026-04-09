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
export const PUBLIC_OFFER_PDF_RENDERER_VERSION = '2026-04-09-print-lite-v1';
const pdfCache = new Map<string, Uint8Array>();
let browserPromise: Promise<Browser> | null = null;

function buildSignatureHydrationScript(offer: OfferPdfVariant): string {
  const acceptedDate = offer.acceptedAt
    ? new Date(offer.acceptedAt.toString()).toLocaleDateString('sv-SE', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
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

    var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      var node = walker.currentNode;
      node.nodeValue = normalizeBrokenSwedish(node.nodeValue || '');
    }

    var legacyMetaTitle = document.querySelector('.offer-shell__title');
    if (legacyMetaTitle) {
      legacyMetaTitle.textContent = statusLabel;
      legacyMetaTitle.className = statusClass;
    }
  })();
</script>`;

  const printStyles = `
<style>
  @page { size: A4; margin: 0; }
  html, body { margin: 0; padding: 0; background: #ffffff; }
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
  .page-block--document::before {
    content: none !important;
    background: none !important;
    background-image: none !important;
    display: none !important;
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
  .offer-shell__meta,
  .offer-shell__customer-card,
  .offer-items__table,
  .offer-item-card,
  .offer-summary,
  .offer-shell__status {
    border-radius: 8px !important;
  }
  .offer-shell__status {
    border: 1px solid #cbd5e1 !important;
    color: #0f172a !important;
  }
  .offer-summary__row--total,
  .offer-item-card__metric--total {
    color: #0f172a !important;
    font-weight: 700 !important;
  }
  .offer-summary__row--total strong,
  .offer-item-card__metric--total dd {
    color: #0f172a !important;
  }
  .offer-item-card__metric:nth-child(even) {
    background: #ffffff !important;
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
