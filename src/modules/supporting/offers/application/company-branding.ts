import type { Company } from '../domain/offer.entity';

export interface OfferBrandingProfile {
  companyName: string;
  senderName: string;
  organizationNumber?: string;
  senderEmail?: string;
  website?: string;
  logoUrl?: string;
  emailHeaderConfig?: string;
  responsibleName?: string;
  responsibleEmail?: string;
  addressLines?: string[];
}

export function resolveOfferBranding(
  company: Company | null | undefined,
  org: { name: string; senderEmail?: string; senderName?: string; emailHeaderConfig?: string } | null | undefined,
  responsible?: { name?: string; email?: string } | null,
) : OfferBrandingProfile {
  const companyName = company?.name?.trim() || org?.name?.trim() || org?.senderName?.trim() || 'Offert';
  const senderName = company?.senderName?.trim() || company?.name?.trim() || org?.senderName?.trim() || org?.name?.trim() || 'Offert';
  const responsibleName = responsible?.name?.trim() || undefined;
  const responsibleEmail = responsible?.email?.trim() || undefined;
  const addressLines = [
    company?.addressLine1,
    company?.addressLine2,
    [company?.postalCode, company?.city].filter(Boolean).join(' '),
    company?.region,
    company?.country,
  ]
    .map((part) => part?.trim())
    .filter(Boolean) as string[];

  return {
    companyName,
    senderName,
    organizationNumber: company?.orgNumber?.trim() || undefined,
    senderEmail: company?.senderEmail?.trim() || org?.senderEmail?.trim(),
    website: company?.website?.trim(),
    logoUrl: company?.logoUrl?.trim(),
    emailHeaderConfig: company?.emailHeaderConfig?.trim() || org?.emailHeaderConfig?.trim(),
    responsibleName,
    responsibleEmail,
    addressLines,
  };
}
