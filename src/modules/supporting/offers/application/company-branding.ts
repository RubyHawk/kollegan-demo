import type { Company } from '../domain/offer.entity';

export interface OfferBrandingProfile {
  companyName: string;
  senderName: string;
  senderEmail?: string;
  website?: string;
  logoUrl?: string;
  emailHeaderConfig?: string;
}

export function resolveOfferBranding(
  company: Company | null | undefined,
  org: { name: string; senderEmail?: string; senderName?: string; emailHeaderConfig?: string } | null | undefined,
) : OfferBrandingProfile {
  const companyName = company?.name?.trim() || org?.senderName?.trim() || org?.name?.trim() || 'Offert';
  const senderName = company?.senderName?.trim() || companyName || org?.senderName?.trim() || org?.name?.trim() || 'Offert';

  return {
    companyName,
    senderName,
    senderEmail: company?.senderEmail?.trim() || org?.senderEmail?.trim(),
    website: company?.website?.trim(),
    logoUrl: company?.logoUrl?.trim(),
    emailHeaderConfig: company?.emailHeaderConfig?.trim() || org?.emailHeaderConfig?.trim(),
  };
}
