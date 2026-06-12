import Link from 'next/link';
import { SiteShell } from '../_components/site-shell';
import { getSiteData, siteMetadata } from '../_lib/public-site-data';

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  return siteMetadata('Om oss');
}

export default async function PublicAboutPage() {
  const { site, isFallback } = await getSiteData();

  return (
    <SiteShell site={site} isFallback={isFallback}>
      <section className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1fr_0.9fr]">
        <div className="fluffy-rise">
          <p className="text-sm font-black uppercase tracking-[0.16em] text-[#bf4f2f]">Om oss</p>
          <h1 className="mt-2 text-5xl font-black leading-tight text-[#211f1c]">{site.settings.heroTitle}</h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-[#211f1c]/75">
            {site.settings.about ?? 'Fluffy’s serverar subs, pizza, panini, wraps och tillbehör med snabb service och tydlig meny.'}
          </p>
          <Link href="/site/kontakt" className="mt-7 inline-flex min-h-11 items-center rounded-md bg-[#211f1c] px-5 py-3 text-sm font-black text-white hover:bg-[#bf4f2f]">
            Hitta hit
          </Link>
        </div>
        <div className="fluffy-rise rounded-lg border border-[#211f1c]/10 bg-white p-5 shadow-sm">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/fluffys/menu-board.svg" alt="Fluffy's menyboard" className="w-full rounded-md" />
        </div>
      </section>

      {site.events.length > 0 ? (
        <section className="border-t border-[#211f1c]/10 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
            <p className="text-sm font-black uppercase tracking-[0.16em] text-[#bf4f2f]">På gång</p>
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              {site.events.map((event) => (
                <article key={event.id} className="rounded-lg border border-[#211f1c]/10 bg-[#fffaf0] p-5">
                  <p className="text-sm font-bold text-[#211f1c]/60">{new Intl.DateTimeFormat('sv-SE', { dateStyle: 'medium' }).format(new Date(event.startsAt))}</p>
                  <h2 className="mt-2 text-lg font-black text-[#211f1c]">{event.title}</h2>
                  {event.description ? <p className="mt-2 text-sm leading-6 text-[#211f1c]/70">{event.description}</p> : null}
                </article>
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </SiteShell>
  );
}
