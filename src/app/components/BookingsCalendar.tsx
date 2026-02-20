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

const ROOM_COLORS: Record<string, { bar: string; text: string; bg: string }> = {
  Enkel: { bar: 'bg-emerald-400', text: 'text-emerald-700', bg: 'bg-emerald-50' },
  Dubbel: { bar: 'bg-blue-400', text: 'text-blue-700', bg: 'bg-blue-50' },
  Svit: { bar: 'bg-violet-400', text: 'text-violet-700', bg: 'bg-violet-50' },
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

  // All rooms sorted for the grid (show every room)
  const allRooms = useMemo(
    () => [...rooms].sort((a, b) => a.id.localeCompare(b.id)),
    [rooms]
  );

  if (bookedRooms.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="w-16 h-16 rounded-2xl bg-stone-100 flex items-center justify-center mx-auto mb-4">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#A8A29E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        </div>
        <p className="text-stone-500 font-medium">Inga bokningar just nu</p>
        <p className="text-stone-400 text-sm mt-1">
          Klicka på ett tillgängligt rum för att skapa en bokning
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Booking summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {bookedRooms.map((room) => {
          const colors = ROOM_COLORS[room.type] || ROOM_COLORS.Enkel;
          const nights = room.checkIn && room.checkOut ? daysBetween(room.checkIn, room.checkOut) : null;

          return (
            <button
              key={room.id}
              onClick={() => onRoomClick?.(room)}
              className="bg-white border border-stone-200 rounded-2xl p-4 text-left hover:shadow-lg hover:border-stone-300 transition-all group"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className={['w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm', colors.bg, colors.text].join(' ')}>
                  {room.id}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-stone-800 truncate">
                    {room.guestName}
                  </p>
                  <p className="text-xs text-stone-400">
                    {TYPE_LABELS[room.type]}
                  </p>
                </div>
              </div>

              {room.checkIn && room.checkOut ? (
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-stone-500">
                    {formatDateNice(room.checkIn)}
                  </span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#A8A29E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                  <span className="text-stone-500">
                    {formatDateNice(room.checkOut)}
                  </span>
                  {nights !== null && (
                    <span className="ml-auto text-stone-400 bg-stone-100 rounded-md px-2 py-0.5">
                      {nights} {nights === 1 ? 'natt' : 'nätter'}
                    </span>
                  )}
                </div>
              ) : (
                <p className="text-xs text-stone-400">Inga datum angivna</p>
              )}
            </button>
          );
        })}
      </div>

      {/* Calendar timeline */}
      <div>
        <h3 className="text-sm font-semibold text-stone-700 mb-3">Tidslinje — nästa 14 dagar</h3>
        <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto calendar-scroll">
            <div className="min-w-[800px]">
              {/* Date header row */}
              <div className="grid border-b border-stone-200" style={{ gridTemplateColumns: '120px repeat(14, 1fr)' }}>
                <div className="px-3 py-3 bg-stone-50 border-r border-stone-200">
                  <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Rum</span>
                </div>
                {dates.map((date) => {
                  const { day, weekday, isToday, isWeekend } = formatDayHeader(date);
                  return (
                    <div
                      key={toDateKey(date)}
                      className={[
                        'px-1 py-2 text-center border-r border-stone-100 last:border-r-0',
                        isToday ? 'bg-amber-50' : isWeekend ? 'bg-stone-50' : 'bg-white',
                      ].join(' ')}
                    >
                      <div className={['text-[10px] uppercase', isToday ? 'text-amber-600 font-bold' : 'text-stone-400'].join(' ')}>
                        {weekday}
                      </div>
                      <div
                        className={[
                          'text-sm font-semibold mt-0.5',
                          isToday
                            ? 'text-amber-700 bg-amber-200 w-7 h-7 rounded-full flex items-center justify-center mx-auto'
                            : 'text-stone-700',
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

                // Calculate bar position
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
                    className="grid border-b border-stone-100 last:border-b-0 group/row"
                    style={{ gridTemplateColumns: '120px repeat(14, 1fr)' }}
                  >
                    {/* Room label */}
                    <div className="px-3 py-3 border-r border-stone-200 bg-stone-50/50 flex items-center gap-2">
                      <span className="font-bold text-sm text-stone-700">{room.id}</span>
                      <span className={['text-[10px] font-medium px-1.5 py-0.5 rounded', colors.bg, colors.text].join(' ')}>
                        {TYPE_LABELS[room.type]}
                      </span>
                    </div>

                    {/* Timeline cells with overlay bar */}
                    <div className="col-span-14 relative min-h-[48px]">
                      {/* Grid lines */}
                      <div className="absolute inset-0 grid" style={{ gridTemplateColumns: 'repeat(14, 1fr)' }}>
                        {dates.map((date) => {
                          const { isToday, isWeekend } = formatDayHeader(date);
                          return (
                            <div
                              key={toDateKey(date)}
                              className={[
                                'border-r border-stone-100 last:border-r-0',
                                isToday ? 'bg-amber-50/50' : isWeekend ? 'bg-stone-50/50' : '',
                              ].join(' ')}
                            />
                          );
                        })}
                      </div>

                      {/* Booking bar */}
                      {isBooked && barSpan > 0 && (
                        <div
                          className="absolute top-2 bottom-2 flex items-center cursor-pointer group/bar"
                          style={{
                            left: `${(barStart / DAYS_TO_SHOW) * 100}%`,
                            width: `${(barSpan / DAYS_TO_SHOW) * 100}%`,
                          }}
                          onClick={() => onRoomClick?.(room)}
                        >
                          <div
                            className={[
                              'w-full h-full rounded-lg flex items-center px-3 shadow-sm transition-shadow group-hover/bar:shadow-md',
                              colors.bar,
                            ].join(' ')}
                          >
                            <span className="text-xs font-semibold text-white truncate drop-shadow-sm">
                              {room.guestName}
                            </span>
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
      <div className="flex flex-wrap gap-4 text-xs text-stone-500">
        {Object.entries(ROOM_COLORS).map(([type, colors]) => (
          <div key={type} className="flex items-center gap-1.5">
            <div className={['w-3 h-3 rounded', colors.bar].join(' ')} />
            <span>{TYPE_LABELS[type]}</span>
          </div>
        ))}
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-amber-200 border border-amber-300" />
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
