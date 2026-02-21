'use client';

import { Room } from '@/lib/types';
import RoomCard from './RoomCard';

interface Props {
  rooms: Room[];
  onRoomClick?: (room: Room) => void;
}

export default function HotelGrid({ rooms, onRoomClick }: Props) {
  const floors = [3, 2, 1];
  let cardIdx = 0;

  return (
    <div className="space-y-8">
      {floors.map((floor) => {
        const floorRooms = rooms.filter((r) => r.floor === floor);
        if (floorRooms.length === 0) return null;

        const available = floorRooms.filter((r) => r.status === 'available').length;
        const locked = floorRooms.filter((r) => r.status === 'locked').length;
        const booked = floorRooms.filter((r) => r.status === 'booked').length;

        return (
          <div key={floor}>
            {/* Glass floor header */}
            <div className="flex items-center gap-3 mb-4 glass-panel rounded-xl px-4 py-2.5 shadow-card">
              {/* Floor number badge */}
              <div className="w-7 h-7 rounded-lg bg-white/60 dark:bg-white/10 border border-white/50 dark:border-white/15 flex items-center justify-center text-xs font-bold text-[var(--text-primary)] shrink-0">
                {floor}
              </div>
              <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-widest">
                Våning {floor}
              </span>
              <span className="text-[10px] text-[var(--text-muted)] bg-white/40 dark:bg-white/8 border border-white/30 dark:border-white/10 rounded-full px-2 py-0.5">
                {floorRooms.length} rum
              </span>
              <div className="flex-1 h-px bg-gradient-to-r from-white/40 via-white/20 to-transparent dark:from-white/10" />
              <div className="flex items-center gap-3 text-[10px] text-[var(--text-muted)]">
                {available > 0 && (
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    {available} ledig{available !== 1 ? 'a' : ''}
                  </span>
                )}
                {locked > 0 && (
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    {locked} res.
                  </span>
                )}
                {booked > 0 && (
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                    {booked} bokad{booked !== 1 ? 'e' : ''}
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
              {floorRooms.map((room) => {
                const delay = cardIdx++ * 50;
                return (
                  <RoomCard
                    key={room.id}
                    room={room}
                    onClick={onRoomClick}
                    animDelay={delay}
                  />
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
