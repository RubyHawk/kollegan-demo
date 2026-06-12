import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { getPublicRestaurantSite, type PublicRestaurantSite } from '@modules/supporting/restaurant-menu';

const FALLBACK_SITE: PublicRestaurantSite = {
  organizationId: 'fallback-fluffys',
  organizationName: "Fluffy's",
  settings: {
    siteName: "Fluffy's",
    heroTitle: "Fluffy's",
    heroSubtitle: 'Subs, pizza, panini, wraps och annat gott i Laxå.',
    about: 'Vi uppdaterar webbplatsen just nu. Menyn, öppettider och bokning kommer tillbaka så snart anslutningen är stabil.',
    phone: null,
    email: 'hej@fluffys.se',
    addressLine1: null,
    addressLine2: null,
    postalCode: null,
    city: 'Laxå',
    country: 'SE',
    reservationEmail: 'bokning@fluffys.se',
    seoTitle: "Fluffy's",
    seoDescription: 'Subs, pizza, panini, wraps och takeaway i Laxå.',
  },
  categories: [],
  openingHours: [],
  events: [],
};

export const DAY_LABELS: Record<number, string> = {
  1: 'Måndag',
  2: 'Tisdag',
  3: 'Onsdag',
  4: 'Torsdag',
  5: 'Fredag',
  6: 'Lördag',
  7: 'Söndag',
};

export async function getSiteData(): Promise<{ site: PublicRestaurantSite; isFallback: boolean }> {
  const headerStore = await headers();
  try {
    return {
      site: await getPublicRestaurantSite(headerStore.get('host')),
      isFallback: false,
    };
  } catch {
    return {
      site: FALLBACK_SITE,
      isFallback: true,
    };
  }
}

export async function siteMetadata(titleSuffix?: string): Promise<Metadata> {
  const { site } = await getSiteData();
  const title = site.settings.seoTitle || site.settings.siteName || site.organizationName;
  return {
    title: titleSuffix ? `${titleSuffix} | ${title}` : title,
    description: site.settings.seoDescription ?? site.settings.heroSubtitle ?? undefined,
    alternates: {
      canonical: titleSuffix ? `https://fluffys.se/${titleSuffix.toLowerCase().replace(/\s+/g, '-')}` : 'https://fluffys.se',
    },
  };
}

export function priceLabel(priceCents: number | null, currency: string, tags: string[] = []) {
  if (priceCents != null) {
    return new Intl.NumberFormat('sv-SE', { style: 'currency', currency, maximumFractionDigits: 0 }).format(priceCents / 100);
  }
  return tags.length > 0 ? tags.join(' / ') : '';
}

export function addressLine(site: PublicRestaurantSite) {
  return [
    site.settings.addressLine1,
    site.settings.addressLine2,
    [site.settings.postalCode, site.settings.city].filter(Boolean).join(' '),
  ].filter(Boolean).join(', ');
}
