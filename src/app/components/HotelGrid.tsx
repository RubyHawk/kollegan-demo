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

        const available = floorRooms.filter((r) => r.status === 'available').length;
        const booked = floorRooms.filter((r) => r.status === 'booked').length;

        return (
          <div key={floor}>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-widest">
                Våning {floor}
              </span>
              <span className="text-[10px] text-[var(--text-muted)] bg-[var(--surface-alt)] border border-[var(--border)] rounded-full px-2 py-0.5">
                {floorRooms.length} rum
              </span>
              <div className="flex-1 h-px bg-gradient-to-r from-[var(--border)] via-[var(--border)] to-transparent" />
              <div className="flex items-center gap-3 text-[10px] text-[var(--text-muted)]">
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  {available}
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                  {booked}
                </span>
              </div>
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
