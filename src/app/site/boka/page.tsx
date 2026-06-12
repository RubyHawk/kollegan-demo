import { ReservationForm } from '../_components/reservation-form';
import { SiteShell } from '../_components/site-shell';
import { getSiteData, siteMetadata } from '../_lib/public-site-data';

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  return siteMetadata('Boka');
}

export default async function PublicBookingPage() {
  const { site, isFallback } = await getSiteData();

  return (
    <SiteShell site={site} isFallback={isFallback}>
      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="fluffy-rise">
          <p className="text-sm font-black uppercase tracking-[0.16em] text-[#bf4f2f]">Boka</p>
          <h1 className="mt-2 text-5xl font-black leading-tight text-[#211f1c]">Skicka en bokningsförfrågan.</h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-[#211f1c]/75">
            Fyll i datum, tid och antal gäster. Vi bekräftar bokningen när restaurangen har kontrollerat läget.
          </p>
          {site.settings.reservationEmail ? (
            <p className="mt-5 text-sm font-bold text-[#211f1c]/70">Bokningsmail: {site.settings.reservationEmail}</p>
          ) : null}
        </div>
        <div className="fluffy-rise">
          <ReservationForm />
        </div>
      </section>
    </SiteShell>
  );
}
