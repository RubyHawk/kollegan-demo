import Link from 'next/link';
import { MenuList } from './_components/menu-list';
import { OpeningHours } from './_components/opening-hours';
import { SiteShell } from './_components/site-shell';
import { getSiteData, siteMetadata } from './_lib/public-site-data';

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  return siteMetadata();
}

export default async function PublicHomePage() {
  const { site, isFallback } = await getSiteData();
  const menuPreview = site.categories.slice(0, 3);

  return (
    <SiteShell site={site} isFallback={isFallback}>
      <section className="relative overflow-hidden bg-[#211f1c] text-[#fffaf0]">
        <div className="mx-auto grid min-h-[82dvh] max-w-7xl items-center gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="fluffy-rise max-w-2xl">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-[#f4d06f]">{site.settings.siteName}</p>
            <h1 className="mt-4 text-5xl font-black leading-none tracking-normal sm:text-7xl">{site.settings.heroTitle}</h1>
            {site.settings.heroSubtitle ? <p className="mt-5 max-w-xl text-lg leading-8 text-[#fffaf0]/82">{site.settings.heroSubtitle}</p> : null}
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/site/meny" className="rounded-md bg-[#f4d06f] px-5 py-3 text-sm font-black text-[#211f1c] hover:bg-[#ffd96f]">
                Se menyn
              </Link>
              <Link href="/site/boka" className="rounded-md border border-[#fffaf0]/25 px-5 py-3 text-sm font-black text-[#fffaf0] hover:bg-white/10">
                Boka bord
              </Link>
            </div>
          </div>
          <div className="fluffy-rise relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/fluffys/menu-board.svg"
              alt="Fluffy's meny som grafisk menyboard"
              className="w-full rounded-lg border border-[#f4d06f]/35 shadow-2xl"
            />
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[0.7fr_1.3fr]">
        <div className="fluffy-rise">
          <p className="text-sm font-black uppercase tracking-[0.16em] text-[#bf4f2f]">Meny</p>
          <h2 className="mt-2 text-4xl font-black text-[#211f1c]">Subs, pizza och favoriter för hela bordet.</h2>
          {site.settings.about ? <p className="mt-4 leading-7 text-[#211f1c]/70">{site.settings.about}</p> : null}
          <Link href="/site/meny" className="fluffy-link mt-5 inline-block text-sm font-black text-[#bf4f2f] underline">
            Visa hela menyn
          </Link>
        </div>
        <MenuList categories={menuPreview.length > 0 ? menuPreview : site.categories} compact />
      </section>

      <section className="border-y border-[#211f1c]/10 bg-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-14 sm:px-6 md:grid-cols-2">
          <div className="fluffy-rise">
            <p className="text-sm font-black uppercase tracking-[0.16em] text-[#bf4f2f]">Öppet</p>
            <h2 className="mt-2 text-3xl font-black text-[#211f1c]">Kom förbi eller beställ takeaway.</h2>
          </div>
          <OpeningHours hours={site.openingHours} />
        </div>
      </section>

      {site.events.length > 0 ? (
        <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
          <p className="text-sm font-black uppercase tracking-[0.16em] text-[#bf4f2f]">På gång</p>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {site.events.map((event) => (
              <article key={event.id} className="fluffy-rise rounded-lg border border-[#211f1c]/10 bg-white p-5">
                <p className="text-sm font-bold text-[#211f1c]/60">{new Intl.DateTimeFormat('sv-SE', { dateStyle: 'medium' }).format(new Date(event.startsAt))}</p>
                <h3 className="mt-2 text-lg font-black text-[#211f1c]">{event.title}</h3>
                {event.description ? <p className="mt-2 text-sm leading-6 text-[#211f1c]/70">{event.description}</p> : null}
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </SiteShell>
  );
}
