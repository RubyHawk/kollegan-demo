'use client';

import { Card, CardBody, Progress } from '@heroui/react';
import AnimatedNumber from './AnimatedNumber';

interface Props {
  availableCount: number;
  lockedCount: number;
  bookedCount: number;
  occupancy: number;
  totalRooms: number;
}

export default function StatSummaryCards({
  availableCount,
  lockedCount,
  bookedCount,
  occupancy,
}: Props) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
      {/* Available */}
      <Card
        shadow="none"
        className="glass-panel border border-white/35 dark:border-white/8 stagger-in"
        style={{ animationDelay: '0ms' }}
      >
        <CardBody className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
            <p className="text-[11px] text-[var(--text-muted)] uppercase tracking-widest font-semibold">
              Lediga
            </p>
          </div>
          <p className="font-heading text-3xl font-bold text-emerald-600 dark:text-emerald-400">
            <AnimatedNumber value={availableCount} />
          </p>
          <p className="text-[11px] text-[var(--text-muted)] mt-1">rum tillgängliga</p>
        </CardBody>
      </Card>

      {/* Locked */}
      <Card
        shadow="none"
        className="glass-panel border border-white/35 dark:border-white/8 stagger-in"
        style={{ animationDelay: '60ms' }}
      >
        <CardBody className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
            <p className="text-[11px] text-[var(--text-muted)] uppercase tracking-widest font-semibold">
              Reserverade
            </p>
          </div>
          <p className="font-heading text-3xl font-bold text-amber-600 dark:text-amber-400">
            <AnimatedNumber value={lockedCount} />
          </p>
          <p className="text-[11px] text-[var(--text-muted)] mt-1">under bearbetning</p>
        </CardBody>
      </Card>

      {/* Booked */}
      <Card
        shadow="none"
        className="glass-panel border border-white/35 dark:border-white/8 stagger-in"
        style={{ animationDelay: '120ms' }}
      >
        <CardBody className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" />
            <p className="text-[11px] text-[var(--text-muted)] uppercase tracking-widest font-semibold">
              Bokade
            </p>
          </div>
          <p className="font-heading text-3xl font-bold text-indigo-600 dark:text-indigo-400">
            <AnimatedNumber value={bookedCount} />
          </p>
          <p className="text-[11px] text-[var(--text-muted)] mt-1">aktiva bokningar</p>
        </CardBody>
      </Card>

      {/* Occupancy */}
      <Card
        shadow="none"
        className="glass-panel border border-white/35 dark:border-white/8 stagger-in"
        style={{ animationDelay: '180ms' }}
      >
        <CardBody className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
            <p className="text-[11px] text-[var(--text-muted)] uppercase tracking-widest font-semibold">
              Beläggning
            </p>
          </div>
          <p className="font-heading text-3xl font-bold text-[var(--text-primary)]">
            <AnimatedNumber value={occupancy} />%
          </p>
          <Progress
            value={occupancy}
            size="sm"
            color="warning"
            className="mt-2"
            aria-label="Beläggning"
          />
        </CardBody>
      </Card>
    </div>
  );
}
