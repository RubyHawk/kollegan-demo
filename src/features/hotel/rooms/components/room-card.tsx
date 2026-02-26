'use client';

import { Room } from '@features/hotel/rooms/types';
import { getRoomMeta, AMENITY_ICONS, AmenityDef } from '@features/hotel/rooms/lib/room-meta';

interface Props {
  room: Room;
  onClick?: (room: Room) => void;
}

const STATUS_ACCENT: Record<string, string> = {
  available: 'border-l-emerald-500',
  locked:    'border-l-amber-400',
  booked:    'border-l-indigo-400',
};

const STATUS_DOT: Record<string, string> = {
  available: 'bg-emerald-500',
  locked:    'bg-amber-400',
  booked:    'bg-indigo-400',
};

const STATUS_LABEL: Record<string, string> = {
  available: 'Ledigt',
  locked:    'Reserveras',
  booked:    'Bokat',
};

const STATUS_TEXT: Record<string, string> = {
  available: 'text-emerald-700 dark:text-emerald-400',
  locked:    'text-amber-700 dark:text-amber-400',
  booked:    'text-indigo-600 dark:text-indigo-400',
};

function AmenityIcon({ amenity }: { amenity: AmenityDef }) {
  return (
    <div
      title={amenity.label}
      className="w-6 h-6 rounded-md bg-[var(--surface-alt)] border border-[var(--border-light)] flex items-center justify-center text-[var(--text-muted)] shrink-0"
    >
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
        <path d={AMENITY_ICONS[amenity.key]} />
      </svg>
    </div>
  );
}

export default function RoomCard({ room, onClick }: Props) {
  const isLocked = room.status === 'locked';
  const isBooked = room.status === 'booked';
  const meta = getRoomMeta(room.id, room.type);

  return (
    <button
      onClick={() => !isLocked && onClick?.(room)}
      disabled={isLocked}
      className={[
        'group relative w-full text-left rounded-xl border-l-[3px] border border-[var(--border)]',
        'card-interactive transition-all duration-200',
        !isLocked && 'cursor-pointer',
        isLocked && 'cursor-default room-locked',
        STATUS_ACCENT[room.status] ?? 'border-l-[var(--border)]',
        room.type === 'Svit'
          ? 'bg-amber-50/40 dark:bg-amber-900/10 overflow-hidden'
          : 'bg-[var(--surface)]',
      ].filter(Boolean).join(' ')}
    >
      {/* Svit: top shimmer edge */}
      {room.type === 'Svit' && (
        <div className="absolute top-0 inset-x-0 h-0.5 svit-shimmer pointer-events-none" />
      )}

      <div className="px-4 py-4 flex flex-col gap-3">

        {/* Block 1: room number + type chip + meta */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="font-heading text-3xl font-bold text-[var(--text-primary)] leading-none mb-1 tabular-nums">
              {room.id}
            </div>
            <div className="text-[11px] text-[var(--text-muted)]">
              {meta.bedType} · Vn {room.floor} · {meta.size} m²
            </div>
          </div>
          <span className={[
            'text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded shrink-0 mt-0.5',
            room.type === 'Svit'
              ? 'bg-amber-200/70 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400'
              : 'bg-[var(--surface-alt)] text-[var(--text-muted)] border border-[var(--border-light)]',
          ].join(' ')}>
            {room.type}
          </span>
        </div>

        {/* Block 2: status + guest info */}
        <div>
          <div className="flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${STATUS_DOT[room.status]}`} />
            <span className={`text-[11px] font-semibold ${STATUS_TEXT[room.status]}`}>
              {STATUS_LABEL[room.status]}
            </span>
          </div>
          {isBooked && (room.guestName || (room.checkIn && room.checkOut)) && (
            <div className="mt-1 text-[11px] text-[var(--text-secondary)] leading-tight">
              {room.guestName && <span className="font-medium">{room.guestName}</span>}
              {room.guestName && room.checkIn && <span className="text-[var(--text-muted)]"> · </span>}
              {room.checkIn && room.checkOut && (
                <span className="text-[var(--text-muted)]">
                  {formatDateShort(room.checkIn)}–{formatDateShort(room.checkOut)}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Block 3: amenities + price */}
        <div className="flex items-center justify-between gap-2 pt-2.5 border-t border-[var(--border-light)]">
          <div className="flex items-center gap-1">
            {meta.amenities.slice(0, 3).map((a) => (
              <AmenityIcon key={a.key} amenity={a} />
            ))}
            {meta.amenities.length > 3 && (
              <span className="text-[10px] text-[var(--text-muted)] ml-0.5">
                +{meta.amenities.length - 3}
              </span>
            )}
          </div>
          <span className="text-xs font-semibold text-[var(--text-primary)] shrink-0 tabular-nums">
            {meta.price.toLocaleString('sv-SE')} <span className="font-normal text-[var(--text-muted)]">kr/n</span>
          </span>
        </div>

      </div>
    </button>
  );
}

function formatDateShort(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' });
}
