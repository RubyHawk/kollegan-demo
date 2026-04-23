import { offersRepository } from '../infrastructure/offers.repository';
import { resolveOfferBrandingForOffer } from './offer-branding-profile';
import { buildPublicOfferPdfFingerprint, renderPublicOfferPdf } from './offer-pdf';
import { sanitizePublicPdfOfferDocument } from './public-offer-document';
import { viewOffer } from './public-offer-actions.service';

export type PublicOfferPdfResult =
  | {
      status: 'ok';
      pdfBytes: Uint8Array;
      filename: string;
      source: 'db' | 'memory' | 'render';
    }
  | {
      status: 'not_found' | 'missing_document';
      message: string;
    };

function slugify(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

export async function renderPublicOfferPdfForToken(
  token: string,
  origin: string,
): Promise<PublicOfferPdfResult> {
  const offer = await viewOffer(token);
  if (!offer) {
    return { status: 'not_found', message: 'Offer not found or link has expired.' };
  }
  if (!offer.generatedDocument) {
    return { status: 'missing_document', message: 'Offer has no generated document yet.' };
  }

  let documentHtml = offer.generatedDocument;
  try {
    const branding = await resolveOfferBrandingForOffer(offer);
    documentHtml = sanitizePublicPdfOfferDocument(offer.generatedDocument, offer, branding);
  } catch {
    documentHtml = offer.generatedDocument;
  }

  const fingerprint = buildPublicOfferPdfFingerprint(documentHtml, origin, offer);
  const filename = `offert-${slugify(offer.title || 'offert')}.pdf`;

  if (offer.generatedPdfFingerprint === fingerprint && offer.generatedPdf?.length) {
    return {
      status: 'ok',
      pdfBytes: offer.generatedPdf,
      filename,
      source: 'db',
    };
  }

  const { pdfBytes, cacheStatus } = await renderPublicOfferPdf({
    documentHtml,
    origin,
    offer,
  });

  if (offer.generatedPdfFingerprint !== fingerprint || !offer.generatedPdf?.length) {
    await offersRepository.updateById(offer.id, {
      generatedPdf: pdfBytes,
      generatedPdfFingerprint: fingerprint,
    }).catch(() => undefined);
  }

  return {
    status: 'ok',
    pdfBytes,
    filename,
    source: cacheStatus === 'memory-hit' ? 'memory' : 'render',
  };
}
