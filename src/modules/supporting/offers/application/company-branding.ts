import { resolveBrandingProfile, type BrandingProfile, type BrandingSource } from '@modules/generic/branding';
import type { Company } from '../domain/offer.entity';

export type OfferBrandingProfile = BrandingProfile;

function toBrandingSource(
  company?: Company | null,
  org?: { name: string; senderEmail?: string; senderName?: string; emailHeaderConfig?: string } | null,
): { companySource?: BrandingSource; organizationSource?: BrandingSource } {
  const companySource = company ? {
    companyName: company.name,
    senderName: company.senderName,
    organizationNumber: company.orgNumber,
    senderEmail: company.senderEmail,
    website: company.website,
    logoUrl: company.logoUrl,
    emailHeaderConfig: company.emailHeaderConfig,
    addressLines: [
      company.addressLine1,
      company.addressLine2,
      [company.postalCode, company.city].filter(Boolean).join(' '),
      company.region,
      company.country,
    ],
  } satisfies BrandingSource : undefined;

  const organizationSource = org ? {
    companyName: org.name,
    senderName: org.senderName,
    senderEmail: org.senderEmail,
    emailHeaderConfig: org.emailHeaderConfig,
  } satisfies BrandingSource : undefined;

  return { companySource, organizationSource };
}

export function resolveOfferBranding(
  company: Company | null | undefined,
  org: { name: string; senderEmail?: string; senderName?: string; emailHeaderConfig?: string } | null | undefined,
  responsible?: { name?: string; email?: string } | null,
) : OfferBrandingProfile {
  const { companySource, organizationSource } = toBrandingSource(company, org);
  return resolveBrandingProfile({
    company: companySource,
    organization: organizationSource,
    responsible,
    fallbackName: 'Offert',
  });
}
