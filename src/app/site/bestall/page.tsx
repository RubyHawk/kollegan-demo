import Link from 'next/link';
import { ArrowRightIcon, PhoneIcon } from 'lucide-react';
import { getPublicSiteCapabilities } from '@modules/supporting/restaurant-menu';
import { availableOnlineProviders } from '@modules/supporting/restaurant-orders';
import { SiteShell } from '../_components/site-shell';
import { Checkout } from '../_components/cart/checkout';
import { getPublicSiteRoutePrefix, getSiteData, publicSiteHref, siteMetadata } from '../_lib/public-site-data';

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  return siteMetadata('Beställ');
}

function telHref(phone: string | null) {
  const normalized = phone?.replace(/[^\d+]/g, '');
  return normalized ? `tel:${normalized}` : null;
}

export default async function PublicOrderPage() {
  const { site, isFallback } = await getSiteData();
  const routePrefix = await getPublicSiteRoutePrefix();
  const callHref = telHref(site.settings.phone);
  const { bookingEnabled, orderingEnabled } = getPublicSiteCapabilities();

  // Online ordering needs the live, uuid-keyed menu; the demo/outage fallback can't be ordered, so we
  // fall back to call-to-order there. The cart itself is built up on the menu pages and reviewed here.
  const canOrderOnline = orderingEnabled && !isFallback;

  return (
    <SiteShell site={site} isFallback={isFallback} routePrefix={routePrefix}>
      <section className="fluffy-page-hero">
        <div className="fluffy-shell fluffy-copy fluffy-rise">
          <p className="fluffy-eyebrow">Beställ</p>
          <h1 className="fluffy-page-title">Avhämtning &amp; leverans</h1>
          <p>
            {canOrderOnline
              ? 'Granska din beställning, välj avhämtning eller hemleverans och skicka — du betalar när maten kommer.'
              : 'Onlinebeställning öppnar snart. Sidan är tillbaka så du kan läsa menyn, men beställningar kan inte skickas här ännu.'}{' '}
            {bookingEnabled ? (
              <>
                Vill du boka bord istället? Det gör du under{' '}
                <Link className="fluffy-link" href={publicSiteHref(routePrefix, '/boka')}>Boka bord</Link>.
              </>
            ) : (
              'Bokning är också pausad tills restaurangen är redo.'
            )}
          </p>
        </div>
      </section>

      <section className="fluffy-section fluffy-section--white">
        <div className="fluffy-shell">
          {canOrderOnline ? (
            <Checkout
              phone={site.settings.phone}
              menuHref={publicSiteHref(routePrefix, '/meny')}
              confirmHref={publicSiteHref(routePrefix, '/bestall/klar')}
              providers={availableOnlineProviders()}
            />
          ) : !orderingEnabled ? (
            <article className="fluffy-card fluffy-order-card fluffy-rise">
              <h2>Onlinebeställning öppnar snart</h2>
              <p>Vi har öppnat sidan igen, men beställningsknappen är avstängd tills restaurangen är redo.</p>
              <Link href={publicSiteHref(routePrefix, '/meny')} className="fluffy-button fluffy-button--primary">
                Se menyn
                <ArrowRightIcon aria-hidden="true" />
              </Link>
              {site.settings.phone ? <p className="fluffy-muted">Frågor? {site.settings.phone}</p> : null}
            </article>
          ) : (
            <article className="fluffy-card fluffy-order-card fluffy-rise">
              <h2>Kontakta oss</h2>
              <p>Just nu tar vi inte emot onlinebeställningar eftersom reservinformationen visas.</p>
              {callHref ? (
                <a href={callHref} className="fluffy-button fluffy-button--primary">
                  <PhoneIcon aria-hidden="true" />
                  Ring oss
                </a>
              ) : (
                <Link href={publicSiteHref(routePrefix, '/kontakt')} className="fluffy-button fluffy-button--primary">
                  Kontaktuppgifter
                  <ArrowRightIcon aria-hidden="true" />
                </Link>
              )}
              {site.settings.phone ? <p className="fluffy-muted">{site.settings.phone}</p> : null}
            </article>
          )}
        </div>
      </section>
    </SiteShell>
  );
}
