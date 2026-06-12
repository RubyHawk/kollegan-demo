import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { getPublicRestaurantSite } from '@modules/supporting/restaurant-menu';
import { ReservationForm } from './reservation-form';

export const dynamic = 'force-dynamic';

const HERO_IMAGE = 'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=1800&q=80';

const DAY_LABELS: Record<number, string> = {
  1: 'Monday',
  2: 'Tuesday',
  3: 'Wednesday',
  4: 'Thursday',
  5: 'Friday',
  6: 'Saturday',
  7: 'Sunday',
};

export async function generateMetadata(): Promise<Metadata> {
  const headerStore = await headers();
  const site = await getPublicRestaurantSite(headerStore.get('host'));
  return {
    title: site.settings.seoTitle || site.settings.siteName || site.organizationName,
    description: site.settings.seoDescription ?? site.settings.heroSubtitle ?? undefined,
  };
}

function priceLabel(priceCents: number | null, currency: string) {
  if (priceCents == null) return '';
  return new Intl.NumberFormat('sv-SE', { style: 'currency', currency, maximumFractionDigits: 0 }).format(priceCents / 100);
}

export default async function PublicRestaurantSitePage() {
  const headerStore = await headers();
  const site = await getPublicRestaurantSite(headerStore.get('host'));
  const address = [
    site.settings.addressLine1,
    [site.settings.postalCode, site.settings.city].filter(Boolean).join(' '),
  ].filter(Boolean).join(', ');

  return (
    <main className="h-dvh overflow-y-auto bg-stone-50 text-stone-950">
      <section className="relative flex min-h-[86vh] items-end overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={HERO_IMAGE} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-black/45" />
        <div className="relative mx-auto grid w-full max-w-6xl gap-8 px-5 pb-12 pt-24 text-white md:grid-cols-[1.2fr_0.8fr] md:px-8">
          <div className="max-w-2xl">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-white/75">{site.settings.siteName}</p>
            <h1 className="text-5xl font-semibold leading-tight md:text-7xl">{site.settings.heroTitle}</h1>
            {site.settings.heroSubtitle ? (
              <p className="mt-5 max-w-xl text-lg leading-8 text-white/85">{site.settings.heroSubtitle}</p>
            ) : null}
          </div>
          <div className="self-end rounded-lg border border-white/25 bg-white/10 p-4 backdrop-blur-md">
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-white/70">Today</p>
            <div className="mt-3 space-y-2 text-sm text-white/90">
              {site.openingHours.slice(0, 7).map((hour) => (
                <div key={hour.id} className="flex justify-between gap-4">
                  <span>{DAY_LABELS[hour.dayOfWeek]}</span>
                  <span>{hour.isClosed ? (hour.label ?? 'Closed') : `${hour.opensAt} - ${hour.closesAt}`}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-8 px-5 py-14 md:grid-cols-[0.7fr_1.3fr] md:px-8">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-stone-500">Menu</p>
          <h2 className="mt-2 text-3xl font-semibold">Food worth coming back for</h2>
          {site.settings.about ? <p className="mt-4 leading-7 text-stone-600">{site.settings.about}</p> : null}
        </div>
        <div className="grid gap-6">
          {site.categories.map((category) => (
            <section key={category.id} className="rounded-lg border border-stone-200 bg-white p-5">
              <div className="mb-4">
                <h3 className="text-xl font-semibold">{category.name}</h3>
                {category.description ? <p className="text-sm text-stone-500">{category.description}</p> : null}
              </div>
              <div className="divide-y divide-stone-200">
                {category.items.length === 0 ? (
                  <p className="py-4 text-sm text-stone-500">Menu items are coming soon.</p>
                ) : category.items.map((item) => (
                  <article key={item.id} className="grid gap-1 py-4">
                    <div className="flex items-start justify-between gap-4">
                      <h4 className="font-semibold">{item.name}</h4>
                      <span className="shrink-0 text-sm font-semibold">{priceLabel(item.priceCents, item.currency)}</span>
                    </div>
                    {item.description ? <p className="text-sm leading-6 text-stone-600">{item.description}</p> : null}
                    {item.tags.length > 0 ? (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {item.tags.map((tag) => (
                          <span key={tag} className="rounded-full border border-stone-200 px-2 py-0.5 text-xs font-semibold text-stone-600">
                            {tag}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      </section>

      <section className="border-y border-stone-200 bg-white">
        <div className="mx-auto grid max-w-6xl gap-8 px-5 py-14 md:grid-cols-2 md:px-8">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-stone-500">Visit</p>
            <h2 className="mt-2 text-3xl font-semibold">Hours and location</h2>
            <div className="mt-6 space-y-2 text-stone-700">
              {site.openingHours.map((hour) => (
                <div key={hour.id} className="flex max-w-md justify-between gap-4 border-b border-stone-100 py-2">
                  <span>{DAY_LABELS[hour.dayOfWeek]}</span>
                  <span>{hour.isClosed ? (hour.label ?? 'Closed') : `${hour.opensAt} - ${hour.closesAt}`}</span>
                </div>
              ))}
            </div>
            <div className="mt-6 text-sm leading-6 text-stone-600">
              {address ? <p>{address}</p> : null}
              {site.settings.phone ? <p>{site.settings.phone}</p> : null}
              {site.settings.email ? <p>{site.settings.email}</p> : null}
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-stone-500">Booking</p>
            <h2 className="mt-2 text-3xl font-semibold">Request a table</h2>
            <div className="mt-6">
              <ReservationForm />
            </div>
          </div>
        </div>
      </section>

      {site.events.length > 0 ? (
        <section className="mx-auto max-w-6xl px-5 py-14 md:px-8">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-stone-500">Events</p>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {site.events.map((event) => (
              <article key={event.id} className="rounded-lg border border-stone-200 bg-white p-5">
                <p className="text-sm text-stone-500">{new Intl.DateTimeFormat('sv-SE', { dateStyle: 'medium' }).format(new Date(event.startsAt))}</p>
                <h3 className="mt-2 text-lg font-semibold">{event.title}</h3>
                {event.description ? <p className="mt-2 text-sm leading-6 text-stone-600">{event.description}</p> : null}
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}
