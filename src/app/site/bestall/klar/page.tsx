import Link from 'next/link';
import { CheckCircle2Icon } from 'lucide-react';
import { SiteShell } from '../../_components/site-shell';
import { getPublicSiteRoutePrefix, getSiteData, publicSiteHref, siteMetadata } from '../../_lib/public-site-data';

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  return siteMetadata('Tack');
}

// Return target for the hosted card payment (Stripe success_url). Payment is confirmed server-side by
// the webhook; this page just acknowledges the completed order to the customer.
export default async function OrderConfirmedPage({ searchParams }: { searchParams: Promise<{ order?: string }> }) {
  const { site, isFallback } = await getSiteData();
  const routePrefix = await getPublicSiteRoutePrefix();
  const { order } = await searchParams;

  return (
    <SiteShell site={site} isFallback={isFallback} routePrefix={routePrefix}>
      <section className="fluffy-section fluffy-section--white">
        <div className="fluffy-shell">
          <div className="fluffy-card fluffy-cart-confirm fluffy-rise" role="status">
            <span className="fluffy-cart-confirm__icon" aria-hidden="true"><CheckCircle2Icon /></span>
            <h2>Tack! Din betalning är klar.</h2>
            {order ? <p className="fluffy-cart-confirm__number">Ordernr #{order}</p> : null}
            <p>
              Vi har tagit emot din beställning och börjar förbereda den.
              {site.settings.phone ? ` Frågor? Ring oss på ${site.settings.phone}.` : ''}
            </p>
            <Link href={publicSiteHref(routePrefix, '/meny')} className="fluffy-button fluffy-button--primary">Beställ mer</Link>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
