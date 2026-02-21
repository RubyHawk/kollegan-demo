'use client';

import { Card, CardBody, Chip } from '@heroui/react';
import { Room } from '@/lib/types';
import { getRoomMeta, AMENITY_ICONS, AmenityDef } from '@/lib/roomMeta';

interface Props {
  room: Room;
  onClick?: (room: Room) => void;
  animDelay?: number;
}

function AmenityIcon({ amenity }: { amenity: AmenityDef }) {
  return (
    <div
      title={amenity.label}
      className="flex items-center justify-center w-7 h-7 rounded-md bg-white/50 dark:bg-white/8 border border-white/40 dark:border-white/12 text-[var(--text-muted)]"
    >
      <svg
        width="13"
        height="13"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d={AMENITY_ICONS[amenity.key]} />
      </svg>
    </div>
  );
}

export default function RoomCard({ room, onClick, animDelay }: Props) {
  const isAvailable = room.status === 'available';
  const isLocked = room.status === 'locked';
  const isBooked = room.status === 'booked';
  const meta = getRoomMeta(room.id, room.type);

  const TYPE_LABELS: Record<string, string> = {
    Enkel: 'Enkelt rum',
    Dubbel: 'Dubbelrum',
    Svit: 'Svit',
  };

  const cardClasses = [
    'relative w-full text-left transition-all duration-300 cursor-pointer stagger-in',
    'glass-panel border',
    isAvailable &&
      'hover:shadow-glow-emerald hover:border-emerald-300/60 dark:hover:border-emerald-600/50 hover:-translate-y-0.5',
    isBooked &&
      'hover:shadow-glow-indigo hover:border-indigo-300/60 dark:hover:border-indigo-600/50 hover:-translate-y-0.5',
    isLocked &&
      '!bg-amber-50/70 dark:!bg-amber-900/15 !border-amber-300/60 dark:!border-amber-700/40 room-locked',
    room.type === 'Svit' && isAvailable && 'border-amber-200/60 dark:border-amber-700/30',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <Card
      isPressable={!isLocked}
      isHoverable={!isLocked}
      isDisabled={isLocked}
      shadow="none"
      onPress={() => onClick?.(room)}
      className={cardClasses}
      style={animDelay !== undefined ? { animationDelay: `${animDelay}ms` } : undefined}
      radius="lg"
    >
      <CardBody className="p-5">
        {/* Svit shimmer overlay */}
        {room.type === 'Svit' && (
          <div className="absolute inset-0 pointer-events-none rounded-xl overflow-hidden">
            <div className="absolute inset-0 svit-shimmer" />
          </div>
        )}

        {/* Top row: status chip + type badge */}
        <div className="flex items-center justify-between mb-3">
          {isAvailable && (
            <Chip
              size="sm"
              color="success"
              variant="dot"
              classNames={{
                base: 'bg-emerald-50/70 dark:bg-emerald-900/20 border-emerald-200/60 dark:border-emerald-800/40',
                content: 'text-emerald-700 dark:text-emerald-400 font-semibold text-[10px] uppercase tracking-wider',
              }}
            >
              Ledigt
            </Chip>
          )}
          {isLocked && (
            <Chip
              size="sm"
              color="warning"
              variant="dot"
              classNames={{
                base: 'bg-amber-50/70 dark:bg-amber-900/20 border-amber-200/60 dark:border-amber-800/40',
                content: 'text-amber-700 dark:text-amber-400 font-semibold text-[10px] uppercase tracking-wider',
              }}
            >
              Reserveras
            </Chip>
          )}
          {isBooked && (
            <Chip
              size="sm"
              color="secondary"
              variant="dot"
              classNames={{
                base: 'bg-indigo-50/70 dark:bg-indigo-900/20 border-indigo-200/60 dark:border-indigo-800/40',
                content: 'text-indigo-700 dark:text-indigo-400 font-semibold text-[10px] uppercase tracking-wider',
              }}
            >
              Bokat
            </Chip>
          )}
          <div
            className={[
              'px-2 py-0.5 rounded-md text-[10px] font-semibold',
              room.type === 'Svit'
                ? 'bg-amber-100/80 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                : 'bg-white/50 dark:bg-white/8 text-[var(--text-secondary)] border border-white/40 dark:border-white/12',
            ].join(' ')}
          >
            {room.type}
          </div>
        </div>

        {/* Room number (large serif) */}
        <div className="font-heading text-4xl font-bold text-[var(--text-primary)] leading-none mb-0.5">
          {room.id}
        </div>
        <div className="text-xs font-medium text-[var(--text-secondary)] mb-3">
          {TYPE_LABELS[room.type] ?? room.type} · Våning {room.floor}
        </div>

        {/* Fixed-height info slot */}
        <div className="mb-3 min-h-[2.25rem]">
          {isBooked ? (
            <>
              <p className="text-xs font-semibold text-[var(--text-primary)] truncate">
                {room.guestName ?? 'Bokad'}
              </p>
              {room.checkIn && room.checkOut && (
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                  {formatDateShort(room.checkIn)} — {formatDateShort(room.checkOut)}
                </p>
              )}
            </>
          ) : (
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed line-clamp-2">
              {meta.description}
            </p>
          )}
        </div>

        {/* Bottom row: amenity icons + price */}
        <div className="flex items-center justify-between pt-3 border-t border-white/30 dark:border-white/8">
          <div className="flex items-center gap-1">
            {meta.amenities.slice(0, 3).map((a) => (
              <AmenityIcon key={a.key} amenity={a} />
            ))}
            {meta.amenities.length > 3 && (
              <span className="text-[10px] text-[var(--text-muted)] ml-0.5">
                +{meta.amenities.length - 3}
              </span>
            )}
          </div>
          <div className="text-right">
            <span className="text-xs font-semibold text-[var(--text-primary)]">
              {meta.price.toLocaleString('sv-SE')} kr
            </span>
            <span className="text-[10px] text-[var(--text-muted)]">/natt</span>
          </div>
        </div>

        {/* Size + view */}
        <div className="flex items-center gap-1 mt-1.5">
          <span className="text-xs text-[var(--text-secondary)]">{meta.size} m²</span>
          <span className="text-xs text-[var(--text-muted)]">·</span>
          <span className="text-xs text-[var(--text-secondary)]">{meta.view}</span>
        </div>
      </CardBody>
    </Card>
  );
}

function formatDateShort(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' });
}
