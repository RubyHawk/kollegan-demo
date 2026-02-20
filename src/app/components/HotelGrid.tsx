'use client';

import { Room } from '@/lib/types';
import RoomCard from './RoomCard';

interface Props {
  rooms: Room[];
  onRoomClick?: (room: Room) => void;
}

export default function HotelGrid({ rooms, onRoomClick }: Props) {
  const floors = [3, 2, 1]; // top floor first

  const available = rooms.filter((r) => r.status === 'available').length;
  const locked = rooms.filter((r) => r.status === 'locked').length;
  const booked = rooms.filter((r) => r.status === 'booked').length;

  return (
    <div className="space-y-8">
      {/* Summary bar */}
      <div className="flex gap-4 text-sm">
        <div className="flex items-center gap-2 bg-emerald-950 border border-emerald-800 rounded-lg px-3 py-1.5">
          <div className="w-2 h-2 rounded-full bg-emerald-400" />
          <span className="text-emerald-400">
            <span className="font-bold">{available}</span> tillgängliga
          </span>
        </div>
        {locked > 0 && (
          <div className="flex items-center gap-2 bg-gold-950 border border-gold-600 rounded-lg px-3 py-1.5">
            <div className="w-2 h-2 rounded-full bg-gold-500 animate-ping" />
            <span className="text-gold-400">
              <span className="font-bold">{locked}</span> reserveras
            </span>
          </div>
        )}
        <div className="flex items-center gap-2 bg-navy-900 border border-navy-700 rounded-lg px-3 py-1.5">
          <div className="w-2 h-2 rounded-full bg-cream-600" />
          <span className="text-cream-400">
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
              <span className="text-xs font-bold text-cream-400 uppercase tracking-widest font-heading">
                Våning {floor}
              </span>
              <div className="flex-1 h-px bg-navy-700" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
              {floorRooms.map((room) => (
                <RoomCard key={room.id} room={room} onClick={onRoomClick} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
