import Link from 'next/link';
import { OpeningHours } from '../_components/opening-hours';
import { SiteShell } from '../_components/site-shell';
import { addressLine, getPublicSiteRoutePrefix, getSiteData, publicSiteHref, siteMetadata } from '../_lib/public-site-data';

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  return siteMetadata('Kontakt');
}

export default async function PublicContactPage() {
  const { site, isFallback } = await getSiteData();
  const routePrefix = await getPublicSiteRoutePrefix();
  const address = addressLine(site);

  return (
    <SiteShell site={site} isFallback={isFallback} routePrefix={routePrefix}>
      <section className="fluffy-page-hero">
        <div className="fluffy-shell fluffy-grid fluffy-grid--contact">
          <div className="fluffy-copy fluffy-rise">
            <p className="fluffy-eyebrow">Kontakt</p>
            <h1 className="fluffy-page-title">Öppettider, takeaway och bord.</h1>
            <p>Hör av dig om du vill boka, fråga om menyn eller bara dubbelkolla när köket är öppet.</p>
            <div className="fluffy-actions">
              <Link href={publicSiteHref(routePrefix, '/boka')} className="fluffy-button fluffy-button--dark">
                Boka bord
              </Link>
              <Link href={publicSiteHref(routePrefix, '/meny')} className="fluffy-button">
                Se menyn
              </Link>
            </div>
          </div>

          <div className="fluffy-menu-grid">
            <section id="parkering" className="fluffy-card fluffy-info-card fluffy-rise fluffy-delay-1">
              <p className="fluffy-eyebrow">Hitta oss</p>
              <h2>{site.settings.siteName}</h2>
              {address ? <p>{address}</p> : null}
              {site.settings.phone ? <p>{site.settings.phone}</p> : null}
              {site.settings.email ? <p>{site.settings.email}</p> : null}
            </section>
            <section className="fluffy-card fluffy-info-card fluffy-rise fluffy-delay-2">
              <p className="fluffy-eyebrow">Takeaway</p>
              <h2>Ring in eller skicka en fråga</h2>
              <p>Vi återkommer så snabbt vi kan när restaurangen har kontrollerat läget.</p>
            </section>
          </div>
        </div>
      </section>

      <section className="fluffy-section fluffy-section--white">
        <div className="fluffy-shell fluffy-grid fluffy-grid--contact">
          <div className="fluffy-copy">
            <p className="fluffy-eyebrow">Öppet</p>
            <h2 className="fluffy-page-title">Planera ditt besök.</h2>
          </div>
          <OpeningHours hours={site.openingHours} />
        </div>
      </section>
    </SiteShell>
  );
}
