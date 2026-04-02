'use client';

/**
 * DashboardView — fully-animated client component for the Soleria overview page.
 *
 * Design principles:
 *  - Information hierarchy: KPIs first → trend analysis → detailed data
 *  - Staggered Framer Motion entrance (spring physics, no layout jank)
 *  - Inline SVG charts: donut (status mix) + bar (monthly trend)
 *  - Color system uses design tokens exclusively (light/dark/theme aware)
 */

import { useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, animate } from 'framer-motion';
import Link from 'next/link';

// ─── Types ────────────────────────────────────────────────────────────────────

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

export interface MonthBucket {
  label: string;
  count: number;
  accepted: number;
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
  monthlyData: MonthBucket[];
}

// ─── Animation variants ───────────────────────────────────────────────────────

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.065, delayChildren: 0.05 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1, y: 0,
    transition: { type: 'spring' as const, stiffness: 300, damping: 28 },
  },
};

const fadeIn = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.35 } },
};

// ─── Status metadata ──────────────────────────────────────────────────────────

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  draft:    { label: 'Utkast',    color: 'var(--status-draft-text)',    bg: 'var(--status-draft-bg)'    },
  sent:     { label: 'Skickad',   color: 'var(--status-sent-text)',     bg: 'var(--status-sent-bg)'     },
  viewed:   { label: 'Visad',     color: 'var(--status-viewed-text)',   bg: 'var(--status-viewed-bg)'   },
  accepted: { label: 'Accepterad',color: 'var(--status-accepted-text)', bg: 'var(--status-accepted-bg)' },
  declined: { label: 'Avvisad',   color: 'var(--status-declined-text)', bg: 'var(--status-declined-bg)' },
  expired:  { label: 'Utgången',  color: 'var(--status-expired-text)',  bg: 'var(--status-expired-bg)'  },
};

// ─── Animated number counter ──────────────────────────────────────────────────

function Counter({ to, prefix = '', suffix = '', decimals = 0 }: {
  to: number; prefix?: string; suffix?: string; decimals?: number;
}) {
  const mv  = useMotionValue(0);
  const [display, setDisplay] = useState('0');

  useEffect(() => {
    const controls = animate(mv, to, {
      duration: 1.1,
      ease: [0.16, 1, 0.3, 1],
      onUpdate(v) {
        setDisplay(v.toLocaleString('sv-SE', {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        }));
      },
    });
    return controls.stop;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [to]);

  return <>{prefix}{display}{suffix}</>;
}

// ─── SVG Donut chart ──────────────────────────────────────────────────────────

function DonutChart({ countMap, total }: { countMap: Record<string, number>; total: number }) {
  const R    = 54;
  const CX   = 68;
  const CY   = 68;
  const CIRC = 2 * Math.PI * R;
  const SW   = 16;
  const statuses = ['sent', 'viewed', 'accepted', 'draft', 'declined', 'expired'];

  const [animated, setAnimated] = useState(false);
  useEffect(() => { const t = setTimeout(() => setAnimated(true), 200); return () => clearTimeout(t); }, []);

  let cumulativeAngle = 0;
  const segments = statuses.map((s) => {
    const count  = countMap[s] ?? 0;
    const frac   = total > 0 ? count / total : 0;
    const dash   = animated ? frac * CIRC : 0;
    const offset = cumulativeAngle;
    cumulativeAngle += frac * CIRC;
    return { s, dash, offset, frac };
  });

  return (
    <div className="flex flex-col items-center gap-4">
      <svg
        width={CX * 2} height={CY * 2}
        viewBox={`0 0 ${CX * 2} ${CY * 2}`}
        className="overflow-visible"
      >
        {/* Track */}
        <circle cx={CX} cy={CY} r={R} fill="none"
          stroke="var(--border)" strokeWidth={SW} />

        {/* Segments */}
        {segments.map(({ s, dash, offset }) => (
          <circle
            key={s}
            cx={CX} cy={CY} r={R}
            fill="none"
            stroke={STATUS_META[s]?.color ?? 'var(--text-muted)'}
            strokeWidth={SW}
            strokeDasharray={`${dash} ${CIRC}`}
            strokeDashoffset={-offset}
            transform={`rotate(-90 ${CX} ${CY})`}
            style={{ transition: 'stroke-dasharray 0.9s cubic-bezier(0.16,1,0.3,1)', strokeLinecap: 'round' }}
          />
        ))}

        {/* Center label */}
        <text x={CX} y={CY - 6} textAnchor="middle" dominantBaseline="middle"
          fontSize="22" fontWeight="700" fill="var(--text-primary)" fontFamily="inherit">
          {total}
        </text>
        <text x={CX} y={CY + 14} textAnchor="middle"
          fontSize="11" fill="var(--text-muted)" fontFamily="inherit">
          offerter
        </text>
      </svg>

      {/* Legend */}
      <div className="w-full space-y-1.5">
        {statuses.filter(s => (countMap[s] ?? 0) > 0 || true).map((s) => {
          const meta  = STATUS_META[s];
          const count = countMap[s] ?? 0;
          const pct   = total > 0 ? Math.round((count / total) * 100) : 0;
          return (
            <div key={s} className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: meta.color }} />
              <span className="flex-1 text-xs text-[var(--text-secondary)]">{meta.label}</span>
              <span className="text-xs font-semibold text-[var(--text-primary)] tabular-nums">{count}</span>
              <span className="text-[10px] text-[var(--text-muted)] w-7 text-right tabular-nums">{pct}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── SVG Bar chart ────────────────────────────────────────────────────────────

function BarChart({ data }: { data: MonthBucket[] }) {
  const [animated, setAnimated] = useState(false);
  useEffect(() => { const t = setTimeout(() => setAnimated(true), 300); return () => clearTimeout(t); }, []);

  const maxCount = Math.max(...data.map(d => d.count), 1);
  const H = 72;
  const W = 28;
  const GAP = 8;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-end gap-2" style={{ height: H + 28 }}>
        {data.map((d, i) => {
          const barH   = animated ? Math.max((d.count / maxCount) * H, d.count > 0 ? 4 : 0) : 0;
          const accH   = animated ? Math.max((d.accepted / maxCount) * H, d.accepted > 0 ? 3 : 0) : 0;
          return (
            <div key={i} className="flex flex-col items-center gap-1" style={{ width: W }}>
              <div
                className="relative flex items-end rounded-t-md overflow-hidden"
                style={{
                  width: W, height: H,
                  background: 'var(--surface-2)',
                  borderRadius: 6,
                }}
                title={`${d.label}: ${d.count} skapade, ${d.accepted} accepterade`}
              >
                {/* Total bar */}
                <div
                  style={{
                    position: 'absolute', bottom: 0, left: 0, right: 0,
                    height: barH,
                    background: 'var(--accent)',
                    opacity: 0.28,
                    borderRadius: '6px 6px 0 0',
                    transition: 'height 0.8s cubic-bezier(0.16,1,0.3,1)',
                  }}
                />
                {/* Accepted overlay */}
                <div
                  style={{
                    position: 'absolute', bottom: 0, left: 0, right: 0,
                    height: accH,
                    background: 'var(--status-accepted-text)',
                    borderRadius: '6px 6px 0 0',
                    transition: 'height 0.8s cubic-bezier(0.16,1,0.3,1) 0.1s',
                  }}
                />
              </div>
              <span className="text-[10px] text-[var(--text-muted)] capitalize">{d.label}</span>
            </div>
          );
        })}
      </div>
      {/* Legend */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm" style={{ background: 'var(--accent)', opacity: 0.4 }} />
          <span className="text-[10px] text-[var(--text-muted)]">Skapade</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm" style={{ background: 'var(--status-accepted-text)' }} />
          <span className="text-[10px] text-[var(--text-muted)]">Accepterade</span>
        </div>
      </div>
    </div>
  );
}

// ─── KPI card ─────────────────────────────────────────────────────────────────

function KpiCard({
  label, value, sub, icon, accent, highlight,
}: {
  label: string;
  value: React.ReactNode;
  sub?: string;
  icon: React.ReactNode;
  accent?: string;
  highlight?: boolean;
}) {
  return (
    <motion.div
      variants={fadeUp}
      className={`relative rounded-2xl border bg-[var(--surface-0)] p-5 flex flex-col gap-3 overflow-hidden ${
        highlight
          ? 'border-[var(--accent)]/30 shadow-[0_0_0_1px_var(--accent-border),0_2px_12px_var(--accent-subtle)]'
          : 'border-[var(--border)] shadow-[0_1px_4px_rgba(0,0,0,0.06)]'
      }`}
    >
      {highlight && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at top left, var(--accent-subtle) 0%, transparent 60%)',
          }}
        />
      )}
      {/* Icon */}
      <div
        className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: accent ? `${accent}1a` : 'var(--surface-2)' }}
      >
        <span style={{ color: accent ?? 'var(--text-muted)' }}>{icon}</span>
      </div>
      {/* Value */}
      <div>
        <p className="text-2xl font-bold tabular-nums tracking-tight"
          style={{ color: accent ?? 'var(--text-primary)' }}>
          {value}
        </p>
        <p className="text-xs font-semibold text-[var(--text-secondary)] mt-0.5 uppercase tracking-wider">{label}</p>
      </div>
      {sub && <p className="text-xs text-[var(--text-muted)] -mt-1">{sub}</p>}
    </motion.div>
  );
}

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const meta = STATUS_META[status];
  if (!meta) return null;
  return (
    <span
      className="shrink-0 text-[11px] font-semibold px-2 py-0.5 rounded-full"
      style={{ background: meta.bg, color: meta.color }}
    >
      {meta.label}
    </span>
  );
}

// ─── Format helpers ───────────────────────────────────────────────────────────

function fmtSEK(v: number) {
  return new Intl.NumberFormat('sv-SE', {
    style: 'currency', currency: 'SEK', maximumFractionDigits: 0,
  }).format(v);
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('sv-SE', { day: '2-digit', month: 'short' });
}

// ─── Main component ───────────────────────────────────────────────────────────

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
  monthlyData,
}: DashboardViewProps) {
  const activePipeline = (countMap['sent'] ?? 0) + (countMap['viewed'] ?? 0);

  return (
    <div className="px-4 py-7 sm:px-6 sm:py-8 max-w-[1280px] mx-auto">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <motion.div
        variants={stagger}
        initial="hidden"
        animate="show"
        className="flex items-start justify-between gap-4 mb-8"
      >
        <motion.div variants={fadeUp} className="flex flex-col gap-0.5">
          {/* Date chip */}
          <p className="text-[11px] font-medium text-[var(--text-muted)] uppercase tracking-widest mb-1">
            {dateLabel}
          </p>
          <h1 className="font-heading text-[26px] font-semibold tracking-tight text-[var(--text-primary)] leading-tight sm:text-[28px]">
            {greetingText}
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-0.5">{greetingSub}</p>
        </motion.div>

        <motion.div variants={fadeUp}>
          <Link
            href="/offerter/ny"
            className="shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--accent)] text-white text-sm font-semibold hover:opacity-90 active:scale-[0.97] transition-all shadow-md shadow-[var(--accent)]/20"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
            <span className="hidden sm:inline">Ny offert</span>
            <span className="sm:hidden">Ny</span>
          </Link>
        </motion.div>
      </motion.div>

      {/* ── KPI cards ──────────────────────────────────────────────────────── */}
      <motion.div
        variants={stagger}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
      >
        <KpiCard
          label="Pipeline"
          value={pipelineValue > 0
            ? <Counter to={pipelineValue} suffix=" kr" />
            : <span className="text-[var(--text-muted)]">—</span>}
          sub={`${activePipeline} aktiva offert${activePipeline === 1 ? '' : 'er'}`}
          icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>}
          accent="var(--status-sent-text)"
        />

        <KpiCard
          label="Accepterat värde"
          value={acceptedValue > 0
            ? <Counter to={acceptedValue} suffix=" kr" />
            : <span className="text-[var(--text-muted)]">—</span>}
          sub={countMap['accepted'] ? `${countMap['accepted']} affär${countMap['accepted'] === 1 ? '' : 'er'}` : 'Inga ännu'}
          icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
          accent="var(--status-accepted-text)"
          highlight={acceptedValue > 0}
        />

        <KpiCard
          label="Vinstgrad"
          value={acceptanceRate !== null
            ? <><Counter to={acceptanceRate} /><span className="text-xl">%</span></>
            : <span className="text-[var(--text-muted)]">—</span>}
          sub={acceptanceRate !== null ? 'Av avslutade offerter' : 'Inga avslutade ännu'}
          icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>}
          accent={acceptanceRate !== null && acceptanceRate >= 50 ? 'var(--status-accepted-text)' : undefined}
        />

        <KpiCard
          label="Utgår snart"
          value={<Counter to={expiringSoon} />}
          sub={expiringSoon > 0 ? `Offert${expiringSoon === 1 ? '' : 'er'} inom 7 dagar` : 'Ingenting på gång'}
          icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>}
          accent={expiringSoon > 0 ? 'var(--status-declined-text)' : undefined}
        />
      </motion.div>

      {/* ── Main grid ──────────────────────────────────────────────────────── */}
      <motion.div
        variants={stagger}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 lg:grid-cols-5 gap-5"
      >

        {/* ── Recent offers — 3/5 cols ─────────────────────────────────── */}
        <motion.div
          variants={fadeUp}
          className="lg:col-span-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-0)] overflow-hidden shadow-[0_1px_4px_rgba(0,0,0,0.06)]"
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
            <div>
              <h2 className="text-sm font-semibold text-[var(--text-primary)]">Senaste offerter</h2>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                {recentOffers.length === 0 ? 'Inga offerter skapade ännu' : `Senast skapade · ${recentOffers.length} visas`}
              </p>
            </div>
            <Link href="/offerter" className="text-xs font-medium text-[var(--accent)] hover:underline flex items-center gap-1">
              Visa alla
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </Link>
          </div>

          {recentOffers.length === 0 ? (
            <motion.div variants={fadeIn} className="flex flex-col items-center justify-center py-16 px-6 text-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[var(--surface-2)] flex items-center justify-center">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2"/>
                </svg>
              </div>
              <p className="text-sm text-[var(--text-muted)]">Inga offerter än.</p>
              <Link href="/offerter/ny"
                className="text-sm font-medium text-[var(--accent)] hover:underline">
                Skapa din första →
              </Link>
            </motion.div>
          ) : (
            <motion.div variants={stagger} className="divide-y divide-[var(--border)]">
              {recentOffers.map((offer) => (
                <motion.div key={offer.id} variants={fadeIn}>
                  <Link
                    href={`/offerter/${offer.id}`}
                    className="flex items-center gap-3 px-5 py-3.5 hover:bg-[var(--surface-hover)] transition-colors group"
                  >
                    {/* Offer number */}
                    <span className="text-[11px] font-mono text-[var(--text-muted)] w-8 shrink-0">
                      {offer.offerNumber ? `#${offer.offerNumber}` : '—'}
                    </span>

                    {/* Title + recipient */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[var(--text-primary)] truncate group-hover:text-[var(--accent)] transition-colors">
                        {offer.title}
                      </p>
                      <p className="text-[11px] text-[var(--text-muted)] truncate mt-0.5">
                        {[offer.recipientName, offer.recipientCompany].filter(Boolean).join(' · ') || '—'}
                      </p>
                    </div>

                    {/* Status */}
                    <StatusBadge status={offer.status} />

                    {/* Value */}
                    <span className="shrink-0 text-sm font-semibold text-[var(--text-primary)] tabular-nums hidden sm:block">
                      {fmtSEK(offer.totalIncVat)}
                    </span>

                    {/* Date */}
                    <span className="shrink-0 text-[11px] text-[var(--text-muted)] w-12 text-right hidden md:block">
                      {fmtDate(offer.createdAt)}
                    </span>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          )}
        </motion.div>

        {/* ── Right column — 2/5 cols ───────────────────────────────────── */}
        <div className="lg:col-span-2 flex flex-col gap-5">

          {/* Status donut */}
          <motion.div
            variants={fadeUp}
            className="rounded-2xl border border-[var(--border)] bg-[var(--surface-0)] p-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)]"
          >
            <div className="mb-4">
              <h2 className="text-sm font-semibold text-[var(--text-primary)]">Statusfördelning</h2>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">Alla offerter fördelade per status</p>
            </div>
            <DonutChart countMap={countMap} total={total} />
          </motion.div>

          {/* Monthly trend */}
          <motion.div
            variants={fadeUp}
            className="rounded-2xl border border-[var(--border)] bg-[var(--surface-0)] p-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)]"
          >
            <div className="mb-4">
              <h2 className="text-sm font-semibold text-[var(--text-primary)]">Månadsöversikt</h2>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">Senaste 6 månaderna</p>
            </div>
            <BarChart data={monthlyData} />
          </motion.div>

        </div>
      </motion.div>

    </div>
  );
}
