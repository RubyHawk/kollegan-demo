'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { CalendarBlank, CloudSun, DotsThreeVertical } from '@phosphor-icons/react';
import type {
  DashboardCalendar,
  DashboardFocusMetrics,
  DashboardToday,
  DashboardWeather,
} from '@modules/generic/dashboard';
import { DashboardDotLabel, MetricTile } from './dashboard-cockpit-primitives';
import { fmtSEK, fmtTime } from './dashboard-cockpit-utils';


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
      className="grid min-h-[164px] overflow-hidden rounded-md border border-[var(--cockpit-border,var(--border))] bg-[var(--surface-0)] shadow-[var(--cockpit-shadow)] xl:h-[164px] xl:grid-cols-[1.1fr_1.7fr_3.25fr_1.05fr]"
      variants={{ initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 } }}
    >
      <div className="border-b border-[var(--cockpit-border-soft,var(--border))] px-3.5 py-3 xl:border-b-0 xl:border-r xl:border-[var(--cockpit-divider,var(--cockpit-border-soft))]">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">Idag</h2>
          <span className="text-[10.5px] font-medium text-[var(--text-muted)]">{today.dateLabel.replace(/^\S+\s/, '')}</span>
        </div>
        <div className="mt-3 flex items-start gap-2.5">
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
          className="mt-4 inline-flex h-8 items-center rounded bg-[var(--accent)] px-3 text-[11px] font-semibold text-white transition-opacity hover:opacity-90"
        >
          Visa dagsplan
        </Link>
      </div>

      <div className="border-b border-[var(--cockpit-border-soft,var(--border))] px-3.5 py-3 xl:border-b-0 xl:border-r xl:border-[var(--cockpit-divider,var(--cockpit-border-soft))]">
        <div className="mb-2.5 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">Dagens fokus</h2>
          <DotsThreeVertical size={16} weight="bold" className="text-[var(--text-muted)]" />
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
          <div key={item.label} className="min-w-0 border-b border-r border-[var(--cockpit-divider,var(--cockpit-border-soft))] px-3 py-3.5 last:border-r-0 sm:[&:nth-child(2n)]:border-r-0 xl:border-b-0 xl:[&:nth-child(2n)]:border-r xl:[&:nth-child(4n)]:border-r-0">
            <p className="text-[10.5px] font-medium leading-3 text-[var(--text-muted)]">{item.label}</p>
            <p className="mt-2 whitespace-nowrap text-[19px] font-semibold tabular-nums leading-none text-[var(--text-primary)]">{item.value}</p>
            <p className="mt-1 text-[11px] text-[var(--text-secondary)]">{item.detail}</p>
          </div>
        ))}
      </div>

      <div className="relative overflow-hidden bg-[linear-gradient(135deg,color-mix(in_srgb,var(--surface-0)_90%,white),color-mix(in_srgb,var(--accent-subtle)_42%,var(--surface-0)))] px-3.5 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">{weather.locationName}</h2>
            <p className="text-[10px] text-[var(--text-secondary)]">SMHI{weatherUpdated ? ` · ${weatherUpdated}` : ''}</p>
          </div>
          <CloudSun size={20} weight="duotone" className="text-[var(--text-muted)]" />
        </div>
        <div className="mt-3 flex items-start justify-between gap-2">
          <div>
            <p className="text-[28px] font-semibold leading-none tabular-nums text-[var(--text-primary)]">
              {weather.temperatureC === null ? '--' : `${Math.round(weather.temperatureC)}°`}
            </p>
            <p className="mt-1 text-[11px] leading-4 text-[var(--text-secondary)]">{weather.conditionLabel}</p>
          </div>
          <DashboardDotLabel tone={weather.status === 'ok' ? 'info' : 'neutral'}>{weather.status === 'ok' ? 'Live' : 'Ej ansluten'}</DashboardDotLabel>
        </div>
        <p className="mt-1.5 truncate text-[10.5px] text-[var(--text-secondary)]">
          Vind <strong className="font-semibold text-[var(--text-primary)]">{weather.windSpeed === null ? '--' : `${weather.windSpeed.toFixed(1)} m/s`}</strong>
          <span className="px-1 text-[var(--text-muted)]">·</span>
          Fukt <strong className="font-semibold text-[var(--text-primary)]">{weather.humidity === null ? '--' : `${Math.round(weather.humidity)}%`}</strong>
        </p>
        {weather.forecast.length > 0 ? (
          <div className="mt-1.5 flex items-center gap-3 border-t border-[var(--cockpit-divider,var(--cockpit-border-soft))] pt-1.5 text-[10.5px]">
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
