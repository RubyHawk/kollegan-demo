'use client';

import { motion } from 'framer-motion';
import { Room } from '@features/hotel/rooms/types';
import RoomCard from './room-card';
import { STAGGER_CONTAINER, STAGGER_ITEM } from '@shared/lib/motion';

interface Props {
  rooms: Room[];
  onRoomClick?: (room: Room) => void;
}

export default function HotelGrid({ rooms, onRoomClick }: Props) {
  const floors = [3, 2, 1];

  return (
    <div className="space-y-6">
      {floors.map((floor) => {
        const floorRooms = rooms.filter((r) => r.floor === floor);
        if (floorRooms.length === 0) return null;

        const available = floorRooms.filter((r) => r.status === 'available').length;
        const locked    = floorRooms.filter((r) => r.status === 'locked').length;
        const booked    = floorRooms.filter((r) => r.status === 'booked').length;

        return (
          <div key={floor}>
            {/* Floor separator — simple, minimal */}
            <div className="flex items-center gap-3 mb-3">
              <span className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-widest whitespace-nowrap">
                Plan {floor}
              </span>
              <div className="flex-1 h-px bg-[var(--border-light)]" />
              <div className="flex items-center gap-3 text-[11px] text-[var(--text-muted)]">
                {available > 0 && (
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                    {available}
                  </span>
                )}
                {locked > 0 && (
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                    {locked}
                  </span>
                )}
                {booked > 0 && (
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
                    {booked}
                  </span>
                )}
              </div>
            </div>

            <motion.div
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-2.5"
              {...STAGGER_CONTAINER}
            >
              {floorRooms.map((room) => (
                <motion.div key={room.id} {...STAGGER_ITEM}>
                  <RoomCard room={room} onClick={onRoomClick} />
                </motion.div>
              ))}
            </motion.div>
          </div>
        );
      })}
    </div>
  );
}
