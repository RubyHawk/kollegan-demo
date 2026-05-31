'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { CalendarBlank, CloudSun, DotsThreeVertical, TrendUp, TrendDown } from '@phosphor-icons/react';
import type {
  DashboardCalendar,
  DashboardFocusMetrics,
  DashboardKpiTrends,
  DashboardToday,
  DashboardWeather,
} from '@modules/generic/dashboard';
import { DashboardDotLabel, MetricTile } from './dashboard-cockpit-primitives';
import { fmtSEK, fmtTime } from './dashboard-cockpit-utils';

function MiniSparkline({ points, color }: { points: number[]; color: string }) {
  if (points.length < 2 || points.every((p) => p === 0)) return null;
  const max = Math.max(...points, 0.001);
  const min = Math.min(...points);
  const range = max - min || 1;
  const W = 54, H = 24, PAD = 2;
  const xs = points.map((_, i) => PAD + (i / (points.length - 1)) * (W - PAD * 2));
  const ys = points.map((v) => H - PAD - ((v - min) / range) * (H - PAD * 2));
  const d = xs.map((x, i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${ys[i].toFixed(1)}`).join(' ');
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} fill="none" aria-hidden>
      <path d={d} stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" opacity="0.7" />
    </svg>
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
  acceptedCount,
  kpiTrends,
}: {
  today: DashboardToday;
  focusMetrics: DashboardFocusMetrics;
  calendar: DashboardCalendar;
  weather: DashboardWeather;
  acceptedValue: number;
  pipelineValue: number;
  acceptanceRate: number | null;
  averageWonValue: number;
  acceptedCount: number;
  kpiTrends: DashboardKpiTrends;
}) {
  const next = today.nextMeeting;
  const weatherUpdated = weather.updatedAt ? fmtTime(weather.updatedAt) : '';

  return (
    <motion.section
      className="grid min-h-[164px] overflow-hidden rounded-md border border-[var(--cockpit-border,var(--border))] bg-[var(--surface-0)] shadow-[var(--cockpit-shadow)] xl:h-[164px] xl:grid-cols-[1.1fr_1.7fr_3.25fr_1.05fr]"
      variants={{ initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 } }}
    >
      {/* Idag */}
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
          Visa dagsplan →
        </Link>
      </div>

      {/* Dagens fokus */}
      <div className="border-b border-[var(--cockpit-border-soft,var(--border))] px-3.5 py-3 xl:border-b-0 xl:border-r xl:border-[var(--cockpit-divider,var(--cockpit-border-soft))]">
        <div className="mb-2.5 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">Dagens fokus</h2>
          <DotsThreeVertical size={16} weight="bold" className="text-[var(--text-muted)]" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <MetricTile label="Över deadline" value={focusMetrics.overdue} detail="Kräver åtgärd" tone={focusMetrics.overdue > 0 ? 'danger' : 'neutral'} />
          <MetricTile label="Nära deadline" value={focusMetrics.dueSoon} detail="Inom 7 dagar" tone={focusMetrics.dueSoon > 0 ? 'warning' : 'neutral'} />
          <MetricTile label="Uppföljning" value={focusMetrics.missingFollowUp} detail="Saknar" tone={focusMetrics.missingFollowUp > 0 ? 'accent' : 'neutral'} />
          <MetricTile label="Möten idag" value={focusMetrics.meetingsToday} detail="Planerade" />
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid border-b border-[var(--cockpit-border-soft,var(--border))] sm:grid-cols-2 xl:border-b-0 xl:border-r xl:border-[var(--cockpit-divider,var(--cockpit-border-soft))] xl:grid-cols-4">
        {/* Accepterat */}
        <KpiCell
          label="Accepterat"
          value={fmtSEK(acceptedValue)}
          detail={acceptedCount > 0 ? `${acceptedCount} vunna offerter` : null}
          points={kpiTrends.acceptedPoints}
          sparkColor="var(--accent)"
        />
        {/* Aktiv pipeline */}
        <KpiCell
          label="Aktiv pipeline"
          value={fmtSEK(pipelineValue)}
          detail={`${kpiTrends.pipelineActiveCount} aktiva offerter`}
          points={kpiTrends.pipelinePoints}
          sparkColor="var(--accent)"
        />
        {/* Vinstgrad */}
        <KpiCell
          label="Vinstgrad"
          value={acceptanceRate === null ? '--' : `${acceptanceRate}%`}
          detail={kpiTrends.winRateFraction}
          points={kpiTrends.winRatePoints}
          sparkColor="var(--status-accepted-text)"
        />
        {/* Snittaffär */}
        <KpiCell
          label="Snittaffär (vunna)"
          value={averageWonValue > 0 ? fmtSEK(averageWonValue) : '--'}
          detail={null}
          trendPct={kpiTrends.avgDealTrendPct}
          points={kpiTrends.avgDealPoints}
          sparkColor="var(--status-viewed-text)"
        />
      </div>

      {/* Väder */}
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

function KpiCell({
  label,
  value,
  detail,
  trendPct,
  points,
  sparkColor,
}: {
  label: string;
  value: string;
  detail: string | null;
  trendPct?: number | null;
  points: number[];
  sparkColor: string;
}) {
  return (
    <div className="relative min-w-0 border-b border-r border-[var(--cockpit-divider,var(--cockpit-border-soft))] px-3 py-3 last:border-r-0 sm:[&:nth-child(2n)]:border-r-0 xl:border-b-0 xl:[&:nth-child(2n)]:border-r xl:[&:nth-child(4n)]:border-r-0">
      <p className="truncate text-[10px] font-semibold uppercase tracking-[.05em] text-[var(--text-muted)]">{label}</p>
      <p className="mt-1.5 whitespace-nowrap text-[18px] font-semibold tabular-nums leading-none text-[var(--text-primary)]">{value}</p>
      {detail !== null && (
        <p className="mt-1 truncate text-[10.5px] text-[var(--text-secondary)]">{detail}</p>
      )}
      {trendPct !== null && trendPct !== undefined && (
        <p className={`mt-1 flex items-center gap-0.5 text-[10.5px] font-semibold ${trendPct >= 0 ? 'text-[var(--status-accepted-text)]' : 'text-[var(--status-danger-text)]'}`}>
          {trendPct >= 0
            ? <TrendUp size={11} weight="bold" />
            : <TrendDown size={11} weight="bold" />}
          {trendPct >= 0 ? '+' : ''}{trendPct}% från förra mån.
        </p>
      )}
      {trendPct === null && detail === null && (
        <p className="mt-1 text-[10.5px] text-[var(--text-muted)]">Ej tillräcklig data</p>
      )}
      <div className="absolute bottom-2 right-2">
        <MiniSparkline points={points} color={sparkColor} />
      </div>
    </div>
  );
}
