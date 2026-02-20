'use client';

import { useMemo } from 'react';
import { Room } from '@/lib/types';

interface Props {
  rooms: Room[];
  onRoomClick?: (room: Room) => void;
}

const TYPE_LABELS: Record<string, string> = {
  Enkel: 'Enkelt',
  Dubbel: 'Dubbel',
  Svit: 'Svit',
};

// Neutral tones for standard rooms, amber for premium (Svit).
// Avoids the rainbow problem while keeping rooms distinguishable.
const ROOM_COLORS: Record<string, { bar: string; text: string; bg: string; border: string }> = {
  Enkel:  { bar: 'bg-stone-400 dark:bg-stone-500',  text: 'text-[var(--text-secondary)]', bg: 'bg-[var(--surface-alt)]',                             border: 'border-l-stone-300 dark:border-l-stone-500'  },
  Dubbel: { bar: 'bg-stone-500 dark:bg-stone-400',  text: 'text-[var(--text-secondary)]', bg: 'bg-[var(--surface-alt)]',                             border: 'border-l-stone-400 dark:border-l-stone-400'  },
  Svit:   { bar: 'bg-amber-500',                    text: 'text-amber-700 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/30',              border: 'border-l-amber-400'                           },
};

const DAYS_TO_SHOW = 14;

function getDateArray(start: Date, count: number): Date[] {
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    return d;
  });
}

function toDateKey(d: Date): string {
  return d.toISOString().split('T')[0];
}

function daysBetween(a: string, b: string): number {
  const da = new Date(a + 'T00:00:00');
  const db = new Date(b + 'T00:00:00');
  return Math.round((db.getTime() - da.getTime()) / (1000 * 60 * 60 * 24));
}

function formatDayHeader(d: Date): { day: string; weekday: string; isToday: boolean; isWeekend: boolean } {
  const today = new Date();
  const isToday =
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear();
  const isWeekend = d.getDay() === 0 || d.getDay() === 6;
  return {
    day: d.getDate().toString(),
    weekday: d.toLocaleDateString('sv-SE', { weekday: 'short' }).replace('.', ''),
    isToday,
    isWeekend,
  };
}

export default function BookingsCalendar({ rooms, onRoomClick }: Props) {
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const dates = useMemo(() => getDateArray(today, DAYS_TO_SHOW), [today]);
  const startKey = toDateKey(today);

  const bookedRooms = useMemo(
    () => rooms.filter((r) => r.status === 'booked').sort((a, b) => a.id.localeCompare(b.id)),
    [rooms]
  );

  const allRooms = useMemo(
    () => [...rooms].sort((a, b) => a.id.localeCompare(b.id)),
    [rooms]
  );

  if (bookedRooms.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="w-16 h-16 rounded-2xl bg-[var(--surface-alt)] flex items-center justify-center mx-auto mb-4 float-animation">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--text-muted)]">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        </div>
        <p className="text-[var(--text-secondary)] font-medium">Inga bokningar just nu</p>
        <p className="text-[var(--text-muted)] text-sm mt-1.5 max-w-xs mx-auto">
          Klicka på ett tillgängligt rum för att skapa en bokning, eller ring Kollegan för att boka via röst.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* ── Booking summary cards ── */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-widest">Aktiva bokningar</span>
          <span className="text-xs text-[var(--text-muted)] bg-[var(--surface-alt)] border border-[var(--border)] rounded-full px-2 py-0.5">
            {bookedRooms.length}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {bookedRooms.map((room) => {
            const colors = ROOM_COLORS[room.type] || ROOM_COLORS.Enkel;
            const nights = room.checkIn && room.checkOut ? daysBetween(room.checkIn, room.checkOut) : null;

            return (
              <button
                key={room.id}
                onClick={() => onRoomClick?.(room)}
                className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 text-left hover:shadow-md hover:border-[var(--text-muted)] transition-all active:scale-[0.98]"
              >
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-xl bg-[var(--surface-alt)] border border-[var(--border)] flex items-center justify-center font-bold text-base shrink-0 font-heading text-[var(--text-primary)]">
                    {room.id}
                  </div>
                  <div className="flex-1 min-w-0 pt-0.5">
                    <p className="text-sm font-semibold text-[var(--text-primary)] truncate leading-tight">
                      {room.guestName}
                    </p>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">
                      {TYPE_LABELS[room.type]}
                    </p>
                  </div>
                  {nights !== null && (
                    <div className="shrink-0 text-right">
                      <span className="text-sm font-bold text-[var(--text-primary)] tabular-nums">{nights}</span>
                      <p className="text-[10px] text-[var(--text-muted)] leading-none mt-0.5">{nights === 1 ? 'natt' : 'nätter'}</p>
                    </div>
                  )}
                </div>

                {room.checkIn && room.checkOut && (
                  <div className="mt-3 pt-3 border-t border-[var(--border-light)] flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--text-muted)] shrink-0">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                    <span className="font-medium">{formatDateNice(room.checkIn)}</span>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--text-muted)] shrink-0">
                      <line x1="5" y1="12" x2="19" y2="12" />
                      <polyline points="12 5 19 12 12 19" />
                    </svg>
                    <span className="font-medium">{formatDateNice(room.checkOut)}</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Calendar timeline ── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-widest">Tidslinje</span>
            <span className="text-xs text-[var(--text-muted)] bg-[var(--surface-alt)] border border-[var(--border)] rounded-full px-2 py-0.5">
              14 dagar
            </span>
          </div>
          <span className="text-[11px] text-[var(--text-muted)]">Klicka på en bokning för detaljer</span>
        </div>

        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl overflow-hidden">
          <div className="overflow-x-auto calendar-scroll">
            <div className="min-w-[800px]">
              {/* Date header row */}
              <div className="grid border-b border-[var(--border)]" style={{ gridTemplateColumns: '120px repeat(14, 1fr)' }}>
                <div className="px-3 py-3 bg-[var(--surface-alt)] border-r border-[var(--border)]">
                  <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Rum</span>
                </div>
                {dates.map((date) => {
                  const { day, weekday, isToday, isWeekend } = formatDayHeader(date);
                  return (
                    <div
                      key={toDateKey(date)}
                      className={[
                        'px-1 py-2 text-center border-r border-[var(--border-light)] last:border-r-0',
                        isToday ? 'bg-amber-50 dark:bg-amber-900/20' : isWeekend ? 'bg-[var(--surface-alt)]' : 'bg-[var(--surface)]',
                      ].join(' ')}
                    >
                      <div className={['text-[10px] uppercase', isToday ? 'text-amber-600 dark:text-amber-400 font-bold' : 'text-[var(--text-muted)]'].join(' ')}>
                        {weekday}
                      </div>
                      <div
                        className={[
                          'text-sm font-semibold mt-0.5',
                          isToday
                            ? 'text-amber-700 dark:text-amber-300 bg-amber-200 dark:bg-amber-700 w-7 h-7 rounded-full flex items-center justify-center mx-auto'
                            : 'text-[var(--text-secondary)]',
                        ].join(' ')}
                      >
                        {day}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Room rows */}
              {allRooms.map((room) => {
                const colors = ROOM_COLORS[room.type] || ROOM_COLORS.Enkel;
                const isBooked = room.status === 'booked' && room.checkIn && room.checkOut;

                let barStart = 0;
                let barSpan = 0;
                if (isBooked && room.checkIn && room.checkOut) {
                  const rawStart = daysBetween(startKey, room.checkIn);
                  const rawEnd = daysBetween(startKey, room.checkOut);
                  barStart = Math.max(0, rawStart);
                  barSpan = Math.min(DAYS_TO_SHOW, rawEnd) - barStart;
                  if (barSpan <= 0) barSpan = 0;
                }

                return (
                  <div
                    key={room.id}
                    className="grid border-b border-[var(--border-light)] last:border-b-0"
                    style={{ gridTemplateColumns: '120px repeat(14, 1fr)' }}
                  >
                    <div className="px-3 py-3 border-r border-[var(--border)] bg-[var(--surface-alt)] flex items-center gap-2">
                      <span className="font-bold text-sm text-[var(--text-secondary)]">{room.id}</span>
                      <span className={['text-[10px] font-medium px-1.5 py-0.5 rounded', colors.bg, colors.text].join(' ')}>
                        {TYPE_LABELS[room.type]}
                      </span>
                    </div>

                    <div className="col-span-14 relative min-h-[48px]">
                      <div className="absolute inset-0 grid" style={{ gridTemplateColumns: 'repeat(14, 1fr)' }}>
                        {dates.map((date) => {
                          const { isToday, isWeekend } = formatDayHeader(date);
                          return (
                            <div
                              key={toDateKey(date)}
                              className={[
                                'border-r border-[var(--border-light)] last:border-r-0',
                                isToday ? 'bg-amber-50/50 dark:bg-amber-900/10' : isWeekend ? 'bg-[var(--surface-alt)]/50' : '',
                              ].join(' ')}
                            />
                          );
                        })}
                      </div>

                      {isBooked && barSpan > 0 && (
                        <div
                          className="absolute top-2 bottom-2 flex items-center cursor-pointer group/bar booking-bar-tooltip"
                          style={{
                            left: `${(barStart / DAYS_TO_SHOW) * 100}%`,
                            width: `${(barSpan / DAYS_TO_SHOW) * 100}%`,
                          }}
                          onClick={() => onRoomClick?.(room)}
                        >
                          <div
                            className={[
                              'w-full h-full rounded-lg flex items-center px-3 shadow-sm transition-all group-hover/bar:shadow-md group-hover/bar:brightness-105',
                              colors.bar,
                            ].join(' ')}
                          >
                            <span className="text-xs font-semibold text-white truncate drop-shadow-sm">
                              {room.guestName}
                            </span>
                          </div>
                          {/* Tooltip */}
                          <div className="tooltip-content">
                            <div className="font-semibold">{room.guestName}</div>
                            {room.checkIn && room.checkOut && (
                              <div className="opacity-80 mt-0.5">
                                {formatDateNice(room.checkIn)} → {formatDateNice(room.checkOut)}
                                {' · '}{daysBetween(room.checkIn, room.checkOut)} {daysBetween(room.checkIn, room.checkOut) === 1 ? 'natt' : 'nätter'}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-[var(--text-muted)]">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-stone-400 dark:bg-stone-500" />
          <span>Enkelt / Dubbel</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-amber-500" />
          <span>Svit</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-amber-200 dark:bg-amber-700 border border-amber-300 dark:border-amber-600" />
          <span>Idag</span>
        </div>
      </div>
    </div>
  );
}

function formatDateNice(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' });
}
