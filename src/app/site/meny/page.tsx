import Link from 'next/link';
import { MapPinIcon, PhoneIcon } from 'lucide-react';
import { MenuBoardHero, MenuList, MenuTabs } from '../_components/menu-list';
import { SiteShell } from '../_components/site-shell';
import { getPublicSiteRoutePrefix, getSiteData, publicSiteHref, siteMetadata } from '../_lib/public-site-data';
import { menuSlug } from '../_lib/menu-visuals';

export const dynamic = 'force-dynamic';

type PublicMenuPageProps = {
  searchParams?: Promise<{
    kategori?: string | string[];
  }>;
};

export async function generateMetadata() {
  return siteMetadata('Meny');
}

function phoneHref(phone?: string | null) {
  const normalized = phone?.replace(/[^\d+]/g, '');
  return normalized ? `tel:${normalized}` : null;
}

export default async function PublicMenuPage({ searchParams }: PublicMenuPageProps) {
  const { site, isFallback } = await getSiteData();
  const routePrefix = await getPublicSiteRoutePrefix();
  const params = await searchParams;
  const requested = Array.isArray(params?.kategori) ? params?.kategori[0] : params?.kategori;
  const activeSlug = requested && site.categories.some((category) => menuSlug(category.name) === requested) ? requested : undefined;
  const activeCategory = activeSlug ? site.categories.find((category) => menuSlug(category.name) === activeSlug) ?? null : null;
  const callHref = phoneHref(site.settings.phone);

  return (
    <SiteShell site={site} isFallback={isFallback} routePrefix={routePrefix} mainClassName="fluffy-public--dark">
      <section className="fluffy-menu-page-hero">
        <div className="fluffy-shell fluffy-menu-page-hero__grid">
          <div className="fluffy-copy fluffy-rise">
            <p className="fluffy-eyebrow">Fluffy&apos;s Laxå</p>
            <h1 className="fluffy-page-title">Menyn</h1>
            <p>
              Välj din favorit, bygg något eget eller hitta ett snabbt stopp för vägen. Priser och rätter hämtas från
              restaurangens publicerade meny.
            </p>
          </div>
          <div className="fluffy-menu-popular fluffy-rise fluffy-delay-1">
            <p>Populärt just nu</p>
            <span>Tacokebab</span>
            <span>Pick&apos;n Mix Kebaben</span>
            <span>Italian Duo</span>
          </div>
        </div>
      </section>

      <section className="fluffy-section fluffy-section--menu">
        <div className="fluffy-shell">
          <MenuTabs categories={site.categories} activeSlug={activeSlug} routePrefix={routePrefix} />
          <div className={activeSlug ? 'fluffy-menu-layout fluffy-menu-layout--focused' : 'fluffy-menu-layout'}>
            <div>
              <MenuList categories={site.categories} activeSlug={activeSlug} variant={activeSlug ? 'focused' : 'overview'} />
            </div>
            <aside className="fluffy-menu-aside" aria-label="Praktisk menyinformation">
              <MenuBoardHero category={activeCategory} />
              <article className="fluffy-aside-card">
                <h2>Öppet idag</h2>
                <p>Kom förbi, välj i kassan och fortsätt resan mätt.</p>
              </article>
              <article className="fluffy-aside-card fluffy-aside-card--paper">
                <h2>Glutenfritt</h2>
                <p>Samma goda pizzor, nu även på glutenfri botten. Fråga personalen om dagens utbud.</p>
              </article>
            </aside>
          </div>
        </div>
      </section>
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
