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
          'bg-white border-emerald-200 hover:border-emerald-400 hover:shadow-lg hover:shadow-emerald-50 cursor-pointer',
        isLocked &&
          'bg-amber-50 border-amber-300 room-locked cursor-not-allowed',
        isBooked &&
          'bg-white border-indigo-200 hover:border-indigo-400 hover:shadow-lg hover:shadow-indigo-50 cursor-pointer',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {/* Top row: room number + type badge */}
      <div className="flex items-start justify-between">
        <div className="text-2xl font-bold tracking-tight text-stone-800 font-heading">
          {room.id}
        </div>
        <div
          className={[
            'w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold',
            isAvailable && 'bg-emerald-100 text-emerald-700',
            isLocked && 'bg-amber-200 text-amber-800',
            isBooked && 'bg-indigo-100 text-indigo-700',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          {TYPE_ICONS[room.type] ?? '?'}
        </div>
      </div>

      {/* Room type */}
      <div className="text-xs text-stone-500 mt-1 font-medium">
        {TYPE_LABELS[room.type] ?? room.type}
      </div>

      {/* Status area */}
      <div className="mt-4">
        {isAvailable && (
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-xs font-medium text-emerald-600">Tillgänglig</span>
          </div>
        )}
        {isLocked && (
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-amber-500 status-ping" />
            <span className="text-xs font-medium text-amber-700">Reserveras...</span>
          </div>
        )}
        {isBooked && (
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-indigo-500" />
              <span className="text-xs font-medium text-indigo-600 truncate max-w-[140px]">
                {room.guestName ?? 'Bokad'}
              </span>
            </div>
            {room.checkIn && room.checkOut && (
              <p className="text-[11px] text-stone-400 pl-3.5">
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
