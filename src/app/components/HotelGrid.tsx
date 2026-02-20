'use client';

import { Room } from '@/lib/types';
import RoomCard from './RoomCard';

interface Props {
  rooms: Room[];
  onRoomClick?: (room: Room) => void;
}

export default function HotelGrid({ rooms, onRoomClick }: Props) {
  const floors = [3, 2, 1];

  return (
    <div className="space-y-8">
      {floors.map((floor) => {
        const floorRooms = rooms.filter((r) => r.floor === floor);
        if (floorRooms.length === 0) return null;
        return (
          <div key={floor}>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-xs font-semibold text-stone-400 uppercase tracking-widest">
                Våning {floor}
              </span>
              <div className="flex-1 h-px bg-stone-200" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
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
