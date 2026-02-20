'use client';

import { Room } from '@/lib/types';
import RoomCard from './RoomCard';

interface Props {
  rooms: Room[];
}

export default function HotelGrid({ rooms }: Props) {
  const floors = [3, 2, 1]; // top floor first

  const available = rooms.filter((r) => r.status === 'available').length;
  const locked = rooms.filter((r) => r.status === 'locked').length;
  const booked = rooms.filter((r) => r.status === 'booked').length;

  return (
    <div className="space-y-8">
      {/* Summary bar */}
      <div className="flex gap-4 text-sm">
        <div className="flex items-center gap-2 bg-green-950 border border-green-800 rounded-lg px-3 py-1.5">
          <div className="w-2 h-2 rounded-full bg-green-400" />
          <span className="text-green-300">
            <span className="font-bold">{available}</span> tillgängliga
          </span>
        </div>
        {locked > 0 && (
          <div className="flex items-center gap-2 bg-yellow-950 border border-yellow-800 rounded-lg px-3 py-1.5">
            <div className="w-2 h-2 rounded-full bg-yellow-400 animate-ping" />
            <span className="text-yellow-300">
              <span className="font-bold">{locked}</span> reserveras
            </span>
          </div>
        )}
        <div className="flex items-center gap-2 bg-gray-900 border border-gray-800 rounded-lg px-3 py-1.5">
          <div className="w-2 h-2 rounded-full bg-gray-600" />
          <span className="text-gray-400">
            <span className="font-bold">{booked}</span> bokade
          </span>
        </div>
      </div>

      {/* Floors */}
      {floors.map((floor) => {
        const floorRooms = rooms.filter((r) => r.floor === floor);
        return (
          <div key={floor}>
            <div className="flex items-center gap-3 mb-3">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                Våning {floor}
              </span>
              <div className="flex-1 h-px bg-gray-800" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
              {floorRooms.map((room) => (
                <RoomCard key={room.id} room={room} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
