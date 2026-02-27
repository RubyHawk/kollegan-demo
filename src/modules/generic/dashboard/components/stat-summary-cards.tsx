'use client';

import { Card, CardContent } from '@shared/ui/card';
import { Progress } from '@shared/ui/progress';
import AnimatedNumber from '@shared/ui/animated-number';

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
        className="glass-panel border border-white/35 dark:border-white/8 shadow-none stagger-in"
        style={{ animationDelay: '0ms' }}
      >
        <CardContent className="p-4">
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
        </CardContent>
      </Card>

      {/* Locked */}
      <Card
        className="glass-panel border border-white/35 dark:border-white/8 shadow-none stagger-in"
        style={{ animationDelay: '60ms' }}
      >
        <CardContent className="p-4">
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
        </CardContent>
      </Card>

      {/* Booked */}
      <Card
        className="glass-panel border border-white/35 dark:border-white/8 shadow-none stagger-in"
        style={{ animationDelay: '120ms' }}
      >
        <CardContent className="p-4">
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
        </CardContent>
      </Card>

      {/* Occupancy */}
      <Card
        className="glass-panel border border-white/35 dark:border-white/8 shadow-none stagger-in"
        style={{ animationDelay: '180ms' }}
      >
        <CardContent className="p-4">
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
            className="mt-2 h-1.5"
            indicatorClassName="bg-amber-500"
            aria-label="Beläggning"
          />
        </CardContent>
      </Card>
    </div>
  );
}
