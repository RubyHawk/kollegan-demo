import Link from 'next/link';
import {
  ArrowRightIcon,
  CarFrontIcon,
  CheckIcon,
  Clock3Icon,
  MapPinIcon,
  ParkingCircleIcon,
  TimerResetIcon,
} from 'lucide-react';
import type { RestaurantMenuItemView } from '@modules/supporting/restaurant-menu';
import { MenuCategoryPreview } from './_components/menu-list';
import { OpeningHours } from './_components/opening-hours';
import { ScribbleStroke } from './_components/scribble-stroke';
import { SiteShell } from './_components/site-shell';
import { addressLine, getPublicSiteRoutePrefix, getSiteData, publicSiteHref, siteMetadata } from './_lib/public-site-data';
import { categoryImage, menuItemParts, priceParts } from './_lib/menu-visuals';

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  return siteMetadata();
}

const DOT_PALETTE = ['green', 'yellow', 'purple', 'orange', 'red', 'gray'] as const;

function CutoutIngredients({ item }: { item: RestaurantMenuItemView }) {
  if (!item.ingredients.length) return null;
  return (
    <ul className="fluffy-cutout__ingredients">
      {item.ingredients.slice(0, 5).map((ing, i) => (
        <li key={ing.name} data-dot={DOT_PALETTE[i % DOT_PALETTE.length]}>
          {ing.name}
        </li>
      ))}
    </ul>
  );
}

function CutoutPrices({ item }: { item: RestaurantMenuItemView }) {
  const prices = priceParts(item);
  if (!prices.length) return null;
  return (
    <div className="fluffy-cutout__prices">
      {prices.map((p) => (
        <span key={p.label}>
          <abbr>{p.label}</abbr>
          {p.value}
        </span>
      ))}
    </div>
  );
}

function GridCutout({ item, modifier, fallbackSrc }: { item: RestaurantMenuItemView; modifier: 'taco' | 'mix'; fallbackSrc: string }) {
  const { number, label } = menuItemParts(item.name);
  return (
    <figure className={`fluffy-cutout fluffy-cutout--${modifier}`}>
      <figcaption>
        {number ? <span>{number}</span> : null}
        <strong>{label}</strong>
        {item.description ? <small>{item.description}</small> : null}
        <CutoutIngredients item={item} />
        <CutoutPrices item={item} />
      </figcaption>
      <span className="fluffy-cutout__photo" aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={item.imageUrl ?? fallbackSrc} alt="" />
      </span>
    </figure>
  );
}

function SubCutout({ item }: { item: RestaurantMenuItemView }) {
  const { number, label } = menuItemParts(item.name);
  const prices = priceParts(item);
  return (
    <figure className="fluffy-cutout fluffy-cutout--sub">
      <figcaption>
        {number ? <span>{number}</span> : null}
        <strong>{label}</strong>
        {item.description ? <small>{item.description}</small> : null}
        {prices.length > 0 ? (
          <div className="fluffy-cutout__prices">
            {prices.map((p) => (
              <span key={p.label}>
                <abbr>{p.label}</abbr>
                {p.value}
              </span>
            ))}
          </div>
        ) : null}
      </figcaption>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={item.imageUrl ?? '/fluffys/menu/subs-classic-board.jpg'} alt="" />
    </figure>
  );
}

function todayHoursLabel(site: Awaited<ReturnType<typeof getSiteData>>['site']) {
  const today = new Intl.DateTimeFormat('sv-SE', { weekday: 'short', timeZone: 'Europe/Stockholm' }).format(new Date());
  const dayMap: Record<string, number> = {
    mån: 1,
    tis: 2,
    ons: 3,
    tors: 4,
    fre: 5,
    lör: 6,
    sön: 7,
  };
  const todayNumber = dayMap[today.replace('.', '')] ?? 1;
  const hour = site.openingHours.find((entry) => entry.dayOfWeek === todayNumber) ?? site.openingHours.find((entry) => !entry.isClosed);

  if (!hour) return '10:00 - 22:00';
  if (hour.isClosed) return hour.label ?? 'Stängt';
  return [hour.opensAt, hour.closesAt].filter(Boolean).join(' - ') || 'Öppet idag';
}

export default async function PublicHomePage() {
  const { site, isFallback } = await getSiteData();
  const routePrefix = await getPublicSiteRoutePrefix();
  const hoursLabel = todayHoursLabel(site);
  const address = addressLine(site) || 'Värgårdsvägen 6, 695 31 Laxå';

  const allItems = site.categories.flatMap((c) => c.items);

  // Build a map of item id → category so we can derive category-aware image fallbacks
  const itemCategoryMap = new Map(
    site.categories.flatMap((c) => c.items.map((item) => [item.id, c])),
  );
  const itemFallbackSrc = (item: RestaurantMenuItemView) => {
    const cat = itemCategoryMap.get(item.id);
    return cat ? categoryImage(cat) : '/fluffys/menu/pizza-kebab-board.jpg';
  };

  // Select collage cutout items: exclude gluten items; subItem prefers subs category
  const nonGlutenItems = allItems.filter((item) => !/gluten/i.test(item.name));
  const subCategoryItems = site.categories
    .filter((c) => /sub/i.test(c.name))
    .flatMap((c) => c.items);
  const mainCandidates = nonGlutenItems.filter((item) => !subCategoryItems.some((s) => s.id === item.id));
  const [tacoItem, mixItem] = mainCandidates;
  const subItem = subCategoryItems[0] ?? nonGlutenItems[2];

  const glutenItem = allItems.find((item) => /gluten/i.test(item.name));
  const glutenPrice = glutenItem ? priceParts(glutenItem)[0] : null;

  return (
    <SiteShell site={site} isFallback={isFallback} routePrefix={routePrefix}>
      <section className="fluffy-landing">
        <div className="fluffy-shell fluffy-landing__grid">
          <div className="fluffy-landing__copy fluffy-rise">
            <p className="fluffy-eyebrow">Fluffy&apos;s Laxå</p>
            <h1 className="fluffy-title">
              <span>Mat vid vägen</span>
              <ScribbleStroke className="fluffy-title__scribble" />
            </h1>
            <p className="fluffy-lede">
              Snabbt, gott och prisvärt för alla smaker och alla tillfällen. Bygg din favorit eller välj från våra klassiker.
            </p>

            <div className="fluffy-ticket-row" aria-label="Snabbinfo">
              <article className="fluffy-ticket fluffy-ticket--quick">
                <div className="fluffy-ticket__head">
                  <TimerResetIcon aria-hidden="true" />
                  <h2>Snabbt stopp</h2>
                </div>
                <p>Fyll på energi och fortsätt resan.</p>
                <ul>
                  {['Välsmakande mat', 'Generösa portioner', 'Enkelt & snabbt', 'Gott pris'].map((item) => (
                    <li key={item}>
                      <CheckIcon aria-hidden="true" />
                      {item}
                    </li>
                  ))}
                </ul>
              </article>
              <article className="fluffy-ticket fluffy-ticket--orange fluffy-ticket--hours">
                <h2>Öppet</h2>
                <p className="fluffy-ticket__stamp">Alla dagar</p>
                <strong>{hoursLabel}</strong>
              </article>
              <article className="fluffy-ticket fluffy-ticket--parking">
                <span className="fluffy-ticket__stamp">Gratis</span>
                <div className="fluffy-ticket__icons" aria-hidden="true">
                  <ParkingCircleIcon />
                  <CarFrontIcon />
                </div>
                <h2>Parkering</h2>
                <p>Gratis parkering för bil, MC och lastbil.</p>
                <Link href={publicSiteHref(routePrefix, '/kontakt#parkering')}>Hitta hit</Link>
              </article>
            </div>

            <Link href={publicSiteHref(routePrefix, '/meny')} className="fluffy-button fluffy-button--primary">
              Se menyn
              <ArrowRightIcon aria-hidden="true" />
            </Link>
          </div>

          <div className="fluffy-collage fluffy-rise fluffy-delay-1" aria-label="Fluffy's menybilder">
            {tacoItem ? <GridCutout item={tacoItem} modifier="taco" fallbackSrc={itemFallbackSrc(tacoItem)} /> : null}
            {mixItem ? <GridCutout item={mixItem} modifier="mix" fallbackSrc={itemFallbackSrc(mixItem)} /> : null}
            <div className="fluffy-collage-sign" aria-hidden="true">
              <span>Subs</span>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/fluffys/favicon.svg" alt="" />
              <span>Pizza</span>
            </div>
            <figure className="fluffy-gluten-ticket">
              <span aria-hidden="true">Gluten free</span>
              <figcaption>
                <strong>Glutenfritt</strong>
                <em>{glutenPrice ? `${glutenPrice.value}:-` : '189:-'}</em>
                <small>{glutenItem?.description ?? 'Samma goda pizzor, nu även på glutenfri botten.'}</small>
                <span className="fluffy-gluten-ticket__cta">Fråga personalen om dagens utbud</span>
              </figcaption>
            </figure>
            {subItem ? <SubCutout item={subItem} /> : null}
          </div>
        </div>
      </section>

      <section className="fluffy-info-strip" aria-label="Praktisk information" id="oppettider">
        <div className="fluffy-shell fluffy-info-strip__inner">
          <article>
            <span className="fluffy-info-strip__icon" aria-hidden="true"><Clock3Icon /></span>
            <div>
              <h2>Öppet idag</h2>
              <p>{hoursLabel}</p>
            </div>
          </article>
          <article id="parkering">
            <span className="fluffy-info-strip__icon" aria-hidden="true"><ParkingCircleIcon /></span>
            <div>
              <h2>Parkering</h2>
              <p>Gratis parkering för bil, MC och lastbil</p>
            </div>
          </article>
          <article>
            <span className="fluffy-info-strip__icon" aria-hidden="true"><MapPinIcon /></span>
            <div>
              <h2>Hitta hit</h2>
              <p>{address}</p>
            </div>
          </article>
          <article>
            <span className="fluffy-info-strip__icon" aria-hidden="true"><TimerResetIcon /></span>
            <div>
              <h2>Snabbt stopp</h2>
              <p>Beställ, ät och fortsätt resan.</p>
            </div>
          </article>
        </div>
      </section>

      {/* Sits between sections at z-index 5 — transparent teeth of the wave
          expose the cream page background, creating the painted-edge look */}
      <div className="fluffy-band-edge" aria-hidden="true">
        <svg viewBox="0 0 1440 52" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M0,52 L0,34 C55,20 95,42 155,30 C205,20 235,44 295,32 C340,22 372,12 420,30 C462,44 500,22 550,34 C592,44 625,18 675,28 C715,37 748,48 800,32 C842,18 878,36 930,26 C968,18 1000,40 1050,32 C1090,24 1125,12 1175,28 C1218,42 1252,22 1300,32 C1338,40 1375,20 1420,30 L1440,28 L1440,52 Z"
            fill="currentColor"
          />
        </svg>
      </div>

      <section className="fluffy-menu-band">
        <div className="fluffy-shell">
          <MenuCategoryPreview categories={site.categories} routePrefix={routePrefix} />
        </div>
      </section>

      <section className="fluffy-section fluffy-section--white">
        <div className="fluffy-shell fluffy-grid fluffy-grid--contact">
          <div className="fluffy-copy fluffy-rise">
            <p className="fluffy-eyebrow">Öppettider</p>
            <h2 className="fluffy-page-title">Kom förbi när du är på väg.</h2>
            <p>Öppettiderna hämtas från restaurangen och uppdateras när teamet ändrar dem i portalen.</p>
          </div>
          <OpeningHours hours={site.openingHours} />
        </div>
      </section>

      {site.events.length > 0 ? (
        <section className="fluffy-section">
          <div className="fluffy-shell">
            <p className="fluffy-eyebrow">På gång</p>
            <div className="fluffy-event-grid">
              {site.events.map((event) => (
                <article key={event.id} className="fluffy-card fluffy-event-card fluffy-rise">
                  <time dateTime={new Date(event.startsAt).toISOString()}>
                    {new Intl.DateTimeFormat('sv-SE', { dateStyle: 'medium', timeZone: 'Europe/Stockholm' }).format(new Date(event.startsAt))}
                  </time>
                  <h3>{event.title}</h3>
                  {event.description ? <p>{event.description}</p> : null}
                </article>
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </SiteShell>
  );
}
