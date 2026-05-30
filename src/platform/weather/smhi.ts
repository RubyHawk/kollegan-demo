const DEFAULT_LAT = 59.2753;
const DEFAULT_LON = 15.2134;
const DEFAULT_CITY = 'Örebro';
const FORECAST_PARAMETERS = 'air_temperature,wind_speed,relative_humidity,symbol_code';

interface SmhiDataPoint {
  parameter?: string;
  name?: string;
  value?: number;
  values?: number[];
}

interface SmhiTimeSeries {
  time?: string;
  validTime?: string;
  data?: SmhiDataPoint[] | Record<string, number>;
  parameters?: Array<{ name?: string; parameter?: string; values?: number[]; value?: number }>;
}

interface SmhiForecastResponse {
  createdTime?: string;
  referenceTime?: string;
  timeSeries?: SmhiTimeSeries[];
}

export interface WeatherLocationConfig {
  lat: number;
  lon: number;
  city: string;
}

export interface SmhiWeatherForecast {
  label: string;
  time: string;
  temperatureC: number | null;
  symbolCode: number | null;
  conditionLabel: string;
}

export interface SmhiWeather {
  status: 'ok' | 'unavailable';
  locationName: string;
  temperatureC: number | null;
  windSpeed: number | null;
  humidity: number | null;
  symbolCode: number | null;
  conditionLabel: string;
  updatedAt: string | null;
  forecast: SmhiWeatherForecast[];
}

export function getDashboardWeatherLocation(): WeatherLocationConfig {
  const lat = Number(process.env.DASHBOARD_WEATHER_LAT);
  const lon = Number(process.env.DASHBOARD_WEATHER_LON);

  return {
    lat: Number.isFinite(lat) ? lat : DEFAULT_LAT,
    lon: Number.isFinite(lon) ? lon : DEFAULT_LON,
    city: process.env.DASHBOARD_WEATHER_CITY?.trim() || DEFAULT_CITY,
  };
}

function getParam(points: SmhiTimeSeries, names: string[]): number | null {
  const data = points.data;
  if (Array.isArray(data)) {
    for (const item of data) {
      const key = item.parameter ?? item.name;
      if (key && names.includes(key)) {
        const raw = item.values?.[0] ?? item.value;
        return typeof raw === 'number' ? raw : null;
      }
    }
  } else if (data) {
    for (const name of names) {
      const value = data[name];
      if (typeof value === 'number') return value;
    }
  }

  for (const item of points.parameters ?? []) {
    const key = item.parameter ?? item.name;
    if (key && names.includes(key)) {
      const raw = item.values?.[0] ?? item.value;
      return typeof raw === 'number' ? raw : null;
    }
  }

  return null;
}

export function weatherSymbolLabel(symbolCode: number | null): string {
  switch (symbolCode) {
    case 1:
    case 2:
      return 'Klart';
    case 3:
    case 4:
      return 'Växlande molnighet';
    case 5:
    case 6:
      return 'Molnigt';
    case 7:
      return 'Mulet';
    case 8:
    case 18:
    case 19:
      return 'Regnskurar';
    case 9:
    case 10:
    case 20:
      return 'Regn';
    case 11:
    case 21:
      return 'Åska';
    case 12:
    case 13:
    case 22:
    case 23:
      return 'Snöblandat';
    case 14:
    case 15:
    case 24:
    case 25:
      return 'Snö';
    case 16:
    case 17:
    case 26:
    case 27:
      return 'Dimma';
    default:
      return 'Prognos saknas';
  }
}

function mapForecastPoint(point: SmhiTimeSeries, label: string): SmhiWeatherForecast {
  const symbolCode = getParam(point, ['symbol_code', 'Wsymb2']);
  return {
    label,
    time: point.time ?? point.validTime ?? '',
    temperatureC: getParam(point, ['air_temperature', 't', '2t']),
    symbolCode,
    conditionLabel: weatherSymbolLabel(symbolCode),
  };
}

export function parseSmhiForecast(
  payload: SmhiForecastResponse,
  locationName: string,
): SmhiWeather {
  const series = payload.timeSeries ?? [];
  const current = series[0];

  if (!current) {
    return unavailableWeather(locationName);
  }

  const symbolCode = getParam(current, ['symbol_code', 'Wsymb2']);
  const forecast = series.slice(1, 4).map((point, index) =>
    mapForecastPoint(point, index === 0 ? 'Nästa' : `+${index + 1} h`),
  );

  return {
    status: 'ok',
    locationName,
    temperatureC: getParam(current, ['air_temperature', 't', '2t']),
    windSpeed: getParam(current, ['wind_speed', 'ws']),
    humidity: getParam(current, ['relative_humidity', 'r']),
    symbolCode,
    conditionLabel: weatherSymbolLabel(symbolCode),
    updatedAt: payload.referenceTime ?? payload.createdTime ?? current.time ?? current.validTime ?? null,
    forecast,
  };
}

export function unavailableWeather(locationName: string): SmhiWeather {
  return {
    status: 'unavailable',
    locationName,
    temperatureC: null,
    windSpeed: null,
    humidity: null,
    symbolCode: null,
    conditionLabel: 'Väderdata saknas',
    updatedAt: null,
    forecast: [],
  };
}

export async function getDashboardWeather(): Promise<SmhiWeather> {
  const location = getDashboardWeatherLocation();
  const url =
    `https://opendata-download-metfcst.smhi.se/api/category/snow1g/version/1/geotype/point/lon/${location.lon}/lat/${location.lat}/data.json`
    + `?timeseries=8&parameters=${FORECAST_PARAMETERS}`;

  try {
    const response = await fetch(url, {
      headers: { accept: 'application/json' },
      next: { revalidate: 900 },
    });

    if (!response.ok) {
      return unavailableWeather(location.city);
    }

    const payload = await response.json() as SmhiForecastResponse;
    return parseSmhiForecast(payload, location.city);
  } catch {
    return unavailableWeather(location.city);
  }
}
