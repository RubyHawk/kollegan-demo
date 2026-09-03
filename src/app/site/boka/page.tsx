import Link from 'next/link';
import { getPublicSiteCapabilities } from '@modules/supporting/restaurant-menu';
import { ReservationForm } from '../_components/reservation-form';
import { SiteShell } from '../_components/site-shell';
import { getPublicSiteRoutePrefix, getSiteData, publicSiteHref, siteMetadata } from '../_lib/public-site-data';

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  return siteMetadata('Boka');
}

export default async function PublicBookingPage() {
  const { site, isFallback } = await getSiteData();
  const routePrefix = await getPublicSiteRoutePrefix();
  const { bookingEnabled } = getPublicSiteCapabilities();

  return (
    <SiteShell site={site} isFallback={isFallback} routePrefix={routePrefix}>
      <section className="fluffy-page-hero">
        <div className="fluffy-shell fluffy-grid fluffy-grid--contact">
          <div className="fluffy-copy fluffy-rise">
            <p className="fluffy-eyebrow">Boka</p>
            <h1 className="fluffy-page-title">Skicka en bokningsförfrågan.</h1>
            <p>
              {bookingEnabled
                ? 'Fyll i datum, tid och antal gäster. Restaurangen bekräftar bokningen när teamet har kontrollerat läget.'
                : 'Bokningsformuläret öppnar snart. Sidan är tillbaka så du kan läsa informationen, men bord kan inte bokas här ännu.'}
            </p>
            {site.settings.reservationEmail ? (
              <p className="fluffy-muted">Bokningsmail: {site.settings.reservationEmail}</p>
            ) : null}
          </div>
          <div className="fluffy-rise fluffy-delay-1">
            {bookingEnabled ? (
              <ReservationForm />
            ) : (
              <article className="fluffy-card fluffy-info-card">
                <p className="fluffy-eyebrow">Snart öppet</p>
                <h2>Bokning är pausad</h2>
                <p>Vi har stängt av bokningsknappen tills restaurangen är redo att ta emot förfrågningar här.</p>
                <Link href={publicSiteHref(routePrefix, '/meny')} className="fluffy-button fluffy-button--primary">
                  Se menyn
                </Link>
              </article>
            )}
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
