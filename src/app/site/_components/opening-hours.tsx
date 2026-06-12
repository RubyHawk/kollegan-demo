import type { RestaurantOpeningHourView } from '@modules/supporting/restaurant-menu';
import { DAY_LABELS } from '../_lib/public-site-data';

export function OpeningHours({ hours }: { hours: RestaurantOpeningHourView[] }) {
  if (hours.length === 0) {
    return <p className="text-sm leading-6 text-[#211f1c]/70">Öppettider uppdateras inom kort.</p>;
  }

  return (
    <div className="divide-y divide-[#211f1c]/10">
      {hours.map((hour) => (
        <div key={hour.id} className="flex justify-between gap-4 py-3 text-sm">
          <span className="font-bold text-[#211f1c]">{DAY_LABELS[hour.dayOfWeek]}</span>
          <span className="text-right font-semibold text-[#211f1c]/70">
            {hour.isClosed ? (hour.label ?? 'Stängt') : `${hour.opensAt} - ${hour.closesAt}`}
          </span>
        </div>
      ))}
    </div>
  );
}
