import Link from 'next/link';
import type { ReactNode } from 'react';
import type { PublicRestaurantSite } from '@modules/supporting/restaurant-menu';
import { addressLine } from '../_lib/public-site-data';

const NAV = [
  { href: '/meny', label: 'Meny' },
  { href: '/om-oss', label: 'Om oss' },
  { href: '/kontakt', label: 'Kontakt' },
  { href: '/boka', label: 'Boka' },
];

export function SiteShell({
  site,
  children,
  isFallback = false,
}: {
  site: PublicRestaurantSite;
  children: ReactNode;
  isFallback?: boolean;
}) {
  const address = addressLine(site);

  return (
    <main className="fluffy-public">
      <header className="fluffy-header">
        <div className="fluffy-shell fluffy-header__inner">
          <Link href="/" className="fluffy-brand">
            <span className="fluffy-brand__mark">sub</span>
            <span>{site.settings.siteName}</span>
          </Link>
          <nav className="fluffy-nav" aria-label="Huvudnavigation">
            {NAV.map((item) => (
              <Link key={item.href} href={item.href}>
                {item.label}
              </Link>
            ))}
          </nav>
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
