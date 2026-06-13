import type { RestaurantOpeningHourView } from '@modules/supporting/restaurant-menu';
import { DAY_LABELS } from '../_lib/public-site-data';

export function OpeningHours({ hours }: { hours: RestaurantOpeningHourView[] }) {
  if (hours.length === 0) {
    return <p className="fluffy-muted">Öppettider uppdateras inom kort.</p>;
  }

  return (
    <div className="fluffy-hours">
      {hours.map((hour) => (
        <div key={hour.id} className="fluffy-hours__row">
          <span className="fluffy-hours__day">{DAY_LABELS[hour.dayOfWeek]}</span>
          <span className="fluffy-hours__time">
            {hour.isClosed ? (hour.label ?? 'Stängt') : `${hour.opensAt} - ${hour.closesAt}`}
          </span>
        </div>
      ))}
    </div>
  );
}
