import Link from 'next/link';
import { MapPinIcon, PhoneIcon } from 'lucide-react';
import { MenuBoard } from '../_components/menu-list';
import { SiteShell } from '../_components/site-shell';
import { getPublicSiteRoutePrefix, getSiteData, publicSiteHref, siteMetadata } from '../_lib/public-site-data';

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  return siteMetadata('Meny');
}

function phoneHref(phone?: string | null) {
  const normalized = phone?.replace(/[^\d+]/g, '');
  return normalized ? `tel:${normalized}` : null;
}

export default async function PublicMenuPage() {
  const { site, isFallback } = await getSiteData();
  const routePrefix = await getPublicSiteRoutePrefix();
  const callHref = phoneHref(site.settings.phone);

  return (
    <SiteShell site={site} isFallback={isFallback} routePrefix={routePrefix}>
      <section className="fluffy-menu-page-hero">
        <div className="fluffy-shell">
          <p className="fluffy-eyebrow">{site.settings.siteName}</p>
          <h1 className="fluffy-page-title">Menyn</h1>
          <p className="fluffy-menu-page-hero__lede">
            Bygg din favorit eller välj en klassiker. Priser och rätter hämtas direkt från restaurangens
            publicerade meny.
          </p>
        </div>
      </section>

      <div className="fluffy-menu fluffy-menu--page" id="meny">
        <MenuBoard categories={site.categories} />
      </div>

      <div className="fluffy-mobile-actions" aria-label="Snabbval">
        <Link href={publicSiteHref(routePrefix, '/kontakt')}>
          <MapPinIcon aria-hidden="true" />
          Hitta hit
        </Link>
        {callHref ? (
          <a href={callHref}>
            <PhoneIcon aria-hidden="true" />
            Ring
          </a>
        ) : (
          <Link href={publicSiteHref(routePrefix, '/kontakt')}>
            <PhoneIcon aria-hidden="true" />
            Kontakt
          </Link>
        )}
      </div>
    </SiteShell>
  );
}
