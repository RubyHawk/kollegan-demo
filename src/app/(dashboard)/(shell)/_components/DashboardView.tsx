'use client';

import { useEffect, useState } from 'react';
import { animate, motion, useMotionValue } from 'framer-motion';
import Link from 'next/link';

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
  return `${formatShortDate(date)}–${formatShortDate(addDays(date, 6))}`;
}

function formatRangeLabel(start: Date, end: Date) {
  return `${formatLongDate(start)} – ${formatLongDate(end)}`;
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
    return <div className="h-12 w-32 rounded-2xl bg-[var(--surface-1)]" aria-hidden="true" />;
  }

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] px-4 py-3 shadow-[0_10px_30px_rgba(0,0,0,0.08)]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">
        Stockholm
      </p>
      <p className="mt-1 font-mono text-[26px] font-semibold tracking-tight text-[var(--text-primary)] tabular-nums">
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
}: {
  label: string;
  value: React.ReactNode;
  sub: string;
  icon: React.ReactNode;
  tone: string;
}) {
  return (
    <motion.div
      variants={fadeUp}
      className="rounded-[24px] border border-[var(--border)] bg-[linear-gradient(180deg,var(--surface-0),var(--surface-1))] px-5 py-4 shadow-[0_14px_40px_rgba(0,0,0,0.08)]"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
            {label}
          </p>
          <div className="mt-3 flex items-baseline gap-2 text-[var(--text-primary)]">
            <p className="text-[28px] font-semibold tracking-tight leading-none tabular-nums">
              {value}
            </p>
          </div>
          <p className="mt-2 text-sm leading-5 text-[var(--text-secondary)]">{sub}</p>
        </div>

        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10"
          style={{
            background: tone,
            color: 'white',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.12)',
          }}
        >
          {icon}
        </div>
      </div>
    </motion.div>
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

  return (
    <motion.div
      variants={fadeUp}
      className="rounded-[26px] border border-[var(--border)] bg-[var(--surface-0)] p-5 shadow-[0_14px_40px_rgba(0,0,0,0.08)]"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold tracking-tight text-[var(--text-primary)]">
            Statusfördelning
          </h2>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            En tydlig översikt över var affärerna ligger just nu.
          </p>
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] px-3 py-2 text-right">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
            Totalt
          </p>
          <p className="text-lg font-semibold tabular-nums text-[var(--text-primary)]">{total}</p>
        </div>
      </div>

      {total === 0 ? (
        <div className="mt-6 rounded-[22px] border border-dashed border-[var(--border)] bg-[var(--surface-1)] px-5 py-8 text-center">
          <p className="text-sm font-medium text-[var(--text-primary)]">Ingen status att visa ännu</p>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            När offerter börjar skickas fylls fördelningen på automatiskt här.
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          <div className="flex h-3 overflow-hidden rounded-full bg-[var(--surface-2)]">
            {rows
              .filter((row) => row.count > 0)
              .map((row) => (
                <div
                  key={row.status}
                  style={{
                    width: `${(row.count / total) * 100}%`,
                    background: row.color,
                  }}
                  title={`${row.label}: ${row.count} st (${row.percent}%)`}
                />
              ))}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {rows.map((row) => (
              <div
                key={row.status}
                className="rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] px-3 py-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ background: row.color }}
                      aria-hidden="true"
                    />
                    <span className="truncate text-sm font-medium text-[var(--text-primary)]">
                      {row.label}
                    </span>
                  </div>
                  <span className="text-sm font-semibold tabular-nums text-[var(--text-primary)]">
                    {row.count}
                  </span>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--surface-2)]">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${row.percent}%`,
                      background: row.color,
                    }}
                  />
                </div>
                <p className="mt-2 text-xs text-[var(--text-muted)]">{row.percent}% av alla offerter</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}

function TrendChart({
  data,
  empty,
}: {
  data: TrendBucket[];
  empty: boolean;
}) {
  const maxValue = Math.max(...data.map((bucket) => bucket.count), 1);

  if (empty) {
    return (
      <div className="rounded-[22px] border border-dashed border-[var(--border)] bg-[var(--surface-1)] px-5 py-10 text-center">
        <p className="text-sm font-medium text-[var(--text-primary)]">Inga offerter i vald period</p>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Prova ett längre intervall eller välj ett eget datumspann.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-[22px] border border-[var(--border)] bg-[linear-gradient(180deg,var(--surface-1),var(--surface-0))] p-4">
      <div className="relative h-64">
        <div className="pointer-events-none absolute inset-x-0 inset-y-0 grid grid-rows-4">
          {[0, 1, 2, 3].map((index) => (
            <div
              key={index}
              className="border-t border-dashed"
              style={{ borderColor: 'color-mix(in srgb, var(--border) 70%, transparent)' }}
            />
          ))}
        </div>

        <div className="absolute inset-0 flex items-end gap-2 pt-3">
          {data.map((bucket) => {
            const totalHeight = Math.max((bucket.count / maxValue) * 100, bucket.count > 0 ? 8 : 2);
            const acceptedHeight = Math.max((bucket.accepted / maxValue) * 100, bucket.accepted > 0 ? 6 : 0);

            return (
              <div key={bucket.longLabel} className="flex min-w-0 flex-1 flex-col items-center gap-2">
                <div
                  className="relative flex h-full w-full items-end justify-center"
                  title={`${bucket.longLabel}: ${bucket.count} skapade, ${bucket.accepted} accepterade`}
                >
                  <div className="relative h-full w-full max-w-10">
                    <div
                      className="absolute inset-x-0 bottom-0 rounded-t-[10px] transition-all duration-500"
                      style={{
                        height: `${totalHeight}%`,
                        background: 'color-mix(in srgb, var(--accent) 18%, transparent)',
                      }}
                    />
                    <div
                      className="absolute inset-x-[20%] bottom-0 rounded-t-[10px] bg-[var(--status-accepted-text)] transition-all duration-500 delay-75"
                      style={{ height: `${acceptedHeight}%` }}
                    />
                  </div>
                </div>
                <span className="line-clamp-1 text-center text-[11px] font-medium text-[var(--text-muted)]">
                  {bucket.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-[var(--border)] pt-4">
        <div className="flex items-center gap-2">
          <span
            className="h-2.5 w-2.5 rounded-full"
            style={{ background: 'color-mix(in srgb, var(--accent) 55%, transparent)' }}
            aria-hidden="true"
          />
          <span className="text-xs text-[var(--text-secondary)]">Skapade</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-[var(--status-accepted-text)]" aria-hidden="true" />
          <span className="text-xs text-[var(--text-secondary)]">Accepterade</span>
        </div>
      </div>
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
        'rounded-xl px-3 py-2 text-sm font-medium transition-colors',
        active
          ? 'bg-[var(--accent)] text-white shadow-[0_10px_24px_rgba(0,0,0,0.16)]'
          : 'bg-[var(--surface-1)] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]',
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
      className="rounded-[26px] border border-[var(--border)] bg-[var(--surface-0)] p-5 shadow-[0_14px_40px_rgba(0,0,0,0.08)]"
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-base font-semibold tracking-tight text-[var(--text-primary)]">
              Tidsöversikt
            </h2>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              {formatRangeLabel(start, end)}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] px-3 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
                Skapade
              </p>
              <p className="mt-1 text-lg font-semibold tabular-nums text-[var(--text-primary)]">
                {createdTotal}
              </p>
            </div>
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] px-3 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
                Accepterade
              </p>
              <p className="mt-1 text-lg font-semibold tabular-nums text-[var(--text-primary)]">
                {acceptedTotal}
              </p>
            </div>
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] px-3 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
                Andel
              </p>
              <p className="mt-1 text-lg font-semibold tabular-nums text-[var(--text-primary)]">
                {successRate}%
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {RANGE_OPTIONS.map((option) => (
            <RangeButton
              key={option.id}
              active={rangePreset === option.id}
              label={option.label}
              onClick={() => setRangePreset(option.id)}
            />
          ))}
        </div>

        {rangePreset === 'custom' ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] px-3 py-3">
              <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
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
                className="mt-2 w-full bg-transparent text-sm font-medium text-[var(--text-primary)] outline-none"
              />
            </label>

            <label className="rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] px-3 py-3">
              <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
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
                className="mt-2 w-full bg-transparent text-sm font-medium text-[var(--text-primary)] outline-none"
              />
            </label>
          </div>
        ) : null}

        <TrendChart data={buckets} empty={createdTotal === 0} />
      </div>
    </motion.div>
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
    <div className="mx-auto max-w-[1360px] px-4 py-7 sm:px-6 sm:py-8">
      <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6">
        <motion.div
          variants={fadeUp}
          className="rounded-[30px] border border-[var(--border)] p-6 shadow-[0_24px_60px_rgba(0,0,0,0.12)] sm:p-7"
          style={{
            background:
              'linear-gradient(145deg, color-mix(in srgb, var(--surface-0) 90%, var(--accent) 10%), var(--surface-0))',
          }}
        >
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-[var(--accent-border)] bg-[var(--accent-subtle)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
                  {dateLabel}
                </span>
                <span className="rounded-full border border-[var(--border)] bg-[var(--surface-1)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                  Översikt
                </span>
              </div>

              <h1 className="font-heading text-[30px] font-semibold tracking-tight text-[var(--text-primary)] sm:text-[36px]">
                {greetingText}
              </h1>
              <p className="mt-3 max-w-2xl text-[15px] leading-7 text-[var(--text-secondary)] sm:text-base">
                {greetingSub}
              </p>

              <div className="mt-5 flex flex-wrap gap-2.5">
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] px-3 py-2">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
                    Aktiva
                  </p>
                  <p className="mt-1 text-sm font-semibold text-[var(--text-primary)]">
                    {activePipeline} offerter i rörelse
                  </p>
                </div>
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] px-3 py-2">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
                    Totalt
                  </p>
                  <p className="mt-1 text-sm font-semibold text-[var(--text-primary)]">
                    {total} offerter i systemet
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-end lg:flex-col lg:items-stretch">
              <DashboardClock />
              <Link
                href="/offerter/ny"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white transition-all hover:opacity-95 active:scale-[0.98] shadow-[0_16px_34px_rgba(0,0,0,0.16)]"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                Ny offert
              </Link>
            </div>
          </div>
        </motion.div>

        <motion.div variants={stagger} className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            label="Pipeline"
            value={pipelineValue > 0 ? <Counter to={pipelineValue} suffix=" kr" /> : <span className="text-[var(--text-muted)]">—</span>}
            sub={`${activePipeline} aktiva offert${activePipeline === 1 ? '' : 'er'}`}
            tone="linear-gradient(135deg, #1e5fb8, #1d8cff)"
            icon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
              </svg>
            }
          />

          <KpiCard
            label="Accepterat värde"
            value={acceptedValue > 0 ? <Counter to={acceptedValue} suffix=" kr" /> : <span className="text-[var(--text-muted)]">—</span>}
            sub={countMap.accepted ? `${countMap.accepted} affär${countMap.accepted === 1 ? '' : 'er'} vunna` : 'Inga accepterade offerter ännu'}
            tone="linear-gradient(135deg, #0d7d4f, #19a266)"
            icon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            }
          />

          <KpiCard
            label="Vinstgrad"
            value={acceptanceRate !== null ? <><Counter to={acceptanceRate} /><span className="ml-1 text-xl">%</span></> : <span className="text-[var(--text-muted)]">—</span>}
            sub={acceptanceRate !== null ? 'Andel accepterade av avslutade offerter' : 'Visas när du har avslutade offerter'}
            tone="linear-gradient(135deg, #8a4f00, #d6851a)"
            icon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 20V10M12 20V4M6 20v-6" />
              </svg>
            }
          />

          <KpiCard
            label="Utgår snart"
            value={<Counter to={expiringSoon} />}
            sub={expiringSoon > 0 ? `Offert${expiringSoon === 1 ? '' : 'er'} som löper ut inom 7 dagar` : 'Ingen offert behöver följas upp direkt'}
            tone={expiringSoon > 0 ? 'linear-gradient(135deg, #c5543f, #ee7b5b)' : 'linear-gradient(135deg, #5f5a4d, #7f796c)'}
            icon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            }
          />
        </motion.div>

        <motion.div variants={stagger} className="grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(360px,1fr)]">
          <motion.div
            variants={fadeUp}
            className="overflow-hidden rounded-[26px] border border-[var(--border)] bg-[var(--surface-0)] shadow-[0_18px_45px_rgba(0,0,0,0.09)]"
          >
            <div className="flex items-center justify-between gap-4 border-b border-[var(--border)] px-5 py-4">
              <div>
                <h2 className="text-base font-semibold tracking-tight text-[var(--text-primary)]">Senaste offerter</h2>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">
                  {recentOffers.length === 0 ? 'Här dyker dina senaste offerter upp när du kommit igång.' : `De ${recentOffers.length} senaste offerterna i systemet.`}
                </p>
              </div>

              <Link href="/offerter" className="inline-flex items-center gap-1 text-sm font-medium text-[var(--accent)] hover:underline">
                Visa alla
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
            </div>

            {recentOffers.length === 0 ? (
              <motion.div variants={fadeIn} className="flex min-h-[420px] flex-col items-center justify-center px-8 py-14 text-center">
                <div className="rounded-[28px] border border-[var(--border)] bg-[linear-gradient(180deg,var(--surface-1),var(--surface-0))] px-8 py-8 shadow-[0_20px_50px_rgba(0,0,0,0.08)]">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-[var(--accent-subtle)] text-[var(--accent)]">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
                      <rect x="9" y="3" width="6" height="4" rx="1" />
                      <path d="M9 12h6M9 16h4" />
                    </svg>
                  </div>

                  <h3 className="mt-5 text-lg font-semibold tracking-tight text-[var(--text-primary)]">Inga offerter än</h3>
                  <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[var(--text-secondary)]">
                    Skapa din första offert för att börja fylla översikten med verklig aktivitet och tydligare uppföljning.
                  </p>

                  <Link href="/offerter/ny" className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white transition-all hover:opacity-95 active:scale-[0.98]">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                    Skapa första offerten
                  </Link>
                </div>
              </motion.div>
            ) : (
              <motion.div variants={stagger} className="divide-y divide-[var(--border)]">
                {recentOffers.map((offer) => (
                  <motion.div key={offer.id} variants={fadeIn}>
                    <Link
                      href={`/offerter/${offer.id}`}
                      className="grid gap-3 px-5 py-4 transition-colors hover:bg-[var(--surface-hover)] md:grid-cols-[72px_minmax(0,1fr)_auto_120px_76px] md:items-center"
                    >
                      <div className="text-[11px] font-mono text-[var(--text-muted)] md:text-xs">
                        {offer.offerNumber ? `#${offer.offerNumber}` : '—'}
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-[var(--text-primary)]">{offer.title}</p>
                        <p className="mt-1 truncate text-sm text-[var(--text-secondary)]">
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
            )}
          </motion.div>

          <div className="space-y-5">
            <StatusDistributionCard countMap={countMap} total={total} />
            <TrendCard activityData={activityData} />
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
