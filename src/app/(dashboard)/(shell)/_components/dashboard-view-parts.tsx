'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { animate, motion, useMotionValue } from 'framer-motion';
import Link from 'next/link';
import type { ProjectStage, ProjectStats } from '@modules/generic/dashboard';
import { cn } from '@shared/lib/utils';

export { TrendCard } from './dashboard-trend-card';

export const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.045, delayChildren: 0.03 } },
};

export const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring' as const, stiffness: 320, damping: 32 },
  },
};

export const fadeIn = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.22 } },
};

const STATUS_ORDER = ['sent', 'viewed', 'accepted', 'declined', 'draft', 'expired'] as const;

const STATUS_META: Record<string, { label: string; color: string; bg: string; border: string }> = {
  draft: {
    label: 'Utkast',
    color: 'var(--status-draft-text)',
    bg: 'var(--status-draft-bg)',
    border: 'var(--status-draft-border)',
  },
  sent: {
    label: 'Skickad',
    color: 'var(--status-sent-text)',
    bg: 'var(--status-sent-bg)',
    border: 'color-mix(in srgb, var(--status-sent-text) 24%, var(--border))',
  },
  viewed: {
    label: 'Visad',
    color: 'var(--status-viewed-text)',
    bg: 'var(--status-viewed-bg)',
    border: 'color-mix(in srgb, var(--status-viewed-text) 24%, var(--border))',
  },
  accepted: {
    label: 'Accepterad',
    color: 'var(--status-accepted-text)',
    bg: 'var(--status-accepted-bg)',
    border: 'color-mix(in srgb, var(--status-accepted-text) 24%, var(--border))',
  },
  declined: {
    label: 'Avvisad',
    color: 'var(--status-declined-text)',
    bg: 'var(--status-declined-bg)',
    border: 'color-mix(in srgb, var(--status-declined-text) 24%, var(--border))',
  },
  expired: {
    label: 'Utgången',
    color: 'var(--status-expired-text)',
    bg: 'var(--status-expired-bg)',
    border: 'color-mix(in srgb, var(--status-expired-text) 24%, var(--border))',
  },
};

const PROJECT_STAGE_ORDER: ProjectStage[] = ['details', 'ordered', 'arrived', 'in_progress', 'completed'];

const PROJECT_STAGE_META: Record<ProjectStage, { label: string; query: string; color: string; bg: string }> = {
  details: { label: 'Uppgifter', query: 'uppgifter', color: 'var(--text-secondary)', bg: 'var(--surface-2)' },
  ordered: { label: 'Beställt', query: 'bestallt', color: 'var(--status-sent-text)', bg: 'var(--status-sent-bg)' },
  arrived: { label: 'Ankommet', query: 'ankommet', color: 'var(--status-viewed-text)', bg: 'var(--status-viewed-bg)' },
  in_progress: { label: 'Pågår', query: 'pagar', color: 'var(--accent)', bg: 'var(--accent-subtle)' },
  completed: { label: 'Klart', query: 'klart', color: 'var(--status-accepted-text)', bg: 'var(--status-accepted-bg)' },
};

export function DashboardClock() {
  const [time, setTime] = useState('');

  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString('sv-SE', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Europe/Stockholm',
    }));
    tick();
    const id = setInterval(tick, 15000);
    return () => clearInterval(id);
  }, []);

  if (!time) return <div className="h-7 w-28 animate-pulse rounded-full bg-[var(--surface-2)]" />;

  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-[var(--border-light)] bg-[var(--surface-1)] px-2.5 py-1 text-[11px] font-semibold text-[var(--text-secondary)]">
      <span className="h-1.5 w-1.5 rounded-full bg-[var(--status-accepted-text)]" />
      Stockholm {time}
    </span>
  );
}

export function Counter({ to, suffix = '', decimals = 0 }: { to: number; suffix?: string; decimals?: number }) {
  const mv = useMotionValue(0);
  const [display, setDisplay] = useState('0');

  useEffect(() => {
    const c = animate(mv, to, {
      duration: 0.65,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (value) => setDisplay(value.toLocaleString('sv-SE', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })),
    });
    return c.stop;
  }, [decimals, mv, to]);

  return <>{display}{suffix}</>;
}

export function DashboardCard({
  title,
  description,
  action,
  className,
  children,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <motion.section
      variants={fadeUp}
      className={cn(
        'overflow-hidden rounded-xl border border-[var(--border-light)] bg-[var(--surface-0)] shadow-[0_10px_26px_rgba(15,23,42,0.045)]',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3 border-b border-[var(--border-light)] px-4 py-3.5">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold tracking-tight text-[var(--text-primary)]">{title}</h2>
          {description ? <p className="mt-0.5 text-xs leading-5 text-[var(--text-secondary)]">{description}</p> : null}
        </div>
        {action}
      </div>
      {children}
    </motion.section>
  );
}

export function MetricCard({
  icon,
  label,
  value,
  sub,
  tone,
}: {
  icon: ReactNode;
  label: string;
  value: ReactNode;
  sub: string;
  tone: 'accent' | 'success' | 'warning' | 'danger' | 'neutral';
}) {
  const toneClass = {
    accent: 'bg-[var(--accent-subtle)] text-[var(--accent)] border-[var(--accent-border)]',
    success: 'bg-[var(--status-accepted-bg)] text-[var(--status-accepted-text)] border-[color-mix(in_srgb,var(--status-accepted-text)_20%,var(--border))]',
    warning: 'bg-[var(--status-expired-bg)] text-[var(--status-expired-text)] border-[color-mix(in_srgb,var(--status-expired-text)_20%,var(--border))]',
    danger: 'bg-[var(--status-danger-bg)] text-[var(--status-danger-text)] border-[color-mix(in_srgb,var(--status-danger-text)_20%,var(--border))]',
    neutral: 'bg-[var(--surface-1)] text-[var(--text-muted)] border-[var(--border-light)]',
  }[tone];

  return (
    <motion.div
      variants={fadeUp}
      className="group rounded-xl border border-[var(--border-light)] bg-[var(--surface-0)] p-3.5 shadow-[0_8px_22px_rgba(15,23,42,0.04)] transition-colors hover:border-[var(--border)] hover:bg-[color-mix(in_srgb,var(--surface-0)_88%,var(--surface-1))]"
    >
      <div className="flex items-start gap-3">
        <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border', toneClass)}>
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">{label}</p>
          <p className="mt-1 flex items-baseline gap-0.5 text-[20px] font-semibold leading-none tabular-nums text-[var(--text-primary)]">
            {value}
          </p>
          <p className="mt-1.5 text-xs leading-4 text-[var(--text-secondary)]">{sub}</p>
        </div>
      </div>
    </motion.div>
  );
}

export function ProjectStatsCard({ stats }: { stats: ProjectStats }) {
  const completionRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

  return (
    <DashboardCard
      title="Projektläge"
      description="Leveransstatus för accepterade offerter"
      action={(
        <Link href="/projekt" className="rounded-lg px-2 py-1 text-xs font-semibold text-[var(--accent)] transition-colors hover:bg-[var(--accent-subtle)]">
          Alla projekt
        </Link>
      )}
    >
      <div className="p-4">
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Aktiva', value: stats.active, color: 'var(--text-primary)' },
            { label: 'Klart', value: stats.completed, color: 'var(--status-accepted-text)' },
            { label: 'Andel', value: `${completionRate}%`, color: 'var(--accent)' },
          ].map((item) => (
            <div key={item.label} className="rounded-lg border border-[var(--border-light)] bg-[var(--surface-1)] px-3 py-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">{item.label}</p>
              <p className="mt-1 text-lg font-semibold tabular-nums" style={{ color: item.color }}>{item.value}</p>
            </div>
          ))}
        </div>

        <div className="mt-3 flex h-2 overflow-hidden rounded-full bg-[var(--surface-2)]">
          {PROJECT_STAGE_ORDER.map((stage) => {
            const count = stats.stages[stage] ?? 0;
            const width = stats.total > 0 ? (count / stats.total) * 100 : 0;
            return (
              <span
                key={stage}
                className="min-w-[2px]"
                style={{ width: `${width}%`, background: PROJECT_STAGE_META[stage].color }}
                title={`${PROJECT_STAGE_META[stage].label}: ${count}`}
              />
            );
          })}
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
                className="grid grid-cols-[minmax(74px,auto)_minmax(0,1fr)_42px] items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-[var(--surface-1)]"
              >
                <span className="flex items-center gap-2 text-xs font-semibold text-[var(--text-primary)]">
                  <span className="h-2 w-2 rounded-full" style={{ background: meta.color }} />
                  {meta.label}
                </span>
                <span className="h-1.5 overflow-hidden rounded-full bg-[var(--surface-2)]">
                  <motion.span
                    initial={{ width: 0 }}
                    animate={{ width: `${percent}%` }}
                    transition={{ duration: 0.35, ease: 'easeOut' }}
                    className="block h-full rounded-full"
                    style={{ background: meta.color }}
                  />
                </span>
                <span className="text-right text-xs font-semibold tabular-nums text-[var(--text-primary)]">{count}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </DashboardCard>
  );
}

export function StatusDistributionCard({ countMap, total }: { countMap: Record<string, number>; total: number }) {
  const [activeStatus, setActiveStatus] = useState<string | null>(null);
  const rows = useMemo(() => STATUS_ORDER.map((status) => {
    const count = countMap[status] ?? 0;
    return {
      status,
      count,
      percent: total > 0 ? Math.round((count / total) * 100) : 0,
      ...STATUS_META[status],
    };
  }), [countMap, total]);
  const populated = rows.filter((row) => row.count > 0);
  const highlightedStatus = activeStatus ?? populated[0]?.status ?? null;
  const highlightedRow = rows.find((row) => row.status === highlightedStatus);
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const segments = populated.map((row, index) => ({
    ...row,
    segment: circumference * (row.count / total),
    dashOffset: populated.slice(0, index).reduce((sum, previous) => sum + circumference * (previous.count / total), 0),
  }));

  return (
    <DashboardCard title="Statusfördelning" description="Pipeline och avslut just nu">
      {total === 0 ? (
        <div className="px-4 py-6 text-center">
          <p className="text-sm font-semibold text-[var(--text-primary)]">Ingen status att visa ännu</p>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">När offerter börjar skickas fylls fördelningen på automatiskt.</p>
        </div>
      ) : (
        <div className="grid gap-4 p-4 sm:grid-cols-[118px_minmax(0,1fr)]">
          <div className="relative mx-auto h-[118px] w-[118px]">
            <svg viewBox="0 0 118 118" className="h-[118px] w-[118px] -rotate-90">
              <circle cx="59" cy="59" r={radius} fill="none" stroke="var(--surface-2)" strokeWidth="13" />
              {segments.map((row) => (
                <circle
                  key={row.status}
                  cx="59"
                  cy="59"
                  r={radius}
                  fill="none"
                  stroke={row.color}
                  strokeLinecap="round"
                  strokeWidth={highlightedStatus === row.status ? 15 : 12}
                  opacity={highlightedStatus && highlightedStatus !== row.status ? 0.32 : 1}
                  strokeDasharray={`${row.segment} ${circumference - row.segment}`}
                  strokeDashoffset={-row.dashOffset}
                  className="cursor-pointer transition-all"
                  onMouseEnter={() => setActiveStatus(row.status)}
                  onMouseLeave={() => setActiveStatus(null)}
                >
                  <title>{`${row.label}: ${row.count}`}</title>
                </circle>
              ))}
            </svg>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-semibold leading-none tabular-nums text-[var(--text-primary)]">
                {highlightedRow?.count ?? total}
              </span>
              <span className="mt-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">totalt</span>
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            {rows.map((row) => (
              <button
                key={row.status}
                type="button"
                onClick={() => setActiveStatus((current) => current === row.status ? null : row.status)}
                onMouseEnter={() => setActiveStatus(row.status)}
                onMouseLeave={() => setActiveStatus(null)}
                className={cn(
                  'rounded-lg border px-2.5 py-2 text-left transition-colors',
                  highlightedStatus === row.status ? 'border-[var(--accent-border)] bg-[var(--accent-subtle)]' : 'border-[var(--border-light)] bg-[var(--surface-1)] hover:bg-[var(--surface-hover)]',
                )}
              >
                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-1.5">
                  <span className="flex min-w-0 items-center gap-1.5 text-[10px] font-semibold text-[var(--text-primary)]">
                    <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: row.color }} />
                    <span className="truncate">{row.label}</span>
                  </span>
                  <span className="shrink-0 text-[11px] font-semibold tabular-nums text-[var(--text-primary)]">{row.count}</span>
                </div>
                <div className="mt-1.5 flex items-center gap-2">
                  <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--surface-2)]">
                    <span className="block h-full rounded-full" style={{ width: `${row.percent}%`, background: row.color }} />
                  </span>
                  <span className="w-8 text-right text-[10px] tabular-nums text-[var(--text-muted)]">{row.percent}%</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </DashboardCard>
  );
}
