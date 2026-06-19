import Link from 'next/link';
import { ArrowRightIcon, PhoneIcon, ShoppingBagIcon, TruckIcon } from 'lucide-react';
import { SiteShell } from '../_components/site-shell';
import { getPublicSiteRoutePrefix, getSiteData, publicSiteHref, siteMetadata } from '../_lib/public-site-data';

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  return siteMetadata('Beställ');
}

// External delivery partners. Add a { name, url } entry to switch a provider on; until a URL
// exists the delivery card falls back to call-to-order. Kept here until the portal exposes a
// configurable field for these links (see ordering roadmap).
const DELIVERY_PROVIDERS: Array<{ name: string; url: string }> = [
  // { name: 'Foodora', url: 'https://www.foodora.se/restaurant/...' },
  // { name: 'Wolt', url: 'https://wolt.com/sv/.../fluffys' },
  // { name: 'Uber Eats', url: 'https://www.ubereats.com/se/store/...' },
];

function telHref(phone: string | null) {
  const normalized = phone?.replace(/[^\d+]/g, '');
  return normalized ? `tel:${normalized}` : null;
}

export default async function PublicOrderPage() {
  const { site, isFallback } = await getSiteData();
  const routePrefix = await getPublicSiteRoutePrefix();
  const callHref = telHref(site.settings.phone);

  return (
    <SiteShell site={site} isFallback={isFallback} routePrefix={routePrefix}>
      <section className="fluffy-page-hero">
        <div className="fluffy-shell fluffy-copy fluffy-rise">
          <p className="fluffy-eyebrow">Beställ</p>
          <h1 className="fluffy-page-title">Avhämtning &amp; leverans</h1>
          <p>
            Ring in din beställning för avhämtning, eller få maten levererad hem. Vill du boka bord
            istället? Det gör du under{' '}
            <Link className="fluffy-link" href={publicSiteHref(routePrefix, '/boka')}>Boka bord</Link>.
          </p>
        </div>
      </section>

      <section className="fluffy-section fluffy-section--white">
        <div className="fluffy-shell fluffy-order-grid">
          <article className="fluffy-card fluffy-order-card fluffy-rise">
            <span className="fluffy-order-icon" aria-hidden="true"><ShoppingBagIcon /></span>
            <h2>Avhämtning</h2>
            <p>Ring och beställ — vi har maten klar för avhämtning när du kommer.</p>
            {callHref ? (
              <a href={callHref} className="fluffy-button fluffy-button--primary">
                <PhoneIcon aria-hidden="true" />
                Ring &amp; beställ
              </a>
            ) : (
              <Link href={publicSiteHref(routePrefix, '/kontakt')} className="fluffy-button fluffy-button--primary">
                Kontaktuppgifter
                <ArrowRightIcon aria-hidden="true" />
              </Link>
            )}
            {site.settings.phone ? <p className="fluffy-muted">{site.settings.phone}</p> : null}
          </article>

          <article className="fluffy-card fluffy-order-card fluffy-rise fluffy-delay-1">
            <span className="fluffy-order-icon" aria-hidden="true"><TruckIcon /></span>
            <h2>Leverans</h2>
            {DELIVERY_PROVIDERS.length > 0 ? (
              <>
                <p>Beställ hemleverans via våra partners.</p>
                <div className="fluffy-order-providers">
                  {DELIVERY_PROVIDERS.map((provider) => (
                    <a key={provider.name} href={provider.url} target="_blank" rel="noreferrer" className="fluffy-button">
                      {provider.name}
                      <ArrowRightIcon aria-hidden="true" />
                    </a>
                  ))}
                </div>
              </>
            ) : (
              <>
                <p>Hemleverans via Foodora, Wolt och Uber Eats läggs till inom kort. Vill du ha leverans nu — ring oss så löser vi det.</p>
                {callHref ? (
                  <a href={callHref} className="fluffy-button">
                    <PhoneIcon aria-hidden="true" />
                    Ring oss
                  </a>
                ) : null}
              </>
            )}
          </article>
        </div>
      </section>
    </SiteShell>
  );
}
