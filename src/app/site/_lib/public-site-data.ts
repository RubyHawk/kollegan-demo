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
  categories: [
    {
      id: 'demo-cat-pizza',
      name: 'Pizza',
      description: 'Klassiska pizzor med krispig botten och generösa toppings.',
      sortOrder: 0,
      isActive: true,
      items: [
        {
          id: 'demo-item-gluten',
          categoryId: 'demo-cat-pizza',
          name: 'Glutenfri pizza',
          description: 'Samma goda pizzor, nu även på glutenfri botten.',
          priceCents: 18900,
          currency: 'SEK',
          imageUrl: null,
          allergens: [],
          tags: [],
          ingredients: [],
          isAvailable: true,
          sortOrder: 0,
        },
      ],
    },
    {
      id: 'demo-cat-subs',
      name: 'Subs',
      description: 'Färska subs med saftiga fyllningar och nybakat bröd.',
      sortOrder: 1,
      isActive: true,
      items: [
        {
          id: 'demo-item-sub',
          categoryId: 'demo-cat-subs',
          name: 'Italian Duo',
          description: 'Peperoni, salami, ost, sallad',
          priceCents: null,
          currency: 'SEK',
          imageUrl: '/fluffys/menu/subs-classic-board.jpg',
          allergens: [],
          tags: ['S 74', 'M 109'],
          ingredients: [],
          isAvailable: true,
          sortOrder: 0,
        },
      ],
    },
    {
      id: 'demo-cat-kebab',
      name: 'Kebab',
      description: 'Kebab, gyros eller kyckling – du väljer själv.',
      sortOrder: 2,
      isActive: true,
      items: [
        {
          id: 'demo-item-taco',
          categoryId: 'demo-cat-kebab',
          name: '19. Tacokebab',
          description: 'Välj mellan kebab / gyros / kyckling',
          priceCents: null,
          currency: 'SEK',
          imageUrl: '/fluffys/menu/pizza-kebab-board.jpg',
          allergens: [],
          tags: ['S 89', 'M 149', 'L 239'],
          ingredients: [],
          isAvailable: true,
          sortOrder: 0,
        },
        {
          id: 'demo-item-mix',
          categoryId: 'demo-cat-kebab',
          name: "21. Pick'n mix kebaben",
          description: 'Bygg din favorit med kebab eller kyckling',
          priceCents: null,
          currency: 'SEK',
          imageUrl: '/fluffys/menu/panini-salad-board.jpg',
          allergens: [],
          tags: ['S 89', 'M 149', 'L 239'],
          ingredients: [],
          isAvailable: true,
          sortOrder: 1,
        },
      ],
    },
    {
      id: 'demo-cat-panini',
      name: 'Panini',
      description: 'Grillade paninis med ost, krispigt och gott.',
      sortOrder: 3,
      isActive: true,
      items: [
        {
          id: 'demo-item-panini',
          categoryId: 'demo-cat-panini',
          name: 'Panini Caprese',
          description: 'Mozzarella, tomat och pesto.',
          priceCents: null,
          currency: 'SEK',
          imageUrl: '/fluffys/menu/panini-salad-board.jpg',
          allergens: [],
          tags: ['M 95'],
          ingredients: [],
          isAvailable: true,
          sortOrder: 0,
        },
      ],
    },
    {
      id: 'demo-cat-tillbehor',
      name: 'Tillbehör',
      description: 'Sidor, såser, dryck och extra tillbehör till maten.',
      sortOrder: 4,
      isActive: true,
      items: [
        {
          id: 'demo-item-fries',
          categoryId: 'demo-cat-tillbehor',
          name: 'Pommes',
          description: 'Krispiga pommes med valfri sås.',
          priceCents: null,
          currency: 'SEK',
          imageUrl: null,
          allergens: [],
          tags: ['Liten 39', 'Stor 49'],
          ingredients: [],
          isAvailable: true,
          sortOrder: 0,
        },
      ],
    },
  ],
  openingHours: [
    { id: 'oh-1', dayOfWeek: 1, opensAt: '10:00', closesAt: '22:00', isClosed: false, label: null },
    { id: 'oh-2', dayOfWeek: 2, opensAt: '10:00', closesAt: '22:00', isClosed: false, label: null },
    { id: 'oh-3', dayOfWeek: 3, opensAt: '10:00', closesAt: '22:00', isClosed: false, label: null },
    { id: 'oh-4', dayOfWeek: 4, opensAt: '10:00', closesAt: '22:00', isClosed: false, label: null },
    { id: 'oh-5', dayOfWeek: 5, opensAt: '10:00', closesAt: '22:00', isClosed: false, label: null },
    { id: 'oh-6', dayOfWeek: 6, opensAt: '10:00', closesAt: '22:00', isClosed: false, label: null },
    { id: 'oh-7', dayOfWeek: 7, opensAt: '10:00', closesAt: '22:00', isClosed: false, label: null },
  ],
  events: [],
};

const FLUFFYS_MARK_PATH = '/fluffys/favicon.svg';

function iconSet(path: string): Metadata['icons'] {
  return {
    icon: path,
    shortcut: path,
    apple: path,
  };
}

function publicSiteHosts(value = process.env.PUBLIC_SITE_HOSTS ?? 'fluffys.se') {
  return value
    .split(',')
    .map((host) => host.trim().split(':')[0]?.toLowerCase())
    .filter(Boolean);
}

function normalizeHost(host: string | null) {
  return (host ?? '').split(':')[0]?.toLowerCase() ?? '';
}

export function isPrettyPublicSiteHost(host: string | null, hosts?: string) {
  return publicSiteHosts(hosts).includes(normalizeHost(host));
}

export async function getPublicSiteRoutePrefix() {
  const headerStore = await headers();
  return isPrettyPublicSiteHost(headerStore.get('host')) ? '' : '/site';
}

export function publicSiteHref(routePrefix: string, path: '/' | `/${string}`) {
  if (path === '/') return routePrefix || '/';
  return `${routePrefix}${path}`;
}

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
    icons: iconSet(FLUFFYS_MARK_PATH),
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
