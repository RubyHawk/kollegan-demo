import Link from 'next/link';
import { Clock3Icon, MapPinIcon, ParkingCircleIcon, TimerResetIcon } from 'lucide-react';
import { MenuCategoryPreview } from './_components/menu-list';
import { OpeningHours } from './_components/opening-hours';
import { SiteShell } from './_components/site-shell';
import { addressLine, getPublicSiteRoutePrefix, getSiteData, publicSiteHref, siteMetadata } from './_lib/public-site-data';

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  return siteMetadata();
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

  return (
    <SiteShell site={site} isFallback={isFallback} routePrefix={routePrefix}>
      <section className="fluffy-landing">
        <div className="fluffy-shell fluffy-landing__grid">
          <div className="fluffy-landing__copy fluffy-rise">
            <p className="fluffy-eyebrow">Fluffy&apos;s Laxå</p>
            <h1 className="fluffy-title">Mat vid vägen</h1>
            <p className="fluffy-lede">
              Snabbt, gott och prisvärt för alla smaker och alla tillfällen. Bygg din favorit eller välj från våra klassiker.
            </p>

            <div className="fluffy-ticket-row" aria-label="Snabbinfo">
              <article className="fluffy-ticket">
                <h2>Snabbt stopp</h2>
                <p>Fyll på energi och fortsätt resan.</p>
                <ul>
                  <li>Välsmakande mat</li>
                  <li>Generösa portioner</li>
                  <li>Enkelt och snabbt</li>
                  <li>Gott pris</li>
                </ul>
              </article>
              <article className="fluffy-ticket fluffy-ticket--orange">
                <h2>Öppet</h2>
                <p>Alla dagar</p>
                <strong>{hoursLabel}</strong>
              </article>
              <article className="fluffy-ticket">
                <h2>Parkering</h2>
                <p>Gratis parkering för bil, MC och lastbil.</p>
                <Link href={publicSiteHref(routePrefix, '/kontakt#parkering')}>Hitta hit</Link>
              </article>
            </div>

            <Link href={publicSiteHref(routePrefix, '/meny')} className="fluffy-button fluffy-button--primary">
              Se menyn
            </Link>
          </div>

          <div className="fluffy-collage fluffy-rise fluffy-delay-1" aria-label="Fluffy's menybilder">
            <figure className="fluffy-collage-card fluffy-collage-card--pizza">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/fluffys/menu/pizza-kebab-board.jpg" alt="Menybild med pizzor och kebabpizza" />
            </figure>
            <figure className="fluffy-collage-card fluffy-collage-card--subs">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/fluffys/menu/subs-classic-board.jpg" alt="Menybild med subs" />
            </figure>
            <figure className="fluffy-collage-strip">
              <span>Subs</span>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/fluffys/favicon.svg" alt="" />
              <span>Pizza</span>
            </figure>
            <figure className="fluffy-collage-card fluffy-collage-card--gluten">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/fluffys/menu/sides-sauces-board.jpg" alt="Menybild med glutenfritt och tillbehör" />
            </figure>
            <figure className="fluffy-collage-card fluffy-collage-card--panini">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/fluffys/menu/panini-salad-board.jpg" alt="Menybild med panini och sallad" />
            </figure>
          </div>
        </div>
      </section>

      <section className="fluffy-info-strip" aria-label="Praktisk information" id="oppettider">
        <div className="fluffy-shell fluffy-info-strip__inner">
          <article>
            <Clock3Icon aria-hidden="true" />
            <div>
              <h2>Öppet idag</h2>
              <p>{hoursLabel}</p>
            </div>
          </article>
          <article id="parkering">
            <ParkingCircleIcon aria-hidden="true" />
            <div>
              <h2>Parkering</h2>
              <p>Gratis parkering för bil, MC och lastbil</p>
            </div>
          </article>
          <article>
            <MapPinIcon aria-hidden="true" />
            <div>
              <h2>Hitta hit</h2>
              <p>{address}</p>
            </div>
          </article>
          <article>
            <TimerResetIcon aria-hidden="true" />
            <div>
              <h2>Snabbt stopp</h2>
              <p>Beställ, ät och fortsätt resan.</p>
            </div>
          </article>
        </div>
      </section>

      <div className="fluffy-shell">
        <MenuCategoryPreview categories={site.categories} routePrefix={routePrefix} />
      </div>

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
                    {new Intl.DateTimeFormat('sv-SE', { dateStyle: 'medium' }).format(new Date(event.startsAt))}
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
