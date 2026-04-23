import type { Offer } from '../domain/offer.entity';
import { companiesRepository } from '../infrastructure/companies.repository';
import { offerBrandingRepository } from '../infrastructure/offer-branding.repository';
import { resolveOfferBranding } from './company-branding';

export async function resolveOfferBrandingForOffer(
  offer: Pick<Offer, 'organizationId' | 'companyId' | 'createdBy'>,
) {
  const companyPromise = offer.companyId
    ? companiesRepository.getById(offer.companyId, offer.organizationId)
    : companiesRepository.list(offer.organizationId).then((companies) => companies.length === 1 ? companies[0] : null);

  const [org, company, responsible] = await Promise.all([
    offerBrandingRepository.findOrganizationProfile(offer.organizationId),
    companyPromise,
    offerBrandingRepository.findResponsibleUser(offer.createdBy),
  ]);

  return resolveOfferBranding(company, org, responsible);
}
