import Link from 'next/link';
import { ArrowRightIcon, PhoneIcon } from 'lucide-react';
import { SiteShell } from '../_components/site-shell';
import { OrderCart, type OrderMenuCategory } from '../_components/order-cart';
import { getPublicSiteRoutePrefix, getSiteData, publicSiteHref, siteMetadata } from '../_lib/public-site-data';
import { isOrderableMenuItem, parseMenuVariants } from '@shared/lib/menu/menu-variants';

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  return siteMetadata('Beställ');
}

function telHref(phone: string | null) {
  const normalized = phone?.replace(/[^\d+]/g, '');
  return normalized ? `tel:${normalized}` : null;
}

// Build the orderable menu from live data: only available items that resolve to at least one priced
// variant (parsed from the menu row's tags/priceCents). The browser never supplies prices — the
// order endpoint re-derives them from the same menu row.
function buildOrderMenu(categories: Awaited<ReturnType<typeof getSiteData>>['site']['categories']): OrderMenuCategory[] {
  return categories
    .map((category) => ({
      id: category.id,
      name: category.name,
      items: category.items
        .filter((item) => isOrderableMenuItem({ tags: item.tags, priceCents: item.priceCents, isAvailable: item.isAvailable }))
        .map((item) => ({
          id: item.id,
          name: item.name,
          description: item.description,
          currency: item.currency,
          variants: parseMenuVariants(item.tags, item.priceCents),
        })),
    }))
    .filter((category) => category.items.length > 0);
}

export default async function PublicOrderPage() {
  const { site, isFallback } = await getSiteData();
  const routePrefix = await getPublicSiteRoutePrefix();
  const callHref = telHref(site.settings.phone);

  // Online ordering needs real, uuid-keyed menu items; the demo/outage fallback can't be ordered, so
  // we fall back to call-to-order there.
  const orderMenu = isFallback ? [] : buildOrderMenu(site.categories);
  const canOrderOnline = orderMenu.length > 0;

  return (
    <SiteShell site={site} isFallback={isFallback} routePrefix={routePrefix}>
      <section className="fluffy-page-hero">
        <div className="fluffy-shell fluffy-copy fluffy-rise">
          <p className="fluffy-eyebrow">Beställ</p>
          <h1 className="fluffy-page-title">Avhämtning &amp; leverans</h1>
          <p>
            {canOrderOnline
              ? 'Bygg din beställning, välj avhämtning eller hemleverans och skicka — du betalar när maten kommer.'
              : 'Ring in din beställning för avhämtning eller leverans.'}{' '}
            Vill du boka bord istället? Det gör du under{' '}
            <Link className="fluffy-link" href={publicSiteHref(routePrefix, '/boka')}>Boka bord</Link>.
          </p>
        </div>
      </section>

      <section className="fluffy-section fluffy-section--white">
        <div className="fluffy-shell">
          {canOrderOnline ? (
            <OrderCart menu={orderMenu} phone={site.settings.phone} />
          ) : (
            <article className="fluffy-card fluffy-order-card fluffy-rise">
              <h2>Ring &amp; beställ</h2>
              <p>Just nu tar vi beställningar för avhämtning och leverans via telefon. Ring oss så fixar vi det.</p>
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
          )}
        </div>
      </section>
    </SiteShell>
  );
}
