import Link from 'next/link';
import type { ReactNode } from 'react';
import type { PublicRestaurantSite } from '@modules/supporting/restaurant-menu';
import { addressLine } from '../_lib/public-site-data';

const NAV = [
  { href: '/site/meny', label: 'Meny' },
  { href: '/site/om-oss', label: 'Om oss' },
  { href: '/site/kontakt', label: 'Kontakt' },
  { href: '/site/boka', label: 'Boka' },
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
    <main className="fluffy-public min-h-dvh overflow-x-hidden">
      <header className="sticky top-0 z-30 border-b border-[#211f1c]/10 bg-[#fffaf0]/92 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link href="/site" className="text-lg font-black tracking-normal text-[#211f1c]">
            {site.settings.siteName}
          </Link>
          <nav className="flex items-center gap-1 overflow-x-auto text-sm font-bold text-[#211f1c]">
            {NAV.map((item) => (
              <Link key={item.href} href={item.href} className="rounded-md px-3 py-2 hover:bg-[#f4d06f]/35">
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      {isFallback ? (
        <div className="border-b border-[#f4d06f]/50 bg-[#f4d06f]/25 px-4 py-2 text-center text-sm font-semibold text-[#211f1c]">
          Webbplatsen visar reservinformation just nu.
        </div>
      ) : null}

      {children}

      <footer className="border-t border-[#211f1c]/10 bg-[#211f1c] text-[#fffaf0]">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-10 sm:px-6 md:grid-cols-[1fr_auto]">
          <div>
            <p className="text-xl font-black">{site.settings.siteName}</p>
            {site.settings.heroSubtitle ? <p className="mt-2 max-w-xl text-sm leading-6 text-[#fffaf0]/75">{site.settings.heroSubtitle}</p> : null}
          </div>
          <div className="text-sm leading-6 text-[#fffaf0]/80 md:text-right">
            {address ? <p>{address}</p> : null}
            {site.settings.phone ? <p>{site.settings.phone}</p> : null}
            {site.settings.email ? <p>{site.settings.email}</p> : null}
          </div>
        </div>
      </footer>
    </main>
  );
}
