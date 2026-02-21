'use client';

import { Room } from '@/lib/types';
import { getRoomMeta, AMENITY_ICONS, AmenityDef } from '@/lib/roomMeta';

interface Props {
  room: Room;
  onClick?: (room: Room) => void;
  animDelay?: number;
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
  booked:    'text-indigo-700 dark:text-indigo-400',
};

function AmenityIcon({ amenity }: { amenity: AmenityDef }) {
  return (
    <div title={amenity.label} className="text-[var(--text-muted)]">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d={AMENITY_ICONS[amenity.key]} />
      </svg>
    </div>
  );
}

export default function RoomCard({ room, onClick, animDelay }: Props) {
  const isLocked = room.status === 'locked';
  const isBooked = room.status === 'booked';
  const meta = getRoomMeta(room.id, room.type);

  return (
    <button
      onClick={() => !isLocked && onClick?.(room)}
      disabled={isLocked}
      className={[
        'group relative w-full text-left rounded-xl border-l-[3px] border border-[var(--border)] stagger-in',
        'bg-[var(--surface)] dark:bg-[var(--surface)]',
        'transition-all duration-200',
        !isLocked && 'hover:shadow-md hover:-translate-y-px hover:border-[var(--border)] cursor-pointer',
        isLocked && 'cursor-default opacity-80 room-locked',
        STATUS_ACCENT[room.status] ?? 'border-l-[var(--border)]',
        room.type === 'Svit' && 'overflow-hidden',
      ].filter(Boolean).join(' ')}
      style={animDelay !== undefined ? { animationDelay: `${animDelay}ms` } : undefined}
    >
      {/* Svit: subtle top shimmer only */}
      {room.type === 'Svit' && (
        <div className="absolute top-0 inset-x-0 h-0.5 svit-shimmer pointer-events-none" />
      )}

      <div className="px-3.5 py-3">
        {/* Row 1: room number + type tag */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <span className="font-heading text-2xl font-bold text-[var(--text-primary)] leading-none">
            {room.id}
          </span>
          <span className={[
            'text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded mt-0.5 shrink-0',
            room.type === 'Svit'
              ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
              : 'bg-[var(--surface-alt)] text-[var(--text-muted)] border border-[var(--border-light)]',
          ].join(' ')}>
            {room.type}
          </span>
        </div>

        {/* Row 2: status dot + label + guest name if booked */}
        <div className="flex items-center gap-1.5 mb-2.5">
          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${STATUS_DOT[room.status]}`} />
          <span className={`text-[11px] font-semibold ${STATUS_TEXT[room.status]}`}>
            {STATUS_LABEL[room.status]}
          </span>
          {isBooked && room.guestName && (
            <>
              <span className="text-[var(--border)] text-[11px]">·</span>
              <span className="text-[11px] text-[var(--text-secondary)] truncate">{room.guestName}</span>
            </>
          )}
          {isBooked && room.checkIn && room.checkOut && (
            <>
              <span className="text-[var(--border)] text-[11px] hidden sm:inline">·</span>
              <span className="text-[11px] text-[var(--text-muted)] hidden sm:inline">
                {formatDateShort(room.checkIn)}–{formatDateShort(room.checkOut)}
              </span>
            </>
          )}
        </div>

        {/* Row 3: amenities + price + size */}
        <div className="flex items-center justify-between gap-2 pt-2.5 border-t border-[var(--border-light)]">
          <div className="flex items-center gap-1.5">
            {meta.amenities.slice(0, 3).map((a) => (
              <AmenityIcon key={a.key} amenity={a} />
            ))}
            {meta.amenities.length > 3 && (
              <span className="text-[10px] text-[var(--text-muted)]">+{meta.amenities.length - 3}</span>
            )}
          </div>
          <div className="flex items-baseline gap-1 shrink-0">
            <span className="text-xs font-semibold text-[var(--text-primary)]">
              {meta.price.toLocaleString('sv-SE')} kr
            </span>
            <span className="text-[10px] text-[var(--text-muted)]">· {meta.size}m²</span>
          </div>
        </div>
      </div>
    </button>
  );
}

function formatDateShort(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' });
}
