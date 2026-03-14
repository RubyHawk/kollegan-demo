/**
 * GET /api/offers/[id]/pdf
 *
 * Returns the offer's generated HTML document with an auto-print script
 * injected. Opening this URL in a new tab triggers the browser print dialog,
 * which lets the user save as PDF. No external PDF library required.
 *
 * Auth: reads the `at` httpOnly cookie (sent automatically by the browser
 * when window.open() is used, so no manual token passing needed).
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@platform/auth/jwt';
import { getOffer } from '@modules/supporting/offers';

function extractToken(req: NextRequest): string {
  return req.headers.get('authorization')?.slice(7) ?? req.cookies.get('at')?.value ?? '';
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[åä]/g, 'a')
    .replace(/[ö]/g, 'o')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  // Authenticate
  let payload;
  try {
    payload = await verifyToken(extractToken(req));
  } catch {
    return new NextResponse('Unauthorized', { status: 401 });
  }
  if (!payload.orgId) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  // Fetch offer
  const { id } = await params;
  const offer = await getOffer(id, payload.orgId);
  if (!offer) {
    return new NextResponse('Not found', { status: 404 });
  }
  if (!offer.generatedDocument) {
    return new NextResponse('Offer has no generated document yet. Send the offer first.', {
      status: 422,
    });
  }

  // Inject auto-print script + print-optimised overrides before </body>
  const printScript = `
<script>
  window.addEventListener('load', function () {
    // Small delay to let fonts and images settle
    setTimeout(function () { window.print(); }, 300);
  });
</script>`;

  const printStyles = `
<style>
  @media print {
    @page { margin: 20mm 18mm; }
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
</style>`;

  const html = offer.generatedDocument
    .replace('</head>', `${printStyles}\n</head>`)
    .replace('</body>', `${printScript}\n</body>`);

  const filename = `offert-${slugify(offer.title)}.pdf`;

  return new NextResponse(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      // "inline" keeps it in the tab; the browser's Save as PDF dialog saves it
      'Content-Disposition': `inline; filename="${filename}"`,
      // Prevent caching of sensitive documents
      'Cache-Control': 'private, no-store',
    },
  });
}
