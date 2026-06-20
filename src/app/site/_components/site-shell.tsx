import Link from 'next/link';
import type { ReactNode } from 'react';
import { MenuIcon } from 'lucide-react';
import type { PublicRestaurantSite } from '@modules/supporting/restaurant-menu';
import { publicSiteHref } from '../_lib/public-site-data';
import { FluffysFooter } from './site-footer';
import { ScribbleStroke } from './scribble-stroke';
import { HeaderCartButton } from './cart/header-cart-button';

const NAV: Array<{ path: `/${string}`; label: string }> = [
  { path: '/#meny', label: 'Meny' },
  { path: '/#oppettider', label: 'Öppettider' },
  { path: '/#parkering', label: 'Parkering' },
  { path: '/#hitta-hit', label: 'Hitta hit' },
  { path: '/kontakt', label: 'Kontakt' },
];

function publicBrandName(siteName: string) {
  return siteName.toLocaleLowerCase('sv-SE').includes('laxå') ? siteName : `${siteName} Laxå`;
}

export function SiteShell({
  site,
  children,
  isFallback = false,
  routePrefix = '',
  mainClassName,
}: {
  site: PublicRestaurantSite;
  children: ReactNode;
  isFallback?: boolean;
  routePrefix?: string;
  mainClassName?: string;
}) {
  const brandName = publicBrandName(site.settings.siteName);

  return (
    <main className={mainClassName ? `fluffy-public ${mainClassName}` : 'fluffy-public'}>
      <header className="fluffy-header">
        <div className="fluffy-shell fluffy-header__inner">
          <Link href={publicSiteHref(routePrefix, '/')} className="fluffy-brand">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/fluffys/favicon.svg" alt="" className="fluffy-brand__mark" />
            <span className="fluffy-brand__text">
              <strong>{brandName}</strong>
              <small>Mat vid vägen</small>
            </span>
          </Link>
          <nav className="fluffy-nav" aria-label="Huvudnavigation">
            {NAV.map((item) => (
              <Link key={`${item.label}-${item.path}`} href={publicSiteHref(routePrefix, item.path)}>
                <span>{item.label}</span>
                <ScribbleStroke className="fluffy-nav__scribble" />
              </Link>
            ))}
          </nav>
          <div className="fluffy-header__actions">
            <HeaderCartButton href={publicSiteHref(routePrefix, '/bestall')} />
            <Link href={publicSiteHref(routePrefix, '/boka')} className="fluffy-header__cta fluffy-header__cta--book">
              Boka bord
            </Link>
            <Link href={publicSiteHref(routePrefix, '/bestall')} className="fluffy-header__cta fluffy-header__cta--order">
              Beställ
            </Link>
            <details className="fluffy-header__menu">
              <summary aria-label="Öppna meny">
                <MenuIcon size={30} strokeWidth={2.25} />
              </summary>
              <nav className="fluffy-header__menu-panel" aria-label="Mobilnavigation">
                {NAV.map((item) => (
                  <Link key={`mobile-${item.label}-${item.path}`} href={publicSiteHref(routePrefix, item.path)}>
                    {item.label}
                  </Link>
                ))}
                <Link href={publicSiteHref(routePrefix, '/bestall')}>Beställ</Link>
                <Link href={publicSiteHref(routePrefix, '/boka')}>Boka bord</Link>
              </nav>
            </details>
          </div>
        </div>
      </header>

      {isFallback ? (
        <div className="fluffy-fallback">
          Webbplatsen visar reservinformation just nu.
        </div>
      ) : null}

      {children}

      <FluffysFooter site={site} routePrefix={routePrefix} />
    </main>
  );
}
