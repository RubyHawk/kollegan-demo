import { prisma } from '@platform/database/prisma';
import { logger } from '@platform/logging/logger';
import { identityService } from '@modules/supporting/identity';
import type { Offer } from '../domain/offer.entity';
import { companiesRepository } from '../infrastructure/companies.repository';
import { resolveOfferBranding, type OfferBrandingProfile } from './company-branding';
import { enrichOfferLineItemUnits } from './offer-product-units';
import { renderPublicOfferPdf, resolvePdfOrigin } from './offer-pdf';
import { sanitizePublicPdfOfferDocument } from './public-offer-document';

export const OFFERS_SERVICE_TAG = 'OffersService';

export async function getOfferResponsibleUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      email: true,
      firstName: true,
      lastName: true,
    },
  });

  if (!user) return null;

  const name = [user.firstName, user.lastName].filter(Boolean).join(' ').trim() || user.email;
  return {
    name,
    email: user.email,
  };
}

export async function persistPublicOfferPdfSnapshot(
  offer: Offer,
  branding?: OfferBrandingProfile,
): Promise<void> {
  if (!offer.generatedDocument?.trim()) return;

  try {
    const offerWithUnits = await enrichOfferLineItemUnits(offer);
    const resolvedBranding = branding ?? await resolveOfferBrandingForOfferData(offerWithUnits);
    const sanitizedDocument = sanitizePublicPdfOfferDocument(
      offerWithUnits.generatedDocument!,
      offerWithUnits,
      resolvedBranding,
    );
    const { pdfBytes, fingerprint } = await renderPublicOfferPdf({
      documentHtml: sanitizedDocument,
      origin: resolvePdfOrigin(),
      offer: offerWithUnits,
    });

    await import('../infrastructure/offers.repository').then(({ offersRepository }) =>
      offersRepository.updateById(offerWithUnits.id, {
        generatedPdf: pdfBytes,
        generatedPdfFingerprint: fingerprint,
      })
    );
  } catch (err) {
    logger.warn(OFFERS_SERVICE_TAG, 'Failed to persist public offer PDF snapshot', { offerId: offer.id, err });
  }
}

export async function resolveOfferBrandingForOfferData(offer: Offer): Promise<OfferBrandingProfile> {
  const [org, company, responsible] = await Promise.all([
    identityService.getOrg(offer.organizationId),
    offer.companyId ? companiesRepository.getById(offer.companyId, offer.organizationId) : Promise.resolve(null),
    getOfferResponsibleUser(offer.createdBy),
  ]);

  return resolveOfferBranding(company, org, responsible);
}

export async function getActorOrganizationId(userId: string): Promise<string | null> {
  const { getUserOrganizationId } = await import('@modules/supporting/auth');
  return getUserOrganizationId(userId);
}
