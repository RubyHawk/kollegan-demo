'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@shared/ui/button';
import { Input } from '@shared/ui/input';
import { Panel } from '@shared/ui/panel';
import { InlineAlert } from '@shared/ui/inline-alert';
import {
  listRestaurantOpeningHours,
  saveRestaurantOpeningHour,
  type RestaurantOpeningHour,
} from '@shared/lib/api/restaurant.api';

const DAYS = [
  { dayOfWeek: 1, label: 'Måndag' },
  { dayOfWeek: 2, label: 'Tisdag' },
  { dayOfWeek: 3, label: 'Onsdag' },
  { dayOfWeek: 4, label: 'Torsdag' },
  { dayOfWeek: 5, label: 'Fredag' },
  { dayOfWeek: 6, label: 'Lördag' },
  { dayOfWeek: 7, label: 'Söndag' },
] as const;

type DraftOpeningHour = {
  id: string;
  dayOfWeek: number;
  opensAt: string;
  closesAt: string;
  isClosed: boolean;
  label: string;
};

function emptyHour(dayOfWeek: number): DraftOpeningHour {
  return {
    id: `draft-${dayOfWeek}`,
    dayOfWeek,
    opensAt: '11:00',
    closesAt: '22:00',
    isClosed: false,
    label: '',
  };
}

function toDraft(hour: RestaurantOpeningHour): DraftOpeningHour {
  return {
    id: hour.id,
    dayOfWeek: hour.dayOfWeek,
    opensAt: hour.opensAt ?? '',
    closesAt: hour.closesAt ?? '',
    isClosed: hour.isClosed,
    label: hour.label ?? '',
  };
}

function mergeHours(hours: RestaurantOpeningHour[]): DraftOpeningHour[] {
  const byDay = new Map(hours.map((hour) => [hour.dayOfWeek, toDraft(hour)]));
  return DAYS.map((day) => byDay.get(day.dayOfWeek) ?? emptyHour(day.dayOfWeek));
}

function formatStatus(hour: DraftOpeningHour) {
  if (hour.isClosed) return hour.label || 'Stängt';
  if (!hour.opensAt || !hour.closesAt) return 'Tid saknas';
  return `${hour.opensAt} - ${hour.closesAt}`;
}

export function OpeningHoursManager() {
  const [hours, setHours] = useState<DraftOpeningHour[]>(() => DAYS.map((day) => emptyHour(day.dayOfWeek)));
  const [loading, setLoading] = useState(true);
  const [savingDay, setSavingDay] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [savedDay, setSavedDay] = useState<number | null>(null);

  const summary = useMemo(
    () => hours.map((hour) => {
      const day = DAYS.find((item) => item.dayOfWeek === hour.dayOfWeek);
      return `${day?.label ?? hour.dayOfWeek}: ${formatStatus(hour)}`;
    }).join(' | '),
    [hours],
  );

  async function load() {
    setLoading(true);
    try {
      setHours(mergeHours(await listRestaurantOpeningHours()));
      setError('');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  function updateHour(dayOfWeek: number, patch: Partial<DraftOpeningHour>) {
    setHours((current) => current.map((hour) => (
      hour.dayOfWeek === dayOfWeek ? { ...hour, ...patch } : hour
    )));
    setSavedDay(null);
  }

  async function saveHour(hour: DraftOpeningHour) {
    setSavingDay(hour.dayOfWeek);
    setError('');
    try {
      const saved = await saveRestaurantOpeningHour({
        dayOfWeek: hour.dayOfWeek,
        opensAt: hour.isClosed ? null : hour.opensAt || null,
        closesAt: hour.isClosed ? null : hour.closesAt || null,
        isClosed: hour.isClosed,
        label: hour.label.trim() || null,
      });
      updateHour(hour.dayOfWeek, toDraft(saved));
      setSavedDay(hour.dayOfWeek);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSavingDay(null);
    }
  }

  return (
    <Panel className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-[var(--ui-text)]">Öppettider</h2>
          <p className="mt-1 text-sm text-[var(--ui-text-muted)]">
            Uppdatera tiderna som visas på den publika restaurangsidan.
          </p>
        </div>
        <Button type="button" variant="secondary" size="compact" onClick={() => void load()} loading={loading}>
          Uppdatera
        </Button>
      </div>

      {error ? <InlineAlert tone="danger">{error}</InlineAlert> : null}

      <div className="sr-only" aria-live="polite">{summary}</div>

      <div className="divide-y divide-[var(--ui-border)]">
        {hours.map((hour) => {
          const day = DAYS.find((item) => item.dayOfWeek === hour.dayOfWeek);
          return (
            <section key={hour.dayOfWeek} className="grid gap-3 py-3 md:grid-cols-[7rem_1fr_auto] md:items-center">
              <div>
                <p className="text-sm font-semibold text-[var(--ui-text)]">{day?.label}</p>
                <p className="text-xs text-[var(--ui-text-muted)]">{formatStatus(hour)}</p>
              </div>

              <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.2fr)_auto] sm:items-center">
                <Input
                  aria-label={`${day?.label} öppnar`}
                  type="time"
                  value={hour.opensAt}
                  disabled={hour.isClosed || loading}
                  onChange={(event) => updateHour(hour.dayOfWeek, { opensAt: event.target.value })}
                />
                <Input
                  aria-label={`${day?.label} stänger`}
                  type="time"
                  value={hour.closesAt}
                  disabled={hour.isClosed || loading}
                  onChange={(event) => updateHour(hour.dayOfWeek, { closesAt: event.target.value })}
                />
                <Input
                  aria-label={`${day?.label} etikett`}
                  value={hour.label}
                  placeholder={hour.isClosed ? 'Ex. Stängt' : 'Valfri etikett'}
                  disabled={loading}
                  onChange={(event) => updateHour(hour.dayOfWeek, { label: event.target.value })}
                />
                <label className="flex min-h-10 items-center gap-2 text-sm text-[var(--ui-text-secondary)]">
                  <input
                    type="checkbox"
                    checked={hour.isClosed}
                    disabled={loading}
                    onChange={(event) => updateHour(hour.dayOfWeek, { isClosed: event.target.checked })}
                    className="size-4 rounded-[var(--ui-radius-sm)] border border-[var(--ui-border)] accent-[var(--ui-accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ui-focus)]"
                  />
                  Stängt
                </label>
              </div>

              <div className="flex items-center gap-2 md:justify-end">
                {savedDay === hour.dayOfWeek ? (
                  <span className="text-xs font-medium text-[var(--ui-success-text)]">Sparat</span>
                ) : null}
                <Button
                  type="button"
                  variant="secondary"
                  size="compact"
                  loading={savingDay === hour.dayOfWeek}
                  disabled={loading}
                  onClick={() => void saveHour(hour)}
                >
                  Spara
                </Button>
              </div>
            </section>
          );
        })}
      </div>
    </Panel>
  );
}
