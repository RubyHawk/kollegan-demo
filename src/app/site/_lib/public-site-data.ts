import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { getPublicRestaurantSite, type PublicRestaurantSite } from '@modules/supporting/restaurant-menu';

// Demo menu shown only when the live portal can't be reached. It carries prices, so it must
// never be served during a real production outage (it would render fabricated, purchasable-
// looking entries). See fallbackSite() — production falls back to the empty variant instead.
// The shape mirrors a representative live menu so local/preview rendering is realistic.
const FALLBACK_DEMO_SITE: PublicRestaurantSite = {
  organizationId: 'fallback-fluffys',
  organizationName: "Fluffy's",
  settings: {
    siteName: "Fluffy's",
    heroTitle: "Fluffy's",
    heroSubtitle: 'Subs, pizza, grillad panini, wraps och tillbehör.',
    about: 'Vi uppdaterar webbplatsen just nu. Menyn, öppettider och bokning kommer tillbaka så snart anslutningen är stabil.',
    phone: '+46 8 000 00 00',
    email: 'hej@fluffys.se',
    addressLine1: 'Exempelgatan 1',
    addressLine2: null,
    postalCode: '111 22',
    city: 'Stockholm',
    country: 'SE',
    reservationEmail: 'bokning@fluffys.se',
    seoTitle: "Fluffy's",
    seoDescription: 'Subs, pizza, grillad panini, wraps och tillbehör.',
  },
  categories: [
    {
      id: 'demo-cat-pizza',
      name: 'Pizza',
      description: 'Pizzor från menybilderna, inklusive S/M/L-priser och glutenfritt alternativ.',
      sortOrder: 0,
      isActive: true,
      items: [
        { id: 'p1', categoryId: 'demo-cat-pizza', name: 'Det Enkla', description: 'Klassisk ostpizza.', priceCents: null, currency: 'SEK', imageUrl: null, allergens: ['gluten', 'mjölk'], tags: ['S 69', 'M 119', 'L 199'], ingredients: [], isAvailable: true, sortOrder: 0 },
        { id: 'p2', categoryId: 'demo-cat-pizza', name: 'Svampgrisen', description: 'Skinka, champinjoner.', priceCents: null, currency: 'SEK', imageUrl: null, allergens: ['gluten', 'mjölk'], tags: ['S 79', 'M 139', 'L 229'], ingredients: [], isAvailable: true, sortOrder: 1 },
        { id: 'p3', categoryId: 'demo-cat-pizza', name: 'Söt o Saltig', description: 'Skinka, ananas.', priceCents: null, currency: 'SEK', imageUrl: null, allergens: ['gluten', 'mjölk'], tags: ['S 79', 'M 139', 'L 229'], ingredients: [], isAvailable: true, sortOrder: 2 },
        { id: 'p4', categoryId: 'demo-cat-pizza', name: 'Tuna', description: 'Tonfisk, lök.', priceCents: null, currency: 'SEK', imageUrl: null, allergens: ['gluten', 'mjölk', 'fisk'], tags: ['S 79', 'M 139', 'L 229'], ingredients: [], isAvailable: true, sortOrder: 3 },
        { id: 'p5', categoryId: 'demo-cat-pizza', name: 'Pepp o Pap', description: 'Pepperoni, paprika.', priceCents: null, currency: 'SEK', imageUrl: null, allergens: ['gluten', 'mjölk'], tags: ['S 79', 'M 139', 'L 229'], ingredients: [], isAvailable: true, sortOrder: 4 },
        { id: 'p6', categoryId: 'demo-cat-pizza', name: 'Taco & Kaos', description: 'Tacosås, tacofärs, nachos, guacamole, jalapeños.', priceCents: null, currency: 'SEK', imageUrl: '/fluffys/menu/pizza-kebab-board.jpg', allergens: ['gluten', 'mjölk'], tags: ['S 89', 'M 149', 'L 239'], ingredients: [], isAvailable: true, sortOrder: 5 },
        { id: 'p7', categoryId: 'demo-cat-pizza', name: 'Köttsmockan', description: 'Ost, salami, pepperoni, chorizo.', priceCents: null, currency: 'SEK', imageUrl: null, allergens: ['gluten', 'mjölk'], tags: ['S 89', 'M 149', 'L 239'], ingredients: [], isAvailable: true, sortOrder: 6 },
        { id: 'p8', categoryId: 'demo-cat-pizza', name: 'Kyckling & Pesto', description: 'Kyckling, pesto, tomater, jalapeños.', priceCents: null, currency: 'SEK', imageUrl: null, allergens: ['gluten', 'mjölk', 'nötter'], tags: ['S 89', 'M 149', 'L 239'], ingredients: [], isAvailable: true, sortOrder: 7 },
        { id: 'p9', categoryId: 'demo-cat-pizza', name: 'Biffen', description: 'Strimlad nötkött, paprika, champinjoner, lök.', priceCents: null, currency: 'SEK', imageUrl: null, allergens: ['gluten', 'mjölk'], tags: ['S 89', 'M 149', 'L 239'], ingredients: [], isAvailable: true, sortOrder: 8 },
        { id: 'p-gluten', categoryId: 'demo-cat-pizza', name: 'Glutenfri pizza', description: 'Samma goda pizzor, nu även på glutenfri botten.', priceCents: 18900, currency: 'SEK', imageUrl: null, allergens: ['mjölk'], tags: [], ingredients: [], isAvailable: true, sortOrder: 9 },
      ],
    },
    {
      id: 'demo-cat-subs',
      name: 'Subs',
      description: 'Kalla och varma subs med liten/stor prisvariant.',
      sortOrder: 1,
      isActive: true,
      items: [
        { id: 's1', categoryId: 'demo-cat-subs', name: 'Ham & Cheese', description: 'Skinka, ost.', priceCents: null, currency: 'SEK', imageUrl: null, allergens: ['gluten', 'mjölk'], tags: ['Liten 73', 'Stor 108'], ingredients: [], isAvailable: true, sortOrder: 0 },
        { id: 's2', categoryId: 'demo-cat-subs', name: 'Turkey & Cheese', description: 'Kalkon, ost.', priceCents: null, currency: 'SEK', imageUrl: null, allergens: ['gluten', 'mjölk'], tags: ['Liten 73', 'Stor 108'], ingredients: [], isAvailable: true, sortOrder: 1 },
        { id: 's3', categoryId: 'demo-cat-subs', name: 'Roast Beef', description: 'Rostbiff.', priceCents: null, currency: 'SEK', imageUrl: null, allergens: ['gluten'], tags: ['Liten 74', 'Stor 108'], ingredients: [], isAvailable: true, sortOrder: 2 },
        { id: 's4', categoryId: 'demo-cat-subs', name: 'Italian Duo', description: 'Peperoni, salami.', priceCents: null, currency: 'SEK', imageUrl: '/fluffys/menu/subs-classic-board.jpg', allergens: ['gluten'], tags: ['Liten 74', 'Stor 109'], ingredients: [], isAvailable: true, sortOrder: 3 },
        { id: 's5', categoryId: 'demo-cat-subs', name: 'Triple Bite', description: 'Skinka, peperoni, salami.', priceCents: null, currency: 'SEK', imageUrl: null, allergens: ['gluten'], tags: ['Liten 75', 'Stor 110'], ingredients: [], isAvailable: true, sortOrder: 4 },
        { id: 's6', categoryId: 'demo-cat-subs', name: 'Pure Melt', description: 'Skinka, kalkon, bacon.', priceCents: null, currency: 'SEK', imageUrl: null, allergens: ['gluten', 'mjölk'], tags: ['Liten 75', 'Stor 110'], ingredients: [], isAvailable: true, sortOrder: 5 },
        { id: 's7', categoryId: 'demo-cat-subs', name: 'Club Melt', description: 'Skinka, kalkon, rostbiff.', priceCents: null, currency: 'SEK', imageUrl: null, allergens: ['gluten', 'mjölk'], tags: ['Liten 75', 'Stor 110'], ingredients: [], isAvailable: true, sortOrder: 6 },
        { id: 's8', categoryId: 'demo-cat-subs', name: 'Creamy Tuna', description: 'Krämig tonfiskröra.', priceCents: null, currency: 'SEK', imageUrl: null, allergens: ['gluten', 'fisk', 'ägg'], tags: ['Liten 75', 'Stor 110'], ingredients: [], isAvailable: true, sortOrder: 7 },
        { id: 's9', categoryId: 'demo-cat-subs', name: 'Skagenröra', description: 'Skagenröra med räkor.', priceCents: null, currency: 'SEK', imageUrl: null, allergens: ['gluten', 'skaldjur', 'ägg'], tags: ['Liten 75', 'Stor 110'], ingredients: [], isAvailable: false, sortOrder: 8 },
      ],
    },
    {
      id: 'demo-cat-panini',
      name: 'Panini',
      description: 'Grillade panini med liten/stor prisvariant.',
      sortOrder: 2,
      isActive: true,
      items: [
        { id: 'pa1', categoryId: 'demo-cat-panini', name: 'Panini Caprese', description: 'Mozzarella, tomat och pesto.', priceCents: null, currency: 'SEK', imageUrl: '/fluffys/menu/panini-salad-board.jpg', allergens: ['gluten', 'mjölk', 'nötter'], tags: ['Liten 89', 'Stor 109'], ingredients: [], isAvailable: true, sortOrder: 0 },
        { id: 'pa2', categoryId: 'demo-cat-panini', name: 'Panini Pollo', description: 'Kyckling, ost, pesto.', priceCents: null, currency: 'SEK', imageUrl: null, allergens: ['gluten', 'mjölk', 'nötter'], tags: ['Liten 89', 'Stor 109'], ingredients: [], isAvailable: true, sortOrder: 1 },
        { id: 'pa3', categoryId: 'demo-cat-panini', name: 'Panini Prosciutto', description: 'Lufttorkad skinka, mozzarella, ruccola.', priceCents: null, currency: 'SEK', imageUrl: null, allergens: ['gluten', 'mjölk'], tags: ['Liten 95', 'Stor 115'], ingredients: [], isAvailable: true, sortOrder: 2 },
      ],
    },
    {
      id: 'demo-cat-sallad',
      name: 'Sallad',
      description: 'Bygg din egen sallad eller wrap.',
      sortOrder: 3,
      isActive: true,
      items: [
        { id: 'sa1', categoryId: 'demo-cat-sallad', name: 'Bygg din egen sallad eller wrap', description: 'Välj bas, proteiner och såser från menyn.', priceCents: 10900, currency: 'SEK', imageUrl: null, allergens: [], tags: [], ingredients: [], isAvailable: true, sortOrder: 0 },
      ],
    },
    {
      id: 'demo-cat-tillbehor',
      name: 'Tillbehör',
      description: 'Pizzasallad, vitlöksbröd, kycklingklubbor, såser och extra tillbehör.',
      sortOrder: 4,
      isActive: true,
      items: [
        { id: 't1', categoryId: 'demo-cat-tillbehor', name: 'Pommes', description: 'Krispiga pommes med valfri sås.', priceCents: null, currency: 'SEK', imageUrl: null, allergens: [], tags: ['Liten 39', 'Stor 49'], ingredients: [], isAvailable: true, sortOrder: 0 },
        { id: 't2', categoryId: 'demo-cat-tillbehor', name: 'Vitlöksbröd', description: 'Nybakat med vitlökssmör.', priceCents: 3900, currency: 'SEK', imageUrl: null, allergens: ['gluten', 'mjölk'], tags: [], ingredients: [], isAvailable: true, sortOrder: 1 },
        { id: 't3', categoryId: 'demo-cat-tillbehor', name: 'Kycklingklubbor', description: '6 st med valfri dipp.', priceCents: 6900, currency: 'SEK', imageUrl: null, allergens: [], tags: [], ingredients: [], isAvailable: true, sortOrder: 2 },
        { id: 't4', categoryId: 'demo-cat-tillbehor', name: 'Extra sås', description: 'Vitlök, bea, kebab eller sweet chili.', priceCents: 1500, currency: 'SEK', imageUrl: null, allergens: ['ägg', 'mjölk'], tags: [], ingredients: [], isAvailable: true, sortOrder: 3 },
      ],
    },
    {
      id: 'demo-cat-lask',
      name: 'Läsk',
      description: 'Läsk, chips, cookies och söt dessert.',
      sortOrder: 5,
      isActive: true,
      items: [
        { id: 'l1', categoryId: 'demo-cat-lask', name: 'Läsk 33 cl', description: 'Coca-Cola, Fanta, Sprite m.fl.', priceCents: 2000, currency: 'SEK', imageUrl: null, allergens: [], tags: [], ingredients: [], isAvailable: true, sortOrder: 0 },
        { id: 'l2', categoryId: 'demo-cat-lask', name: 'Läsk 50 cl', description: 'Coca-Cola, Fanta, Sprite m.fl.', priceCents: 2500, currency: 'SEK', imageUrl: null, allergens: [], tags: [], ingredients: [], isAvailable: true, sortOrder: 1 },
        { id: 'l3', categoryId: 'demo-cat-lask', name: 'Chips', description: 'Stor påse.', priceCents: 2500, currency: 'SEK', imageUrl: null, allergens: [], tags: [], ingredients: [], isAvailable: true, sortOrder: 2 },
        { id: 'l4', categoryId: 'demo-cat-lask', name: 'Cookie', description: 'Nybakad chocolate chip cookie.', priceCents: 2500, currency: 'SEK', imageUrl: null, allergens: ['gluten', 'mjölk', 'ägg'], tags: [], ingredients: [], isAvailable: true, sortOrder: 3 },
      ],
    },
  ],
  openingHours: [
    { id: 'oh-1', dayOfWeek: 1, opensAt: null, closesAt: null, isClosed: true, label: 'Closed' },
    { id: 'oh-2', dayOfWeek: 2, opensAt: '11:00', closesAt: '22:00', isClosed: false, label: null },
    { id: 'oh-3', dayOfWeek: 3, opensAt: '11:00', closesAt: '22:00', isClosed: false, label: null },
    { id: 'oh-4', dayOfWeek: 4, opensAt: '11:00', closesAt: '22:00', isClosed: false, label: null },
    { id: 'oh-5', dayOfWeek: 5, opensAt: '11:00', closesAt: '23:00', isClosed: false, label: null },
    { id: 'oh-6', dayOfWeek: 6, opensAt: '12:00', closesAt: '23:00', isClosed: false, label: null },
    { id: 'oh-7', dayOfWeek: 7, opensAt: '12:00', closesAt: '21:00', isClosed: false, label: null },
  ],
  events: [],
};

// Production-safe outage fallback: brand identity only — no menu, prices, hours, or the demo
// contact details (a real outage must not surface a fabricated phone/address/maps link).
const FALLBACK_EMPTY_SITE: PublicRestaurantSite = {
  ...FALLBACK_DEMO_SITE,
  settings: {
    ...FALLBACK_DEMO_SITE.settings,
    phone: null,
    email: null,
    addressLine1: null,
    addressLine2: null,
    postalCode: null,
    city: null,
    reservationEmail: null,
  },
  categories: [],
  openingHours: [],
};

// The demo menu is only acceptable outside production, or when a demo deployment opts in via
// PUBLIC_SITE_DEMO=true. Anywhere else (a real production outage) we serve the empty site so no
// fabricated prices are shown.
function fallbackSite(): PublicRestaurantSite {
  const showDemo = process.env.NODE_ENV !== 'production' || process.env.PUBLIC_SITE_DEMO === 'true';
  return showDemo ? FALLBACK_DEMO_SITE : FALLBACK_EMPTY_SITE;
}

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

// Re-exported from opening-status (client-safe) so both server and client code share one source.
export { DAY_LABELS } from './opening-status';

export async function getSiteData(): Promise<{ site: PublicRestaurantSite; isFallback: boolean }> {
  const headerStore = await headers();
  try {
    return {
      site: await getPublicRestaurantSite(headerStore.get('host')),
      isFallback: false,
    };
  } catch {
    return {
      site: fallbackSite(),
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
