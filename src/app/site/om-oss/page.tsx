import Link from 'next/link';
import { SiteShell } from '../_components/site-shell';
import { getPublicSiteRoutePrefix, getSiteData, publicSiteHref, siteMetadata } from '../_lib/public-site-data';

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  return siteMetadata('Om oss');
}

export default async function PublicAboutPage() {
  const { site, isFallback } = await getSiteData();
  const routePrefix = await getPublicSiteRoutePrefix();

  return (
    <SiteShell site={site} isFallback={isFallback} routePrefix={routePrefix}>
      <section className="fluffy-page-hero">
        <div className="fluffy-shell fluffy-grid fluffy-grid--contact">
          <div className="fluffy-copy fluffy-rise">
            <p className="fluffy-eyebrow">Om oss</p>
            <h1 className="fluffy-page-title">{site.settings.heroTitle}</h1>
            <p>
              {site.settings.about ?? 'Fluffy’s serverar subs, pizza, panini, wraps och tillbehör med snabb service och tydlig meny.'}
            </p>
            <div className="fluffy-actions">
              <Link href={publicSiteHref(routePrefix, '/kontakt')} className="fluffy-button fluffy-button--dark">
                Hitta hit
              </Link>
              <Link href={publicSiteHref(routePrefix, '/meny')} className="fluffy-button">
                Se menyn
              </Link>
            </div>
          </div>
          <figure className="fluffy-board-card fluffy-page-media fluffy-rise fluffy-delay-1">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/fluffys/menu-board.svg" alt="Fluffy's menyboard" className="fluffy-board-media" />
          </figure>
        </div>
      </section>

      <section className="fluffy-section fluffy-section--white">
        <div className="fluffy-shell fluffy-info-grid">
          <article className="fluffy-card fluffy-info-card">
            <p className="fluffy-eyebrow">01</p>
            <h2>Snabbt på riktigt</h2>
            <p>Menyn är byggd för lunch, takeaway och kvällar när alla vill ha något olika.</p>
          </article>
          <article className="fluffy-card fluffy-info-card">
            <p className="fluffy-eyebrow">02</p>
            <h2>Tydlig meny</h2>
            <p>Subs, pizza, panini och wraps ligger som kodad webbmeny, inte som en svårläst PDF.</p>
          </article>
          <article className="fluffy-card fluffy-info-card">
            <p className="fluffy-eyebrow">03</p>
            <h2>Lätt att nå</h2>
            <p>Kontakt, öppettider och bokningsförfrågan finns nära till hands på mobil och desktop.</p>
          </article>
        </div>
      </section>

      {site.events.length > 0 ? (
        <section className="fluffy-section">
          <div className="fluffy-shell">
            <p className="fluffy-eyebrow">På gång</p>
            <div className="fluffy-event-grid">
              {site.events.map((event) => (
                <article key={event.id} className="fluffy-card fluffy-event-card">
                  <time dateTime={new Date(event.startsAt).toISOString()}>
                    {new Intl.DateTimeFormat('sv-SE', { dateStyle: 'medium' }).format(new Date(event.startsAt))}
                  </time>
                  <h2>{event.title}</h2>
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
