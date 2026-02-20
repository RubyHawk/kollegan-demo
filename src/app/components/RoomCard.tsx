'use client';

import { Room } from '@/lib/types';
import { getRoomMeta, AMENITY_ICONS, AmenityDef } from '@/lib/roomMeta';

interface Props {
  room: Room;
  onClick?: (room: Room) => void;
}

function AmenityIcon({ amenity }: { amenity: AmenityDef }) {
  return (
    <div title={amenity.label} className="flex items-center justify-center w-6 h-6 rounded-md bg-[var(--surface-alt)] text-[var(--text-muted)]">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d={AMENITY_ICONS[amenity.key]} />
      </svg>
    </div>
  );
}

export default function RoomCard({ room, onClick }: Props) {
  const isAvailable = room.status === 'available';
  const isLocked = room.status === 'locked';
  const isBooked = room.status === 'booked';
  const meta = getRoomMeta(room.id, room.type);

  const TYPE_LABELS: Record<string, string> = {
    Enkel: 'Enkelt rum',
    Dubbel: 'Dubbelrum',
    Svit: 'Svit',
  };

  // Neutral for standard rooms, amber only for premium (Svit)
  const typeColors: Record<string, string> = {
    Enkel:  'bg-[var(--surface-alt)] text-[var(--text-secondary)]',
    Dubbel: 'bg-[var(--surface-alt)] text-[var(--text-secondary)]',
    Svit:   'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
  };

  return (
    <button
      onClick={() => onClick?.(room)}
      disabled={isLocked}
      className={[
        'relative w-full text-left rounded-2xl p-5 transition-all duration-200 border',
        !isLocked && 'cursor-pointer active:scale-[0.98]',
        isAvailable && 'bg-[var(--surface)] border-[var(--border)] hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-md',
        isLocked && 'bg-amber-50 dark:bg-amber-900/20 border-amber-300 dark:border-amber-700 room-locked cursor-not-allowed',
        isBooked && 'bg-[var(--surface)] border-[var(--border)] hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-md',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {/* Top row: status + type badge */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          {isAvailable && (
            <>
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Ledigt</span>
            </>
          )}
          {isLocked && (
            <>
              <div className="w-1.5 h-1.5 rounded-full bg-amber-500 status-ping" />
              <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wider">Reserveras</span>
            </>
          )}
          {isBooked && (
            <>
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
              <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Bokat</span>
            </>
          )}
        </div>
        <div className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${typeColors[room.type] ?? 'bg-stone-100 text-stone-600'}`}>
          {room.type}
        </div>
      </div>

      {/* Room number (large serif) */}
      <div className="font-heading text-3xl font-bold text-[var(--text-primary)] leading-none mb-0.5">
        {room.id}
      </div>
      <div className="text-xs font-medium text-[var(--text-muted)] mb-3">
        {TYPE_LABELS[room.type] ?? room.type} · Våning {room.floor}
      </div>

      {/* Fixed-height info slot — description for available/locked, guest info for booked.
          Always the same height so the card never shifts on hover. */}
      <div className="mb-3 min-h-[2.25rem]">
        {isBooked ? (
          <>
            <p className="text-xs font-semibold text-[var(--text-primary)] truncate">{room.guestName ?? 'Bokad'}</p>
            {room.checkIn && room.checkOut && (
              <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                {formatDateShort(room.checkIn)} — {formatDateShort(room.checkOut)}
              </p>
            )}
          </>
        ) : (
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed line-clamp-2">
            {meta.description}
          </p>
        )}
      </div>

      {/* Bottom row: amenity icons + price */}
      <div className="flex items-center justify-between pt-3 border-t border-[var(--border-light)]">
        <div className="flex items-center gap-1">
          {meta.amenities.slice(0, 3).map((a) => (
            <AmenityIcon key={a.key} amenity={a} />
          ))}
          {meta.amenities.length > 3 && (
            <span className="text-[10px] text-[var(--text-muted)] ml-0.5">+{meta.amenities.length - 3}</span>
          )}
        </div>
        <div className="text-right">
          <span className="text-xs font-semibold text-[var(--text-primary)]">{meta.price.toLocaleString('sv-SE')} kr</span>
          <span className="text-[10px] text-[var(--text-muted)]">/natt</span>
        </div>
      </div>

      {/* Size + view */}
      <div className="flex items-center gap-1 mt-1.5">
        <span className="text-[10px] text-[var(--text-muted)]">{meta.size} m²</span>
        <span className="text-[10px] text-[var(--text-muted)]">·</span>
        <span className="text-[10px] text-[var(--text-muted)]">{meta.view}</span>
      </div>
    </button>
  );
}

function formatDateShort(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' });
}
