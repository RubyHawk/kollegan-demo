'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Button } from '@shared/ui/button';
import { Panel } from '@shared/ui/panel';
import { StatusBadge } from '@shared/ui/status-badge';
import { CalendarIcon } from '@shared/ui/icons';
import {
  updateRestaurantReservation,
  type RestaurantReservation,
  type RestaurantReservationStatus,
} from '@shared/lib/api/restaurant.api';

type ReservationSummary = {
  pending: RestaurantReservation[];
  confirmedToday: RestaurantReservation[];
  upcomingConfirmed: RestaurantReservation[];
};

interface RestaurantReservationsDashboardPanelProps {
  canReadReservations: boolean;
  canWriteReservations: boolean;
  initialSummary: ReservationSummary;
}

function formatReservationTime(reservation: RestaurantReservation) {
  return new Intl.DateTimeFormat('sv-SE', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Stockholm',
  }).format(new Date(reservation.requestedAt));
}

function isToday(value: string) {
  const day = new Intl.DateTimeFormat('sv-SE', {
    dateStyle: 'short',
    timeZone: 'Europe/Stockholm',
  });
  return day.format(new Date(value)) === day.format(new Date());
}

function contactLine(reservation: RestaurantReservation) {
  return [reservation.guestPhone, reservation.guestEmail].filter(Boolean).join(' | ') || 'Kontakt saknas';
}

function mergeReservation(list: RestaurantReservation[], reservation: RestaurantReservation) {
  const next = list.filter((item) => item.id !== reservation.id);
  next.push(reservation);
  return next.sort((a, b) => new Date(a.requestedAt).getTime() - new Date(b.requestedAt).getTime());
}

export function RestaurantReservationsDashboardPanel({
  canReadReservations,
  canWriteReservations,
  initialSummary,
}: RestaurantReservationsDashboardPanelProps) {
  const [summary, setSummary] = useState(initialSummary);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const pendingPreview = useMemo(() => summary.pending.slice(0, 4), [summary.pending]);
  const confirmedTodayPreview = useMemo(() => summary.confirmedToday.slice(0, 3), [summary.confirmedToday]);

  async function updateStatus(id: string, status: RestaurantReservationStatus) {
    if (!canWriteReservations) return;

    setSavingId(id);
    setError('');
    try {
      const updated = await updateRestaurantReservation(id, status);
      setSummary((current) => {
        const withoutUpdated = {
          pending: current.pending.filter((item) => item.id !== id),
          confirmedToday: current.confirmedToday.filter((item) => item.id !== id),
          upcomingConfirmed: current.upcomingConfirmed.filter((item) => item.id !== id),
        };

        if (updated.status !== 'confirmed') return withoutUpdated;

        return {
          pending: withoutUpdated.pending,
          confirmedToday: isToday(updated.requestedAt)
            ? mergeReservation(withoutUpdated.confirmedToday, updated)
            : withoutUpdated.confirmedToday,
          upcomingConfirmed: mergeReservation(withoutUpdated.upcomingConfirmed, updated),
        };
      });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSavingId(null);
    }
  }

  return (
    <Panel className="space-y-4 lg:col-span-2">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex min-w-0 items-center gap-2">
          <CalendarIcon />
          <div className="min-w-0">
            <h2 className="truncate text-sm font-semibold text-[var(--ui-text)]">Bokningar</h2>
            <p className="text-xs text-[var(--ui-text-muted)]">Nya förfrågningar och dagens bekräftade bord.</p>
          </div>
        </div>
        {canReadReservations ? (
          <Button asChild variant="secondary" size="compact">
            <Link href="/bokningar">Visa alla</Link>
          </Button>
        ) : null}
      </div>

      {!canReadReservations ? (
        <p className="text-sm text-[var(--ui-text-muted)]">Bokningar visas för roller med bokningsåtkomst.</p>
      ) : (
        <>
          <div className="grid gap-2 sm:grid-cols-3">
            <div className="rounded-[var(--ui-radius-md)] border border-[var(--ui-border)] bg-[var(--ui-surface-subtle)] px-3 py-2">
              <p className="text-xs font-medium uppercase text-[var(--ui-text-muted)]">Nya</p>
              <p className="text-lg font-semibold tabular-nums text-[var(--ui-text)]">{summary.pending.length}</p>
            </div>
            <div className="rounded-[var(--ui-radius-md)] border border-[var(--ui-border)] bg-[var(--ui-surface-subtle)] px-3 py-2">
              <p className="text-xs font-medium uppercase text-[var(--ui-text-muted)]">Bekräftade idag</p>
              <p className="text-lg font-semibold tabular-nums text-[var(--ui-text)]">{summary.confirmedToday.length}</p>
            </div>
            <div className="rounded-[var(--ui-radius-md)] border border-[var(--ui-border)] bg-[var(--ui-surface-subtle)] px-3 py-2">
              <p className="text-xs font-medium uppercase text-[var(--ui-text-muted)]">Kommande</p>
              <p className="text-lg font-semibold tabular-nums text-[var(--ui-text)]">{summary.upcomingConfirmed.length}</p>
            </div>
          </div>

          {error ? (
            <p className="rounded-[var(--ui-radius-md)] border border-[var(--ui-danger-border)] bg-[var(--ui-danger-bg)] px-3 py-2 text-sm text-[var(--ui-danger-text)]">
              {error}
            </p>
          ) : null}

          {pendingPreview.length > 0 ? (
            <section className="space-y-2">
              <h3 className="text-xs font-semibold uppercase text-[var(--ui-text-muted)]">Behöver svar</h3>
              <div className="divide-y divide-[var(--ui-border)]">
                {pendingPreview.map((reservation) => (
                  <article key={reservation.id} className="grid gap-3 py-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-medium text-[var(--ui-text)]">{reservation.guestName}</p>
                        <StatusBadge tone="warning">Ny</StatusBadge>
                      </div>
                      <p className="text-xs text-[var(--ui-text-muted)]">
                        {reservation.partySize} gäster - {formatReservationTime(reservation)}
                      </p>
                      <p className="truncate text-xs text-[var(--ui-text-muted)]">{contactLine(reservation)}</p>
                    </div>
                    {canWriteReservations ? (
                      <div className="flex flex-wrap gap-2 lg:justify-end">
                        <Button
                          type="button"
                          size="compact"
                          variant="secondary"
                          loading={savingId === reservation.id}
                          onClick={() => void updateStatus(reservation.id, 'confirmed')}
                        >
                          Bekräfta
                        </Button>
                        <Button
                          type="button"
                          size="compact"
                          variant="ghost"
                          loading={savingId === reservation.id}
                          onClick={() => void updateStatus(reservation.id, 'declined')}
                        >
                          Avböj
                        </Button>
                      </div>
                    ) : (
                      <p className="text-xs text-[var(--ui-text-muted)] lg:text-right">Endast läsbehörighet</p>
                    )}
                  </article>
                ))}
              </div>
            </section>
          ) : (
            <p className="text-sm text-[var(--ui-text-muted)]">Inga nya bokningsförfrågningar just nu.</p>
          )}

          {confirmedTodayPreview.length > 0 ? (
            <section className="space-y-2 border-t border-[var(--ui-border)] pt-3">
              <h3 className="text-xs font-semibold uppercase text-[var(--ui-text-muted)]">Bekräftade idag</h3>
              <div className="divide-y divide-[var(--ui-border)]">
                {confirmedTodayPreview.map((reservation) => (
                  <div key={reservation.id} className="flex items-center justify-between gap-3 py-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-[var(--ui-text)]">{reservation.guestName}</p>
                      <p className="text-xs text-[var(--ui-text-muted)]">
                        {reservation.partySize} gäster - {formatReservationTime(reservation)}
                      </p>
                    </div>
                    <StatusBadge tone="success">Bekräftad</StatusBadge>
                  </div>
                ))}
              </div>
            </section>
          ) : null}
        </>
      )}
    </Panel>
  );
}
