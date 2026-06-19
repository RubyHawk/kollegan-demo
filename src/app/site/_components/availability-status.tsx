'use client';

import { useEffect, useState } from 'react';
import {
  DAY_LABELS,
  formatDuration,
  getOpeningStatus,
  relativeDayWord,
  stockholmNow,
  type OpeningHour,
} from '../_lib/opening-status';

function capitalize(text: string) {
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : text;
}

export function AvailabilityStatus({ hours }: { hours: OpeningHour[] }) {
  // The client computes its own "now" on hydration (suppressHydrationWarning covers the SSR diff);
  // tick so a passing minute — or an open/close boundary — updates without a reload.
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  const status = getOpeningStatus(hours, now);
  const { dateText, dayOfWeek } = stockholmNow(now);

  let headline: string;
  let sub: string | null = null;
  if (!status.hasHours) {
    headline = 'Öppettider uppdateras inom kort';
  } else if (status.isOpen) {
    headline = `Öppet till ${status.closesAtText}`;
    sub = status.minutesUntilClose != null
      ? `${status.closingSoon ? 'Stänger snart · ' : 'Stänger om '}${status.closingSoon ? `om ${formatDuration(status.minutesUntilClose)}` : formatDuration(status.minutesUntilClose)}`
      : null;
  } else if (status.nextOpenDayOfWeek != null && status.nextOpenAtText) {
    const word = relativeDayWord(status.nextOpenDayOfWeek, dayOfWeek, DAY_LABELS);
    const when = word === 'idag' || word === 'imorgon' ? word : `på ${word}`;
    headline = `Öppnar ${when} ${status.nextOpenAtText}`;
    sub = status.today?.isClosed ? 'Stängt idag' : 'Stängt just nu';
  } else {
    headline = 'Stängt';
    sub = 'Inga öppettider just nu';
  }

  const showProgress = status.isOpen && status.progress != null && status.today?.opensAt && status.closesAtText;

  return (
    <div className="fluffy-avail" data-open={status.hasHours ? status.isOpen : undefined} suppressHydrationWarning>
      <div className="fluffy-avail__top">
        <span className="fluffy-avail__pill">
          <span className="fluffy-avail__dot" aria-hidden="true" />
          {status.hasHours ? (status.isOpen ? 'Öppet nu' : 'Stängt') : 'Öppettider'}
        </span>
        <span className="fluffy-avail__date" suppressHydrationWarning>{capitalize(dateText)}</span>
      </div>

      <p className="fluffy-avail__headline" suppressHydrationWarning>{headline}</p>
      {sub ? <p className="fluffy-avail__sub" suppressHydrationWarning>{sub}</p> : null}

      {showProgress ? (
        <div className="fluffy-avail__progress" suppressHydrationWarning>
          <span className="fluffy-avail__track">
            <span className="fluffy-avail__fill" style={{ width: `${Math.round((status.progress ?? 0) * 100)}%` }} />
          </span>
          <div className="fluffy-avail__scale">
            <span>{status.today?.opensAt}</span>
            <span>{status.closesAtText}</span>
          </div>
        </div>
      ) : null}
    </div>
  );
}
