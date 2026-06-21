import type { Metadata } from 'next';
import Image from 'next/image';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';

const FLUFFYS_HOSTS = new Set(['fluffys.se', 'www.fluffys.se', 'portal.fluffys.se']);

export const metadata: Metadata = {
  title: "Fluffy's - under uppbyggnad",
  description: "Fluffy's webbplats och portal \u00e4r tillf\u00e4lligt under uppbyggnad.",
  robots: {
    index: false,
    follow: false,
  },
  icons: {
    icon: '/fluffys/favicon.svg',
    shortcut: '/fluffys/favicon.svg',
    apple: '/fluffys/favicon.svg',
  },
};

function normalizeHost(host: string | null) {
  return (host ?? '').split(':')[0]?.toLowerCase() ?? '';
}

export default async function FluffysUnderConstructionPage() {
  const headerStore = await headers();
  const host = normalizeHost(
    headerStore.get('x-fluffys-construction-host')
      ?? headerStore.get('x-forwarded-host')
      ?? headerStore.get('host'),
  );
  if (!FLUFFYS_HOSTS.has(host)) notFound();

  return (
    <main className="fluffy-public flex min-h-dvh items-center justify-center overflow-hidden px-4 py-8 text-center">
      <section
        aria-labelledby="fluffys-construction-title"
        className="mx-auto grid w-full max-w-3xl justify-items-center gap-6"
      >
        <Image
          src="/fluffys/favicon.svg"
          alt="Fluffy's"
          width={112}
          height={112}
          priority
          className="h-24 w-24 sm:h-28 sm:w-28"
        />
        <Image
          src="/fluffys/under-construction.gif"
          alt=""
          width={360}
          height={220}
          unoptimized
          priority
          aria-hidden="true"
          className="h-auto w-72 max-w-full sm:w-80"
        />
        <div className="grid justify-items-center gap-4">
          <h1
            id="fluffys-construction-title"
            className="text-4xl font-black uppercase leading-none text-[var(--fp-ink)] sm:text-6xl md:text-7xl"
            style={{ fontFamily: 'var(--fluffy-display-font)' }}
          >
            <span className="block">Under</span>
            <span className="block">uppbyggnad</span>
          </h1>
          <p className="fluffy-lede mx-auto">
            Tack f&ouml;r ert t&aring;lamod. Vi bygger om Fluffy&apos;s webbplats och portal s&aring; att allt
            blir redo f&ouml;r n&aring;got riktigt gott.
          </p>
          <p className="max-w-xl text-base font-black leading-relaxed text-[var(--fp-purple)] sm:text-lg">
            V&auml;nta lite till - det goda kommer snart.
          </p>
        </div>
      </section>
    </main>
  );
}
