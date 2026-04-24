import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@platform/auth/jwt';
import { getOffer } from '../../application/offers.service';
import { resolveOfferBrandingForOffer } from '../../application/offer-branding-profile';
import { sanitizeGeneratedOfferDocument } from '../../application/document-generator';

function extractToken(req: NextRequest): string {
  return req.headers.get('authorization')?.slice(7) ?? req.cookies.get('at')?.value ?? '';
}

function extractId(req: NextRequest): string {
  const parts = req.nextUrl.pathname.split('/');
  return parts[parts.length - 2] ?? '';
}

function slugify(s: string): string {
  return s
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
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

export async function handleGetOfferPdf(req: NextRequest): Promise<NextResponse> {
  let payload;
  try {
    payload = await verifyToken(extractToken(req));
  } catch {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  if (!payload.orgId) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  const id = extractId(req);
  const offer = await getOffer(id, payload.orgId);
  if (!offer) {
    return new NextResponse('Not found', { status: 404 });
  }

  if (!offer.generatedDocument) {
    return new NextResponse('Offer has no generated document yet. Send the offer first.', {
      status: 422,
    });
  }

  const signatureScript = buildSignatureHydrationScript(offer);
  const printScript = `
<script>
  window.addEventListener('load', function () {
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

  let documentHtml = offer.generatedDocument;
  try {
    const branding = await resolveOfferBrandingForOffer(offer);
    documentHtml = sanitizeGeneratedOfferDocument(offer.generatedDocument, offer, branding);
  } catch {
    documentHtml = offer.generatedDocument;
  }

  const html = documentHtml
    .replace('</head>', `${printStyles}\n</head>`)
    .replace('</body>', `${signatureScript}\n${printScript}\n</body>`);

  const filename = `offert-${slugify(offer.title)}.pdf`;

  return new NextResponse(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Disposition': `inline; filename="${filename}"`,
      'Cache-Control': 'private, no-store',
    },
  });
}
