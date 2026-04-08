import { identityService } from '@modules/supporting/identity';
import type { Offer } from '../domain/offer.entity';
import { companiesRepository } from '../infrastructure/companies.repository';
import { resolveOfferBranding } from './company-branding';
import { getOfferResponsibleUser } from './offers.service';

export async function resolveOfferBrandingForOffer(
  offer: Pick<Offer, 'organizationId' | 'companyId' | 'createdBy'>,
) {
  const [org, company, responsible] = await Promise.all([
    identityService.getOrg(offer.organizationId),
    offer.companyId ? companiesRepository.getById(offer.companyId, offer.organizationId) : Promise.resolve(null),
    getOfferResponsibleUser(offer.createdBy),
  ]);

  return resolveOfferBranding(company, org, responsible);
}
