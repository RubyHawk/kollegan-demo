'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Line,
  LineChart,
} from 'recharts';
import type {
  DashboardActionItem,
  DashboardActivityFeedItem,
  DashboardCalendar,
  DashboardFocusMetrics,
  DashboardOfferTableRow,
  DashboardPipelineOverview,
  DashboardProjectHandoff,
  DashboardToday,
  DashboardWeather,
} from '@modules/generic/dashboard';
import {
  CheckCircleIcon,
  ReceiptIcon,
} from '@shared/ui/icons';
import { cn } from '@shared/lib/utils';
import {
  Bell,
  CalendarBlank,
  CloudSun,
  DotsThreeVertical,
  WarningCircle,
} from '@phosphor-icons/react';
import { EmptyPanelState, MetricTile, Panel } from './dashboard-cockpit-primitives';
import { fmtCompactSEK, fmtRelativeDate, fmtSEK, fmtTime, toneClasses } from './dashboard-cockpit-utils';

const KPI_TREND = [
  { x: 1, value: 22 },
  { x: 2, value: 28 },
  { x: 3, value: 25 },
  { x: 4, value: 34 },
  { x: 5, value: 31 },
  { x: 6, value: 42 },
  { x: 7, value: 39 },
];

function TinySparkline({ tone = 'accent' }: { tone?: 'accent' | 'success' | 'info' }) {
  const color = tone === 'success'
    ? 'var(--status-accepted-text)'
    : tone === 'info'
      ? 'var(--status-viewed-text)'
      : 'var(--accent)';

  return (
    <div className="mt-3 overflow-hidden">
      <LineChart width={118} height={30} data={KPI_TREND} margin={{ top: 4, right: 2, left: 2, bottom: 2 }}>
        <Line
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={1.8}
          dot={false}
          isAnimationActive={false}
        />
      </LineChart>
    </div>
  );
}

export function TodayFocusPanel({
  today,
  focusMetrics,
  calendar,
}: {
  today: DashboardToday;
  focusMetrics: DashboardFocusMetrics;
  calendar: DashboardCalendar;
}) {
  const next = today.nextMeeting;

  return (
    <motion.section
      className="grid h-full min-h-[172px] overflow-hidden rounded-md border border-[var(--cockpit-border,var(--border))] bg-[var(--surface-0)] shadow-[var(--cockpit-shadow)] md:grid-cols-[144px_minmax(0,1fr)]"
      variants={{ initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 } }}
    >
      <div className="border-b border-[var(--cockpit-border-soft,var(--border))] px-3 py-2.5 md:border-b-0 md:border-r">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">Idag</h2>
          <span className="hidden text-[10px] font-semibold text-[var(--text-muted)] md:inline">{today.dateLabel.replace(/^\S+\s/, '')}</span>
        </div>
        <div className="mt-3 flex items-start gap-2">
          <CalendarBlank size={14} weight="duotone" className="mt-0.5 shrink-0 text-[var(--text-muted)]" />
          <div className="min-w-0">
          {next ? (
            <>
              <p className="truncate text-xs font-semibold text-[var(--text-primary)]">{next.title}</p>
              <p className="mt-0.5 text-[11px] leading-4 text-[var(--text-secondary)]">
                {next.allDay ? 'Hela dagen' : `${fmtTime(next.start)}-${fmtTime(next.end) || fmtTime(next.start)}`}
              </p>
            </>
          ) : (
            <>
              <p className="text-xs font-semibold text-[var(--text-primary)]">Inget planerat</p>
              <p className="mt-0.5 text-[11px] leading-4 text-[var(--text-secondary)]">
                {calendar.configured ? 'Fri resten av dagen.' : 'Koppla kalender.'}
              </p>
            </>
          )}
          </div>
        </div>
          <Link
            href="/meetings"
          className="mt-3 inline-flex h-7 items-center gap-2 rounded-md bg-[var(--accent)] px-3 text-[11px] font-semibold text-white transition-opacity hover:opacity-90"
          >
            Visa dagsplan
          </Link>
      </div>

      <div className="min-w-0 px-3 py-2.5">
        <div className="mb-1.5 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">Dagens fokus</h2>
          <DotsThreeVertical size={18} weight="bold" className="text-[var(--text-muted)]" />
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          <MetricTile label="Över deadline" value={focusMetrics.overdue} detail="Kräver åtgärd" tone={focusMetrics.overdue > 0 ? 'danger' : 'neutral'} />
          <MetricTile label="Nära deadline" value={focusMetrics.dueSoon} detail="Inom 7 dagar" tone={focusMetrics.dueSoon > 0 ? 'warning' : 'neutral'} />
          <MetricTile label="Saknar uppföljning" value={focusMetrics.missingFollowUp} detail="Kunder" tone={focusMetrics.missingFollowUp > 0 ? 'accent' : 'neutral'} />
          <MetricTile label="Möten idag" value={focusMetrics.meetingsToday} detail="Planerade" />
        </div>
      </div>
    </motion.section>
  );
}

export function WeatherPanel({ weather }: { weather: DashboardWeather }) {
  return (
    <motion.section
      className="h-full min-h-[172px] overflow-hidden rounded-md border border-[var(--cockpit-border,var(--border))] bg-[var(--surface-0)] shadow-[var(--cockpit-shadow)]"
      variants={{ initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 } }}
    >
      <div className="flex h-9 items-center justify-between border-b border-[var(--cockpit-border-soft,var(--border))] px-3">
        <div>
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">{weather.locationName}</h2>
          <p className="text-[10px] text-[var(--text-secondary)]">Väder</p>
        </div>
        <CloudSun size={18} weight="duotone" className="text-[var(--text-muted)]" />
      </div>
      <div className="p-3 pt-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-[30px] font-semibold leading-none tabular-nums text-[var(--text-primary)]">
              {weather.temperatureC === null ? '--' : `${Math.round(weather.temperatureC)}°`}
            </p>
            <p className="mt-0.5 text-xs leading-4 text-[var(--text-secondary)]">{weather.conditionLabel}</p>
          </div>
          <div className="rounded-md border border-[var(--cockpit-border-soft,var(--border))] bg-[var(--surface-1)] px-2.5 py-1.5 text-right">
            <p className="text-[10px] font-semibold uppercase text-[var(--text-muted)]">Nu</p>
            <p className="text-xs text-[var(--text-secondary)]">
              {weather.status === 'ok' ? 'SMHI' : 'Ej tillgängligt'}
            </p>
          </div>
        </div>

        <div className="mt-1.5 truncate text-[11px] text-[var(--text-secondary)]">
          Vind{' '}
          <strong className="font-semibold tabular-nums text-[var(--text-primary)]">
            {weather.windSpeed === null ? '--' : `${weather.windSpeed.toFixed(1)} m/s`}
          </strong>
          <span className="px-1 text-[var(--text-muted)]">·</span>
          Fukt{' '}
          <strong className="font-semibold tabular-nums text-[var(--text-primary)]">
            {weather.humidity === null ? '--' : `${Math.round(weather.humidity)}%`}
          </strong>
        </div>

        {weather.forecast.length > 0 ? (
          <div className="mt-2 flex items-center gap-3 border-t border-[var(--cockpit-border-soft,var(--border))] pt-2 text-[11px]">
            {weather.forecast.slice(0, 2).map((point) => (
              <div key={point.time || point.label} className="min-w-0">
                <span className="mr-1 text-[var(--text-muted)]">{point.label}</span>
                <span className="font-semibold tabular-nums text-[var(--text-primary)]">
                  {point.temperatureC === null ? '--' : `${Math.round(point.temperatureC)}°`}
                </span>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </motion.section>
  );
}

export function KpiStrip({
  acceptedValue,
  pipelineValue,
  acceptanceRate,
  averageWonValue,
}: {
  acceptedValue: number;
  pipelineValue: number;
  acceptanceRate: number | null;
  averageWonValue: number;
}) {
  const items = [
    { label: 'Accepterat denna månad', value: fmtSEK(acceptedValue), detail: 'Vunna offerter' },
    { label: 'Aktiv pipeline', value: fmtSEK(pipelineValue), detail: 'Skickade och visade' },
    { label: 'Vinstgrad', value: acceptanceRate === null ? '--' : `${acceptanceRate}%`, detail: 'Av avslutade' },
    { label: 'Snittaffär', value: averageWonValue > 0 ? fmtSEK(averageWonValue) : '--', detail: 'Vunna' },
  ];

  return (
    <motion.section
      className="grid h-full min-h-[172px] overflow-hidden rounded-md border border-[var(--cockpit-border,var(--border))] bg-[var(--surface-0)] shadow-[var(--cockpit-shadow)] sm:grid-cols-2 xl:grid-cols-4"
      initial="initial"
      animate="animate"
      variants={{ initial: {}, animate: { transition: { staggerChildren: 0.03 } } }}
    >
      {items.map((item) => (
        <motion.div
          key={item.label}
          variants={{ initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 } }}
          className="min-w-0 border-b border-r border-[var(--cockpit-border-soft,var(--border))] p-4 last:border-r-0 sm:[&:nth-child(2n)]:border-r-0 xl:border-b-0 xl:[&:nth-child(2n)]:border-r xl:[&:nth-child(4n)]:border-r-0"
        >
          <p className="text-[10px] font-semibold uppercase text-[var(--text-muted)]">{item.label}</p>
          <p className="mt-2 whitespace-nowrap text-[22px] font-semibold tabular-nums leading-none text-[var(--text-primary)]">{item.value}</p>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">{item.detail}</p>
          <TinySparkline tone={item.label === 'Vinstgrad' ? 'success' : item.label === 'Snittaffär' ? 'info' : 'accent'} />
        </motion.div>
      ))}
    </motion.section>
  );
}

export function ActionQueue({ items }: { items: DashboardActionItem[] }) {
  return (
    <Panel
      title="Kräver handling"
      eyebrow={`${items.length} prioriterade`}
      action={<DotsThreeVertical size={18} weight="bold" className="text-[var(--text-muted)]" />}
      className="xl:col-span-5"
    >
      {items.length === 0 ? (
        <EmptyPanelState title="Inga akuta åtgärder" body="Öppna offerter och uppföljningar ser lugna ut just nu." />
      ) : (
        <div className="flex-1 divide-y divide-[var(--cockpit-border-soft,var(--border))] overflow-hidden">
          {items.map((item) => (
            <Link key={item.id} href={item.href} className="grid min-h-[62px] gap-3 px-4 py-2.5 transition-colors hover:bg-[var(--surface-hover)] sm:grid-cols-[104px_minmax(0,1fr)_auto] sm:items-center">
              <span className={cn('w-fit rounded-md border px-2 py-1 text-[10px] font-semibold uppercase', toneClasses(item.tone))}>
                <span className="inline-flex items-center gap-1">
                  {item.tone === 'danger' ? <WarningCircle size={12} weight="fill" /> : null}
                  {item.tone === 'danger' ? 'Kritisk' : item.tone === 'warning' ? 'Varning' : 'Normal'}
                </span>
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold text-[var(--text-primary)]">{item.label}</span>
                <span className="mt-0.5 block truncate text-xs text-[var(--text-secondary)]">{item.detail}</span>
              </span>
              <span className="w-fit rounded-md border border-[var(--border)] bg-[var(--surface-1)] px-3 py-1.5 text-xs font-semibold text-[var(--accent)]">
                {item.actionLabel}
              </span>
            </Link>
          ))}
        </div>
      )}
    </Panel>
  );
}

export function OfferTable({ rows }: { rows: DashboardOfferTableRow[] }) {
  return (
    <Panel
      title="Aktiva offerter"
      eyebrow={`${rows.length} rader`}
      action={<Link href="/offerter" className="text-xs font-semibold text-[var(--accent)] hover:underline">Visa alla</Link>}
      className="xl:col-span-7"
    >
      {rows.length === 0 ? (
        <EmptyPanelState title="Inga aktiva offerter" body="När du skapar eller skickar offerter visas de här." />
      ) : (
        <div className="flex-1 overflow-hidden">
          <table className="w-full table-fixed text-left">
            <colgroup>
              <col className="w-[112px]" />
              <col />
              <col className="w-[104px]" />
              <col className="w-[126px]" />
              <col className="w-[128px]" />
            </colgroup>
            <thead className="sticky top-0 border-b border-[var(--cockpit-border-soft,var(--border))] bg-[var(--surface-1)] text-[10px] uppercase text-[var(--text-muted)]">
              <tr>
                <th className="px-3 py-2 font-semibold">Status</th>
                <th className="px-3 py-2 font-semibold">Kund</th>
                <th className="px-3 py-2 font-semibold">Belopp</th>
                <th className="px-3 py-2 font-semibold">Deadline</th>
                <th className="px-4 py-2 font-semibold">Nästa steg</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--cockpit-border-soft,var(--border))]">
              {rows.map((row) => (
                <tr key={row.id} className="transition-colors hover:bg-[var(--surface-hover)]">
                  <td className="px-3 py-1.5">
                    <Link href={row.href} className={cn('inline-flex whitespace-nowrap rounded-md border px-2 py-1 text-[11px] font-semibold', toneClasses(statusTone(row.status)))}>
                      {row.statusLabel}
                    </Link>
                  </td>
                  <td className="min-w-0 px-3 py-1.5">
                    <Link href={row.href} className="block">
                      <span className="block truncate text-[13px] font-semibold leading-4 text-[var(--text-primary)]">{row.customer}</span>
                      <span className="block truncate text-[11px] leading-3 text-[var(--text-muted)]">Offert {row.offerNumber}</span>
                    </Link>
                  </td>
                  <td className="whitespace-nowrap px-3 py-1.5 text-[13px] font-semibold tabular-nums text-[var(--text-primary)]">{fmtSEK(row.amount)}</td>
                  <td className="px-3 py-1.5">
                    <span className={cn('inline-flex whitespace-nowrap rounded-md border px-2 py-1 text-[11px] font-semibold', toneClasses(row.deadlineTone))}>
                      {row.deadlineLabel}
                    </span>
                  </td>
                  <td className="truncate px-3 py-1.5 text-[13px] text-[var(--text-secondary)]">{row.nextStep}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  );
}

export function PipelinePanel({ overview }: { overview: DashboardPipelineOverview }) {
  return (
    <Panel title="Pipelineöversikt" eyebrow={`Värde i pipeline ${fmtSEK(overview.totalValue)}`} action={<DotsThreeVertical size={18} weight="bold" className="text-[var(--text-muted)]" />} className="xl:col-span-4">
      <div className="grid flex-1 grid-cols-2 gap-px bg-[var(--cockpit-border-soft,var(--border))] sm:grid-cols-4">
        {overview.stages.map((stage) => (
          <Link key={stage.id} href={`/offerter?status=${stage.id}`} className="bg-[var(--surface-0)] p-3 transition-colors hover:bg-[var(--surface-hover)]">
            <p className="text-[10px] font-semibold uppercase text-[var(--text-muted)]">{stage.label}</p>
            <p className="mt-2 text-xl font-semibold tabular-nums text-[var(--text-primary)]">{stage.count}</p>
            <p className="mt-1 text-xs text-[var(--text-secondary)]">{fmtCompactSEK(stage.value)}</p>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[var(--surface-2)]">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${stage.percent}%` }}
                className="h-full rounded-full bg-[var(--accent)]"
              />
            </div>
          </Link>
        ))}
      </div>
    </Panel>
  );
}

export function ProjectHandoffPanel({ projects }: { projects: DashboardProjectHandoff[] }) {
  return (
    <Panel
      title="Projektöverlämning"
      eyebrow={`${projects.length} aktiva projekt`}
      action={<Link href="/projekt" className="text-xs font-semibold text-[var(--accent)] hover:underline">Alla projekt</Link>}
      className="xl:col-span-4"
    >
      {projects.length === 0 ? (
        <EmptyPanelState title="Inga projekt att lämna över" body="Accepterade offerter som blir projekt hamnar här." />
      ) : (
        <div className="flex-1 divide-y divide-[var(--cockpit-border-soft,var(--border))] overflow-auto">
          {projects.map((project) => (
            <Link key={project.id} href={project.href} className="grid gap-2 px-4 py-3 transition-colors hover:bg-[var(--surface-hover)] sm:grid-cols-[minmax(0,1fr)_104px_88px] sm:items-center">
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold text-[var(--text-primary)]">{project.name}</span>
                <span className="mt-0.5 block truncate text-xs text-[var(--text-secondary)]">{project.customer}</span>
              </span>
              <span className="rounded-md border border-[var(--accent-border)] bg-[var(--accent-subtle)] px-2 py-1 text-center text-[11px] font-semibold text-[var(--accent)]">
                {project.stageLabel}
              </span>
              <span className="text-xs text-[var(--text-secondary)] sm:text-right">{project.handoffLabel}</span>
            </Link>
          ))}
        </div>
      )}
    </Panel>
  );
}

export function ActivityFeedPanel({ items }: { items: DashboardActivityFeedItem[] }) {
  return (
    <Panel title="Senaste aktivitet" eyebrow="Live från erbjudanden" action={<Bell size={18} weight="duotone" className="text-[var(--text-muted)]" />} className="xl:col-span-4">
      {items.length === 0 ? (
        <EmptyPanelState title="Ingen aktivitet ännu" body="Skapade, skickade, visade och accepterade offerter visas här." />
      ) : (
        <div className="flex-1 divide-y divide-[var(--cockpit-border-soft,var(--border))] overflow-auto">
          {items.map((item) => {
            const content = (
              <span className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 transition-colors hover:bg-[var(--surface-hover)]">
                <span className={cn('flex h-7 w-7 items-center justify-center rounded-full border', toneClasses(item.tone))}>
                  {item.tone === 'success' ? <CheckCircleIcon size={14} /> : <ReceiptIcon size={14} />}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-[var(--text-primary)]">{item.label}</span>
                  <span className="mt-0.5 block truncate text-xs text-[var(--text-secondary)]">{item.detail}</span>
                </span>
                <span className="text-[11px] text-[var(--text-muted)]">{fmtRelativeDate(item.occurredAt)}</span>
              </span>
            );

            return item.href ? <Link key={item.id} href={item.href}>{content}</Link> : <div key={item.id}>{content}</div>;
          })}
        </div>
      )}
    </Panel>
  );
}

function statusTone(status: string): DashboardOfferTableRow['deadlineTone'] {
  if (status === 'accepted') return 'success';
  if (status === 'viewed') return 'info';
  if (status === 'sent') return 'accent';
  return 'neutral';
}
