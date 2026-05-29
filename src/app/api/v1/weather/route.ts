import { NextResponse } from 'next/server';
import type { WeatherData, WeatherDay } from './types';

// Örebro coordinates
const LAT = 59.2741;
const LON = 15.2066;
const CITY = 'Örebro';

// SMHI Wsymb2 code → label, emoji, category
const WSYMB2: Record<number, { label: string; emoji: string; cat: 'clear' | 'partcloud' | 'cloud' | 'fog' | 'rain' | 'sleet' | 'snow' | 'thunder' }> = {
  1:  { label: 'Klart',                  emoji: '☀️',  cat: 'clear' },
  2:  { label: 'Nästan klart',           emoji: '🌤️', cat: 'clear' },
  3:  { label: 'Växlande molnighet',     emoji: '⛅',  cat: 'partcloud' },
  4:  { label: 'Halvklart',              emoji: '🌥️', cat: 'partcloud' },
  5:  { label: 'Molnigt',               emoji: '☁️',  cat: 'cloud' },
  6:  { label: 'Mulet',                 emoji: '☁️',  cat: 'cloud' },
  7:  { label: 'Dimma',                 emoji: '🌫️', cat: 'fog' },
  8:  { label: 'Lätt regnskur',         emoji: '🌦️', cat: 'rain' },
  9:  { label: 'Måttlig regnskur',      emoji: '🌧️', cat: 'rain' },
  10: { label: 'Kraftig regnskur',      emoji: '🌧️', cat: 'rain' },
  11: { label: 'Åskväder',              emoji: '⛈️',  cat: 'thunder' },
  12: { label: 'Lätt snöblandad regn',  emoji: '🌨️', cat: 'sleet' },
  13: { label: 'Måttlig snöblandad',    emoji: '🌨️', cat: 'sleet' },
  14: { label: 'Kraftig snöblandad',    emoji: '🌨️', cat: 'sleet' },
  15: { label: 'Lätt snöby',            emoji: '❄️',  cat: 'snow' },
  16: { label: 'Måttlig snöby',         emoji: '❄️',  cat: 'snow' },
  17: { label: 'Kraftig snöby',         emoji: '❄️',  cat: 'snow' },
  18: { label: 'Lätt regn',             emoji: '🌦️', cat: 'rain' },
  19: { label: 'Måttligt regn',         emoji: '🌧️', cat: 'rain' },
  20: { label: 'Kraftigt regn',         emoji: '🌧️', cat: 'rain' },
  21: { label: 'Åska',                  emoji: '⛈️',  cat: 'thunder' },
  22: { label: 'Lätt snöblandad',       emoji: '🌨️', cat: 'sleet' },
  23: { label: 'Måttlig snöblandad',    emoji: '🌨️', cat: 'sleet' },
  24: { label: 'Kraftig snöblandad',    emoji: '🌨️', cat: 'sleet' },
  25: { label: 'Lätt snöfall',          emoji: '🌨️', cat: 'snow' },
  26: { label: 'Måttligt snöfall',      emoji: '❄️',  cat: 'snow' },
  27: { label: 'Kraftigt snöfall',      emoji: '❄️',  cat: 'snow' },
};

// WMO codes from Open-Meteo fallback → Wsymb2-style data
function wmoToMeta(code: number): { label: string; emoji: string; cat: 'clear' | 'partcloud' | 'cloud' | 'fog' | 'rain' | 'sleet' | 'snow' | 'thunder' } {
  if (code === 0)                return { label: 'Klart',          emoji: '☀️',  cat: 'clear' };
  if (code === 1)                return { label: 'Nästan klart',   emoji: '🌤️', cat: 'clear' };
  if (code === 2)                return { label: 'Halvklart',      emoji: '⛅',  cat: 'partcloud' };
  if (code === 3)                return { label: 'Mulet',          emoji: '☁️',  cat: 'cloud' };
  if (code >= 45 && code <= 48) return { label: 'Dimma',          emoji: '🌫️', cat: 'fog' };
  if (code >= 51 && code <= 67) return { label: 'Regn',           emoji: '🌧️', cat: 'rain' };
  if (code >= 71 && code <= 77) return { label: 'Snöfall',        emoji: '❄️',  cat: 'snow' };
  if (code >= 80 && code <= 82) return { label: 'Regnskurar',     emoji: '🌦️', cat: 'rain' };
  if (code >= 85 && code <= 86) return { label: 'Snöbyar',        emoji: '🌨️', cat: 'snow' };
  if (code >= 95)               return { label: 'Åskväder',       emoji: '⛈️',  cat: 'thunder' };
  return { label: 'Okänt',                                          emoji: '🌡️', cat: 'cloud' };
}

function param(series: { name: string; values: number[] }[], name: string): number {
  return series.find(p => p.name === name)?.values[0] ?? 0;
}

const DAYS_SV = ['sön', 'mån', 'tis', 'ons', 'tor', 'fre', 'lör'];

async function fetchSMHI(): Promise<WeatherData> {
  const latStr = LAT.toFixed(6);
  const lonStr = LON.toFixed(6);
  const url = `https://opendata-download-metfcst.smhi.se/api/category/pmp3g/version/2/geotype/point/lon/${lonStr}/lat/${latStr}/data.json`;

  const res = await fetch(url, { next: { revalidate: 1800 } });
  if (!res.ok) throw new Error(`SMHI ${res.status}`);

  const data = await res.json();
  const series: { validTime: string; parameters: { name: string; values: number[] }[] }[] = data.timeSeries;

  const now = series[0];
  const params = now.parameters;

  const tempRaw   = param(params, 't');
  const feelsLike = param(params, 'tcc_mean') ? tempRaw - 1 : tempRaw; // approx
  const wsymb     = param(params, 'Wsymb2');
  const humidity  = param(params, 'r');
  const wind      = param(params, 'ws');

  const meta = WSYMB2[wsymb] ?? { label: 'Okänt', emoji: '🌡️', cat: 'cloud' as const };

  // Group next 3 days (skip today)
  const byDay: Record<string, { high: number; low: number; wsymb: number }> = {};
  for (const entry of series) {
    const d = new Date(entry.validTime);
    const key = d.toISOString().slice(0, 10);
    const todayKey = new Date().toISOString().slice(0, 10);
    if (key === todayKey) continue;
    if (Object.keys(byDay).length >= 3 && !byDay[key]) break;
    const t = param(entry.parameters, 't');
    const w = param(entry.parameters, 'Wsymb2');
    if (!byDay[key]) byDay[key] = { high: t, low: t, wsymb: w };
    else {
      byDay[key].high = Math.max(byDay[key].high, t);
      byDay[key].low  = Math.min(byDay[key].low, t);
    }
  }

  const forecast: WeatherDay[] = Object.entries(byDay)
    .slice(0, 3)
    .map(([dateStr, v]) => ({
      date:  DAYS_SV[new Date(dateStr).getDay()],
      emoji: (WSYMB2[v.wsymb] ?? meta).emoji,
      high:  Math.round(v.high),
      low:   Math.round(v.low),
    }));

  return {
    city: CITY,
    temp: Math.round(tempRaw),
    feelsLike: Math.round(feelsLike),
    condition: meta.label,
    emoji: meta.emoji,
    cat: meta.cat,
    humidity: Math.round(humidity),
    windSpeed: Math.round(wind * 10) / 10,
    forecast,
    source: 'smhi',
    updatedAt: new Date().toISOString(),
  };
}

async function fetchOpenMeteo(): Promise<WeatherData> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m,relative_humidity_2m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=Europe%2FStockholm&forecast_days=4&wind_speed_unit=ms`;

  const res = await fetch(url, { next: { revalidate: 1800 } });
  if (!res.ok) throw new Error(`OpenMeteo ${res.status}`);

  const d = await res.json();
  const cur = d.current;
  const daily = d.daily;

  const meta = wmoToMeta(cur.weather_code);

  const forecast: WeatherDay[] = daily.time.slice(1, 4).map((dateStr: string, i: number) => {
    const fm = wmoToMeta(daily.weather_code[i + 1]);
    return {
      date:  DAYS_SV[new Date(dateStr).getDay()],
      emoji: fm.emoji,
      high:  Math.round(daily.temperature_2m_max[i + 1]),
      low:   Math.round(daily.temperature_2m_min[i + 1]),
    };
  });

  return {
    city: CITY,
    temp: Math.round(cur.temperature_2m),
    feelsLike: Math.round(cur.apparent_temperature),
    condition: meta.label,
    emoji: meta.emoji,
    cat: meta.cat,
    humidity: Math.round(cur.relative_humidity_2m),
    windSpeed: Math.round(cur.wind_speed_10m * 10) / 10,
    forecast,
    source: 'openmeteo',
    updatedAt: new Date().toISOString(),
  };
}

export async function GET() {
  try {
    const data = await fetchSMHI();
    return NextResponse.json(data);
  } catch {
    try {
      const data = await fetchOpenMeteo();
      return NextResponse.json(data);
    } catch (err2) {
      return NextResponse.json({ error: String(err2) }, { status: 503 });
    }
  }
}
