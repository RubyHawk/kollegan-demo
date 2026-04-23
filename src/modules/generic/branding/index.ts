export interface BrandingProfile {
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

export interface BrandingSource {
  companyName?: string | null | undefined;
  senderName?: string | null | undefined;
  organizationNumber?: string | null | undefined;
  senderEmail?: string | null | undefined;
  website?: string | null | undefined;
  logoUrl?: string | null | undefined;
  emailHeaderConfig?: string | null | undefined;
  addressLines?: Array<string | null | undefined>;
}

export interface BrandingResponsible {
  name?: string;
  email?: string;
}

export interface ResolveBrandingProfileInput {
  documentOverride?: BrandingSource | null;
  company?: BrandingSource | null;
  organization?: BrandingSource | null;
  responsible?: BrandingResponsible | null;
  fallbackName?: string;
}

function clean(value?: string | null): string | undefined {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

function cleanAddressLines(lines?: Array<string | null | undefined> | null): string[] | undefined {
  if (!lines) return undefined;

  const normalized = lines
    .map((line) => clean(line))
    .filter((line): line is string => Boolean(line));

  return normalized.length > 0 ? normalized : undefined;
}

export function resolveBrandingProfile({
  documentOverride,
  company,
  organization,
  responsible,
  fallbackName = 'Offert',
}: ResolveBrandingProfileInput): BrandingProfile {
  const fallback = clean(fallbackName) ?? 'Offert';
  const companyName = clean(documentOverride?.companyName)
    ?? clean(company?.companyName)
    ?? clean(organization?.companyName)
    ?? clean(organization?.senderName)
    ?? fallback;
  const senderName = clean(documentOverride?.senderName)
    ?? clean(company?.senderName)
    ?? clean(company?.companyName)
    ?? clean(organization?.senderName)
    ?? clean(organization?.companyName)
    ?? fallback;

  return {
    companyName,
    senderName,
    organizationNumber: clean(documentOverride?.organizationNumber)
      ?? clean(company?.organizationNumber)
      ?? clean(organization?.organizationNumber),
    senderEmail: clean(documentOverride?.senderEmail)
      ?? clean(company?.senderEmail)
      ?? clean(organization?.senderEmail),
    website: clean(documentOverride?.website)
      ?? clean(company?.website)
      ?? clean(organization?.website),
    logoUrl: clean(documentOverride?.logoUrl)
      ?? clean(company?.logoUrl)
      ?? clean(organization?.logoUrl),
    emailHeaderConfig: clean(documentOverride?.emailHeaderConfig)
      ?? clean(company?.emailHeaderConfig)
      ?? clean(organization?.emailHeaderConfig),
    responsibleName: clean(responsible?.name),
    responsibleEmail: clean(responsible?.email),
    addressLines: cleanAddressLines(documentOverride?.addressLines)
      ?? cleanAddressLines(company?.addressLines)
      ?? cleanAddressLines(organization?.addressLines),
  };
}
