import Link from 'next/link';
import type { ReactNode } from 'react';
import { MenuIcon } from 'lucide-react';
import type { PublicRestaurantSite } from '@modules/supporting/restaurant-menu';
import { addressLine, publicSiteHref } from '../_lib/public-site-data';

const NAV: Array<{ path: `/${string}`; label: string }> = [
  { path: '/meny', label: 'Meny' },
  { path: '/#oppettider', label: 'Öppettider' },
  { path: '/kontakt#parkering', label: 'Parkering' },
  { path: '/kontakt', label: 'Hitta hit' },
  { path: '/kontakt', label: 'Kontakt' },
];

export function SiteShell({
  site,
  children,
  isFallback = false,
  routePrefix = '',
}: {
  site: PublicRestaurantSite;
  children: ReactNode;
  isFallback?: boolean;
  routePrefix?: string;
}) {
  const address = addressLine(site);

  return (
    <main className="fluffy-public">
      <header className="fluffy-header">
        <div className="fluffy-shell fluffy-header__inner">
          <Link href={publicSiteHref(routePrefix, '/')} className="fluffy-brand">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/fluffys/favicon.svg" alt="" className="fluffy-brand__mark" />
            <span className="fluffy-brand__text">
              <strong>{site.settings.siteName}</strong>
              <small>Mat vid vägen</small>
            </span>
          </Link>
          <nav className="fluffy-nav" aria-label="Huvudnavigation">
            {NAV.map((item) => (
              <Link key={`${item.label}-${item.path}`} href={publicSiteHref(routePrefix, item.path)}>
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="fluffy-header__actions">
            <Link href={publicSiteHref(routePrefix, '/boka')} className="fluffy-header__cta">
              Beställ / Boka
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
                <Link href={publicSiteHref(routePrefix, '/boka')}>Beställ / Boka</Link>
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

      <footer className="fluffy-footer">
        <div className="fluffy-shell fluffy-footer__inner">
          <div>
            <p className="fluffy-footer__brand">{site.settings.siteName}</p>
            {site.settings.heroSubtitle ? <p className="fluffy-footer__meta">{site.settings.heroSubtitle}</p> : null}
          </div>
          <div className="fluffy-footer__meta">
            {address ? <p>{address}</p> : null}
            {site.settings.phone ? <p>{site.settings.phone}</p> : null}
            {site.settings.email ? <p>{site.settings.email}</p> : null}
          </div>
        </div>
      </footer>
    </main>
  );
}
