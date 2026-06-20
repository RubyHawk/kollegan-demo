'use client';

import { Clock3, Info, MapPin, Wifi, WifiOff } from 'lucide-react';
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
  return (
    <header className="fluffy-pos-header flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-[var(--ui-border)] bg-[var(--ui-surface)] px-3 py-2">
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <div className="flex h-9 items-center gap-2 rounded-[var(--ui-radius-md)] border border-[var(--ui-border)] bg-[var(--ui-surface-subtle)] px-3 text-sm font-semibold">
          <MapPin size={16} strokeWidth={1.75} />
          <span className="truncate">Fluffy&apos;s</span>
        </div>
        <StatusBadge tone={businessDay ? 'success' : 'neutral'}>
          {businessDay ? `Dag öppen ${timeLabel(businessDay.openedAt)}` : 'Dag stängd'}
        </StatusBadge>
        <StatusBadge tone={currentShift ? 'success' : 'neutral'}>
          <Clock3 size={14} strokeWidth={1.75} />
          {currentShift ? 'Incheckad' : 'Ej incheckad'}
        </StatusBadge>
        <StatusBadge tone={online ? 'success' : 'warning'}>
          {online ? <Wifi size={14} strokeWidth={1.75} /> : <WifiOff size={14} strokeWidth={1.75} />}
          {online ? 'Online' : 'Offline'}
        </StatusBadge>
        {canReadReports ? (
          <StatusBadge tone={(summary?.unpaidOrderCount ?? 0) > 0 ? 'warning' : 'success'}>
            {summary?.unpaidOrderCount ?? 0} obetalda
          </StatusBadge>
        ) : null}
      </div>

      <Button
        type="button"
        variant={orderInfoOpen ? 'default' : 'outline'}
        size="compact"
        onClick={onToggleOrderInfo}
      >
        <Info data-icon="inline-start" />
        Orderinfo
      </Button>
    </header>
  );
}
