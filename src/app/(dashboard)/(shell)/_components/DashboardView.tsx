'use client';

import { useEffect, useState } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
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
const STATUS_GRID_ORDER = ['sent', 'viewed', 'accepted', 'declined', 'draft', 'expired'] as const;

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  draft:    { label: 'Utkast',     color: 'var(--status-draft-text)',    bg: 'var(--status-draft-bg)' },
  sent:     { label: 'Skickad',    color: 'var(--status-sent-text)',     bg: 'var(--status-sent-bg)' },
  viewed:   { label: 'Visad',      color: 'var(--status-viewed-text)',   bg: 'var(--status-viewed-bg)' },
  accepted: { label: 'Accepterad', color: 'var(--status-accepted-text)', bg: 'var(--status-accepted-bg)' },
  declined: { label: 'Avvisad',    color: 'var(--status-declined-text)', bg: 'var(--status-declined-bg)' },
  expired:  { label: 'Utgången',   color: 'var(--status-expired-text)',  bg: 'var(--status-expired-bg)' },
};

const RANGE_OPTIONS: Array<{ id: RangePreset; label: string; days?: number }> = [
  { id: '7d',    label: '1 v',   days: 7 },
  { id: '30d',   label: '1 mån', days: 30 },
  { id: '90d',   label: '3 mån', days: 90 },
  { id: '365d',  label: '1 år',  days: 365 },
  { id: 'custom',label: 'Datum' },
];

const currencyFormatter = new Intl.NumberFormat('sv-SE', {
  style: 'currency', currency: 'SEK', maximumFractionDigits: 0,
});

// ─── Date helpers ─────────────────────────────────────────────────────────────

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

function fmtSEK(v: number) { return currencyFormatter.format(v); }
function fmtDate(iso: string) { return new Date(iso).toLocaleDateString('sv-SE', { day:'2-digit', month:'short' }); }

// ─── Clock ─────────────────────────────────────────────────────────────────────

function DashboardClock() {
  const [time, setTime] = useState('');
  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString('sv-SE', {
      hour:'2-digit', minute:'2-digit', second:'2-digit', timeZone:'Europe/Stockholm',
    }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  if (!time) return <div className="h-9 w-32 animate-pulse rounded-full bg-[var(--surface-2)]" />;

  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface-1)] px-3 py-1.5 shadow-[0_6px_16px_rgba(0,0,0,0.05)]">
      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--surface-2)]">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--text-muted)]">
          <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
        </svg>
      </div>
      <div className="flex items-baseline gap-2">
        <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">Stockholm</p>
        <p className="font-mono text-[14px] font-semibold tabular-nums leading-none text-[var(--text-primary)]">{time}</p>
      </div>
    </div>
  );
}

// ─── Counter ───────────────────────────────────────────────────────────────────

function Counter({ to, suffix = '', decimals = 0 }: { to: number; suffix?: string; decimals?: number }) {
  const mv = useMotionValue(0);
  const [display, setDisplay] = useState('0');
  useEffect(() => {
    const c = animate(mv, to, {
      duration: 0.9, ease: [0.16,1,0.3,1],
      onUpdate: v => setDisplay(v.toLocaleString('sv-SE', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })),
    });
    return c.stop;
  }, [decimals, mv, to]);
  return <>{display}{suffix}</>;
}

// ─── Status badge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const meta = STATUS_META[status];
  if (!meta) return null;
  return (
    <span className="shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold" style={{ background: meta.bg, color: meta.color }}>
      {meta.label}
    </span>
  );
}

// ─── KPI strip item ────────────────────────────────────────────────────────────

function KpiItem({ label, value, sub, icon, tone }: {
  label: string; value: React.ReactNode; sub: string; icon: React.ReactNode; tone: string;
}) {
  return (
    <div className="flex items-start gap-3 px-5 py-4">
      <div
        className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-white/10"
        style={{ background: tone, color: 'white' }}
      >
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">{label}</p>
        <p className="mt-0.5 text-[17px] font-semibold leading-none tabular-nums text-[var(--text-primary)]">{value}</p>
        <p className="mt-1 text-[11px] leading-4 text-[var(--text-secondary)]">{sub}</p>
      </div>
    </div>
  );
}

// ─── Status distribution ───────────────────────────────────────────────────────

function StatusDistributionCard({ countMap, total }: { countMap: Record<string, number>; total: number }) {
  const [activeStatus, setActiveStatus] = useState<string | null>(null);
  const rows = STATUS_ORDER.map(status => {
    const count = countMap[status] ?? 0;
    return { status, count, percent: total > 0 ? Math.round((count / total) * 100) : 0, ...STATUS_META[status] };
  });
  const compactRows = STATUS_GRID_ORDER.map((status) => rows.find((row) => row.status === status)).filter(Boolean) as typeof rows;
  const populated = rows.filter(r => r.count > 0);
  const highlightedStatus = activeStatus ?? populated[0]?.status ?? null;
  const highlightedRow = rows.find(r => r.status === highlightedStatus) ?? null;
  const hoverRow = activeStatus ? rows.find(r => r.status === activeStatus) ?? null : null;
  const radius = 52, circ = 2 * Math.PI * radius;
  const segments = populated.map((r, i) => ({
    ...r,
    segment: circ * (r.count / total),
    dashOffset: populated.slice(0, i).reduce((s, p) => s + circ * (p.count / total), 0),
  }));

  return (
    <motion.div variants={fadeUp} className="rounded-[20px] border border-[var(--border)] bg-[linear-gradient(180deg,var(--surface-0),var(--surface-1))] px-4 py-3.5 shadow-[0_14px_34px_rgba(0,0,0,0.06)]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold tracking-tight text-[var(--text-primary)]">Statusfördelning</h2>
          <p className="mt-0.5 text-[11px] text-[var(--text-secondary)]">Pipeline och avslut just nu</p>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">Totalt</span>
          <span className="text-base font-semibold tabular-nums text-[var(--text-primary)]">{total}</span>
        </div>
      </div>

      {total === 0 ? (
        <div className="mt-3 rounded-[14px] border border-dashed border-[var(--border)] bg-[var(--surface-1)] px-4 py-6 text-center">
          <p className="text-xs font-medium text-[var(--text-primary)]">Ingen status att visa ännu</p>
          <p className="mt-1 text-[11px] text-[var(--text-secondary)]">När offerter börjar skickas fylls fördelningen på automatiskt.</p>
        </div>
      ) : (
        <div className="mt-3 rounded-[16px] border border-[var(--border)] bg-[var(--surface-0)] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.35)] lg:grid lg:grid-cols-[156px_minmax(0,1fr)] lg:gap-4">
          <div className="flex flex-col items-center gap-3 lg:items-start">
            <div className="relative mx-auto h-[112px] w-[112px] lg:mx-0">
              {hoverRow ? (
                <div className="pointer-events-none absolute -top-2 left-1/2 z-10 -translate-x-1/2 rounded-full border border-[var(--border)] bg-[var(--surface-0)] px-2.5 py-1 text-[10px] font-semibold text-[var(--text-primary)] shadow-[0_8px_18px_rgba(0,0,0,0.08)]">
                  {hoverRow.label}
                </div>
              ) : null}
              <svg viewBox="0 0 132 132" className="h-[112px] w-[112px] -rotate-90">
                <circle cx="66" cy="66" r={radius} fill="none" stroke="color-mix(in srgb, var(--border) 80%, transparent)" strokeWidth="16"/>
                {segments.map(r => (
                  <circle
                    key={r.status}
                    cx="66"
                    cy="66"
                    r={radius}
                    fill="none"
                    stroke={r.color}
                    strokeLinecap="round"
                    strokeWidth={highlightedStatus === r.status ? 18 : 14}
                    opacity={highlightedStatus && highlightedStatus !== r.status ? 0.35 : 1}
                    strokeDasharray={`${r.segment} ${circ - r.segment}`}
                    strokeDashoffset={-r.dashOffset}
                    className="cursor-pointer transition-all duration-150"
                    onMouseEnter={() => setActiveStatus(r.status)}
                    onMouseLeave={() => setActiveStatus(null)}
                  >
                    <title>{`${r.label}: ${r.count} (${r.percent}%)`}</title>
                  </circle>
                ))}
              </svg>
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-center">
                <span className="text-[24px] font-semibold tabular-nums text-[var(--text-primary)]">
                  {highlightedRow?.count ?? total}
                </span>
              </div>
            </div>

            {highlightedRow ? (
              <div className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-0)] px-3.5 py-3 shadow-[0_8px_18px_rgba(0,0,0,0.04)]">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
                      Aktiv del
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: highlightedRow.color }} />
                      <p className="text-sm font-semibold text-[var(--text-primary)]">{highlightedRow.label}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">andel</p>
                    <p className="mt-1 text-sm font-semibold tabular-nums text-[var(--text-primary)]">{highlightedRow.percent}%</p>
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:mt-0">
            {compactRows.map(r => (
              <button
                key={r.status}
                type="button"
                onClick={() => setActiveStatus((current) => current === r.status ? null : r.status)}
                onMouseEnter={() => setActiveStatus(r.status)}
                onMouseLeave={() => setActiveStatus(null)}
                className={cn(
                  'grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 rounded-2xl border px-3 py-2 text-left transition-all',
                  highlightedStatus === r.status
                    ? 'border-[color-mix(in_srgb,var(--accent)_32%,var(--border))] bg-[color-mix(in_srgb,var(--accent)_6%,var(--surface-0))] shadow-[0_8px_18px_rgba(0,0,0,0.05)]'
                    : 'border-[var(--border)] bg-[var(--surface-0)] hover:bg-[var(--surface-1)]',
                )}
                aria-pressed={highlightedStatus === r.status}
              >
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: r.color }}/>
                <div className="min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-[11px] font-medium text-[var(--text-primary)]">{r.label}</span>
                    <span className="text-[10px] tabular-nums text-[var(--text-muted)]">{r.percent}%</span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[var(--surface-2)]">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${r.percent}%` }} transition={{ duration: 0.45, ease: 'easeOut' }}
                      className="h-full rounded-full" style={{ background: r.color }}/>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">antal</p>
                  <p className="text-[12px] font-semibold tabular-nums text-[var(--text-primary)]">{r.count}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}

// ─── Recharts tooltip ──────────────────────────────────────────────────────────

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

function TrendCard({ activityData }: { activityData: OfferActivityPoint[] }) {
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
          ].map((item, i, arr) => (
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

function OffersPaginated({ offers }: { offers: RecentOffer[] }) {
  const [page, setPage] = useState(0);
  const totalPages  = Math.ceil(offers.length / OFFERS_PER_PAGE);
  const pageOffers  = offers.slice(page * OFFERS_PER_PAGE, (page + 1) * OFFERS_PER_PAGE);

  return (
    <>
      <motion.div variants={stagger} className="divide-y divide-[var(--border)]">
        {pageOffers.map(offer => (
          <motion.div key={offer.id} variants={fadeIn}>
            <Link
              href={`/offerter/${offer.id}`}
              className="grid gap-3 px-5 py-3.5 transition-colors hover:bg-[var(--surface-hover)] md:grid-cols-[72px_minmax(0,1fr)_auto_120px_76px] md:items-center"
            >
              <div className="font-mono text-[11px] text-[var(--text-muted)]">
                {offer.offerNumber ? `#${offer.offerNumber}` : '—'}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-[var(--text-primary)]">{offer.title}</p>
                <p className="mt-0.5 truncate text-xs text-[var(--text-secondary)]">
                  {[offer.recipientName, offer.recipientCompany].filter(Boolean).join(' · ') || 'Ingen mottagare ännu'}
                </p>
              </div>
              <div className="md:justify-self-start"><StatusBadge status={offer.status}/></div>
              <div className="text-sm font-semibold tabular-nums text-[var(--text-primary)] md:text-right">{fmtSEK(offer.totalIncVat)}</div>
              <div className="text-sm text-[var(--text-muted)] md:text-right">{fmtDate(offer.createdAt)}</div>
            </Link>
          </motion.div>
        ))}
      </motion.div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-[var(--border)] px-5 py-2.5">
          <p className="text-[11px] text-[var(--text-muted)]">
            {page * OFFERS_PER_PAGE + 1}–{Math.min((page+1)*OFFERS_PER_PAGE, offers.length)} av {offers.length}
          </p>
          <div className="flex items-center gap-1">
            <button type="button" aria-label="Föregående sida" onClick={() => setPage(p => Math.max(0, p-1))} disabled={page===0}
              className="rounded-lg border border-[var(--border)] bg-[var(--surface-1)] px-2.5 py-1.5 text-[11px] text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-hover)] disabled:cursor-not-allowed disabled:opacity-40">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
            </button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button key={i} type="button" onClick={() => setPage(i)}
                className={cn('rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition-colors',
                  i === page ? 'bg-[var(--accent)] text-white' : 'border border-[var(--border)] bg-[var(--surface-1)] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]')}>
                {i+1}
              </button>
            ))}
            <button type="button" aria-label="Nästa sida" onClick={() => setPage(p => Math.min(totalPages-1, p+1))} disabled={page===totalPages-1}
              className="rounded-lg border border-[var(--border)] bg-[var(--surface-1)] px-2.5 py-1.5 text-[11px] text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-hover)] disabled:cursor-not-allowed disabled:opacity-40">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Main view ─────────────────────────────────────────────────────────────────

export default function DashboardView({
  greetingText, greetingSub, dateLabel,
  acceptedValue, pipelineValue, acceptanceRate, expiringSoon,
  total, countMap, recentOffers, activityData,
}: DashboardViewProps) {
  const activePipeline = (countMap.sent ?? 0) + (countMap.viewed ?? 0);

  return (
    <div className="mx-auto max-w-[1360px] px-4 py-3 sm:px-6 sm:py-4">
      <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-3">

        {/* ── Hero: greeting + embedded KPIs ─────────────────────────── */}
        <motion.div
          variants={fadeUp}
          className="overflow-hidden rounded-[24px] border border-[var(--border)] shadow-[0_16px_40px_rgba(0,0,0,0.09)]"
          style={{ background: 'linear-gradient(145deg, color-mix(in srgb, var(--surface-0) 92%, var(--accent) 8%), var(--surface-0))' }}
        >
          {/* Greeting row */}
          <div className="flex items-start justify-between gap-4 px-6 pt-5 pb-4">
            <div className="min-w-0 flex-1">
              <div className="mb-2 flex flex-wrap items-center gap-1.5">
                <span className="rounded-full border border-[color-mix(in_srgb,var(--accent)_28%,var(--border))] bg-[color-mix(in_srgb,var(--accent)_12%,var(--surface-0))] px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-primary)]">
                  {dateLabel}
                </span>
                <span className="rounded-full border border-[var(--border)] bg-[var(--surface-1)] px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                  Översikt
                </span>
              </div>
              <DashboardClock/>
              <h1 className="mt-2 font-heading text-[22px] font-semibold tracking-tight text-[var(--text-primary)] sm:text-[26px]">
                {greetingText}
              </h1>
              <p className="mt-1.5 text-[13px] leading-5 text-[var(--text-secondary)]">{greetingSub}</p>
            </div>

            {/* CTA */}
            <div className="flex shrink-0 flex-col items-end gap-3 pt-0.5">
              <Link
                href="/offerter/ny"
                className="inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold text-white shadow-[0_8px_20px_rgba(0,0,0,0.16)] transition-all hover:opacity-95 active:scale-[0.98]"
                style={{ background: 'linear-gradient(135deg, color-mix(in srgb, var(--accent) 20%, #e06b45 80%), color-mix(in srgb, var(--accent) 8%, #a34729 92%))' }}
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
                Ny offert
              </Link>
            </div>
          </div>

          {/* Divider */}
          <div className="mx-0 border-t border-[var(--border)]"/>

          {/* KPI strip */}
          <div className="grid grid-cols-2 divide-x divide-y divide-[var(--border)] xl:grid-cols-4 xl:divide-y-0">
            <KpiItem
              label="Pipeline"
              value={pipelineValue > 0 ? <Counter to={pipelineValue} suffix=" kr"/> : <span className="text-[var(--text-muted)]">—</span>}
              sub={`${activePipeline} aktiva offert${activePipeline===1?'':'er'}`}
              tone="linear-gradient(135deg,#1e5fb8,#1d8cff)"
              icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>}
            />
            <KpiItem
              label="Accepterat värde"
              value={acceptedValue > 0 ? <Counter to={acceptedValue} suffix=" kr"/> : <span className="text-[var(--text-muted)]">—</span>}
              sub={countMap.accepted ? `${countMap.accepted} affär${countMap.accepted===1?'':'er'} vunna` : 'Inga accepterade offerter ännu'}
              tone="linear-gradient(135deg,#0d7d4f,#19a266)"
              icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
            />
            <KpiItem
              label="Vinstgrad"
              value={acceptanceRate !== null ? <><Counter to={acceptanceRate}/><span className="ml-0.5 text-base">%</span></> : <span className="text-[var(--text-muted)]">—</span>}
              sub={acceptanceRate !== null ? 'Andel accepterade av avslutade' : 'Visas när du har avslutade offerter'}
              tone="linear-gradient(135deg,#8a4f00,#d6851a)"
              icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>}
            />
            <KpiItem
              label="Utgår snart"
              value={<Counter to={expiringSoon}/>}
              sub={expiringSoon > 0 ? `Offert${expiringSoon===1?'':'er'} löper ut inom 7 dagar` : 'Ingen offert behöver följas upp'}
              tone={expiringSoon > 0 ? 'linear-gradient(135deg,#c5543f,#ee7b5b)' : 'linear-gradient(135deg,#5f5a4d,#7f796c)'}
              icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>}
            />
          </div>
        </motion.div>

        {/* ── Main grid ──────────────────────────────────────────────── */}
        <motion.div variants={stagger} className="grid gap-3 xl:grid-cols-[minmax(0,1.08fr)_minmax(460px,1fr)]">

          {/* Offers */}
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
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </Link>
            </div>

            {recentOffers.length === 0 ? (
              <motion.div variants={fadeIn} className="flex min-h-[240px] flex-col items-center justify-center px-6 py-8 text-center">
                <div className="rounded-[24px] border border-[var(--border)] bg-[linear-gradient(180deg,var(--surface-1),var(--surface-0))] px-8 py-7 shadow-[0_16px_40px_rgba(0,0,0,0.07)]">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl bg-[var(--accent-subtle)] text-[var(--accent)]">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/>
                      <rect x="9" y="3" width="6" height="4" rx="1"/><path d="M9 12h6M9 16h4"/>
                    </svg>
                  </div>
                  <h3 className="mt-4 text-base font-semibold tracking-tight text-[var(--text-primary)]">Inga offerter än</h3>
                  <p className="mx-auto mt-1.5 max-w-sm text-xs leading-5 text-[var(--text-secondary)]">
                    Skapa din första offert för att börja fylla översikten med verklig aktivitet.
                  </p>
                  <Link href="/offerter/ny"
                    className="mt-5 inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-[0_12px_26px_rgba(0,0,0,0.13)] transition-all hover:opacity-95 active:scale-[0.98]"
                    style={{ background: 'linear-gradient(135deg, color-mix(in srgb, var(--accent) 20%, #e06b45 80%), color-mix(in srgb, var(--accent) 8%, #a34729 92%))' }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
                    Skapa första offerten
                  </Link>
                </div>
              </motion.div>
            ) : (
              <OffersPaginated offers={recentOffers}/>
            )}
          </motion.div>

          {/* Right sidebar */}
          <div className="space-y-3">
            <StatusDistributionCard countMap={countMap} total={total}/>
            <TrendCard activityData={activityData}/>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
