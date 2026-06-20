'use client';

import { useEffect, useState } from 'react';
import { CarFrontIcon } from 'lucide-react';
import {
  DAY_LABELS,
  closedLabel,
  getOpeningStatus,
  getRouteStrip,
  stockholmNow,
  type OpeningHour,
} from '../_lib/opening-status';

const TZ = 'Europe/Stockholm';

// "Road" geometry. The SVG is stretched to the road box (preserveAspectRatio="none"), so a point
// (x, y) in this viewBox maps linearly to that box — letting us drop the live pin exactly on the
// line by evaluating the same profile function the path is built from.
const VB_W = 740;
const VB_H = 160;
const RX0 = 20;
const RX1 = 720;
const BASE_Y = 108;

// A calmer, road-like profile: one gentle hump early in the open stretch, then it settles almost
// flat with a faint ripple toward closing — less decorative than a full sine wave.
function waveY(x: number): number {
  const t = (x - RX0) / (RX1 - RX0); // 0 at open … 1 at close
  const hump = Math.exp(-((t - 0.24) ** 2) / 0.02) * 17;
  const ripple = Math.sin(t * Math.PI * 4) * 2.4 * t;
  return BASE_Y - hump + ripple;
}

const ROAD_D = (() => {
  const steps = 90;
  let d = '';
  for (let i = 0; i <= steps; i += 1) {
    const x = RX0 + ((RX1 - RX0) * i) / steps;
    d += `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${waveY(x).toFixed(1)} `;
  }
  return d.trim();
})();

function capitalize(text: string) {
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : text;
}

/** "20/6" — day/month, Stockholm wall-clock. */
function shortDate(now: Date): string {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: TZ, day: 'numeric', month: 'numeric' }).format(now);
}

/**
 * Concept D · Route Strip. The left panel renders today's opening window as a roadside map — a
 * wavy route from opening to closing with a live "now" pin — and the right panel is a thermal
 * receipt of the whole week. Both read the same live opening-hours data and tick once a minute.
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
  const { dateText } = stockholmNow(now);

  // The road as a time journey at one consistent weight: solid green = open→now (0→gp), an orange
  // band straddling the live marker, and the dashed base showing the remaining open time (now→close).
  // gp is kept just off the ends so the pin and its bubble never clip.
  const gp = route.isOpen ? Math.min(90, Math.max(4, route.progress * 100)) : 0;
  const orangeStart = route.isOpen ? Math.max(0, gp - 5) : 0;
  const orangeEnd = route.isOpen ? Math.min(99, gp + 5) : 0;
  const orangeLen = Math.max(0, orangeEnd - orangeStart);
  const xPin = RX0 + (RX1 - RX0) * (gp / 100);
  const pinLeft = (xPin / VB_W) * 100;
  const pinTop = (waveY(xPin) / VB_H) * 100;
  const bigParts = route.bigValue.split(' ');

  return (
    <div className="fluffy-routehours" suppressHydrationWarning>
      <div className="fluffy-route fluffy-rise">
        <p className="fluffy-eyebrow">Öppettider</p>
        <h2 className="fluffy-route__title">
          <span>Kika in när</span>
          <span>du är på väg</span>
        </h2>

        <div
          className="fluffy-routecard"
          data-open={route.hasHours ? route.isOpen : undefined}
          suppressHydrationWarning
        >
          <svg className="fluffy-routecard__compass" viewBox="0 0 48 48" aria-hidden="true">
            <circle cx="24" cy="24" r="20.5" fill="none" stroke="currentColor" strokeWidth="1.3" />
            <path d="M24 7 L28 24 L24 41 L20 24 Z" fill="currentColor" opacity="0.55" />
            <path d="M7 24 L24 20 L41 24 L24 28 Z" fill="currentColor" opacity="0.28" />
            <text x="24" y="6.5" textAnchor="middle" fontSize="7" fill="currentColor">N</text>
          </svg>

          <div
            className="fluffy-routecard__track"
            role="img"
            aria-label={
              route.isOpen
                ? `Öppet nu. ${route.bigValue} ${route.bigLabel}. ${route.closeLine}.`
                : `${route.closeLine}. ${route.bigValue} ${route.bigLabel}.`
            }
            suppressHydrationWarning
          >
            <span className="fluffy-routecard__end fluffy-routecard__end--start">
              <b>{route.openText ?? '—'}</b>
              <span>Öppnar</span>
            </span>

            <span className="fluffy-routecard__road-wrap">
              <svg className="fluffy-routecard__road" viewBox={`0 0 ${VB_W} ${VB_H}`} preserveAspectRatio="none" aria-hidden="true">
                <path className="fluffy-routecard__road-base" d={ROAD_D} pathLength={100} />
                <path className="fluffy-routecard__road-green" d={ROAD_D} pathLength={100} style={{ strokeDasharray: `${gp} ${100 - gp}` }} />
                <path
                  className="fluffy-routecard__road-orange"
                  d={ROAD_D}
                  pathLength={100}
                  style={{ strokeDasharray: `0 ${orangeStart} ${orangeLen} 100` }}
                />
              </svg>
              {route.isOpen ? (
                <span className="fluffy-routecard__pin" style={{ left: `${pinLeft}%`, top: `${pinTop}%` }}>
                  <span className="fluffy-routecard__bubble">Öppet nu</span>
                  <svg className="fluffy-routecard__mark" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12 23s7.5-7.2 7.5-13A7.5 7.5 0 1 0 4.5 10C4.5 15.8 12 23 12 23Z" />
                    <circle cx="12" cy="9.6" r="3" />
                  </svg>
                </span>
              ) : null}
            </span>

            <span className="fluffy-routecard__end fluffy-routecard__end--end">
              <b>{route.closeText ?? '—'}</b>
              <span>Stänger</span>
            </span>
          </div>

          <div className="fluffy-routecard__rule" aria-hidden="true" />

          <div className="fluffy-routecard__readout">
            <span className="fluffy-routecard__today" suppressHydrationWarning>Idag: {capitalize(dateText)}</span>
            <p className="fluffy-routecard__time" suppressHydrationWarning>
              {bigParts.map((part, i) => (
                <span
                  key={`${part}-${i}`}
                  className={`fluffy-routecard__num${i === bigParts.length - 1 ? ' is-accent' : ''}`}
                >
                  {part}
                </span>
              ))}
              <span className="fluffy-routecard__time-label">{route.bigLabel}</span>
            </p>
            <span className="fluffy-routecard__close" suppressHydrationWarning>{route.closeLine}</span>
          </div>
        </div>

        <div className="fluffy-route__foot">
          <span className="fluffy-route__foot-icon" aria-hidden="true">
            <CarFrontIcon />
          </span>
          <div className="fluffy-route__foot-copy">
            <p className="fluffy-route__foot-title">Mat vid vägen</p>
            <p className="fluffy-route__foot-text">Vi finns längs E20 i Laxå.</p>
            <p className="fluffy-route__foot-text">Perfekt stopp på vägen.</p>
          </div>
          <span className="fluffy-route__foot-mark" aria-hidden="true">Välkommen in!</span>
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
      <span className="fluffy-receipt__tape" aria-hidden="true" />
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
                  {isToday ? <span className="fluffy-receipt__tag"> &lt;idag&gt;</span> : null}
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
