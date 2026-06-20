'use client';

import { useEffect, useState } from 'react';
import { MapPinIcon } from 'lucide-react';
import {
  DAY_LABELS,
  closedLabel,
  formatTime,
  getOpeningStatus,
  getRouteStrip,
  stockholmNow,
  type OpeningHour,
} from '../_lib/opening-status';

const TZ = 'Europe/Stockholm';

function capitalize(text: string) {
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : text;
}

/** "20/6" — day/month, Stockholm wall-clock. */
function shortDate(now: Date): string {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: TZ, day: 'numeric', month: 'numeric' }).format(now);
}

/**
 * Concept D · Route Strip. The left panel renders today's opening window as a horizontal route
 * (open → close) with a live "now" pin; the right panel is a thermal-receipt rendering of the
 * whole week. Both read from the same live opening-hours data and tick once a minute.
 */
export function OpeningRoute({ hours }: { hours: OpeningHour[] }) {
  // Compute "now" on the client so the pin, the readout and JA/NEJ stay accurate as time passes
  // (suppressHydrationWarning covers the SSR→client diff, matching AvailabilityStatus).
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  const route = getRouteStrip(hours, now);
  const status = getOpeningStatus(hours, now);
  const { dateText, minutes } = stockholmNow(now);

  // Keep the pin (and its caption) clear of the strip ends so the label never clips.
  const pinPos = Math.min(97, Math.max(3, route.progress * 100));
  const fillPct = Math.min(100, Math.max(0, route.progress * 100));
  // The pin only shows while open, where it marks "now" on the route — caption it with the live clock.
  const pinTag = formatTime(minutes);

  return (
    <div className="fluffy-hours" suppressHydrationWarning>
      <div className="fluffy-route fluffy-rise">
        <p className="fluffy-eyebrow">Öppettider</p>
        <h2 className="fluffy-route__title">Kika in när du är på väg</h2>

        <span
          className="fluffy-route__status"
          data-open={route.hasHours ? route.isOpen : undefined}
          suppressHydrationWarning
        >
          <span className="fluffy-route__status-dot" aria-hidden="true" />
          {route.hasHours ? (route.isOpen ? 'Öppet nu' : 'Stängt') : 'Öppettider'}
        </span>

        <div
          className="fluffy-route__strip"
          data-open={route.isOpen ? '' : undefined}
          role="img"
          aria-label={
            route.isOpen
              ? `Öppet nu. ${route.bigValue} ${route.bigLabel}. ${route.closeLine}.`
              : `${route.closeLine}. ${route.bigValue} ${route.bigLabel}.`
          }
          suppressHydrationWarning
        >
          <span className="fluffy-route__line" aria-hidden="true">
            <span className="fluffy-route__line-fill" style={{ width: `${fillPct}%` }} />
            <span className="fluffy-route__node fluffy-route__node--start" />
            <span className="fluffy-route__node fluffy-route__node--end" />
            {route.isOpen ? (
              <span className="fluffy-route__pin" style={{ left: `${pinPos}%` }}>
                <span className="fluffy-route__pin-tag">{pinTag}</span>
                <MapPinIcon className="fluffy-route__pin-icon" aria-hidden="true" />
              </span>
            ) : null}
          </span>
          <div className="fluffy-route__ends" aria-hidden="true">
            <span className="fluffy-route__end">
              <b>{route.openText ?? '—'}</b>
              <span>Öppnar</span>
            </span>
            <span className="fluffy-route__end fluffy-route__end--right">
              <b>{route.closeText ?? '—'}</b>
              <span>Stänger</span>
            </span>
          </div>
        </div>

        <p className="fluffy-route__readout" suppressHydrationWarning>
          <span className="fluffy-route__readout-value">{route.bigValue}</span>
          <span className="fluffy-route__readout-label">{route.bigLabel}</span>
        </p>

        <div className="fluffy-route__meta" suppressHydrationWarning>
          <span className="fluffy-route__today">Idag: {capitalize(dateText)}</span>
          <span className="fluffy-route__close">{route.closeLine}</span>
        </div>
      </div>

      <ReceiptHours hours={hours} now={now} isOpen={route.hasHours && status.isOpen} />
    </div>
  );
}

function ReceiptHours({ hours, now, isOpen }: { hours: OpeningHour[]; now: Date; isOpen: boolean }) {
  const { dayOfWeek } = stockholmNow(now);
  const todayShort = `${(DAY_LABELS[dayOfWeek] ?? '').slice(0, 3).toUpperCase()} ${shortDate(now)}`;
  const ordered = [...hours].sort((a, b) => a.dayOfWeek - b.dayOfWeek);

  return (
    <aside className="fluffy-receipt fluffy-rise fluffy-delay-1" aria-label="Veckans öppettider" suppressHydrationWarning>
      <div className="fluffy-receipt__paper">
        <p className="fluffy-receipt__logo">Fluffy&rsquo;s</p>
        <p className="fluffy-receipt__sub">Mat vid vägen · Laxå</p>

        <div className="fluffy-receipt__rule" aria-hidden="true" />
        <div className="fluffy-receipt__row fluffy-receipt__row--head">
          <b>ÖPPETTIDER</b>
          <span className="fluffy-receipt__dots" aria-hidden="true" />
          <span suppressHydrationWarning>{todayShort}</span>
        </div>
        <div className="fluffy-receipt__rule fluffy-receipt__rule--solid" aria-hidden="true" />

        {ordered.length === 0 ? (
          <p className="fluffy-receipt__empty">Öppettider uppdateras inom kort.</p>
        ) : (
          ordered.map((hour) => {
            const isToday = hour.dayOfWeek === dayOfWeek;
            const closed = hour.isClosed || !hour.opensAt || !hour.closesAt;
            return (
              <div
                key={hour.id}
                className="fluffy-receipt__row"
                data-today={isToday ? '' : undefined}
                data-closed={closed ? '' : undefined}
              >
                <b>
                  {(DAY_LABELS[hour.dayOfWeek] ?? '').slice(0, 3).toUpperCase()}
                  {isToday ? <span className="fluffy-receipt__tag"> ‹idag›</span> : null}
                </b>
                <span className="fluffy-receipt__dots" aria-hidden="true" />
                <span>{closed ? closedLabel(hour.label).toUpperCase() : `${hour.opensAt}–${hour.closesAt}`}</span>
              </div>
            );
          })
        )}

        <div className="fluffy-receipt__rule" aria-hidden="true" />
        <div className="fluffy-receipt__row fluffy-receipt__row--total" data-open={isOpen ? '' : undefined}>
          <b>ÖPPET NU?</b>
          <span className="fluffy-receipt__dots" aria-hidden="true" />
          <span suppressHydrationWarning>{isOpen ? 'JA' : 'NEJ'}</span>
        </div>
        <div className="fluffy-receipt__rule fluffy-receipt__rule--solid" aria-hidden="true" />

        <div className="fluffy-receipt__barcode" aria-hidden="true" />
        <p className="fluffy-receipt__code" aria-hidden="true">7 350001 234567</p>
        <p className="fluffy-receipt__thanks">Tack — välkommen in!</p>
      </div>
    </aside>
  );
}
