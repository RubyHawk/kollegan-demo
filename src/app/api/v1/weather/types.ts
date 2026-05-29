export interface WeatherDay {
  date: string; // "mån" / "tis" etc.
  emoji: string;
  high: number;
  low: number;
}

export interface WeatherData {
  city: string;
  temp: number;
  feelsLike: number;
  condition: string;
  emoji: string;
  cat: string;
  humidity: number;
  windSpeed: number; // m/s
  forecast: WeatherDay[];
  source: 'smhi' | 'openmeteo';
  updatedAt: string;
}
