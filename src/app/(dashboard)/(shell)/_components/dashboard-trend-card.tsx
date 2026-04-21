'use client';

import { useState } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { motion } from 'framer-motion';
import type { OfferActivityPoint } from '@modules/generic/dashboard';
import { cn } from '@shared/lib/utils';

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring' as const, stiffness: 300, damping: 30 },
  },
};

type RangePreset = '7d' | '30d' | '90d' | '365d' | 'custom';

interface TrendBucket {
  label: string;
  longLabel: string;
  count: number;
  accepted: number;
}

const RANGE_OPTIONS: Array<{ id: RangePreset; label: string; days?: number }> = [
  { id: '7d',    label: '1 v',   days: 7 },
  { id: '30d',   label: '1 mån', days: 30 },
  { id: '90d',   label: '3 mån', days: 90 },
  { id: '365d',  label: '1 år',  days: 365 },
  { id: 'custom',label: 'Datum' },
];

function startOfDay(d: Date) { const n = new Date(d); n.setHours(0,0,0,0); return n; }
function endOfDay(d: Date)   { const n = new Date(d); n.setHours(23,59,59,999); return n; }
function addDays(d: Date, days: number) { const n = new Date(d); n.setDate(n.getDate()+days); return n; }
function addMonths(d: Date, m: number)  { const n = new Date(d); n.setMonth(n.getMonth()+m); return n; }
function monthStart(d: Date) { return new Date(d.getFullYear(), d.getMonth(), 1); }
function monthEnd(d: Date)   { return endOfDay(new Date(d.getFullYear(), d.getMonth()+1, 0)); }
function dayDiff(s: Date, e: Date) {
  return Math.max(1, Math.floor((endOfDay(e).getTime() - startOfDay(s).getTime()) / 86400000) + 1);
}
function toInputDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function fmtShort(d: Date) {
  return new Intl.DateTimeFormat('sv-SE', { day:'numeric', month:'short' }).format(d);
}
function fmtLong(d: Date) {
  return new Intl.DateTimeFormat('sv-SE', { day:'numeric', month:'long', year:'numeric' }).format(d);
}
function fmtMonth(d: Date) {
  return new Intl.DateTimeFormat('sv-SE', { month:'short' }).format(d);
}
function fmtRangeLabel(s: Date, e: Date) { return `${fmtLong(s)} – ${fmtLong(e)}`; }

function clampDateRange(startValue: string, endValue: string) {
  if (!startValue || !endValue || startValue <= endValue) return { startValue, endValue };
  return { startValue, endValue: startValue };
}

function getRangeBounds(range: RangePreset, customStart: string, customEnd: string) {
  const today = new Date();
  if (range === 'custom' && customStart && customEnd) {
    return { start: startOfDay(new Date(customStart)), end: endOfDay(new Date(customEnd)) };
  }
  const opt = RANGE_OPTIONS.find(o => o.id === range);
  return { start: startOfDay(addDays(today, -((opt?.days ?? 30) - 1))), end: endOfDay(today) };
}

function buildTrendBuckets(activityData: OfferActivityPoint[], start: Date, end: Date): TrendBucket[] {
  const filtered = activityData.filter(e => {
    const d = new Date(e.createdAt); return d >= start && d <= end;
  });
  const totalDays = dayDiff(start, end);
  const buckets: TrendBucket[] = [];

  if (totalDays <= 14) {
    for (let c = startOfDay(start); c <= end; c = addDays(c, 1)) {
      const bs = startOfDay(c), be = endOfDay(c);
      const m = filtered.filter(e => { const d = new Date(e.createdAt); return d >= bs && d <= be; });
      buckets.push({ label: fmtShort(bs), longLabel: fmtLong(bs), count: m.length, accepted: m.filter(e => e.status === 'accepted').length });
    }
    return buckets;
  }

  if (totalDays <= 62) {
    for (let c = startOfDay(start); c <= end; c = addDays(c, 7)) {
      const bs = startOfDay(c), we = addDays(c, 6), be = endOfDay(we <= end ? we : end);
      const m = filtered.filter(e => { const d = new Date(e.createdAt); return d >= bs && d <= be; });
      buckets.push({ label: fmtShort(bs), longLabel: `${fmtShort(bs)}–${fmtShort(addDays(c,6))}`, count: m.length, accepted: m.filter(e => e.status === 'accepted').length });
    }
    return buckets;
  }

  for (let c = monthStart(start); c <= end; c = addMonths(c, 1)) {
    const bs = monthStart(c), me = monthEnd(c), be = me <= end ? me : end;
    const m = filtered.filter(e => { const d = new Date(e.createdAt); return d >= bs && d <= be; });
    buckets.push({
      label: fmtMonth(bs),
      longLabel: new Intl.DateTimeFormat('sv-SE', { month:'long', year:'numeric' }).format(bs),
      count: m.length, accepted: m.filter(e => e.status === 'accepted').length,
    });
  }
  return buckets;
}

function ChartTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ value: number; name: string; color: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-[10px] border border-[var(--border)] bg-[var(--surface-0)] px-3 py-2.5 shadow-[0_8px_24px_rgba(0,0,0,0.14)]">
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">{label}</p>
      {payload.map(p => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color }}/>
          <span className="text-xs text-[var(--text-secondary)]">
            {p.name === 'count' ? 'Skapade' : 'Accepterade'}
          </span>
          <span className="ml-1 text-xs font-semibold tabular-nums text-[var(--text-primary)]">{p.value}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Trend card ────────────────────────────────────────────────────────────────

export function TrendCard({ activityData }: { activityData: OfferActivityPoint[] }) {
  const [range, setRange] = useState<RangePreset>('90d');
  const [customStart, setCustomStart] = useState(toInputDate(addDays(new Date(), -29)));
  const [customEnd, setCustomEnd]     = useState(toInputDate(new Date()));

  const { start, end } = getRangeBounds(range, customStart, customEnd);
  const buckets = buildTrendBuckets(activityData, start, end);
  const createdTotal  = buckets.reduce((s, b) => s + b.count, 0);
  const acceptedTotal = buckets.reduce((s, b) => s + b.accepted, 0);
  const successRate   = createdTotal > 0 ? Math.round((acceptedTotal / createdTotal) * 100) : 0;

  const stride    = Math.max(1, Math.ceil(buckets.length / 8));
  const chartData = buckets.map((b, i) => ({ ...b, displayLabel: i % stride === 0 ? b.label : '' }));
  const yMax      = Math.max(...buckets.map(b => b.count), 1);
  const yTicks    = Array.from({ length: Math.min(yMax, 5) + 1 }, (_, i) =>
    Math.round((yMax / Math.min(yMax, 5)) * i),
  );

  return (
    <motion.div variants={fadeUp} className="rounded-[20px] border border-[var(--border)] bg-[linear-gradient(180deg,var(--surface-0),var(--surface-1))] px-4 pt-4 pb-3 shadow-[0_14px_34px_rgba(0,0,0,0.06)]">

      {/* Header */}
      <div className="mb-3 flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <div>
          <h2 className="text-sm font-semibold tracking-tight text-[var(--text-primary)]">Tidsöversikt</h2>
          <p className="mt-0.5 text-[11px] text-[var(--text-secondary)]">{fmtRangeLabel(start, end)}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-[11px]">
          {[
            { lbl: 'Skapade', val: createdTotal },
            { lbl: 'Vunna',   val: acceptedTotal },
            { lbl: 'Vinstgrad',   val: `${successRate}%` },
          ].map((item, i) => (
            <div key={item.lbl} className="flex items-center gap-1.5">
              {i > 0 && <span className="h-3 w-px bg-[var(--border)]"/>}
              <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-[var(--text-muted)]">{item.lbl}</span>
              <span className="font-semibold tabular-nums text-[var(--text-primary)]">{item.val}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Chart */}
      {createdTotal === 0 ? (
        <div className="flex h-[320px] items-center justify-center rounded-[16px] border border-dashed border-[var(--border)] bg-[var(--surface-0)]">
          <div className="text-center">
            <p className="text-xs font-medium text-[var(--text-primary)]">Inga offerter i vald period</p>
            <p className="mt-1 text-[11px] text-[var(--text-secondary)]">Prova ett längre intervall.</p>
          </div>
        </div>
      ) : (
        <div className="rounded-[16px] border border-[var(--border)] bg-[var(--surface-0)] px-3 pt-3 pb-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]">
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={chartData} margin={{ top: 10, right: 14, left: 2, bottom: 8 }}>
              <defs>
                <linearGradient id="gradTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="var(--accent)" stopOpacity={0.22}/>
                  <stop offset="95%" stopColor="var(--accent)" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="gradAccepted" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="var(--status-accepted-text)" stopOpacity={0.14}/>
                  <stop offset="95%" stopColor="var(--status-accepted-text)" stopOpacity={0}/>
                </linearGradient>
              </defs>

              <CartesianGrid
                strokeDasharray="4 6"
                stroke="color-mix(in srgb, var(--border) 70%, transparent)"
                vertical={false}
              />
              <XAxis
                dataKey="displayLabel"
                tick={{ fill: 'var(--text-muted)', fontSize: 10, fontFamily: 'Inter, system-ui, sans-serif' }}
                tickLine={false}
                axisLine={false}
                interval={0}
              />
              <YAxis
                ticks={yTicks}
                tick={{ fill: 'var(--text-muted)', fontSize: 10, fontFamily: 'Inter, system-ui, sans-serif' }}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
                width={44}
                label={{
                  value: 'Antal',
                  angle: -90,
                  position: 'insideLeft',
                  offset: -2,
                  fill: 'var(--text-muted)',
                  fontSize: 10,
                }}
              />
              <Tooltip
                content={<ChartTooltip/>}
                cursor={{ stroke: 'var(--accent)', strokeWidth: 1, strokeDasharray: '4 4', opacity: 0.5 }}
              />
              <Area
                type="monotone"
                dataKey="count"
                stroke="var(--accent)"
                strokeWidth={2.5}
                fill="url(#gradTotal)"
                dot={{ r: 3, fill: 'var(--surface-0)', stroke: 'var(--accent)', strokeWidth: 2.5 }}
                activeDot={{ r: 5, fill: 'var(--surface-0)', stroke: 'var(--accent)', strokeWidth: 3 }}
              />
              <Area
                type="monotone"
                dataKey="accepted"
                stroke="var(--status-accepted-text)"
                strokeWidth={2}
                strokeDasharray="6 5"
                fill="url(#gradAccepted)"
                dot={{ r: 2.5, fill: 'var(--status-accepted-text)', strokeWidth: 0 }}
                activeDot={{ r: 4.5, fill: 'var(--status-accepted-text)', strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Bottom control bar — all on one line */}
      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">

        {/* Legend */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full" style={{ background: 'var(--accent)' }}/>
            <span className="text-[10px] text-[var(--text-secondary)]">Skapade</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full" style={{ background: 'var(--status-accepted-text)' }}/>
            <span className="text-[10px] text-[var(--text-secondary)]">Accepterade</span>
          </div>
        </div>

        <span className="hidden h-3 w-px bg-[var(--border)] sm:block"/>

        {/* Range preset buttons */}
        <div className="flex items-center gap-1">
          {RANGE_OPTIONS.map(opt => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setRange(opt.id)}
              className={cn(
                'rounded-full px-2.5 py-1 text-[10px] font-medium transition-all',
                range === opt.id
                  ? 'bg-[var(--accent)] font-semibold text-white shadow-[0_4px_10px_rgba(0,0,0,0.12)]'
                  : 'border border-[var(--border)] bg-[var(--surface-1)] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]',
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Inline date inputs — reserve space always, hide with opacity */}
        <div
          className={cn(
            'ml-auto flex items-center gap-1.5 transition-opacity duration-150',
            range !== 'custom' && 'pointer-events-none opacity-0',
          )}
          aria-hidden={range !== 'custom'}
        >
          <input
            type="date"
            value={customStart}
            tabIndex={range !== 'custom' ? -1 : undefined}
            onChange={e => {
              const n = clampDateRange(e.target.value, customEnd);
              setCustomStart(n.startValue); setCustomEnd(n.endValue);
            }}
            className="h-8 w-[118px] rounded-full border border-[var(--border)] bg-[var(--surface-1)] px-3 text-[11px] font-medium text-[var(--text-primary)] outline-none focus:ring-1 focus:ring-[var(--accent)]"
          />
          <span className="text-[10px] text-[var(--text-muted)]">→</span>
          <input
            type="date"
            value={customEnd}
            min={customStart}
            tabIndex={range !== 'custom' ? -1 : undefined}
            onChange={e => {
              const n = clampDateRange(customStart, e.target.value);
              setCustomStart(n.startValue); setCustomEnd(n.endValue);
            }}
            className="h-8 w-[118px] rounded-full border border-[var(--border)] bg-[var(--surface-1)] px-3 text-[11px] font-medium text-[var(--text-primary)] outline-none focus:ring-1 focus:ring-[var(--accent)]"
          />
        </div>
      </div>
    </motion.div>
  );
}

// ─── Paginated offers ──────────────────────────────────────────────────────────
