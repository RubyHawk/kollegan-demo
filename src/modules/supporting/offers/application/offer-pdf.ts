import { createHash } from 'crypto';
import { chromium, type Browser } from 'playwright';
import { buildPublicPdfHtml } from './offer-pdf-html';

export { buildPublicPdfHtml } from './offer-pdf-html';

export type OfferPdfVariantStatus = 'draft' | 'sent' | 'viewed' | 'accepted' | 'declined' | 'expired';

export interface OfferPdfVariant {
  status: OfferPdfVariantStatus;
  signatureImage?: string | null;
  signerName?: string | null;
  acceptedAt?: string | Date | null;
}

const PDF_CACHE_MAX_ENTRIES = 24;
export const PUBLIC_OFFER_PDF_RENDERER_VERSION = '2026-04-11-print-approved-layout-v5-hide-item-details-apris';
const pdfCache = new Map<string, Uint8Array>();
let browserPromise: Promise<Browser> | null = null;

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
