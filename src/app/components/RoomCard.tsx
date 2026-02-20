'use client';

import { Room } from '@/lib/types';

interface Props {
  room: Room;
  onClick?: (room: Room) => void;
}

const TYPE_LABELS: Record<string, string> = {
  Enkel: 'Enkelt rum',
  Dubbel: 'Dubbelrum',
  Svit: 'Svit',
};

const TYPE_ICONS: Record<string, string> = {
  Enkel: '1',
  Dubbel: '2',
  Svit: 'S',
};

export default function RoomCard({ room, onClick }: Props) {
  const isAvailable = room.status === 'available';
  const isLocked = room.status === 'locked';
  const isBooked = room.status === 'booked';

  return (
    <button
      onClick={() => onClick?.(room)}
      disabled={isLocked}
      className={[
        'relative w-full text-left rounded-2xl p-5 transition-all duration-300 border group',
        isAvailable &&
          'bg-[var(--surface)] border-emerald-200 dark:border-emerald-800 hover:border-emerald-400 dark:hover:border-emerald-600 hover:shadow-lg hover:shadow-emerald-50 dark:hover:shadow-emerald-900/20 cursor-pointer',
        isLocked &&
          'bg-amber-50 dark:bg-amber-900/20 border-amber-300 dark:border-amber-700 room-locked cursor-not-allowed',
        isBooked &&
          'bg-[var(--surface)] border-indigo-200 dark:border-indigo-800 hover:border-indigo-400 dark:hover:border-indigo-600 hover:shadow-lg hover:shadow-indigo-50 dark:hover:shadow-indigo-900/20 cursor-pointer',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="flex items-start justify-between">
        <div className="text-2xl font-bold tracking-tight text-[var(--text-primary)] font-heading">
          {room.id}
        </div>
        <div
          className={[
            'w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold',
            isAvailable && 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400',
            isLocked && 'bg-amber-200 dark:bg-amber-800/40 text-amber-800 dark:text-amber-400',
            isBooked && 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-400',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          {TYPE_ICONS[room.type] ?? '?'}
        </div>
      </div>

      <div className="text-xs text-[var(--text-muted)] mt-1 font-medium">
        {TYPE_LABELS[room.type] ?? room.type}
      </div>

      <div className="mt-4">
        {isAvailable && (
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Tillgänglig</span>
          </div>
        )}
        {isLocked && (
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-amber-500 status-ping" />
            <span className="text-xs font-medium text-amber-700 dark:text-amber-400">Reserveras...</span>
          </div>
        )}
        {isBooked && (
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-indigo-500" />
              <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400 truncate max-w-[140px]">
                {room.guestName ?? 'Bokad'}
              </span>
            </div>
            {room.checkIn && room.checkOut && (
              <p className="text-[11px] text-[var(--text-muted)] pl-3.5">
                {formatDateShort(room.checkIn)} — {formatDateShort(room.checkOut)}
              </p>
            )}
          </div>
        )}
      </div>
    </button>
  );
}

function formatDateShort(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' });
}
