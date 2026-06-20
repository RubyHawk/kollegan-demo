import Link from 'next/link';
import { ArrowUpRightIcon, ClockIcon, MailIcon, PhoneIcon } from 'lucide-react';
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

/**
 * Clean, minimal footer: a strong brand row with the live status and primary actions, three lean
 * link columns and a quiet bottom bar — premium and roomy, with a single orange road accent.
 * Scoped to the Fluffy public site.
 */
export function FluffysFooter({ site, routePrefix = '' }: { site: PublicRestaurantSite; routePrefix?: string }) {
  const { settings } = site;
  const address = addressLine(site);
  const tel = telHref(settings.phone);
  const status = footerOpenLabel(site);
  const mapQuery = [settings.siteName, address].filter(Boolean).join(', ') || settings.siteName;

  return (
    <footer className="fluffy-footer">
      <div className="fluffy-shell fluffy-footer__top">
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

      <div className="fluffy-shell">
        <div className="fluffy-footer__rule" aria-hidden="true" />
      </div>

      <div className="fluffy-shell fluffy-footer__cols">
        <nav className="fluffy-footer__col" aria-label="Hitta hit">
          <h2>Hitta hit</h2>
          {address ? (
            <address className="fluffy-footer__address">{address}</address>
          ) : (
            <p className="fluffy-footer__muted">Adress uppdateras inom kort.</p>
          )}
          {address ? (
            <a className="fluffy-footer__link" href={mapsHref(mapQuery)} target="_blank" rel="noreferrer">
              Vägbeskrivning
              <ArrowUpRightIcon aria-hidden="true" className="fluffy-footer__link-out" />
            </a>
          ) : null}
        </nav>

        <div className="fluffy-footer__col">
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

        <nav className="fluffy-footer__col" aria-label="Snabblänkar">
          <h2>Snabblänkar</h2>
          <Link className="fluffy-footer__link" href={publicSiteHref(routePrefix, '/#meny')}>Meny</Link>
          <Link className="fluffy-footer__link" href={publicSiteHref(routePrefix, '/#oppettider')}>Öppettider</Link>
          <Link className="fluffy-footer__link" href={publicSiteHref(routePrefix, '/bestall')}>Beställ</Link>
          <Link className="fluffy-footer__link" href={publicSiteHref(routePrefix, '/boka')}>Boka bord</Link>
          <Link className="fluffy-footer__link" href={publicSiteHref(routePrefix, '/kontakt')}>Kontakt</Link>
        </nav>
      </div>

      <div className="fluffy-footer__bar">
        <div className="fluffy-shell fluffy-footer__bar-inner">
          <span>© {new Date().getFullYear()} {settings.siteName}</span>
          <span className="fluffy-footer__bar-tag">Mat vid vägen{settings.city ? ` · ${settings.city}` : ''}</span>
        </div>
      </div>
    </footer>
  );
}
