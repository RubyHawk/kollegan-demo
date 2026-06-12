'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@shared/ui/button';
import { EmptyState } from '@shared/ui/empty-state';
import { InlineAlert } from '@shared/ui/inline-alert';
import { PageHeader } from '@shared/ui/page-header';
import { Panel } from '@shared/ui/panel';
import { StatusBadge, type StatusTone } from '@shared/ui/status-badge';
import {
  listRestaurantReservations,
  updateRestaurantReservation,
  type RestaurantReservation,
  type RestaurantReservationStatus,
} from '@shared/lib/api/restaurant.api';

const FILTERS: Array<{ value: 'all' | RestaurantReservationStatus; label: string }> = [
  { value: 'all', label: 'Alla' },
  { value: 'new', label: 'Nya' },
  { value: 'confirmed', label: 'Bekräftade' },
  { value: 'declined', label: 'Avböjda' },
  { value: 'cancelled', label: 'Avbokade' },
];

const STATUS_LABELS: Record<RestaurantReservationStatus, string> = {
  new: 'Ny',
  confirmed: 'Bekräftad',
  declined: 'Avböjd',
  cancelled: 'Avbokad',
};

const STATUS_TONES: Record<RestaurantReservationStatus, StatusTone> = {
  new: 'warning',
  confirmed: 'success',
  declined: 'danger',
  cancelled: 'neutral',
};

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('sv-SE', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function contactLine(reservation: RestaurantReservation) {
  return [reservation.guestPhone, reservation.guestEmail].filter(Boolean).join(' | ') || 'Kontakt saknas';
}

export function ReservationsClient() {
  const [reservations, setReservations] = useState<RestaurantReservation[]>([]);
  const [filter, setFilter] = useState<'all' | RestaurantReservationStatus>('new');
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const visibleReservations = useMemo(() => reservations, [reservations]);

  async function load(nextFilter = filter) {
    setLoading(true);
    try {
      const status = nextFilter === 'all' ? undefined : nextFilter;
      setReservations(await listRestaurantReservations({ status }));
      setError('');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load(filter);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- filter drives the API request.
  }, [filter]);

  async function updateStatus(id: string, status: RestaurantReservationStatus) {
    setSavingId(id);
    setError('');
    try {
      const updated = await updateRestaurantReservation(id, status);
      setReservations((current) => current.map((reservation) => (
        reservation.id === id ? updated : reservation
      )).filter((reservation) => filter === 'all' || reservation.status === filter));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <PageHeader
        eyebrow="Restaurang"
        title="Bokningar"
        description="Hantera bokningsförfrågningar från den publika restaurangsidan."
      />

      {error ? <InlineAlert tone="danger">{error}</InlineAlert> : null}

      <Panel className="space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap gap-2" aria-label="Filtrera bokningar">
            {FILTERS.map((item) => (
              <Button
                key={item.value}
                type="button"
                variant={filter === item.value ? 'default' : 'secondary'}
                size="compact"
                onClick={() => setFilter(item.value)}
              >
                {item.label}
              </Button>
            ))}
          </div>
          <Button type="button" variant="secondary" size="compact" onClick={() => void load()} loading={loading}>
            Uppdatera
          </Button>
        </div>

        {visibleReservations.length === 0 && !loading ? (
          <EmptyState
            title="Inga bokningar hittades"
            description="När gäster skickar in en förfrågan från webbplatsen visas den här."
            actionLabel="Uppdatera"
            onAction={() => void load()}
          />
        ) : null}

        <div className="divide-y divide-[var(--ui-border)]">
          {visibleReservations.map((reservation) => (
            <article key={reservation.id} className="grid gap-3 py-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
              <div className="min-w-0 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-sm font-semibold text-[var(--ui-text)]">{reservation.guestName}</h2>
                  <StatusBadge tone={STATUS_TONES[reservation.status]}>{STATUS_LABELS[reservation.status]}</StatusBadge>
                  <span className="text-xs text-[var(--ui-text-muted)]">{reservation.partySize} gäster</span>
                </div>
                <p className="text-sm text-[var(--ui-text-secondary)]">{formatDateTime(reservation.requestedAt)}</p>
                <p className="text-sm text-[var(--ui-text-muted)]">{contactLine(reservation)}</p>
                {reservation.message ? (
                  <p className="max-w-3xl text-sm leading-6 text-[var(--ui-text-secondary)]">{reservation.message}</p>
                ) : null}
              </div>

              <div className="flex flex-wrap gap-2 lg:justify-end">
                <Button
                  type="button"
                  size="compact"
                  variant="secondary"
                  loading={savingId === reservation.id}
                  disabled={reservation.status === 'confirmed'}
                  onClick={() => void updateStatus(reservation.id, 'confirmed')}
                >
                  Bekräfta
                </Button>
                <Button
                  type="button"
                  size="compact"
                  variant="secondary"
                  loading={savingId === reservation.id}
                  disabled={reservation.status === 'declined'}
                  onClick={() => void updateStatus(reservation.id, 'declined')}
                >
                  Avböj
                </Button>
                <Button
                  type="button"
                  size="compact"
                  variant="ghost"
                  loading={savingId === reservation.id}
                  disabled={reservation.status === 'cancelled'}
                  onClick={() => void updateStatus(reservation.id, 'cancelled')}
                >
                  Avboka
                </Button>
              </div>
            </article>
          ))}
        </div>
      </Panel>
    </div>
  );
}
