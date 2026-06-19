import type { RestaurantOpeningHourView } from '@modules/supporting/restaurant-menu';
import { DAY_LABELS } from '../_lib/public-site-data';
import { closedLabel, stockholmNow } from '../_lib/opening-status';

export function WeeklyHours({ hours }: { hours: RestaurantOpeningHourView[] }) {
  if (hours.length === 0) {
    return <p className="fluffy-muted">Öppettider uppdateras inom kort.</p>;
  }

  const todayDow = stockholmNow().dayOfWeek;
  const ordered = [...hours].sort((a, b) => a.dayOfWeek - b.dayOfWeek);

  return (
    <ol className="fluffy-week" aria-label="Veckans öppettider">
      {ordered.map((hour) => {
        const isToday = hour.dayOfWeek === todayDow;
        const closed = hour.isClosed || !hour.opensAt || !hour.closesAt;
        return (
          <li
            key={hour.id}
            className="fluffy-week__row"
            data-today={isToday ? '' : undefined}
            data-closed={closed ? '' : undefined}
            aria-current={isToday ? 'date' : undefined}
          >
            <span className="fluffy-week__day">{DAY_LABELS[hour.dayOfWeek]}</span>
            <span className="fluffy-week__time">
              {closed ? closedLabel(hour.label) : `${hour.opensAt}–${hour.closesAt}`}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
