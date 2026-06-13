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
      <section className="fluffy-page-hero">
        <div className="fluffy-shell fluffy-grid fluffy-grid--menu">
          <div className="fluffy-copy fluffy-rise">
            <p className="fluffy-eyebrow">Meny</p>
            <h1 className="fluffy-page-title">Välj något varmt, krispigt, snabbt eller extra stort.</h1>
            <p>Priser, storlekar och varianter hämtas från restaurangens publicerade meny.</p>
            <div className="fluffy-proof-strip" aria-label="Menytyper">
              <span>Subs</span>
              <span>Pizza</span>
              <span>Panini</span>
              <span>Wraps</span>
            </div>
          </div>
          <figure className="fluffy-board-card fluffy-page-media fluffy-rise fluffy-delay-1">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/fluffys/menu-board.svg"
              alt="Fluffy's menyboard"
              className="fluffy-board-media"
            />
          </figure>
        </div>
      </section>

      <section className="fluffy-section fluffy-section--white">
        <div className="fluffy-shell">
          <MenuList categories={site.categories} />
        </div>
      </section>
    </SiteShell>
  );
}
