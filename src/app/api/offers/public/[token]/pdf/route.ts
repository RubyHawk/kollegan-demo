import { NextRequest, NextResponse } from 'next/server';
import { viewOffer } from '@modules/supporting/offers';
import { resolveOfferBrandingForOffer } from '@modules/supporting/offers/application/offer-branding-profile';
import { buildPublicOfferPdfFingerprint, renderPublicOfferPdf } from '@modules/supporting/offers/application/offer-pdf';
import { sanitizePublicPdfOfferDocument } from '@modules/supporting/offers/application/public-offer-document';
import { offersRepository } from '@modules/supporting/offers/infrastructure/offers.repository';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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

  const fingerprint = buildPublicOfferPdfFingerprint(documentHtml, req.nextUrl.origin, offer);
  const filename = `offert-${slugify(offer.title || 'offert')}.pdf`;

  if (offer.generatedPdfFingerprint === fingerprint && offer.generatedPdf?.length) {
    return new NextResponse(Buffer.from(offer.generatedPdf), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${filename}"`,
        'Cache-Control': 'private, no-store',
        'X-Soleria-Pdf-Source': 'db',
      },
    });
  }

  const { pdfBytes, cacheStatus } = await renderPublicOfferPdf({
    documentHtml,
    origin: req.nextUrl.origin,
    offer,
  });

  if (offer.generatedPdfFingerprint !== fingerprint || !offer.generatedPdf?.length) {
    await offersRepository.updateById(offer.id, {
      generatedPdf: pdfBytes,
      generatedPdfFingerprint: fingerprint,
    }).catch(() => undefined);
  }
  const source = cacheStatus === 'memory-hit' ? 'memory' : 'render';

  return new NextResponse(Buffer.from(pdfBytes), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${filename}"`,
      'Cache-Control': 'private, no-store',
      'X-Soleria-Pdf-Source': source,
    },
  });
}
