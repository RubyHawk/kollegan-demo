import { describe, expect, it } from 'vitest';
import { parseSmhiForecast, unavailableWeather, weatherSymbolLabel } from '../../src/platform/weather/smhi';

describe('SMHI weather adapter', () => {
  it('parses SNOW1gv1 point forecasts into the dashboard weather shape', () => {
    const parsed = parseSmhiForecast({
      referenceTime: '2026-05-30T08:00:00Z',
      timeSeries: [
        {
          time: '2026-05-30T09:00:00Z',
          data: [
            { parameter: 'air_temperature', values: [15.4] },
            { parameter: 'wind_speed', values: [3.2] },
            { parameter: 'relative_humidity', values: [68] },
            { parameter: 'symbol_code', values: [6] },
          ],
        },
        {
          time: '2026-05-30T10:00:00Z',
          data: [
            { parameter: 'air_temperature', values: [16.1] },
            { parameter: 'symbol_code', values: [2] },
          ],
        },
      ],
    }, 'Örebro');

    expect(parsed.status).toBe('ok');
    expect(parsed.locationName).toBe('Örebro');
    expect(parsed.temperatureC).toBe(15.4);
    expect(parsed.windSpeed).toBe(3.2);
    expect(parsed.humidity).toBe(68);
    expect(parsed.conditionLabel).toBe('Molnigt');
    expect(parsed.forecast[0]).toMatchObject({
      label: 'Nästa',
      temperatureC: 16.1,
      conditionLabel: 'Klart',
    });
  });

  it('falls back to an unavailable state when SMHI returns no timeseries', () => {
    expect(parseSmhiForecast({}, 'Örebro')).toEqual(unavailableWeather('Örebro'));
  });

  it('maps unknown weather symbols to a truthful missing forecast label', () => {
    expect(weatherSymbolLabel(99)).toBe('Prognos saknas');
  });
});
