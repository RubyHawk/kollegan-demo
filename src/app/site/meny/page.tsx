import { MenuList } from '../_components/menu-list';
import { SiteShell } from '../_components/site-shell';
import { getSiteData, siteMetadata } from '../_lib/public-site-data';

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  return siteMetadata('Meny');
}

export default async function PublicMenuPage() {
  const { site, isFallback } = await getSiteData();

  return (
    <SiteShell site={site} isFallback={isFallback}>
      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[0.7fr_1.3fr]">
        <div className="fluffy-rise">
          <p className="text-sm font-black uppercase tracking-[0.16em] text-[#bf4f2f]">Meny</p>
          <h1 className="mt-2 text-5xl font-black leading-tight text-[#211f1c]">Välj något varmt, krispigt, snabbt eller extra stort.</h1>
          <p className="mt-4 leading-7 text-[#211f1c]/70">
            Priser och varianter hämtas från restaurangens publicerade meny.
          </p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/fluffys/menu-board.svg"
            alt="Fluffy's menyboard"
            className="mt-8 w-full rounded-lg border border-[#211f1c]/10 shadow-lg"
          />
        </div>
        <MenuList categories={site.categories} />
      </section>
    </SiteShell>
  );
}
