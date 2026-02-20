'use client';

import { Room } from '@/lib/types';

interface Props {
  room: Room;
}

const TYPE_LABELS: Record<string, string> = {
  Enkel: 'Enkelt rum',
  Dubbel: 'Dubbelrum',
  Svit: 'Svit',
};

export default function RoomCard({ room }: Props) {
  const isAvailable = room.status === 'available';
  const isLocked = room.status === 'locked';
  const isBooked = room.status === 'booked';

  return (
    <div
      className={[
        'relative rounded-xl p-4 transition-all duration-500 select-none border',
        isAvailable &&
          'bg-emerald-950 border-emerald-800 hover:border-gold-600 hover:bg-[#0D3322] cursor-default',
        isLocked && 'bg-gold-950 border-gold-500 room-locked',
        isBooked && 'bg-navy-900 border-navy-700 opacity-50',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {/* Status dot */}
      <div
        className={[
          'absolute top-3 right-3 w-2.5 h-2.5 rounded-full',
          isAvailable && 'bg-emerald-400',
          isLocked && 'bg-gold-500 status-ping',
          isBooked && 'bg-navy-700',
        ]
          .filter(Boolean)
          .join(' ')}
      />

      {/* Room number */}
      <div
        className={[
          'text-2xl font-bold tracking-tight font-heading',
          isAvailable && 'text-cream-100',
          isLocked && 'text-gold-400',
          isBooked && 'text-cream-600',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {room.id}
      </div>

      {/* Room type */}
      <div
        className={[
          'text-xs mt-1 font-semibold uppercase tracking-wider',
          isAvailable && 'text-emerald-400',
          isLocked && 'text-gold-500',
          isBooked && 'text-cream-600',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {TYPE_LABELS[room.type] ?? room.type}
      </div>

      {/* Status label */}
      <div className="mt-3 text-xs leading-tight min-h-[16px]">
        {isAvailable && <span className="text-emerald-400/70">Tillgänglig</span>}
        {isLocked && (
          <span className="text-gold-600 font-medium">Reserveras...</span>
        )}
        {isBooked && (
          <span className="text-cream-600 truncate block max-w-full">
            {room.guestName ?? 'Bokad'}
          </span>
        )}
      </div>
    </div>
  );
}
