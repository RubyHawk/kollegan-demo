import { identityService } from '@modules/supporting/identity';
import { prisma } from '@platform/database/prisma';
import type { Offer } from '../domain/offer.entity';
import { companiesRepository } from '../infrastructure/companies.repository';
import { resolveOfferBranding } from './company-branding';

async function getOfferResponsibleUser(userId: string) {
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

export async function resolveOfferBrandingForOffer(
  offer: Pick<Offer, 'organizationId' | 'companyId' | 'createdBy'>,
) {
  const companyPromise = offer.companyId
    ? companiesRepository.getById(offer.companyId, offer.organizationId)
    : companiesRepository.list(offer.organizationId).then((companies) => companies.length === 1 ? companies[0] : null);

  const [org, company, responsible] = await Promise.all([
    identityService.getOrg(offer.organizationId),
    companyPromise,
    getOfferResponsibleUser(offer.createdBy),
  ]);

  return resolveOfferBranding(company, org, responsible);
}
