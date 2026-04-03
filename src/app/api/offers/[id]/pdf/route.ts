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
    if (!sig.image && !sig.name && !sig.date) return;
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
  const signatureScript = buildSignatureHydrationScript(offer);

  const printStyles = `
<style>
  @media print {
    @page { margin: 20mm 18mm; }
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
</style>`;

  const html = offer.generatedDocument
    .replace('</head>', `${printStyles}\n</head>`)
    .replace('</body>', `${signatureScript}\n${printScript}\n</body>`);

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
