'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Line, LineChart } from 'recharts';
import { CalendarBlank, CloudSun, DotsThreeVertical } from '@phosphor-icons/react';
import type {
  DashboardCalendar,
  DashboardFocusMetrics,
  DashboardToday,
  DashboardWeather,
} from '@modules/generic/dashboard';
import { DashboardDotLabel, MetricTile } from './dashboard-cockpit-primitives';
import { fmtSEK, fmtTime } from './dashboard-cockpit-utils';

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
      <LineChart width={96} height={28} data={KPI_TREND} margin={{ top: 4, right: 2, left: 2, bottom: 2 }}>
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

export function TopCockpitBand({
  today,
  focusMetrics,
  calendar,
  weather,
  acceptedValue,
  pipelineValue,
  acceptanceRate,
  averageWonValue,
}: {
  today: DashboardToday;
  focusMetrics: DashboardFocusMetrics;
  calendar: DashboardCalendar;
  weather: DashboardWeather;
  acceptedValue: number;
  pipelineValue: number;
  acceptanceRate: number | null;
  averageWonValue: number;
}) {
  const next = today.nextMeeting;
  const weatherUpdated = weather.updatedAt ? fmtTime(weather.updatedAt) : '';
  const kpis = [
    { label: 'Accepterat', value: fmtSEK(acceptedValue), detail: 'Vunna offerter', tone: 'accent' as const },
    { label: 'Aktiv pipeline', value: fmtSEK(pipelineValue), detail: 'Skickade och visade', tone: 'accent' as const },
    { label: 'Vinstgrad', value: acceptanceRate === null ? '--' : `${acceptanceRate}%`, detail: 'Av avslutade', tone: 'success' as const },
    { label: 'Snittaffär', value: averageWonValue > 0 ? fmtSEK(averageWonValue) : '--', detail: 'Vunna offerter', tone: 'info' as const },
  ];

  return (
    <motion.section
      className="grid min-h-[170px] overflow-hidden rounded-lg border border-[var(--cockpit-border,var(--border))] bg-[var(--surface-0)] shadow-[var(--cockpit-shadow)] xl:h-[170px] xl:grid-cols-[1.25fr_1.85fr_3.45fr_1.15fr]"
      variants={{ initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 } }}
    >
      <div className="border-b border-[var(--cockpit-border-soft,var(--border))] px-4 py-3 xl:border-b-0 xl:border-r xl:border-[var(--cockpit-divider,var(--cockpit-border-soft))]">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="text-[15px] font-semibold text-[var(--text-primary)]">Idag</h2>
          <span className="text-[11px] font-medium text-[var(--text-muted)]">{today.dateLabel.replace(/^\S+\s/, '')}</span>
        </div>
        <div className="mt-4 flex items-start gap-2.5">
          <CalendarBlank size={15} weight="duotone" className="mt-0.5 shrink-0 text-[var(--text-muted)]" />
          <div className="min-w-0">
            {next ? (
              <>
                <p className="truncate text-[13px] font-semibold text-[var(--text-primary)]">{next.title}</p>
                <p className="mt-0.5 text-xs leading-4 text-[var(--text-secondary)]">
                  {next.allDay ? 'Hela dagen' : `${fmtTime(next.start)}-${fmtTime(next.end) || fmtTime(next.start)}`}
                </p>
              </>
            ) : (
              <>
                <p className="text-[13px] font-semibold text-[var(--text-primary)]">Inget planerat</p>
                <p className="mt-0.5 text-xs leading-4 text-[var(--text-secondary)]">
                  {calendar.configured ? 'Fri resten av dagen.' : 'Koppla kalender.'}
                </p>
              </>
            )}
          </div>
        </div>
        <Link
          href="/meetings"
          className="mt-4 inline-flex h-8 items-center rounded-md bg-[var(--accent)] px-3 text-xs font-semibold text-white transition-opacity hover:opacity-90"
        >
          Visa dagsplan
        </Link>
      </div>

      <div className="border-b border-[var(--cockpit-border-soft,var(--border))] px-4 py-3 xl:border-b-0 xl:border-r xl:border-[var(--cockpit-divider,var(--cockpit-border-soft))]">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[15px] font-semibold text-[var(--text-primary)]">Dagens fokus</h2>
          <DotsThreeVertical size={18} weight="bold" className="text-[var(--text-muted)]" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <MetricTile label="Över deadline" value={focusMetrics.overdue} detail="Kräver åtgärd" tone={focusMetrics.overdue > 0 ? 'danger' : 'neutral'} />
          <MetricTile label="Nära deadline" value={focusMetrics.dueSoon} detail="Inom 7 dagar" tone={focusMetrics.dueSoon > 0 ? 'warning' : 'neutral'} />
          <MetricTile label="Uppföljning" value={focusMetrics.missingFollowUp} detail="Saknas" tone={focusMetrics.missingFollowUp > 0 ? 'accent' : 'neutral'} />
          <MetricTile label="Möten idag" value={focusMetrics.meetingsToday} detail="Planerade" />
        </div>
      </div>

      <div className="grid border-b border-[var(--cockpit-border-soft,var(--border))] sm:grid-cols-2 xl:border-b-0 xl:border-r xl:border-[var(--cockpit-divider,var(--cockpit-border-soft))] xl:grid-cols-4">
        {kpis.map((item) => (
          <div key={item.label} className="min-w-0 border-b border-r border-[var(--cockpit-divider,var(--cockpit-border-soft))] px-3 py-4 last:border-r-0 sm:[&:nth-child(2n)]:border-r-0 xl:border-b-0 xl:[&:nth-child(2n)]:border-r xl:[&:nth-child(4n)]:border-r-0">
            <p className="text-[11px] font-medium leading-3 text-[var(--text-muted)]">{item.label}</p>
            <p className="mt-2 whitespace-nowrap text-[20px] font-semibold tabular-nums leading-none text-[var(--text-primary)]">{item.value}</p>
            <p className="mt-1 text-xs text-[var(--text-secondary)]">{item.detail}</p>
            <TinySparkline tone={item.tone} />
          </div>
        ))}
      </div>

      <div className="relative overflow-hidden bg-[linear-gradient(135deg,color-mix(in_srgb,var(--surface-0)_88%,white),color-mix(in_srgb,var(--accent-subtle)_50%,var(--surface-0)))] px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[15px] font-semibold text-[var(--text-primary)]">{weather.locationName}</h2>
            <p className="text-[10px] text-[var(--text-secondary)]">SMHI{weatherUpdated ? ` · ${weatherUpdated}` : ''}</p>
          </div>
          <CloudSun size={22} weight="duotone" className="text-[var(--text-muted)]" />
        </div>
        <div className="mt-3 flex items-start justify-between gap-2">
          <div>
            <p className="text-[32px] font-semibold leading-none tabular-nums text-[var(--text-primary)]">
              {weather.temperatureC === null ? '--' : `${Math.round(weather.temperatureC)}°`}
            </p>
            <p className="mt-1 text-xs leading-4 text-[var(--text-secondary)]">{weather.conditionLabel}</p>
          </div>
          <DashboardDotLabel tone={weather.status === 'ok' ? 'info' : 'neutral'}>{weather.status === 'ok' ? 'Live' : 'Ej ansluten'}</DashboardDotLabel>
        </div>
        <p className="mt-2 truncate text-[11px] text-[var(--text-secondary)]">
          Vind <strong className="font-semibold text-[var(--text-primary)]">{weather.windSpeed === null ? '--' : `${weather.windSpeed.toFixed(1)} m/s`}</strong>
          <span className="px-1 text-[var(--text-muted)]">·</span>
          Fukt <strong className="font-semibold text-[var(--text-primary)]">{weather.humidity === null ? '--' : `${Math.round(weather.humidity)}%`}</strong>
        </p>
        {weather.forecast.length > 0 ? (
          <div className="mt-2 flex items-center gap-3 border-t border-[var(--cockpit-divider,var(--cockpit-border-soft))] pt-2 text-[11px]">
            {weather.forecast.slice(0, 2).map((point) => (
              <span key={point.time || point.label} className="min-w-0 truncate text-[var(--text-secondary)]">
                {point.label} <strong className="font-semibold tabular-nums text-[var(--text-primary)]">{point.temperatureC === null ? '--' : `${Math.round(point.temperatureC)}°`}</strong>
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </motion.section>
  );
}
