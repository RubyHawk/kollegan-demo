'use client';

import { useEffect, useState } from 'react';
import { ChevronDown, Clock3, Info, MapPin, Wifi, WifiOff } from 'lucide-react';
import { Button } from '@shared/ui/button';
import { StatusBadge } from '@shared/ui/status-badge';
import type { AttendanceShift } from '@shared/lib/api/attendance.api';
import type { RestaurantBusinessDay, RestaurantOrderSummary } from '@shared/lib/api/restaurant-orders.api';
import { timeLabel } from './kassa-helpers';

export function KassaOperationalStrip({
  businessDay,
  currentShift,
  online,
  summary,
  canReadReports,
  orderInfoOpen,
  onToggleOrderInfo,
}: {
  businessDay: RestaurantBusinessDay | null;
  currentShift: AttendanceShift | null;
  online: boolean;
  summary: RestaurantOrderSummary | null;
  canReadReports: boolean;
  orderInfoOpen: boolean;
  onToggleOrderInfo: () => void;
}) {
  const [nowLabel, setNowLabel] = useState('');
  const unpaidCount = summary?.unpaidOrderCount ?? 0;

  useEffect(() => {
    const update = () => setNowLabel(timeLabel(new Date().toISOString()));
    update();
    const timer = window.setInterval(update, 30_000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <header className="fluffy-pos-header flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-[var(--ui-border)] bg-[var(--ui-surface)] px-5 py-2">
      <div className="flex min-w-0 flex-wrap items-center gap-3">
        <div className="flex h-9 items-center gap-2 text-base font-semibold">
          <MapPin size={16} strokeWidth={1.75} />
          <span className="truncate">Fluffy&apos;s Laxå</span>
          <ChevronDown size={16} strokeWidth={1.75} className="text-[var(--ui-text-muted)]" />
        </div>
        <StatusBadge tone={businessDay ? 'success' : 'neutral'}>
          {businessDay ? 'Dag öppen' : 'Dag stängd'}
        </StatusBadge>
        {nowLabel ? (
          <StatusBadge tone="neutral">
            <Clock3 size={14} strokeWidth={1.75} />
            {nowLabel}
          </StatusBadge>
        ) : null}
        <StatusBadge tone={currentShift ? 'success' : 'neutral'}>
          <Clock3 size={14} strokeWidth={1.75} />
          {currentShift ? 'Incheckad' : 'Ej incheckad'}
        </StatusBadge>
        <StatusBadge tone={online ? 'success' : 'warning'}>
          {online ? <Wifi size={14} strokeWidth={1.75} /> : <WifiOff size={14} strokeWidth={1.75} />}
          {online ? 'Online' : 'Offline'}
        </StatusBadge>
      </div>

      <div className="flex items-center gap-3">
        {canReadReports ? (
          <div className="flex items-center gap-2 text-sm font-medium text-[var(--ui-text-secondary)]">
            <span>Obetalda</span>
            <span className="grid h-6 min-w-6 place-items-center rounded-full bg-[var(--ui-accent)] px-1.5 text-xs font-bold text-[var(--ui-text-inverse)]">
              {unpaidCount}
            </span>
          </div>
        ) : null}
        <Button
          type="button"
          variant={orderInfoOpen ? 'default' : 'outline'}
          size="compact"
          className="h-10 px-4"
          onClick={onToggleOrderInfo}
        >
          <Info data-icon="inline-start" />
          Orderinfo
          <ChevronDown size={16} strokeWidth={1.75} />
        </Button>
      </div>
    </header>
  );
}
