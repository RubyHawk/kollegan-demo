import { ReservationForm } from '../_components/reservation-form';
import { SiteShell } from '../_components/site-shell';
import { getPublicSiteRoutePrefix, getSiteData, siteMetadata } from '../_lib/public-site-data';

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  return siteMetadata('Boka');
}

export default async function PublicBookingPage() {
  const { site, isFallback } = await getSiteData();
  const routePrefix = await getPublicSiteRoutePrefix();

  return (
    <SiteShell site={site} isFallback={isFallback} routePrefix={routePrefix}>
      <section className="fluffy-page-hero">
        <div className="fluffy-shell fluffy-grid fluffy-grid--contact">
          <div className="fluffy-copy fluffy-rise">
            <p className="fluffy-eyebrow">Boka</p>
            <h1 className="fluffy-page-title">Skicka en bokningsförfrågan.</h1>
            <p>
              Fyll i datum, tid och antal gäster. Restaurangen bekräftar bokningen när teamet har kontrollerat läget.
            </p>
            {site.settings.reservationEmail ? (
              <p className="fluffy-muted">Bokningsmail: {site.settings.reservationEmail}</p>
            ) : null}
          </div>
          <div className="fluffy-rise fluffy-delay-1">
            <ReservationForm />
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
