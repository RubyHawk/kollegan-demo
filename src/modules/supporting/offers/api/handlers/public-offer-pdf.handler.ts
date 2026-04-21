import { NextRequest, NextResponse } from 'next/server';
import { renderPublicOfferPdfForToken } from '../../application/public-offer-pdf.service';

function extractToken(req: NextRequest): string {
  const parts = req.nextUrl.pathname.split('/');
  const publicIdx = parts.indexOf('public');
  return publicIdx !== -1 ? (parts[publicIdx + 1] ?? '') : '';
}

export async function handleGetPublicOfferPdf(req: NextRequest): Promise<NextResponse> {
  const token = extractToken(req);
  if (!token) return new NextResponse('Not found', { status: 404 });

  const result = await renderPublicOfferPdfForToken(token, req.nextUrl.origin);
  if (result.status !== 'ok') {
    return new NextResponse(result.message, {
      status: result.status === 'not_found' ? 404 : 422,
    });
  }

  return new NextResponse(Buffer.from(result.pdfBytes), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${result.filename}"`,
      'Cache-Control': 'private, no-store',
      'X-Soleria-Pdf-Source': result.source,
    },
  });
}
