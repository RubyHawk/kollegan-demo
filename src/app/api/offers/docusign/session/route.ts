/**
 * POST /api/offers/docusign/session
 *
 * Creates a DocuSign embedded signing session for the given public offer token.
 * Returns { signingUrl } — client redirects to this URL.
 *
 * No authentication required (public offer flow, gated by the offer token).
 * Rate-limited to prevent abuse.
 *
 * Body: { token: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { offersRepository } from '@modules/supporting/offers/infrastructure/offers.repository';
import { createSigningSession, isDocuSignConfigured } from '@modules/supporting/offers/application/signature-providers/docusign';
import { generateFallbackDocument } from '@modules/supporting/offers/application/document-generator';

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!isDocuSignConfigured()) {
    return NextResponse.json({ error: 'DocuSign is not configured' }, { status: 501 });
  }

  let token: string;
  try {
    const body = await req.json() as { token?: string };
    token = body.token ?? '';
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  if (!token) {
    return NextResponse.json({ error: 'token is required' }, { status: 400 });
  }

  const offer = await offersRepository.findByPublicToken(token);
  if (!offer) {
    return NextResponse.json({ error: 'Offer not found' }, { status: 404 });
  }
  if (offer.status !== 'sent' && offer.status !== 'viewed') {
    return NextResponse.json({ error: 'Offer cannot be signed in its current status' }, { status: 409 });
  }
  if (offer.publicTokenExpiresAt && new Date(offer.publicTokenExpiresAt) < new Date()) {
    return NextResponse.json({ error: 'Offer link has expired' }, { status: 410 });
  }

  // Use stored document or generate a fallback for offers sent before auto-generation was added
  const document = offer.generatedDocument ?? generateFallbackDocument(offer);

  const appUrl    = process.env.NEXT_PUBLIC_APP_URL ?? '';
  const returnUrl = `${appUrl}/api/offers/docusign/return?token=${token}&envelopeId={{envelopeId}}`;

  const session = await createSigningSession(
    offer.id,
    offer.title,
    document,
    offer.recipientName,
    offer.recipientEmail,
    // DocuSign replaces {{envelopeId}} in the returnUrl with the actual envelope ID
    returnUrl,
  );

  return NextResponse.json({ signingUrl: session.signingUrl, envelopeId: session.envelopeId });
}
