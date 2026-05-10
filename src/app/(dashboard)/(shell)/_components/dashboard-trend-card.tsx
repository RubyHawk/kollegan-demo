'use client';

import { useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { OfferActivityPoint } from '@modules/generic/dashboard';
import { cn } from '@shared/lib/utils';
import { DashboardCard } from './dashboard-view-parts';

type RangePreset = '7d' | '30d' | '90d' | '365d' | 'custom';

interface TrendBucket {
  label: string;
  longLabel: string;
  count: number;
  accepted: number;
}

const RANGE_OPTIONS: Array<{ id: RangePreset; label: string; days?: number }> = [
  { id: '7d', label: '1v', days: 7 },
  { id: '30d', label: '1 mån', days: 30 },
  { id: '90d', label: '3 mån', days: 90 },
  { id: '365d', label: '1 år', days: 365 },
  { id: 'custom', label: 'Datum' },
];

function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function endOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(23, 59, 59, 999);
  return next;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function addMonths(date: Date, months: number) {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
}

function monthStart(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function monthEnd(date: Date) {
  return endOfDay(new Date(date.getFullYear(), date.getMonth() + 1, 0));
}

function dayDiff(start: Date, end: Date) {
  return Math.max(1, Math.floor((endOfDay(end).getTime() - startOfDay(start).getTime()) / 86400000) + 1);
}

function toInputDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function fmtShort(date: Date) {
  return new Intl.DateTimeFormat('sv-SE', { day: 'numeric', month: 'short' }).format(date);
}

function fmtLong(date: Date) {
  return new Intl.DateTimeFormat('sv-SE', { day: 'numeric', month: 'short', year: 'numeric' }).format(date);
}

function fmtMonth(date: Date) {
  return new Intl.DateTimeFormat('sv-SE', { month: 'short' }).format(date);
}

function fmtRangeLabel(start: Date, end: Date) {
  return `${fmtLong(start)} - ${fmtLong(end)}`;
}

function clampDateRange(startValue: string, endValue: string) {
  if (!startValue || !endValue || startValue <= endValue) return { startValue, endValue };
  return { startValue, endValue: startValue };
}

function getRangeBounds(range: RangePreset, customStart: string, customEnd: string) {
  const today = new Date();
  if (range === 'custom' && customStart && customEnd) {
    return { start: startOfDay(new Date(customStart)), end: endOfDay(new Date(customEnd)) };
  }
  const option = RANGE_OPTIONS.find((item) => item.id === range);
  return { start: startOfDay(addDays(today, -((option?.days ?? 30) - 1))), end: endOfDay(today) };
}

function buildTrendBuckets(activityData: OfferActivityPoint[], start: Date, end: Date): TrendBucket[] {
  const filtered = activityData.filter((event) => {
    const date = new Date(event.createdAt);
    return date >= start && date <= end;
  });
  const totalDays = dayDiff(start, end);
  const buckets: TrendBucket[] = [];

  if (totalDays <= 14) {
    for (let current = startOfDay(start); current <= end; current = addDays(current, 1)) {
      const bucketStart = startOfDay(current);
      const bucketEnd = endOfDay(current);
      const matches = filtered.filter((event) => {
        const date = new Date(event.createdAt);
        return date >= bucketStart && date <= bucketEnd;
      });
      buckets.push({
        label: fmtShort(bucketStart),
        longLabel: fmtLong(bucketStart),
        count: matches.length,
        accepted: matches.filter((event) => event.status === 'accepted').length,
      });
    }
    return buckets;
  }

  if (totalDays <= 62) {
    for (let current = startOfDay(start); current <= end; current = addDays(current, 7)) {
      const bucketStart = startOfDay(current);
      const weekEnd = addDays(current, 6);
      const bucketEnd = endOfDay(weekEnd <= end ? weekEnd : end);
      const matches = filtered.filter((event) => {
        const date = new Date(event.createdAt);
        return date >= bucketStart && date <= bucketEnd;
      });
      buckets.push({
        label: fmtShort(bucketStart),
        longLabel: `${fmtShort(bucketStart)} - ${fmtShort(bucketEnd)}`,
        count: matches.length,
        accepted: matches.filter((event) => event.status === 'accepted').length,
      });
    }
    return buckets;
  }

  for (let current = monthStart(start); current <= end; current = addMonths(current, 1)) {
    const bucketStart = monthStart(current);
    const bucketEnd = monthEnd(current) <= end ? monthEnd(current) : end;
    const matches = filtered.filter((event) => {
      const date = new Date(event.createdAt);
      return date >= bucketStart && date <= bucketEnd;
    });
    buckets.push({
      label: fmtMonth(bucketStart),
      longLabel: new Intl.DateTimeFormat('sv-SE', { month: 'long', year: 'numeric' }).format(bucketStart),
      count: matches.length,
      accepted: matches.filter((event) => event.status === 'accepted').length,
    });
  }
  return buckets;
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number; name: string; color: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-0)] px-3 py-2 shadow-[0_10px_22px_rgba(15,23,42,0.12)]">
      <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">{label}</p>
      {payload.map((item) => (
        <div key={item.name} className="flex items-center gap-2 text-xs">
          <span className="h-2 w-2 rounded-full" style={{ background: item.color }} />
          <span className="text-[var(--text-secondary)]">{item.name === 'count' ? 'Skapade' : 'Accepterade'}</span>
          <span className="ml-auto font-semibold tabular-nums text-[var(--text-primary)]">{item.value}</span>
        </div>
      ))}
    </div>
  );
}

export function TrendCard({ activityData }: { activityData: OfferActivityPoint[] }) {
  const [range, setRange] = useState<RangePreset>('90d');
  const [customStart, setCustomStart] = useState(toInputDate(addDays(new Date(), -29)));
  const [customEnd, setCustomEnd] = useState(toInputDate(new Date()));

  const { start, end } = useMemo(
    () => getRangeBounds(range, customStart, customEnd),
    [customEnd, customStart, range],
  );

  const buckets = useMemo(
    () => buildTrendBuckets(activityData, start, end),
    [activityData, end, start],
  );
  const createdTotal = buckets.reduce((sum, bucket) => sum + bucket.count, 0);
  const acceptedTotal = buckets.reduce((sum, bucket) => sum + bucket.accepted, 0);
  const successRate = createdTotal > 0 ? Math.round((acceptedTotal / createdTotal) * 100) : 0;

  const chartData = useMemo(() => {
    const stride = Math.max(1, Math.ceil(buckets.length / 6));
    return buckets.map((bucket, index) => ({
      ...bucket,
      displayLabel: index % stride === 0 ? bucket.label : '',
    }));
  }, [buckets]);
  const yMax = Math.max(...buckets.map((bucket) => bucket.count), 1);
  const tickCount = Math.min(yMax, 4);
  const yTicks = Array.from({ length: tickCount + 1 }, (_, index) => Math.round((yMax / tickCount) * index));

  return (
    <DashboardCard
      title="Tidsöversikt"
      description={fmtRangeLabel(start, end)}
      action={(
        <div className="hidden items-center gap-2 text-[11px] sm:flex">
          <span className="font-semibold tabular-nums text-[var(--text-primary)]">{createdTotal}</span>
          <span className="text-[var(--text-muted)]">skapade</span>
        </div>
      )}
    >
      <div className="p-4">
        <div className="mb-3 grid grid-cols-3 gap-2">
          {[
            { label: 'Skapade', value: createdTotal.toLocaleString('sv-SE') },
            { label: 'Accepterade', value: acceptedTotal.toLocaleString('sv-SE') },
            { label: 'Träff', value: `${successRate}%` },
          ].map((item) => (
            <div key={item.label} className="rounded-2xl border border-[var(--border-light)] bg-[color-mix(in_srgb,var(--surface-0)_84%,var(--surface-1))] px-3 py-2.5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-[var(--text-muted)]">{item.label}</p>
              <p className="mt-1 text-lg font-semibold tabular-nums text-[var(--text-primary)]">{item.value}</p>
            </div>
          ))}
        </div>

        {createdTotal === 0 ? (
          <div className="flex h-[200px] items-center justify-center rounded-[20px] border border-dashed border-[var(--border)] bg-[var(--surface-1)] text-center">
            <div>
              <p className="text-sm font-semibold text-[var(--text-primary)]">Inga offerter i vald period</p>
              <p className="mt-1 text-xs text-[var(--text-secondary)]">Prova ett längre intervall.</p>
            </div>
          </div>
        ) : (
          <div className="rounded-[20px] border border-[var(--border-light)] bg-[color-mix(in_srgb,var(--surface-0)_82%,var(--surface-1))] px-2 pt-3 pb-1">
            <ResponsiveContainer width="100%" height={190}>
              <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                <defs>
                  <linearGradient id="dashboardCreated" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="var(--accent)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="dashboardAccepted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--status-accepted-text)" stopOpacity={0.14} />
                    <stop offset="95%" stopColor="var(--status-accepted-text)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 6"
                  stroke="color-mix(in srgb, var(--border) 70%, transparent)"
                  vertical={false}
                />
                <XAxis
                  dataKey="displayLabel"
                  tick={{ fill: 'var(--text-muted)', fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  interval={0}
                />
                <YAxis
                  ticks={yTicks}
                  tick={{ fill: 'var(--text-muted)', fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                  width={36}
                />
                <Tooltip
                  content={<ChartTooltip />}
                  cursor={{ stroke: 'var(--accent)', strokeWidth: 1, strokeDasharray: '4 4', opacity: 0.55 }}
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  name="count"
                  stroke="var(--accent)"
                  strokeWidth={2.2}
                  fill="url(#dashboardCreated)"
                  dot={false}
                  activeDot={{ r: 4, fill: 'var(--surface-0)', stroke: 'var(--accent)', strokeWidth: 2 }}
                />
                <Area
                  type="monotone"
                  dataKey="accepted"
                  name="accepted"
                  stroke="var(--status-accepted-text)"
                  strokeWidth={2}
                  fill="url(#dashboardAccepted)"
                  dot={false}
                  activeDot={{ r: 4, fill: 'var(--status-accepted-text)', strokeWidth: 0 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 pr-1 text-[11px] text-[var(--text-secondary)]">
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[var(--accent)]" />Skapade</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[var(--status-accepted-text)]" />Accepterade</span>
          </div>
          <div className="flex flex-wrap items-center gap-1">
            {RANGE_OPTIONS.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setRange(option.id)}
                className={cn(
                  'rounded-full px-2.5 py-1 text-[10px] font-semibold transition-colors',
                  range === option.id
                    ? 'bg-[var(--accent)] text-white'
                    : 'border border-[var(--border-light)] bg-[var(--surface-1)] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]',
                )}
              >
                {option.label}
              </button>
            ))}
          </div>

          {range === 'custom' ? (
            <div className="grid w-full grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-1.5 sm:ml-auto sm:w-auto">
              <input
                type="date"
                value={customStart}
                onChange={(event) => {
                  const next = clampDateRange(event.target.value, customEnd);
                  setCustomStart(next.startValue);
                  setCustomEnd(next.endValue);
                }}
                className="h-8 min-w-0 rounded-lg border border-[var(--border)] bg-[var(--surface-1)] px-2 text-[11px] font-medium text-[var(--text-primary)] outline-none focus:ring-1 focus:ring-[var(--accent)]"
              />
              <span className="text-[10px] text-[var(--text-muted)]">till</span>
              <input
                type="date"
                value={customEnd}
                min={customStart}
                onChange={(event) => {
                  const next = clampDateRange(customStart, event.target.value);
                  setCustomStart(next.startValue);
                  setCustomEnd(next.endValue);
                }}
                className="h-8 min-w-0 rounded-lg border border-[var(--border)] bg-[var(--surface-1)] px-2 text-[11px] font-medium text-[var(--text-primary)] outline-none focus:ring-1 focus:ring-[var(--accent)]"
              />
            </div>
          ) : null}
        </div>
      </div>
    </DashboardCard>
  );
}
