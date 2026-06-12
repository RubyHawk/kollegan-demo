import Link from 'next/link';
import { OpeningHours } from '../_components/opening-hours';
import { SiteShell } from '../_components/site-shell';
import { addressLine, getSiteData, siteMetadata } from '../_lib/public-site-data';

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  return siteMetadata('Kontakt');
}

export default async function PublicContactPage() {
  const { site, isFallback } = await getSiteData();
  const address = addressLine(site);

  return (
    <SiteShell site={site} isFallback={isFallback}>
      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="fluffy-rise">
          <p className="text-sm font-black uppercase tracking-[0.16em] text-[#bf4f2f]">Kontakt</p>
          <h1 className="mt-2 text-5xl font-black leading-tight text-[#211f1c]">Öppettider och kontakt.</h1>
          <div className="mt-6 space-y-2 text-base font-semibold leading-7 text-[#211f1c]/75">
            {address ? <p>{address}</p> : null}
            {site.settings.phone ? <p>{site.settings.phone}</p> : null}
            {site.settings.email ? <p>{site.settings.email}</p> : null}
          </div>
          <Link href="/site/boka" className="mt-7 inline-block rounded-md bg-[#211f1c] px-5 py-3 text-sm font-black text-white hover:bg-[#bf4f2f]">
            Boka bord
          </Link>
        </div>
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-1">
          <section className="fluffy-rise rounded-lg border border-[#211f1c]/10 bg-white p-5 shadow-sm">
            <h2 className="text-2xl font-black text-[#211f1c]">Öppet</h2>
            <div className="mt-4">
              <OpeningHours hours={site.openingHours} />
            </div>
          </section>
          <section className="fluffy-rise rounded-lg border border-[#211f1c]/10 bg-[#211f1c] p-5 text-[#fffaf0] shadow-sm">
            <h2 className="text-2xl font-black">Takeaway</h2>
            <p className="mt-3 text-sm leading-6 text-[#fffaf0]/75">
              Ring restaurangen eller skicka en bokningsförfrågan så återkommer vi så snabbt vi kan.
            </p>
          </section>
        </div>
      </section>
    </SiteShell>
  );
}
