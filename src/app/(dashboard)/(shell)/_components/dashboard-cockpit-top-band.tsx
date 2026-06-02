'use client';

import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { CalendarBlank, CloudSun, TrendUp, TrendDown } from '@phosphor-icons/react';
import type {
  DashboardCalendar,
  DashboardKpiTrends,
  DashboardToday,
  DashboardWeather,
} from '@modules/generic/dashboard';
import { DashboardDotLabel } from './dashboard-cockpit-primitives';
import { fmtSEK, fmtCompactSEK, fmtTime } from './dashboard-cockpit-utils';

function MiniSparkline({
  points,
  color,
  gradId,
  formatValue,
  xLabels,
}: {
  points: number[];
  color: string;
  gradId: string;
  formatValue: (v: number) => string;
  xLabels?: string[];
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hovered, setHovered] = useState<number | null>(null);

  if (points.length < 2 || points.every((p) => p === 0)) return null;

  const max = Math.max(...points, 0.001);
  const min = Math.min(...points);
  const range = max - min || 1;
  const W = 100, H = 40, PAD_X = 1, PAD_Y = 5;
  const xs = points.map((_, i) => PAD_X + (i / (points.length - 1)) * (W - PAD_X * 2));
  const ys = points.map((v) => H - PAD_Y - ((v - min) / range) * (H - PAD_Y * 2));

  // Catmull-Rom → cubic bezier for smooth curves
  let d = `M${xs[0].toFixed(1)},${ys[0].toFixed(1)}`;
  for (let i = 0; i < xs.length - 1; i++) {
    const p0x = xs[i - 1] ?? xs[0],  p0y = ys[i - 1] ?? ys[0];
    const p1x = xs[i],               p1y = ys[i];
    const p2x = xs[i + 1],           p2y = ys[i + 1];
    const p3x = xs[i + 2] ?? xs[xs.length - 1], p3y = ys[i + 2] ?? ys[ys.length - 1];
    const t = 0.35;
    const cp1x = p1x + (p2x - p0x) * t;
    const cp1y = p1y + (p2y - p0y) * t;
    const cp2x = p2x - (p3x - p1x) * t;
    const cp2y = p2y - (p3y - p1y) * t;
    d += ` C${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p2x.toFixed(1)},${p2y.toFixed(1)}`;
  }

  const fillPath = `${d} L${xs[xs.length - 1].toFixed(1)},${H} L${xs[0].toFixed(1)},${H} Z`;

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const pct = (e.clientX - rect.left) / rect.width;
    const idx = Math.round(pct * (points.length - 1));
    setHovered(Math.max(0, Math.min(points.length - 1, idx)));
  };

  const labels = xLabels ?? points.map((_, i) => {
    const weeksAgo = points.length - 1 - i;
    return weeksAgo === 0 ? 'Nu' : `${weeksAgo}v`;
  });

  const tooltipLeftPct = hovered !== null ? (xs[hovered] / W) * 100 : 0;

  return (
    <div className="relative select-none">
      {/* Tooltip */}
      {hovered !== null && (
        <div
          className="pointer-events-none absolute -top-7 z-20 -translate-x-1/2"
          style={{ left: `${tooltipLeftPct}%` }}
        >
          <div className="rounded bg-[var(--text-primary)] px-1.5 py-0.5 shadow-sm">
            <span className="text-[10px] font-semibold text-white whitespace-nowrap">{formatValue(points[hovered])}</span>
            <span className="ml-1 text-[9px] text-white/60 whitespace-nowrap">{labels[hovered]}</span>
          </div>
        </div>
      )}

      {/* Chart */}
      <svg
        ref={svgRef}
        width="100%"
        height="40"
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        fill="none"
        aria-hidden
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHovered(null)}
        className="cursor-crosshair"
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.22" />
            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <path d={fillPath} fill={`url(#${gradId})`} />
        <path d={d} stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        {hovered !== null && (
          <>
            <line
              x1={xs[hovered]} y1={PAD_Y - 2} x2={xs[hovered]} y2={H}
              stroke={color} strokeWidth="0.8" strokeDasharray="2.5 2" opacity="0.55"
            />
            <circle cx={xs[hovered]} cy={ys[hovered]} r="2.8" fill="white" />
            <circle cx={xs[hovered]} cy={ys[hovered]} r="1.8" fill={color} />
          </>
        )}
      </svg>

      {/* X-axis labels */}
      <div className="flex justify-between px-0.5 pb-1 text-[9px] leading-none text-[var(--text-muted)]">
        <span>{labels[0]}</span>
        <span>{labels[labels.length - 1]}</span>
      </div>
    </div>
  );
}

export function TopCockpitBand({
  today,
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
      className="grid min-h-[172px] overflow-hidden rounded-md border border-[var(--cockpit-border,var(--border))] bg-[var(--surface-0)] shadow-[var(--cockpit-shadow)] xl:h-[172px] xl:grid-cols-[1.1fr_5fr_1.05fr]"
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
        {today.focusLabel ? (
          <p className="mt-2.5 text-[11px] leading-4 text-[var(--status-warning-text)]">
            {today.focusLabel}
          </p>
        ) : null}
        <Link
          href="/meetings"
          className="mt-3 inline-flex h-8 items-center rounded bg-[var(--accent)] px-3 text-[11px] font-semibold text-white transition-opacity hover:opacity-90"
        >
          Visa dagsplan →
        </Link>
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
          sparkId="spark-accepted"
          formatValue={fmtCompactSEK}
        />
        {/* Aktiv pipeline */}
        <KpiCell
          label="Aktiv pipeline"
          value={fmtSEK(pipelineValue)}
          detail={`${kpiTrends.pipelineActiveCount} aktiva offerter`}
          points={kpiTrends.pipelinePoints}
          sparkColor="var(--accent)"
          sparkId="spark-pipeline"
          formatValue={(v) => `${v} aktiva`}
        />
        {/* Vinstgrad */}
        <KpiCell
          label="Vinstgrad"
          value={acceptanceRate === null ? '--' : `${acceptanceRate}%`}
          detail={kpiTrends.winRateFraction}
          points={kpiTrends.winRatePoints}
          sparkColor="var(--status-accepted-text)"
          sparkId="spark-winrate"
          formatValue={(v) => `${v}%`}
        />
        {/* Snittaffär */}
        <KpiCell
          label="Snittaffär (vunna)"
          value={averageWonValue > 0 ? fmtSEK(averageWonValue) : '--'}
          detail={null}
          trendPct={kpiTrends.avgDealTrendPct}
          points={kpiTrends.avgDealPoints}
          sparkColor="var(--status-viewed-text)"
          sparkId="spark-avgdeal"
          formatValue={fmtCompactSEK}
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
  sparkId,
  formatValue,
}: {
  label: string;
  value: string;
  detail: string | null;
  trendPct?: number | null;
  points: number[];
  sparkColor: string;
  sparkId: string;
  formatValue: (v: number) => string;
}) {
  return (
    <div className="relative flex min-w-0 flex-col border-b border-r border-[var(--cockpit-divider,var(--cockpit-border-soft))] px-3 pt-3 pb-0 last:border-r-0 sm:[&:nth-child(2n)]:border-r-0 xl:border-b-0 xl:[&:nth-child(2n)]:border-r xl:[&:nth-child(4n)]:border-r-0">
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
      <div className="mt-auto overflow-visible">
        <MiniSparkline points={points} color={sparkColor} gradId={sparkId} formatValue={formatValue} />
      </div>
    </div>
  );
}
