import Link from 'next/link';
import { MenuList } from './_components/menu-list';
import { OpeningHours } from './_components/opening-hours';
import { SiteShell } from './_components/site-shell';
import { getSiteData, siteMetadata } from './_lib/public-site-data';

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  return siteMetadata();
}

export default async function PublicHomePage() {
  const { site, isFallback } = await getSiteData();
  const menuPreview = site.categories.slice(0, 4);

  return (
    <SiteShell site={site} isFallback={isFallback}>
      <section className="fluffy-hero">
        <div className="fluffy-shell fluffy-hero__inner">
          <div className="fluffy-hero__copy fluffy-rise">
            <p className="fluffy-eyebrow">Laxå · subs · pizza · takeaway</p>
            <h1 className="fluffy-title">{site.settings.heroTitle}</h1>
            {site.settings.heroSubtitle ? <p className="fluffy-lede">{site.settings.heroSubtitle}</p> : null}
            <div className="fluffy-actions">
              <Link href="/meny" className="fluffy-button">
                Se menyn
              </Link>
              <Link href="/boka" className="fluffy-button fluffy-button--ghost">
                Boka bord
              </Link>
            </div>
            <div className="fluffy-quick-facts" aria-label="Snabbinfo">
              <span>Nybakat och snabbt</span>
              <span>Lunch och kväll</span>
              <span>Takeaway redo</span>
            </div>
          </div>

          <div className="fluffy-hero__media fluffy-rise fluffy-delay-1">
            <figure className="fluffy-board-card">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/fluffys/menu-board.svg"
                alt="Fluffy's meny som grafisk menyboard"
              />
            </figure>
          </div>
        </div>
      </section>

      <section className="fluffy-section">
        <div className="fluffy-shell fluffy-grid fluffy-grid--menu">
          <div className="fluffy-copy fluffy-rise">
            <p className="fluffy-eyebrow">Meny</p>
            <h2 className="fluffy-page-title">Subs, pizza och favoriter för hela bordet.</h2>
            {site.settings.about ? <p>{site.settings.about}</p> : null}
            <div className="fluffy-proof-strip" aria-label="Menyhöjdpunkter">
              <span>Subs</span>
              <span>Pizza</span>
              <span>Panini</span>
              <span>Wraps</span>
            </div>
            <p>
              <Link href="/meny" className="fluffy-link">
                Visa hela menyn
              </Link>
            </p>
          </div>
          <MenuList categories={menuPreview.length > 0 ? menuPreview : site.categories} compact />
        </div>
      </section>

      <section className="fluffy-section fluffy-section--white">
        <div className="fluffy-shell fluffy-grid fluffy-grid--contact">
          <div className="fluffy-copy fluffy-rise">
            <p className="fluffy-eyebrow">Öppet</p>
            <h2 className="fluffy-page-title">Kom förbi eller beställ takeaway.</h2>
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
