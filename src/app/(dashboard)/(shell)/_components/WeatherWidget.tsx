'use client';

import { useEffect, useState } from 'react';
import type { WeatherData } from '@/app/api/weather/route';

// Gradient + glow per weather category
const CAT_THEME: Record<string, { grad: string; glow: string; bg: string }> = {
  clear:     { grad: 'from-amber-500/20 via-orange-400/10 to-transparent', glow: 'rgba(251,146,60,0.18)',  bg: '#1e1508' },
  partcloud: { grad: 'from-sky-500/15 via-blue-400/8 to-transparent',     glow: 'rgba(56,189,248,0.14)',  bg: '#0c1520' },
  cloud:     { grad: 'from-slate-500/15 via-slate-400/8 to-transparent',  glow: 'rgba(148,163,184,0.12)', bg: '#111318' },
  fog:       { grad: 'from-slate-400/12 via-zinc-400/6 to-transparent',   glow: 'rgba(161,161,170,0.10)', bg: '#111318' },
  rain:      { grad: 'from-blue-600/20 via-cyan-500/10 to-transparent',   glow: 'rgba(37,99,235,0.18)',   bg: '#0a1020' },
  sleet:     { grad: 'from-cyan-600/18 via-blue-400/8 to-transparent',    glow: 'rgba(22,163,174,0.14)',  bg: '#0a1418' },
  snow:      { grad: 'from-sky-300/15 via-blue-300/8 to-transparent',     glow: 'rgba(125,211,252,0.14)', bg: '#0c1520' },
  thunder:   { grad: 'from-violet-600/22 via-purple-500/10 to-transparent',glow: 'rgba(124,58,237,0.20)', bg: '#100c1e' },
};

function WindIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.7 7.7a2.5 2.5 0 1 1 1.8 4.3H2"/><path d="M9.6 4.6A2 2 0 1 1 11 8H2"/><path d="M12.6 19.4A2 2 0 1 0 14 16H2"/>
    </svg>
  );
}

function DropletIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"/>
    </svg>
  );
}

function ThermometerIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"/>
    </svg>
  );
}

function LocationIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
    </svg>
  );
}

export default function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch('/api/weather')
      .then(r => r.json())
      .then(d => {
        if (d.error) { setError(true); return; }
        setWeather(d);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  const theme = CAT_THEME[weather?.cat ?? 'cloud'] ?? CAT_THEME.cloud;

  if (loading) {
    return (
      <div className="rounded-[20px] border border-[var(--border)] bg-[var(--surface-0)] shadow-[0_14px_34px_rgba(0,0,0,0.06)] overflow-hidden animate-pulse">
        <div className="h-[220px] bg-gradient-to-br from-[var(--surface-1)] to-[var(--surface-0)]" />
      </div>
    );
  }

  if (error || !weather) {
    return (
      <div className="rounded-[20px] border border-[var(--border)] bg-[var(--surface-0)] px-4 py-5 text-center">
        <p className="text-[11px] text-[var(--text-muted)]">Väderdata ej tillgänglig</p>
      </div>
    );
  }

  return (
    <div
      className="relative overflow-hidden rounded-[20px] border border-white/[0.06] shadow-[0_14px_34px_rgba(0,0,0,0.18)]"
      style={{ background: theme.bg, boxShadow: `0 0 40px 0 ${theme.glow}, 0 14px 34px rgba(0,0,0,0.18)` }}
    >
      {/* Gradient bloom */}
      <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${theme.grad}`} />

      {/* Glass shimmer top edge */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.12] to-transparent" />

      <div className="relative z-10 px-5 pt-4 pb-4">

        {/* Location row */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-1.5 text-[var(--text-muted)]">
            <LocationIcon />
            <span className="text-[11px] font-semibold tracking-wide text-white/60">{weather.city}</span>
          </div>
          <span
            className="rounded-full border border-white/10 bg-white/[0.07] px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.16em] text-white/40"
            title={weather.source === 'smhi' ? 'SMHI — Sveriges meteorologiska och hydrologiska institut' : 'Open-Meteo fallback'}
          >
            {weather.source === 'smhi' ? 'SMHI' : 'Open-Meteo'}
          </span>
        </div>

        {/* Main weather display */}
        <div className="flex items-end justify-between mb-5">
          <div>
            {/* Big emoji */}
            <div
              className="mb-2 text-[52px] leading-none select-none"
              style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.4))' }}
            >
              {weather.emoji}
            </div>
            <div className="flex items-start gap-1 leading-none">
              <span className="text-[52px] font-bold tracking-tight text-white tabular-nums" style={{ textShadow: '0 2px 16px rgba(0,0,0,0.4)' }}>
                {weather.temp}
              </span>
              <span className="mt-2 text-[22px] font-light text-white/50">°C</span>
            </div>
          </div>

          {/* Condition + stats */}
          <div className="text-right pb-1">
            <p className="mb-3 text-[13px] font-semibold text-white/80 leading-tight">{weather.condition}</p>
            <div className="space-y-2">
              <div className="flex items-center justify-end gap-1.5 text-white/50">
                <span className="text-[11px]">{weather.windSpeed} m/s</span>
                <WindIcon />
              </div>
              <div className="flex items-center justify-end gap-1.5 text-white/50">
                <span className="text-[11px]">{weather.humidity}%</span>
                <DropletIcon />
              </div>
              <div className="flex items-center justify-end gap-1.5 text-white/50">
                <span className="text-[11px]">Känns {weather.feelsLike}°</span>
                <ThermometerIcon />
              </div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="mb-4 h-px bg-white/[0.07]" />

        {/* 3-day forecast */}
        <div className="grid grid-cols-3 gap-2">
          {weather.forecast.map((day) => (
            <div
              key={day.date}
              className="flex flex-col items-center gap-1.5 rounded-2xl border border-white/[0.07] bg-white/[0.04] px-2 py-2.5 backdrop-blur-sm"
            >
              <span className="text-[9px] font-bold uppercase tracking-[0.14em] text-white/40">{day.date}</span>
              <span className="text-[20px] leading-none">{day.emoji}</span>
              <div className="flex items-center gap-1.5 text-[10px] tabular-nums">
                <span className="font-semibold text-white/80">{day.high}°</span>
                <span className="text-white/30">{day.low}°</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
