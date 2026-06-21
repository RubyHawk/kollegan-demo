import Link from 'next/link';
import {
  ArrowUpRightIcon,
  CalendarDaysIcon,
  ChevronRightIcon,
  ClockIcon,
  InfoIcon,
  MailIcon,
  MapPinIcon,
  PhoneIcon,
  ShoppingBagIcon,
  UtensilsIcon,
} from 'lucide-react';
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

function footerOpenLabel(site: PublicRestaurantSite): { open: boolean | null; text: string } {
  const status = getOpeningStatus(site.openingHours);
  if (!status.hasHours) return { open: null, text: 'Öppettider uppdateras inom kort' };
  if (status.isOpen) return { open: true, text: `Öppet nu till ${status.closesAtText}` };
  if (status.nextOpenDayOfWeek != null && status.nextOpenAtText) {
    const word = relativeDayWord(status.nextOpenDayOfWeek, stockholmNow().dayOfWeek, DAY_LABELS);
    const when = word === 'idag' || word === 'imorgon' ? word : `på ${word}`;
    return { open: false, text: `Stängt · öppnar ${when} ${status.nextOpenAtText}` };
  }
  return { open: false, text: 'Stängt' };
}

/** Compact "today" status for the Öppettider mini-card: a word + a supporting line. */
function todayStatus(site: PublicRestaurantSite): { open: boolean | null; word: string; line: string } {
  const status = getOpeningStatus(site.openingHours);
  if (!status.hasHours) return { open: null, word: 'Öppettider', line: 'Uppdateras inom kort' };
  if (status.isOpen) {
    return { open: true, word: 'Öppet', line: status.closesAtText ? `Stänger kl. ${status.closesAtText}` : 'Öppet just nu' };
  }
  if (status.nextOpenDayOfWeek != null && status.nextOpenAtText) {
    const word = relativeDayWord(status.nextOpenDayOfWeek, stockholmNow().dayOfWeek, DAY_LABELS);
    const when = word === 'idag' ? 'kl.' : `${word} kl.`;
    return { open: false, word: 'Stängt', line: `Öppnar ${when} ${status.nextOpenAtText}` };
  }
  return { open: false, word: 'Stängt', line: 'Se öppettider' };
}

/**
 * Premium, card-based roadside footer: a brand row with the live status + actions, then cards for
 * Hitta hit (with a stylized E20 map), Kontakt, Öppettider idag and Snabblänkar, a dashed road
 * divider and a quiet bottom bar. Live data; scoped to the Fluffy public site.
 */
export function FluffysFooter({ site, routePrefix = '' }: { site: PublicRestaurantSite; routePrefix?: string }) {
  const { settings } = site;
  const address = addressLine(site);
  const tel = telHref(settings.phone);
  const status = footerOpenLabel(site);
  const today = todayStatus(site);
  const town = settings.city || 'Laxå';
  const place = `${settings.siteName}, ${town}`;
  const mapQuery = [settings.siteName, address].filter(Boolean).join(', ') || settings.siteName;

  const quickLinks: Array<{ href: string; label: string; Icon: typeof UtensilsIcon }> = [
    { href: publicSiteHref(routePrefix, '/#meny'), label: 'Meny', Icon: UtensilsIcon },
    { href: publicSiteHref(routePrefix, '/#oppettider'), label: 'Öppettider', Icon: ClockIcon },
    { href: publicSiteHref(routePrefix, '/bestall'), label: 'Beställ', Icon: ShoppingBagIcon },
    { href: publicSiteHref(routePrefix, '/boka'), label: 'Boka bord', Icon: CalendarDaysIcon },
    { href: publicSiteHref(routePrefix, '/kontakt'), label: 'Kontakt', Icon: PhoneIcon },
    { href: publicSiteHref(routePrefix, '/om-oss'), label: 'Om Fluffy’s', Icon: InfoIcon },
  ];

  return (
    <footer className="fluffy-footer">
      <div className="fluffy-shell fluffy-footer__panel">
        <div className="fluffy-footer__top">
          <Link href={publicSiteHref(routePrefix, '/')} className="fluffy-footer__brand" aria-label={settings.siteName}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/fluffys/favicon.svg" alt="" className="fluffy-footer__mark" />
            <span>
              <strong>{settings.siteName}</strong>
              <small>Mat vid vägen</small>
            </span>
          </Link>

          <div className="fluffy-footer__actions">
            <p className="fluffy-footer__status" data-open={status.open ?? undefined}>
              <ClockIcon aria-hidden="true" />
              {status.text}
            </p>
            <div className="fluffy-footer__cta-row">
              <Link href={publicSiteHref(routePrefix, '/bestall')} className="fluffy-footer__cta fluffy-footer__cta--order">
                Beställ
              </Link>
              <Link href={publicSiteHref(routePrefix, '/boka')} className="fluffy-footer__cta">
                Boka bord
              </Link>
            </div>
          </div>
        </div>

        <div className="fluffy-footer__cards">
          <section className="fluffy-footer__card fluffy-footer__find" aria-label="Hitta hit">
            <div className="fluffy-footer__find-body">
              <h2 className="fluffy-footer__card-title">Hitta hit</h2>
              <p className="fluffy-footer__place">
                <MapPinIcon aria-hidden="true" />
                {place}
              </p>
              <p className="fluffy-footer__near">Nära E20</p>
              <p className="fluffy-footer__blurb">Enkelt att stanna till. Gott på vägen. Gratis parkering precis utanför.</p>
              <div className="fluffy-footer__find-actions">
                <a className="fluffy-footer__route" href={mapsHref(mapQuery)} target="_blank" rel="noreferrer">
                  Vägbeskrivning
                  <ArrowUpRightIcon aria-hidden="true" />
                </a>
                <span className="fluffy-footer__shield">E20</span>
              </div>
            </div>
            <span
              className="fluffy-footer__map"
              role="img"
              aria-label={`Karta: ${place}, nära E20`}
              style={{ backgroundImage: 'url("/fluffys/footer-map.svg")' }}
            />
          </section>

          <div className="fluffy-footer__stack">
            <section className="fluffy-footer__card fluffy-footer__contact" aria-label="Kontakt">
              <h2 className="fluffy-footer__card-title">Kontakt</h2>
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
            </section>

            <section className="fluffy-footer__card fluffy-footer__hours" aria-label="Öppettider idag">
              <h2 className="fluffy-footer__card-title">Öppettider idag</h2>
              <p className="fluffy-footer__hours-now" data-open={today.open ?? undefined}>
                <ClockIcon aria-hidden="true" />
                {today.word}
              </p>
              <p className="fluffy-footer__hours-line">{today.line}</p>
              <Link className="fluffy-footer__more" href={publicSiteHref(routePrefix, '/#oppettider')}>
                Se alla öppettider
                <ArrowUpRightIcon aria-hidden="true" />
              </Link>
            </section>
          </div>

          <nav className="fluffy-footer__card fluffy-footer__links" aria-label="Snabblänkar">
            <h2 className="fluffy-footer__card-title">Snabblänkar</h2>
            <ul>
              {quickLinks.map(({ href, label, Icon }) => (
                <li key={label}>
                  <Link href={href}>
                    <Icon aria-hidden="true" className="fluffy-footer__links-lead" />
                    <span>{label}</span>
                    <ChevronRightIcon aria-hidden="true" className="fluffy-footer__links-chev" />
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="fluffy-footer__road" aria-hidden="true" />

        <div className="fluffy-footer__bar">
          <span>© {new Date().getFullYear()} {settings.siteName} · Mat vid vägen · {town}</span>
          <span className="fluffy-footer__bar-end">
            Vid E20 i {town}
            <span className="fluffy-footer__shield">E20</span>
          </span>
        </div>
      </div>
    </footer>
  );
}
