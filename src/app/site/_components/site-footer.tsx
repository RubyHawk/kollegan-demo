import Link from 'next/link';
import { ArrowUpRightIcon, ClockIcon, MailIcon, MapPinIcon, PhoneIcon, UtensilsIcon } from 'lucide-react';
import type { PublicRestaurantSite } from '@modules/supporting/restaurant-menu';
import { addressLine, DAY_LABELS, publicSiteHref } from '../_lib/public-site-data';
import { getOpeningStatus, relativeDayWord, stockholmNow } from '../_lib/opening-status';

function telHref(phone: string | null) {
  const normalized = phone?.replace(/[^\d+]/g, '');
  return normalized ? `tel:${normalized}` : null;
}

function mapsHref(query: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

/** Today's status as a roadside sign: a big word + a supporting line. */
function signStatus(site: PublicRestaurantSite): { open: boolean | null; big: string; sub: string } {
  const status = getOpeningStatus(site.openingHours);
  if (!status.hasHours) return { open: null, big: 'Öppettider', sub: 'Uppdateras inom kort' };
  if (status.isOpen) {
    return { open: true, big: 'Öppet nu', sub: status.closesAtText ? `Stänger ${status.closesAtText}` : 'Öppet just nu' };
  }
  if (status.nextOpenDayOfWeek != null && status.nextOpenAtText) {
    const word = relativeDayWord(status.nextOpenDayOfWeek, stockholmNow().dayOfWeek, DAY_LABELS);
    const when = word === 'idag' || word === 'imorgon' ? word : `på ${word}`;
    return { open: false, big: 'Stängt nu', sub: `Öppnar ${when} ${status.nextOpenAtText}` };
  }
  return { open: false, big: 'Stängt nu', sub: 'Se öppettider' };
}

/**
 * Roadside-scene footer: the dark band reads as asphalt, today's status is a green highway sign on
 * posts, "Hitta hit" is a directional arrow sign, the order CTA is a route shield, and the bottom
 * is a concrete curb with an E20 marker. Live data; scoped to the Fluffy public site.
 */
export function FluffysFooter({ site, routePrefix = '' }: { site: PublicRestaurantSite; routePrefix?: string }) {
  const { settings } = site;
  const address = addressLine(site);
  const tel = telHref(settings.phone);
  const sign = signStatus(site);
  const mapQuery = [settings.siteName, address].filter(Boolean).join(', ') || settings.siteName;

  return (
    <footer className="fluffy-footer">
      <div className="fluffy-shell fluffy-footer__inner">
        <div className="fluffy-footer__brand-col">
          <Link href={publicSiteHref(routePrefix, '/')} className="fluffy-footer__brand" aria-label={settings.siteName}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/fluffys/favicon.svg" alt="" className="fluffy-footer__mark" />
          </Link>
          <p className="fluffy-footer__brand-tag">Mat vid vägen</p>
          {settings.heroSubtitle ? <p className="fluffy-footer__tagline">{settings.heroSubtitle}</p> : null}
        </div>

        <div className="fluffy-footer__sign-wrap">
          <div className="fluffy-footer__sign" data-open={sign.open ?? undefined}>
            <span className="fluffy-footer__sign-eyebrow">Öppettider idag</span>
            <strong className="fluffy-footer__sign-big">{sign.big}</strong>
            <span className="fluffy-footer__sign-sub">{sign.sub}</span>
          </div>
        </div>

        <div className="fluffy-footer__find">
          <div className="fluffy-footer__direction">
            <h2>Hitta hit</h2>
            {address ? (
              <address className="fluffy-footer__address">{address}</address>
            ) : (
              <p className="fluffy-footer__address">Adress uppdateras inom kort.</p>
            )}
            <span className="fluffy-footer__along">Längs E20</span>
            {address ? (
              <a className="fluffy-footer__direction-link" href={mapsHref(mapQuery)} target="_blank" rel="noreferrer">
                Vägbeskrivning
                <ArrowUpRightIcon aria-hidden="true" />
              </a>
            ) : null}
          </div>

          <div className="fluffy-footer__contact">
            <h2>Kontakt</h2>
            {tel ? (
              <a className="fluffy-footer__link" href={tel}>
                <PhoneIcon aria-hidden="true" />
                {settings.phone}
              </a>
            ) : null}
            {settings.email ? (
              <a className="fluffy-footer__link" href={`mailto:${settings.email}`}>
                <MailIcon aria-hidden="true" />
                {settings.email}
              </a>
            ) : null}
          </div>
        </div>

        <div className="fluffy-footer__badge">
          <div className="fluffy-footer__badge-inner">
            <p className="fluffy-footer__badge-q">Hungrig på vägen?</p>
            <Link href={publicSiteHref(routePrefix, '/bestall')} className="fluffy-footer__badge-order">
              Beställ
            </Link>
            <Link href={publicSiteHref(routePrefix, '/boka')} className="fluffy-footer__badge-book">
              Boka bord
            </Link>
          </div>
        </div>

        <nav className="fluffy-footer__col" aria-label="Snabblänkar">
          <h2>Snabblänkar</h2>
          <Link className="fluffy-footer__link" href={publicSiteHref(routePrefix, '/#meny')}>
            <UtensilsIcon aria-hidden="true" />
            Meny
          </Link>
          <Link className="fluffy-footer__link" href={publicSiteHref(routePrefix, '/#oppettider')}>
            <ClockIcon aria-hidden="true" />
            Öppettider
          </Link>
          <Link className="fluffy-footer__link" href={publicSiteHref(routePrefix, '/kontakt')}>
            <MapPinIcon aria-hidden="true" />
            Kontakt
          </Link>
        </nav>
      </div>

      <div className="fluffy-footer__curb" aria-hidden="true" />

      <div className="fluffy-footer__bar">
        <div className="fluffy-shell fluffy-footer__bar-inner">
          <span>© {new Date().getFullYear()} {settings.siteName} · Mat vid vägen{settings.city ? ` · ${settings.city}` : ''}</span>
          <span className="fluffy-footer__bar-end">
            <span className="fluffy-footer__shield-mini">E20</span>
            Mat vid vägen
          </span>
        </div>
      </div>
    </footer>
  );
}
