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
          'bg-green-950 border-green-800 hover:border-green-500 hover:bg-green-900 cursor-default',
        isLocked && 'bg-yellow-950 border-yellow-700 room-locked',
        isBooked && 'bg-gray-900 border-gray-800 opacity-55',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {/* Status dot */}
      <div
        className={[
          'absolute top-3 right-3 w-2.5 h-2.5 rounded-full',
          isAvailable && 'bg-green-400',
          isLocked && 'bg-yellow-400 status-ping',
          isBooked && 'bg-gray-600',
        ]
          .filter(Boolean)
          .join(' ')}
      />

      {/* Room number */}
      <div
        className={[
          'text-2xl font-bold tracking-tight',
          isAvailable && 'text-green-200',
          isLocked && 'text-yellow-200',
          isBooked && 'text-gray-500',
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
          isAvailable && 'text-green-500',
          isLocked && 'text-yellow-500',
          isBooked && 'text-gray-600',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {TYPE_LABELS[room.type] ?? room.type}
      </div>

      {/* Status label */}
      <div className="mt-3 text-xs leading-tight min-h-[16px]">
        {isAvailable && <span className="text-green-600">Tillgänglig</span>}
        {isLocked && (
          <span className="text-yellow-600 font-medium">Reserveras...</span>
        )}
        {isBooked && (
          <span className="text-gray-600 truncate block max-w-full">
            {room.guestName ?? 'Bokad'}
          </span>
        )}
      </div>
    </div>
  );
}
