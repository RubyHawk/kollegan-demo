'use client';

import { useEffect, useRef, useState } from 'react';
import { animate, motion, useMotionValue } from 'framer-motion';
import Link from 'next/link';
import { cn } from '@shared/lib/utils';

export interface RecentOffer {
  id: string;
  title: string;
  status: string;
  offerNumber: number | null;
  recipientName: string | null;
  recipientCompany: string | null;
  totalIncVat: number;
  createdAt: string;
  validUntil: string | null;
}

export interface OfferActivityPoint {
  createdAt: string;
  status: string;
}

export interface DashboardViewProps {
  greetingText: string;
  greetingSub: string;
  dateLabel: string;
  acceptedValue: number;
  pipelineValue: number;
  acceptanceRate: number | null;
  expiringSoon: number;
  total: number;
  countMap: Record<string, number>;
  recentOffers: RecentOffer[];
  activityData: OfferActivityPoint[];
}

type RangePreset = '7d' | '30d' | '90d' | '365d' | 'custom';

interface TrendBucket {
  label: string;
  longLabel: string;
  count: number;
  accepted: number;
}

const OFFERS_PER_PAGE = 5;

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.04 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring' as const, stiffness: 300, damping: 30 },
  },
};

const fadeIn = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.28 } },
};

const STATUS_ORDER = ['sent', 'viewed', 'accepted', 'draft', 'declined', 'expired'] as const;

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  draft: { label: 'Utkast', color: 'var(--status-draft-text)', bg: 'var(--status-draft-bg)' },
  sent: { label: 'Skickad', color: 'var(--status-sent-text)', bg: 'var(--status-sent-bg)' },
  viewed: { label: 'Visad', color: 'var(--status-viewed-text)', bg: 'var(--status-viewed-bg)' },
  accepted: { label: 'Accepterad', color: 'var(--status-accepted-text)', bg: 'var(--status-accepted-bg)' },
  declined: { label: 'Avvisad', color: 'var(--status-declined-text)', bg: 'var(--status-declined-bg)' },
  expired: { label: 'Utgången', color: 'var(--status-expired-text)', bg: 'var(--status-expired-bg)' },
};

const RANGE_OPTIONS: Array<{ id: RangePreset; label: string; days?: number }> = [
  { id: '7d', label: '1 v', days: 7 },
  { id: '30d', label: '1 mån', days: 30 },
  { id: '90d', label: '3 mån', days: 90 },
  { id: '365d', label: '1 år', days: 365 },
  { id: 'custom', label: 'Datum' },
];

const currencyFormatter = new Intl.NumberFormat('sv-SE', {
  style: 'currency',
  currency: 'SEK',
  maximumFractionDigits: 0,
});

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
  const diff = endOfDay(end).getTime() - startOfDay(start).getTime();
  return Math.max(1, Math.floor(diff / (24 * 60 * 60 * 1000)) + 1);
}

function toInputDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatShortDate(date: Date) {
  return new Intl.DateTimeFormat('sv-SE', { day: 'numeric', month: 'short' }).format(date);
}

function formatLongDate(date: Date) {
  return new Intl.DateTimeFormat('sv-SE', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

function formatMonthLabel(date: Date) {
  return new Intl.DateTimeFormat('sv-SE', { month: 'short' }).format(date);
}

function formatWeekLabel(date: Date) {
  return `${formatShortDate(date)}-${formatShortDate(addDays(date, 6))}`;
}

function formatRangeLabel(start: Date, end: Date) {
  return `${formatLongDate(start)} - ${formatLongDate(end)}`;
}

function clampDateRange(startValue: string, endValue: string) {
  if (!startValue || !endValue || startValue <= endValue) {
    return { startValue, endValue };
  }

  return { startValue, endValue: startValue };
}

function getRangeBounds(range: RangePreset, customStart: string, customEnd: string) {
  const today = new Date();
  const end = endOfDay(today);

  if (range === 'custom' && customStart && customEnd) {
    return {
      start: startOfDay(new Date(customStart)),
      end: endOfDay(new Date(customEnd)),
    };
  }

  const option = RANGE_OPTIONS.find((entry) => entry.id === range);
  const days = option?.days ?? 30;
  return { start: startOfDay(addDays(today, -(days - 1))), end };
}

function buildTrendBuckets(activityData: OfferActivityPoint[], start: Date, end: Date) {
  const filtered = activityData.filter((entry) => {
    const createdAt = new Date(entry.createdAt);
    return createdAt >= start && createdAt <= end;
  });

  const totalDays = dayDiff(start, end);
  const buckets: TrendBucket[] = [];

  if (totalDays <= 14) {
    for (let cursor = startOfDay(start); cursor <= end; cursor = addDays(cursor, 1)) {
      const bucketStart = startOfDay(cursor);
      const bucketEnd = endOfDay(cursor);
      const matches = filtered.filter((entry) => {
        const createdAt = new Date(entry.createdAt);
        return createdAt >= bucketStart && createdAt <= bucketEnd;
      });

      buckets.push({
        label: formatShortDate(bucketStart),
        longLabel: formatLongDate(bucketStart),
        count: matches.length,
        accepted: matches.filter((entry) => entry.status === 'accepted').length,
      });
    }

    return buckets;
  }

  if (totalDays <= 62) {
    for (let cursor = startOfDay(start); cursor <= end; cursor = addDays(cursor, 7)) {
      const bucketStart = startOfDay(cursor);
      const weekEnd = addDays(cursor, 6);
      const bucketEnd = endOfDay(weekEnd <= end ? weekEnd : end);
      const matches = filtered.filter((entry) => {
        const createdAt = new Date(entry.createdAt);
        return createdAt >= bucketStart && createdAt <= bucketEnd;
      });

      buckets.push({
        label: formatShortDate(bucketStart),
        longLabel: formatWeekLabel(bucketStart),
        count: matches.length,
        accepted: matches.filter((entry) => entry.status === 'accepted').length,
      });
    }

    return buckets;
  }

  for (let cursor = monthStart(start); cursor <= end; cursor = addMonths(cursor, 1)) {
    const bucketStart = monthStart(cursor);
    const currentMonthEnd = monthEnd(cursor);
    const bucketEnd = currentMonthEnd <= end ? currentMonthEnd : end;
    const matches = filtered.filter((entry) => {
      const createdAt = new Date(entry.createdAt);
      return createdAt >= bucketStart && createdAt <= bucketEnd;
    });

    buckets.push({
      label: formatMonthLabel(bucketStart),
      longLabel: new Intl.DateTimeFormat('sv-SE', {
        month: 'long',
        year: 'numeric',
      }).format(bucketStart),
      count: matches.length,
      accepted: matches.filter((entry) => entry.status === 'accepted').length,
    });
  }

  return buckets;
}

function fmtSEK(value: number) {
  return currencyFormatter.format(value);
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('sv-SE', { day: '2-digit', month: 'short' });
}

function buildLinePath(points: Array<{ x: number; y: number }>) {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
  return points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');
}

function buildAreaPath(points: Array<{ x: number; y: number }>, baseline: number) {
  if (points.length === 0) return '';
  const first = points[0];
  const last = points[points.length - 1];
  return `${buildLinePath(points)} L ${last.x} ${baseline} L ${first.x} ${baseline} Z`;
}

function DashboardClock() {
  const [time, setTime] = useState('');

  useEffect(() => {
    function tick() {
      setTime(
        new Date().toLocaleTimeString('sv-SE', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          timeZone: 'Europe/Stockholm',
        }),
      );
    }

    tick();
    const intervalId = setInterval(tick, 1000);
    return () => clearInterval(intervalId);
  }, []);

  if (!time) {
    return <div className="h-10 w-32 rounded-2xl bg-[var(--surface-1)]" aria-hidden="true" />;
  }

  return (
    <div className="rounded-[18px] border border-[var(--border)] bg-[linear-gradient(180deg,var(--surface-0),var(--surface-1))] px-3 py-2 shadow-[0_8px_20px_rgba(0,0,0,0.07)]">
      <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--text-muted)]">
        Stockholm
      </p>
      <p className="mt-0.5 font-mono text-[20px] font-semibold tracking-tight text-[var(--text-primary)] tabular-nums">
        {time}
      </p>
    </div>
  );
}

function Counter({
  to,
  prefix = '',
  suffix = '',
  decimals = 0,
}: {
  to: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
}) {
  const motionValue = useMotionValue(0);
  const [display, setDisplay] = useState('0');

  useEffect(() => {
    const controls = animate(motionValue, to, {
      duration: 0.9,
      ease: [0.16, 1, 0.3, 1],
      onUpdate(value) {
        setDisplay(
          value.toLocaleString('sv-SE', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
          }),
        );
      },
    });

    return controls.stop;
  }, [decimals, motionValue, to]);

  return (
    <>
      {prefix}
      {display}
      {suffix}
    </>
  );
}

function KpiCard({
  label,
  value,
  sub,
  icon,
  tone,
  className,
}: {
  label: string;
  value: React.ReactNode;
  sub: string;
  icon: React.ReactNode;
  tone: string;
  className?: string;
}) {
  return (
    <div className={cn('flex h-full items-start gap-3 rounded-[18px] px-3 py-3 sm:px-3.5', className)}>
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]"
        style={{
          background: tone,
          color: 'white',
        }}
      >
        {icon}
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
          {label}
        </p>
        <div className="mt-1 flex items-baseline gap-2 text-[var(--text-primary)]">
          <p className="text-[19px] font-semibold leading-none tracking-tight tabular-nums">{value}</p>
        </div>
        <p className="mt-1 text-[11px] leading-4 text-[var(--text-secondary)]">
          {sub}
        </p>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const meta = STATUS_META[status];
  if (!meta) {
    return null;
  }

  return (
    <span
      className="shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold"
      style={{ background: meta.bg, color: meta.color }}
    >
      {meta.label}
    </span>
  );
}

function StatusDistributionCard({
  countMap,
  total,
}: {
  countMap: Record<string, number>;
  total: number;
}) {
  const rows = STATUS_ORDER.map((status) => {
    const count = countMap[status] ?? 0;
    return {
      status,
      count,
      percent: total > 0 ? Math.round((count / total) * 100) : 0,
      ...STATUS_META[status],
    };
  });

  const populatedRows = rows.filter((row) => row.count > 0);
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const donutRows = populatedRows.map((row) => {
    const segment = circumference * (row.count / total);
    return { ...row, segment };
  });
  const donutSegments = donutRows.map((row, index) => ({
    ...row,
    dashOffset: donutRows.slice(0, index).reduce((sum, entry) => sum + entry.segment, 0),
  }));

  return (
    <motion.div
      variants={fadeUp}
      className="rounded-[20px] border border-[var(--border)] bg-[linear-gradient(180deg,var(--surface-0),var(--surface-1))] px-4 py-3.5 shadow-[0_14px_34px_rgba(0,0,0,0.06)]"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold tracking-tight text-[var(--text-primary)]">
            Statusfördelning
          </h2>
          <p className="mt-0.5 text-[11px] text-[var(--text-secondary)]">
            Pipeline och avslut just nu
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
            Totalt
          </span>
          <span className="text-base font-semibold tabular-nums text-[var(--text-primary)]">
            {total}
          </span>
        </div>
      </div>

      {total === 0 ? (
        <div className="mt-3 rounded-[14px] border border-dashed border-[var(--border)] bg-[var(--surface-1)] px-4 py-6 text-center">
          <p className="text-xs font-medium text-[var(--text-primary)]">Ingen status att visa ännu</p>
          <p className="mt-1 text-[11px] text-[var(--text-secondary)]">
            När offerter börjar skickas fylls fördelningen på automatiskt här.
          </p>
        </div>
      ) : (
        <div className="mt-3 grid items-center gap-4 sm:grid-cols-[116px_minmax(0,1fr)]">
          <div className="relative mx-auto h-[108px] w-[108px] sm:mx-0">
            <svg viewBox="0 0 132 132" className="h-[108px] w-[108px] -rotate-90">
              <circle
                cx="66"
                cy="66"
                r={radius}
                fill="none"
                stroke="color-mix(in srgb, var(--border) 80%, transparent)"
                strokeWidth="16"
              />
              {donutSegments.map((row) => (
                <circle
                  key={row.status}
                  cx="66"
                  cy="66"
                  r={radius}
                  fill="none"
                  stroke={row.color}
                  strokeLinecap="round"
                  strokeWidth="16"
                  strokeDasharray={`${row.segment} ${circumference - row.segment}`}
                  strokeDashoffset={-row.dashOffset}
                />
              ))}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-[22px] font-semibold leading-none tabular-nums text-[var(--text-primary)]">
                {total}
              </span>
              <span className="mt-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
                offerter
              </span>
            </div>
          </div>

          <div className="grid gap-x-4 gap-y-1.5 sm:grid-cols-2">
            {rows.map((row) => (
              <div key={row.status} className="flex items-center gap-2">
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ background: row.color }}
                  aria-hidden="true"
                />
                <span className="flex-1 truncate text-[11.5px] font-medium text-[var(--text-primary)]">
                  {row.label}
                </span>
                <span className="tabular-nums text-[11px] text-[var(--text-secondary)]">
                  {row.percent}%
                </span>
                <span className="w-5 text-right text-[12px] font-semibold tabular-nums text-[var(--text-primary)]">
                  {row.count}
                </span>
                <div
                  className="h-1 w-12 shrink-0 overflow-hidden rounded-full"
                  style={{ background: 'var(--surface-2)' }}
                >
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${row.percent}%` }}
                    transition={{ duration: 0.45, ease: 'easeOut' }}
                    className="h-full rounded-full"
                    style={{ background: row.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}

interface TooltipState {
  x: number;
  y: number;
  bucket: TrendBucket;
}

function TrendChart({
  data,
  empty,
}: {
  data: TrendBucket[];
  empty: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  const maxValue = Math.max(...data.map((bucket) => bucket.count), 1);
  const width = 720;
  const height = 180;
  const paddingX = 18;
  const paddingTop = 12;
  const paddingBottom = 22;
  const chartHeight = height - paddingTop - paddingBottom;
  const baseline = height - paddingBottom;
  const step = data.length > 1 ? (width - paddingX * 2) / (data.length - 1) : 0;
  const totalPoints = data.map((bucket, index) => ({
    x: paddingX + step * index,
    y: baseline - (bucket.count / maxValue) * chartHeight,
  }));
  const acceptedPoints = data.map((bucket, index) => ({
    x: paddingX + step * index,
    y: baseline - (bucket.accepted / maxValue) * chartHeight,
  }));

  const labelStride = Math.max(1, Math.ceil(data.length / 8));

  function handleMouseMove(e: React.MouseEvent<SVGSVGElement>) {
    const container = containerRef.current;
    if (!container || data.length === 0) return;
    const rect = container.getBoundingClientRect();
    const relX = e.clientX - rect.left;
    const relY = e.clientY - rect.top;
    const svgX = (relX / rect.width) * width;
    let closestIndex = 0;
    let minDist = Infinity;
    totalPoints.forEach((pt, i) => {
      const dist = Math.abs(pt.x - svgX);
      if (dist < minDist) { minDist = dist; closestIndex = i; }
    });
    setTooltip({ x: relX, y: relY, bucket: data[closestIndex] });
  }

  if (empty) {
    return (
      <div className="rounded-[14px] border border-dashed border-[var(--border)] bg-[var(--surface-1)] px-4 py-8 text-center">
        <p className="text-xs font-medium text-[var(--text-primary)]">Inga offerter i vald period</p>
        <p className="mt-1 text-[11px] text-[var(--text-secondary)]">
          Prova ett längre intervall eller välj ett eget datumspann.
        </p>
      </div>
    );
  }

  const hoveredIndex = tooltip
    ? (() => {
        const svgX = (tooltip.x / (containerRef.current?.getBoundingClientRect().width ?? 1)) * width;
        let ci = 0;
        let md = Infinity;
        totalPoints.forEach((pt, i) => {
          const d = Math.abs(pt.x - svgX);
          if (d < md) { md = d; ci = i; }
        });
        return ci;
      })()
    : null;

  return (
    <div
      ref={containerRef}
      className="relative rounded-[14px] border border-[var(--border)] px-2.5 py-2"
      style={{
        background:
          'linear-gradient(180deg,color-mix(in srgb, var(--accent) 3%, var(--surface-0)),var(--surface-0))',
      }}
      onMouseLeave={() => setTooltip(null)}
    >
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-[140px] w-full cursor-crosshair"
        onMouseMove={handleMouseMove}
      >
        {[0, 1, 2, 3].map((index) => {
          const y = paddingTop + (chartHeight / 3) * index;
          return (
            <line
              key={index}
              x1={0}
              x2={width}
              y1={y}
              y2={y}
              stroke="color-mix(in srgb, var(--border) 70%, transparent)"
              strokeDasharray="5 7"
            />
          );
        })}

        <path
          d={buildAreaPath(totalPoints, baseline)}
          fill="color-mix(in srgb, var(--accent) 18%, transparent)"
        />
        <path
          d={buildLinePath(totalPoints)}
          fill="none"
          stroke="var(--accent)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d={buildLinePath(acceptedPoints)}
          fill="none"
          stroke="var(--status-accepted-text)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="6 6"
        />

        {/* Crosshair on hover */}
        {hoveredIndex !== null && (
          <line
            x1={totalPoints[hoveredIndex].x}
            x2={totalPoints[hoveredIndex].x}
            y1={paddingTop}
            y2={baseline}
            stroke="var(--accent)"
            strokeWidth="1"
            strokeDasharray="4 4"
            opacity="0.5"
          />
        )}

        {data.map((bucket, index) => (
          <g key={bucket.longLabel}>
            <circle
              cx={totalPoints[index].x}
              cy={totalPoints[index].y}
              r={hoveredIndex === index ? 5.5 : 3.5}
              fill="var(--surface-0)"
              stroke="var(--accent)"
              strokeWidth={hoveredIndex === index ? 3 : 2.5}
              style={{ transition: 'r 0.1s, stroke-width 0.1s' }}
            />
            {bucket.accepted > 0 ? (
              <circle
                cx={acceptedPoints[index].x}
                cy={acceptedPoints[index].y}
                r={hoveredIndex === index ? 4 : 2.75}
                fill="var(--status-accepted-text)"
                style={{ transition: 'r 0.1s' }}
              />
            ) : null}
          </g>
        ))}

        {data.map((bucket, index) =>
          index % labelStride === 0 ? (
            <text
              key={`${bucket.longLabel}-label`}
              x={totalPoints[index].x}
              y={height - 4}
              textAnchor="middle"
              fontSize="10"
              fill={hoveredIndex === index ? 'var(--text-primary)' : 'var(--text-muted)'}
              fontFamily="Inter, system-ui, sans-serif"
              fontWeight={hoveredIndex === index ? '600' : '400'}
            >
              {bucket.label}
            </text>
          ) : null,
        )}
      </svg>

      {/* Tooltip */}
      {tooltip && hoveredIndex !== null && (
        <div
          className="pointer-events-none absolute z-10 rounded-[12px] border border-[var(--border)] bg-[var(--surface-0)] px-3 py-2.5 shadow-[0_8px_24px_rgba(0,0,0,0.14)]"
          style={{
            left: Math.min(
              Math.max(tooltip.x - 64, 4),
              (containerRef.current?.clientWidth ?? 200) - 134,
            ),
            top: Math.max(tooltip.y - 72, 4),
          }}
        >
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
            {data[hoveredIndex].longLabel}
          </p>
          <div className="mt-1.5 flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span
                className="h-2 w-2 rounded-full"
                style={{ background: 'var(--accent)' }}
              />
              <span className="text-xs text-[var(--text-secondary)]">Skapade</span>
              <span className="text-xs font-semibold tabular-nums text-[var(--text-primary)]">
                {data[hoveredIndex].count}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span
                className="h-2 w-2 rounded-full"
                style={{ background: 'var(--status-accepted-text)' }}
              />
              <span className="text-xs text-[var(--text-secondary)]">Acc.</span>
              <span className="text-xs font-semibold tabular-nums text-[var(--text-primary)]">
                {data[hoveredIndex].accepted}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function RangeButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'rounded-full px-2.5 py-1 text-[11px] font-medium transition-all',
        active
          ? 'bg-[var(--accent)] font-semibold text-white shadow-[0_6px_14px_rgba(0,0,0,0.12)]'
          : 'border border-[var(--border)] bg-[var(--surface-1)] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]',
      ].join(' ')}
    >
      {label}
    </button>
  );
}

function TrendCard({ activityData }: { activityData: OfferActivityPoint[] }) {
  const [rangePreset, setRangePreset] = useState<RangePreset>('90d');
  const [customStart, setCustomStart] = useState(toInputDate(addDays(new Date(), -29)));
  const [customEnd, setCustomEnd] = useState(toInputDate(new Date()));

  const { start, end } = getRangeBounds(rangePreset, customStart, customEnd);
  const buckets = buildTrendBuckets(activityData, start, end);
  const createdTotal = buckets.reduce((sum, bucket) => sum + bucket.count, 0);
  const acceptedTotal = buckets.reduce((sum, bucket) => sum + bucket.accepted, 0);
  const successRate = createdTotal > 0 ? Math.round((acceptedTotal / createdTotal) * 100) : 0;

  return (
    <motion.div
      variants={fadeUp}
      className="rounded-[20px] border border-[var(--border)] bg-[linear-gradient(180deg,var(--surface-0),var(--surface-1))] px-4 py-3.5 shadow-[0_14px_34px_rgba(0,0,0,0.06)]"
    >
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <div className="min-w-0">
            <h2 className="text-sm font-semibold tracking-tight text-[var(--text-primary)]">
              Tidsöversikt
            </h2>
            <p className="mt-0.5 text-[11px] text-[var(--text-secondary)]">
              {formatRangeLabel(start, end)}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
                Skapade
              </span>
              <span className="text-sm font-semibold tabular-nums text-[var(--text-primary)]">
                {createdTotal}
              </span>
            </div>
            <span className="h-4 w-px bg-[var(--border)]" aria-hidden />
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
                Vunna
              </span>
              <span className="text-sm font-semibold tabular-nums text-[var(--text-primary)]">
                {acceptedTotal}
              </span>
            </div>
            <span className="h-4 w-px bg-[var(--border)]" aria-hidden />
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
                Vinst
              </span>
              <span className="text-sm font-semibold tabular-nums text-[var(--text-primary)]">
                {successRate}%
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
          <div className="flex flex-wrap gap-1">
            {RANGE_OPTIONS.map((option) => (
              <RangeButton
                key={option.id}
                active={rangePreset === option.id}
                label={option.label}
                onClick={() => setRangePreset(option.id)}
              />
            ))}
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span
                className="h-2 w-2 rounded-full"
                style={{ background: 'var(--accent)' }}
                aria-hidden
              />
              <span className="text-[10px] text-[var(--text-secondary)]">Skapade</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span
                className="h-2 w-2 rounded-full"
                style={{ background: 'var(--status-accepted-text)' }}
                aria-hidden
              />
              <span className="text-[10px] text-[var(--text-secondary)]">Accepterade</span>
            </div>
          </div>
        </div>

        {/* Always reserve space for date pickers to prevent chart from jumping */}
        <div
          className={cn(
            'grid gap-2 sm:grid-cols-2 transition-opacity duration-150',
            rangePreset !== 'custom' && 'pointer-events-none opacity-0',
          )}
          aria-hidden={rangePreset !== 'custom'}
        >
          <label className="rounded-xl border border-[var(--border)] bg-[var(--surface-1)] px-3 py-2">
            <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
              Från
            </span>
            <input
              type="date"
              value={customStart}
              onChange={(event) => {
                const next = clampDateRange(event.target.value, customEnd);
                setCustomStart(next.startValue);
                setCustomEnd(next.endValue);
              }}
              className="mt-1 w-full bg-transparent text-xs font-medium text-[var(--text-primary)] outline-none"
              tabIndex={rangePreset !== 'custom' ? -1 : undefined}
            />
          </label>

          <label className="rounded-xl border border-[var(--border)] bg-[var(--surface-1)] px-3 py-2">
            <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
              Till
            </span>
            <input
              type="date"
              value={customEnd}
              min={customStart}
              onChange={(event) => {
                const next = clampDateRange(customStart, event.target.value);
                setCustomStart(next.startValue);
                setCustomEnd(next.endValue);
              }}
              className="mt-1 w-full bg-transparent text-xs font-medium text-[var(--text-primary)] outline-none"
              tabIndex={rangePreset !== 'custom' ? -1 : undefined}
            />
          </label>
        </div>

        <TrendChart data={buckets} empty={createdTotal === 0} />
      </div>
    </motion.div>
  );
}

function OffersPaginated({ offers }: { offers: RecentOffer[] }) {
  const [page, setPage] = useState(0);
  const totalPages = Math.ceil(offers.length / OFFERS_PER_PAGE);
  const pageOffers = offers.slice(page * OFFERS_PER_PAGE, (page + 1) * OFFERS_PER_PAGE);

  return (
    <>
      <motion.div variants={stagger} className="divide-y divide-[var(--border)]">
        {pageOffers.map((offer) => (
          <motion.div key={offer.id} variants={fadeIn}>
            <Link
              href={`/offerter/${offer.id}`}
              className="grid gap-3 px-5 py-3.5 transition-colors hover:bg-[var(--surface-hover)] md:grid-cols-[72px_minmax(0,1fr)_auto_120px_76px] md:items-center"
            >
              <div className="text-[11px] font-mono text-[var(--text-muted)] md:text-xs">
                {offer.offerNumber ? `#${offer.offerNumber}` : '—'}
              </div>

              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-[var(--text-primary)]">{offer.title}</p>
                <p className="mt-0.5 truncate text-xs text-[var(--text-secondary)]">
                  {[offer.recipientName, offer.recipientCompany].filter(Boolean).join(' · ') || 'Ingen mottagare ännu'}
                </p>
              </div>

              <div className="md:justify-self-start">
                <StatusBadge status={offer.status} />
              </div>

              <div className="text-sm font-semibold tabular-nums text-[var(--text-primary)] md:text-right">
                {fmtSEK(offer.totalIncVat)}
              </div>

              <div className="text-sm text-[var(--text-muted)] md:text-right">
                {fmtDate(offer.createdAt)}
              </div>
            </Link>
          </motion.div>
        ))}
      </motion.div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-[var(--border)] px-5 py-2.5">
          <p className="text-[11px] text-[var(--text-muted)]">
            {page * OFFERS_PER_PAGE + 1}–{Math.min((page + 1) * OFFERS_PER_PAGE, offers.length)} av {offers.length}
          </p>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="rounded-lg border border-[var(--border)] bg-[var(--surface-1)] px-2.5 py-1.5 text-[11px] font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-hover)] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setPage(i)}
                className={cn(
                  'rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition-colors',
                  i === page
                    ? 'bg-[var(--accent)] text-white'
                    : 'border border-[var(--border)] bg-[var(--surface-1)] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]',
                )}
              >
                {i + 1}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page === totalPages - 1}
              className="rounded-lg border border-[var(--border)] bg-[var(--surface-1)] px-2.5 py-1.5 text-[11px] font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-hover)] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default function DashboardView({
  greetingText,
  greetingSub,
  dateLabel,
  acceptedValue,
  pipelineValue,
  acceptanceRate,
  expiringSoon,
  total,
  countMap,
  recentOffers,
  activityData,
}: DashboardViewProps) {
  const activePipeline = (countMap.sent ?? 0) + (countMap.viewed ?? 0);

  return (
    <div className="mx-auto max-w-[1360px] px-4 py-3 sm:px-6 sm:py-4">
      <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-3">

        {/* Compact greeting hero */}
        <motion.div
          variants={fadeUp}
          className="overflow-hidden rounded-[24px] border border-[var(--border)] shadow-[0_16px_40px_rgba(0,0,0,0.09)]"
          style={{
            background:
              'linear-gradient(145deg, color-mix(in srgb, var(--surface-0) 92%, var(--accent) 8%), var(--surface-0))',
          }}
        >
          <div className="grid gap-0 xl:grid-cols-[minmax(0,1fr)_260px]">
            <div className="px-5 py-4 sm:px-6">
              <div className="mb-2 flex flex-wrap items-center gap-1.5">
                <span className="rounded-full border border-[color-mix(in_srgb,var(--accent)_28%,var(--border))] bg-[color-mix(in_srgb,var(--accent)_12%,var(--surface-0))] px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-primary)]">
                  {dateLabel}
                </span>
                <span className="rounded-full border border-[var(--border)] bg-[var(--surface-1)] px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                  Översikt
                </span>
              </div>

              <h1 className="font-heading text-[22px] font-semibold tracking-tight text-[var(--text-primary)] sm:text-[26px]">
                {greetingText}
              </h1>
              <p className="mt-1.5 max-w-2xl text-[13px] leading-5 text-[var(--text-secondary)]">
                {greetingSub}
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                <div className="rounded-[16px] border border-[var(--border)] bg-[var(--surface-1)] px-3 py-2">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
                    Aktiva just nu
                  </p>
                  <p className="mt-0.5 text-sm font-semibold text-[var(--text-primary)]">
                    {activePipeline} offerter i rörelse
                  </p>
                </div>
                <div className="rounded-[16px] border border-[var(--border)] bg-[var(--surface-1)] px-3 py-2">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
                    Total överblick
                  </p>
                  <p className="mt-0.5 text-sm font-semibold text-[var(--text-primary)]">
                    {total} offerter i systemet
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t border-[var(--border)] bg-[linear-gradient(180deg,color-mix(in srgb, var(--surface-1) 88%, transparent),var(--surface-1))] px-4 py-4 xl:border-l xl:border-t-0">
              <div className="flex h-full flex-col gap-2.5">
                <DashboardClock />
                <div className="rounded-[18px] border border-[var(--border)] bg-[var(--surface-0)] px-3.5 py-3 shadow-[0_10px_26px_rgba(0,0,0,0.05)]">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
                    Fokus idag
                  </p>
                  <p className="mt-1.5 text-xs leading-5 text-[var(--text-secondary)]">
                    Håll koll på nya offerter, följ upp det som är visat och fånga upp sådant som snart löper ut.
                  </p>
                  <Link
                    href="/offerter/ny"
                    className="mt-3 inline-flex items-center justify-center gap-1.5 rounded-xl bg-[var(--accent)] px-3.5 py-2 text-xs font-semibold text-white transition-all hover:opacity-95 active:scale-[0.98] shadow-[0_12px_26px_rgba(0,0,0,0.14)]"
                    style={{ background: 'linear-gradient(135deg, color-mix(in srgb, var(--accent) 20%, #e06b45 80%), color-mix(in srgb, var(--accent) 8%, #a34729 92%))' }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                    Ny offert
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* KPI cards */}
        <motion.div
          variants={fadeUp}
          className="rounded-[22px] border border-[var(--border)] bg-[linear-gradient(180deg,var(--surface-0),var(--surface-1))] px-2 py-1.5 shadow-[0_10px_28px_rgba(0,0,0,0.05)] sm:px-3"
        >
          <div className="grid gap-1 min-[460px]:grid-cols-2 xl:grid-cols-4">
            <KpiCard
              className="min-w-0"
              label="Pipeline"
              value={pipelineValue > 0 ? <Counter to={pipelineValue} suffix=" kr" /> : <span className="text-[var(--text-muted)]">—</span>}
              sub={`${activePipeline} aktiva offert${activePipeline === 1 ? '' : 'er'}`}
              tone="linear-gradient(135deg, #1e5fb8, #1d8cff)"
              icon={
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                </svg>
              }
            />

            <KpiCard
              className="min-w-0"
              label="Accepterat värde"
              value={acceptedValue > 0 ? <Counter to={acceptedValue} suffix=" kr" /> : <span className="text-[var(--text-muted)]">—</span>}
              sub={countMap.accepted ? `${countMap.accepted} affär${countMap.accepted === 1 ? '' : 'er'} vunna` : 'Inga accepterade offerter ännu'}
              tone="linear-gradient(135deg, #0d7d4f, #19a266)"
              icon={
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              }
            />

            <KpiCard
              className="min-w-0"
              label="Vinstgrad"
              value={acceptanceRate !== null ? <><Counter to={acceptanceRate} /><span className="ml-1 text-base">%</span></> : <span className="text-[var(--text-muted)]">—</span>}
              sub={acceptanceRate !== null ? 'Andel accepterade av avslutade offerter' : 'Visas när du har avslutade offerter'}
              tone="linear-gradient(135deg, #8a4f00, #d6851a)"
              icon={
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 20V10M12 20V4M6 20v-6" />
                </svg>
              }
            />

            <KpiCard
              className="min-w-0"
              label="Utgår snart"
              value={<Counter to={expiringSoon} />}
              sub={expiringSoon > 0 ? `Offert${expiringSoon === 1 ? '' : 'er'} som löper ut inom 7 dagar` : 'Ingen offert behöver följas upp direkt'}
              tone={expiringSoon > 0 ? 'linear-gradient(135deg, #c5543f, #ee7b5b)' : 'linear-gradient(135deg, #5f5a4d, #7f796c)'}
              icon={
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              }
            />
          </div>
        </motion.div>

        {/* Main content grid */}
        <motion.div variants={stagger} className="grid gap-3 xl:grid-cols-[minmax(0,1.35fr)_minmax(340px,0.95fr)]">
          {/* Offers list */}
          <motion.div
            variants={fadeUp}
            className="overflow-hidden rounded-[22px] border border-[var(--border)] bg-[var(--surface-0)] shadow-[0_14px_36px_rgba(0,0,0,0.08)]"
          >
            <div className="flex items-center justify-between gap-4 border-b border-[var(--border)] px-5 py-3.5">
              <div>
                <h2 className="text-sm font-semibold tracking-tight text-[var(--text-primary)]">Senaste offerter</h2>
                <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
                  {recentOffers.length === 0
                    ? 'Här dyker dina senaste offerter upp när du kommit igång.'
                    : `${recentOffers.length} offerter — bläddra med pilarna nedan.`}
                </p>
              </div>

              <Link href="/offerter" className="inline-flex items-center gap-1 text-xs font-medium text-[var(--accent)] hover:underline">
                Visa alla
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
            </div>

            {recentOffers.length === 0 ? (
              <motion.div variants={fadeIn} className="flex min-h-[240px] flex-col items-center justify-center px-6 py-8 text-center">
                <div className="rounded-[24px] border border-[var(--border)] bg-[linear-gradient(180deg,var(--surface-1),var(--surface-0))] px-8 py-7 shadow-[0_16px_40px_rgba(0,0,0,0.07)]">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl bg-[var(--accent-subtle)] text-[var(--accent)]">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
                      <rect x="9" y="3" width="6" height="4" rx="1" />
                      <path d="M9 12h6M9 16h4" />
                    </svg>
                  </div>
                  <h3 className="mt-4 text-base font-semibold tracking-tight text-[var(--text-primary)]">Inga offerter än</h3>
                  <p className="mx-auto mt-1.5 max-w-sm text-xs leading-5 text-[var(--text-secondary)]">
                    Skapa din första offert för att börja fylla översikten med verklig aktivitet.
                  </p>
                  <Link
                    href="/offerter/ny"
                    className="mt-5 inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-all hover:opacity-95 active:scale-[0.98] shadow-[0_12px_26px_rgba(0,0,0,0.13)]"
                    style={{ background: 'linear-gradient(135deg, color-mix(in srgb, var(--accent) 20%, #e06b45 80%), color-mix(in srgb, var(--accent) 8%, #a34729 92%))' }}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                    Skapa första offerten
                  </Link>
                </div>
              </motion.div>
            ) : (
              <OffersPaginated offers={recentOffers} />
            )}
          </motion.div>

          {/* Right sidebar */}
          <div className="space-y-3">
            <StatusDistributionCard countMap={countMap} total={total} />
            <TrendCard activityData={activityData} />
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
