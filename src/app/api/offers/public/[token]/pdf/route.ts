import { createHash } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { chromium, type Browser } from 'playwright';
import { viewOffer } from '@modules/supporting/offers';
import { resolveOfferBrandingForOffer } from '@modules/supporting/offers/application/offer-branding-profile';
import { sanitizePublicPdfOfferDocument } from '@modules/supporting/offers/application/public-offer-document';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const PDF_CACHE_MAX_ENTRIES = 24;
const pdfCache = new Map<string, Uint8Array>();
let browserPromise: Promise<Browser> | null = null;

function extractToken(req: NextRequest): string {
  const parts = req.nextUrl.pathname.split('/');
  const publicIdx = parts.indexOf('public');
  return publicIdx !== -1 ? (parts[publicIdx + 1] ?? '') : '';
}

function slugify(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
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

function buildPdfCacheKey(documentHtml: string, offer: {
  status: 'draft' | 'sent' | 'viewed' | 'accepted' | 'declined' | 'expired';
  signatureImage?: string | null;
  signerName?: string | null;
  acceptedAt?: string | Date | null;
}): string {
  return createHash('sha1')
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

function buildSignatureHydrationScript(offer: {
  signatureImage?: string | null;
  signerName?: string | null;
  acceptedAt?: string | Date | null;
}): string {
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

function buildPublicPdfHtml(
  documentHtml: string,
  origin: string,
  offer: {
    status: 'draft' | 'sent' | 'viewed' | 'accepted' | 'declined' | 'expired';
    signatureImage?: string | null;
    signerName?: string | null;
    acceptedAt?: string | Date | null;
  },
): string {
  const baseTag = `<base href="${origin}/" />`;
  const signatureScript = buildSignatureHydrationScript(offer);
  const behaviorScript = `
<script>
  (function () {
    function normalizeBrokenSwedish(text) {
      return text
        .replace(/Ã…/g, 'Å')
        .replace(/Ã„/g, 'Ä')
        .replace(/Ã–/g, 'Ö')
        .replace(/Ã¥/g, 'å')
        .replace(/Ã¤/g, 'ä')
        .replace(/Ã¶/g, 'ö')
        .replace(/Â /g, '\\u00a0')
        .replace(/Â·/g, '·')
        .replace(/â€”/g, '—')
        .replace(/â€“/g, '–')
        .replace(/â€œ/g, '“')
        .replace(/â€\\u009d/g, '”')
        .replace(/â€™/g, '’');
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
  .doc-wrapper { margin: 0 !important; border: none !important; border-radius: 0 !important; box-shadow: none !important; max-width: none !important; }
  .page-separator { display: none !important; }
  .page-block { page-break-after: always; break-after: page; }
  .page-block:last-child { page-break-after: auto; break-after: auto; }
</style>`;

  return documentHtml
    .replace('</head>', `${baseTag}\n${printStyles}\n</head>`)
    .replace('</body>', `${signatureScript}\n${behaviorScript}\n</body>`);
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const token = extractToken(req);
  if (!token) return new NextResponse('Not found', { status: 404 });

  const offer = await viewOffer(token);
  if (!offer) {
    return new NextResponse('Offer not found or link has expired.', { status: 404 });
  }
  if (!offer.generatedDocument) {
    return new NextResponse('Offer has no generated document yet.', { status: 422 });
  }

  let documentHtml = offer.generatedDocument;
  try {
    const branding = await resolveOfferBrandingForOffer(offer);
    documentHtml = sanitizePublicPdfOfferDocument(offer.generatedDocument, offer, branding);
  } catch {
    documentHtml = offer.generatedDocument;
  }
  const html = buildPublicPdfHtml(documentHtml, req.nextUrl.origin, offer);
  const cacheKey = buildPdfCacheKey(html, offer);
  const cachedPdf = getCachedPdf(cacheKey);
  const filename = `offert-${slugify(offer.title || 'offert')}.pdf`;

  if (cachedPdf) {
    return new NextResponse(Buffer.from(cachedPdf), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${filename}"`,
        'Cache-Control': 'private, no-store',
        'X-Soleria-Pdf-Cache': 'HIT',
      },
    });
  }

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
    setCachedPdf(cacheKey, pdfBytes);

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${filename}"`,
        'Cache-Control': 'private, no-store',
        'X-Soleria-Pdf-Cache': 'MISS',
      },
    });
  } finally {
    await context.close();
  }
}
