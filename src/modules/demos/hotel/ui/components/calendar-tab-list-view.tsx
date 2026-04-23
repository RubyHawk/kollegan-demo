'use client';

import { useMemo } from 'react';
import type { Room } from '@demos/hotel/domain/room.entity';
import { BAR_COLOR, EmptyState, ROOM_LABEL, TYPE_BADGE, diffDays, fmtShort } from './calendar-tab-shared';

export function ListView({ rooms, onRoomClick }: { rooms: Room[]; onRoomClick?: (r: Room) => void }) {
  const booked = useMemo(
    () => rooms.filter((r) => r.status === 'booked').sort((a, b) => a.id.localeCompare(b.id)),
    [rooms],
  );

  if (booked.length === 0) return <EmptyState />;

  return (
    <div className="space-y-2">
      <div className="hidden sm:grid grid-cols-[1fr_1.4fr_1fr_1fr_auto] gap-4 px-4 py-2 text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-widest">
        <span>Rum</span><span>Gäst</span><span>Incheckning</span><span>Utcheckning</span><span>Nätter</span>
      </div>

      {booked.map((room) => {
        const nights = room.checkIn && room.checkOut ? diffDays(room.checkIn, room.checkOut) : null;
        const badge  = TYPE_BADGE[room.type] || TYPE_BADGE.Enkel;
        const bar    = BAR_COLOR[room.type]  || BAR_COLOR.Enkel;

        return (
          <button
            key={room.id}
            onClick={() => onRoomClick?.(room)}
            className="w-full bg-[var(--surface)] border-2 border-[var(--border)] rounded-2xl px-4 py-3.5 text-left hover:shadow-card-hover hover:border-purple-200 dark:hover:border-amber-900/40 transition-all active:scale-[0.995] group shadow-card"
          >
            {/* Mobile */}
            <div className="flex items-start gap-3 sm:hidden">
              <div className={['w-2 self-stretch rounded-full shrink-0 mt-1', bar.bg].join(' ')} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-sm text-[var(--text-primary)]">Rum {room.id}</span>
                  <span className={['text-[10px] font-medium px-1.5 py-0.5 rounded-md', badge].join(' ')}>
                    {ROOM_LABEL[room.type]}
                  </span>
                </div>
                <p className="text-sm text-[var(--text-secondary)] mt-0.5 truncate">{room.guestName}</p>
                {room.checkIn && room.checkOut && (
                  <p className="text-xs text-[var(--text-muted)] mt-1">
                    {fmtShort(room.checkIn)} → {fmtShort(room.checkOut)}
                    {nights !== null && <> · {nights} {nights === 1 ? 'natt' : 'nätter'}</>}
                  </p>
                )}
              </div>
            </div>

            {/* Desktop */}
            <div className="hidden sm:grid grid-cols-[1fr_1.4fr_1fr_1fr_auto] gap-4 items-center">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className={['w-1.5 h-8 rounded-full shrink-0', bar.bg].join(' ')} />
                <div className="min-w-0">
                  <p className="font-semibold text-sm text-[var(--text-primary)] truncate">
                    {ROOM_LABEL[room.type]} {room.number}
                  </p>
                  <p className="text-[10px] text-[var(--text-muted)]">Våning {room.floor}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-full bg-[var(--surface-alt)] border border-[var(--border)] flex items-center justify-center shrink-0">
                  <span className="text-[10px] font-bold text-[var(--text-secondary)]">
                    {room.guestName?.charAt(0).toUpperCase() ?? '?'}
                  </span>
                </div>
                <span className="text-sm text-[var(--text-primary)] font-medium truncate">{room.guestName}</span>
              </div>
              <div>
                {room.checkIn ? (
                  <>
                    <p className="text-sm font-medium text-[var(--text-primary)]">{fmtShort(room.checkIn)}</p>
                    <p className="text-[10px] text-[var(--text-muted)]">
                      {new Date(room.checkIn + 'T00:00:00').toLocaleDateString('sv-SE', { weekday: 'long' })}
                    </p>
                  </>
                ) : <span className="text-xs text-[var(--text-muted)]">—</span>}
              </div>
              <div>
                {room.checkOut ? (
                  <>
                    <p className="text-sm font-medium text-[var(--text-primary)]">{fmtShort(room.checkOut)}</p>
                    <p className="text-[10px] text-[var(--text-muted)]">
                      {new Date(room.checkOut + 'T00:00:00').toLocaleDateString('sv-SE', { weekday: 'long' })}
                    </p>
                  </>
                ) : <span className="text-xs text-[var(--text-muted)]">—</span>}
              </div>
              <div className="flex items-center gap-3">
                {nights !== null ? (
                  <div className="text-right">
                    <span className="text-sm font-bold text-[var(--text-primary)] tabular-nums">{nights}</span>
                    <p className="text-[10px] text-[var(--text-muted)] leading-none mt-0.5">{nights === 1 ? 'natt' : 'nätter'}</p>
                  </div>
                ) : <span className="text-xs text-[var(--text-muted)]">—</span>}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  className="text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

// ── Timeline view (Google Calendar style) ─────────────────────────────────
