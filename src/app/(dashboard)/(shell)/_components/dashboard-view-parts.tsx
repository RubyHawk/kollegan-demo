'use client';

import { useEffect, useState } from 'react';
import { animate, motion, useMotionValue } from 'framer-motion';
import Link from 'next/link';
import type { OfferProjectSummary, ProjectStage, ProjectStats, RecentOffer } from '@modules/generic/dashboard';
import { cn } from '@shared/lib/utils';

export { TrendCard } from './dashboard-trend-card';

const OFFERS_PER_PAGE = 5;

export const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.04 } },
};

export const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring' as const, stiffness: 300, damping: 30 },
  },
};

export const fadeIn = {
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

const PROJECT_STAGE_ORDER: ProjectStage[] = ['details', 'ordered', 'arrived', 'in_progress', 'completed'];

const PROJECT_STAGE_META: Record<ProjectStage, { label: string; query: string; color: string; bg: string }> = {
  details:     { label: 'Uppgifter', query: 'uppgifter', color: 'var(--text-secondary)', bg: 'var(--surface-2)' },
  ordered:     { label: 'Beställt', query: 'bestallt', color: 'var(--status-sent-text)', bg: 'var(--status-sent-bg)' },
  arrived:     { label: 'Ankommet', query: 'ankommet', color: 'var(--status-viewed-text)', bg: 'var(--status-viewed-bg)' },
  in_progress: { label: 'Pågår', query: 'pagar', color: 'var(--accent)', bg: 'var(--accent-subtle)' },
  completed:   { label: 'Klart', query: 'klart', color: 'var(--status-accepted-text)', bg: 'var(--status-accepted-bg)' },
};

const currencyFormatter = new Intl.NumberFormat('sv-SE', {
  style: 'currency', currency: 'SEK', maximumFractionDigits: 0,
});

// ─── Date helpers ─────────────────────────────────────────────────────────────

function fmtSEK(v: number) { return currencyFormatter.format(v); }
function fmtDate(iso: string) { return new Date(iso).toLocaleDateString('sv-SE', { day:'2-digit', month:'short' }); }

// ─── Clock ─────────────────────────────────────────────────────────────────────

export function DashboardClock() {
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
        <p className="text-[9px] font-semibold uppercase text-[var(--text-muted)]">Stockholm</p>
        <p className="font-mono text-[14px] font-semibold tabular-nums leading-none text-[var(--text-primary)]">{time}</p>
      </div>
    </div>
  );
}

// ─── Counter ───────────────────────────────────────────────────────────────────

export function Counter({ to, suffix = '', decimals = 0 }: { to: number; suffix?: string; decimals?: number }) {
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

function ProjectStageBadge({ project }: { project: OfferProjectSummary | null }) {
  if (!project) return null;
  const meta = PROJECT_STAGE_META[project.stage];
  const label = project.stage === 'completed' ? 'Projekt klart' : `Projekt: ${meta.label}`;

  return (
    <span
      className="inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold"
      style={{ background: meta.bg, color: meta.color, borderColor: `color-mix(in srgb, ${meta.color} 32%, var(--border))` }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: meta.color }} />
      {label}
    </span>
  );
}

export function KpiItem({ label, value, sub, icon, tone }: {
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
        <p className="text-[9px] font-semibold uppercase text-[var(--text-muted)]">{label}</p>
        <p className="mt-0.5 text-[17px] font-semibold leading-none tabular-nums text-[var(--text-primary)]">{value}</p>
        <p className="mt-1 text-[11px] leading-4 text-[var(--text-secondary)]">{sub}</p>
      </div>
    </div>
  );
}

// ─── Status distribution ───────────────────────────────────────────────────────

export function StatusDistributionCard({ countMap, total }: { countMap: Record<string, number>; total: number }) {
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
          <span className="text-[10px] font-semibold uppercase text-[var(--text-muted)]">Totalt</span>
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
                    <p className="text-[10px] font-semibold uppercase text-[var(--text-muted)]">
                      Aktiv del
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: highlightedRow.color }} />
                      <p className="text-sm font-semibold text-[var(--text-primary)]">{highlightedRow.label}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-semibold uppercase text-[var(--text-muted)]">andel</p>
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
                  <p className="text-[9px] font-semibold uppercase text-[var(--text-muted)]">antal</p>
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

export function ProjectStatsCard({ stats }: { stats: ProjectStats }) {
  const completionRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

  return (
    <motion.div variants={fadeUp} className="rounded-[20px] border border-[var(--border)] bg-[linear-gradient(180deg,var(--surface-0),var(--surface-1))] px-4 py-3.5 shadow-[0_14px_34px_rgba(0,0,0,0.06)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold tracking-tight text-[var(--text-primary)]">Projektläge</h2>
          <p className="mt-0.5 text-[11px] text-[var(--text-secondary)]">Leverans efter accepterade offerter</p>
        </div>
        <Link href="/projekt" className="rounded-full border border-[var(--border)] bg-[var(--surface-1)] px-2.5 py-1 text-[10px] font-semibold text-[var(--accent)] transition-colors hover:bg-[var(--surface-hover)]">
          Alla projekt
        </Link>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-0)] px-3 py-2.5">
          <p className="text-[9px] font-semibold uppercase text-[var(--text-muted)]">Aktiva</p>
          <p className="mt-1 text-lg font-semibold tabular-nums text-[var(--text-primary)]">{stats.active}</p>
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-0)] px-3 py-2.5">
          <p className="text-[9px] font-semibold uppercase text-[var(--text-muted)]">Klart</p>
          <p className="mt-1 text-lg font-semibold tabular-nums text-[var(--status-accepted-text)]">{stats.completed}</p>
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-0)] px-3 py-2.5">
          <p className="text-[9px] font-semibold uppercase text-[var(--text-muted)]">Andel</p>
          <p className="mt-1 text-lg font-semibold tabular-nums text-[var(--text-primary)]">{completionRate}%</p>
        </div>
      </div>

      <div className="mt-3 space-y-2">
        {PROJECT_STAGE_ORDER.map((stage) => {
          const meta = PROJECT_STAGE_META[stage];
          const count = stats.stages[stage] ?? 0;
          const percent = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
          return (
            <Link
              key={stage}
              href={`/projekt?stage=${meta.query}`}
              className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 rounded-2xl border border-[var(--border)] bg-[var(--surface-0)] px-3 py-2 transition-colors hover:bg-[var(--surface-hover)]"
            >
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: meta.color }} />
              <div className="min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-[11px] font-semibold text-[var(--text-primary)]">{meta.label}</span>
                  <span className="text-[10px] tabular-nums text-[var(--text-muted)]">{percent}%</span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[var(--surface-2)]">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percent}%` }}
                    transition={{ duration: 0.45, ease: 'easeOut' }}
                    className="h-full rounded-full"
                    style={{ background: meta.color }}
                  />
                </div>
              </div>
              <span className="text-sm font-semibold tabular-nums text-[var(--text-primary)]">{count}</span>
            </Link>
          );
        })}
      </div>
    </motion.div>
  );
}

export function OffersPaginated({ offers }: { offers: RecentOffer[] }) {
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
              className={cn(
                'grid gap-3 border-l-4 border-l-transparent px-5 py-3.5 transition-colors hover:bg-[var(--surface-hover)] md:grid-cols-[72px_minmax(0,1fr)_auto_auto_120px_76px] md:items-center',
                offer.project?.stage === 'completed' && 'border-l-[var(--status-accepted-text)] bg-[color-mix(in_srgb,var(--status-accepted-bg)_24%,var(--surface-0))]',
              )}
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
              <div className="md:justify-self-start"><ProjectStageBadge project={offer.project}/></div>
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
