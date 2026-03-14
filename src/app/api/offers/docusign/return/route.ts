/**
 * GET /api/offers/docusign/return
 *
 * DocuSign embedded signing return URL.
 * Called by DocuSign after the recipient finishes (signs, cancels, or declines).
 *
 * Query params set by DocuSign:
 *   event        — 'signing_complete' | 'cancel' | 'decline' | ...
 *   envelopeId   — DocuSign envelope ID
 *   token        — Our public offer token (passed via returnUrl)
 *
 * On 'signing_complete': mark offer accepted → redirect to success page
 * On 'decline':          mark offer declined → redirect to declined page
 * On anything else:      redirect back to the public offer page (no state change)
 */

import { NextRequest, NextResponse } from 'next/server';
import { resolveReturnAction } from '@modules/supporting/offers/application/signature-providers/docusign';
import { signOffer, declineOfferByToken } from '@modules/supporting/offers';
import { logger } from '@platform/logging/logger';

const TAG = 'DocuSignReturn';

function getIp(req: NextRequest): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
}
function getUa(req: NextRequest): string {
  return req.headers.get('user-agent') ?? 'unknown';
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const { searchParams } = req.nextUrl;
  const event      = searchParams.get('event')      ?? '';
  const token      = searchParams.get('token')      ?? '';
  const envelopeId = searchParams.get('envelopeId') ?? '';

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? '';
  const publicPageUrl = `${appUrl}/offers/public/${token}`;

  if (!token) {
    return NextResponse.redirect(`${appUrl}/offers`);
  }

  const action = resolveReturnAction(event);
  logger.info(TAG, `DocuSign return: event=${event} action=${action}`, { token, envelopeId });

  try {
    if (action === 'accept') {
      // Use envelopeId as the "signature image" marker — real signature is in DocuSign
      const signatureMarker = `docusign:${envelopeId}`;
      await signOffer(token, signatureMarker, getIp(req), getUa(req));
      return NextResponse.redirect(`${publicPageUrl}?signed=1`);
    }

    if (action === 'decline') {
      await declineOfferByToken(token, 'Avvisad via DocuSign', getIp(req), getUa(req));
      return NextResponse.redirect(`${publicPageUrl}?declined=1`);
    }
  } catch (err) {
    logger.warn(TAG, 'Failed to process DocuSign return', { err, token, event });
  }

  // cancel or error → send back to offer page
  return NextResponse.redirect(publicPageUrl);
}
