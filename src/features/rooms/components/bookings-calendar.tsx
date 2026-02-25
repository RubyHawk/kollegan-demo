'use client';

import { useMemo, useState, useEffect } from 'react';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@shared/ui/tooltip';
import { Button } from '@shared/ui/button';
import { Badge } from '@shared/ui/badge';
import { Room } from '@features/rooms/types';

interface Props {
  rooms: Room[];
  onRoomClick?: (room: Room) => void;
}

type View = 'week' | 'month' | '2months';
type SubTab = 'list' | 'timeline' | 'google';

const VIEWS: { key: View; label: string }[] = [
  { key: 'week',    label: 'Vecka' },
  { key: 'month',   label: 'Månad' },
  { key: '2months', label: '2 mån' },
];

// Fixed pixel dimensions
const LABEL_W = 180; // px for room label column
const ROW_H   = 52;  // px per room row
const HEAD1_H = 32;  // month group row height
const HEAD2_H = 42;  // day number row height

const ROOM_LABEL: Record<string, string> = {
  Enkel:  'Enkelt rum',
  Dubbel: 'Dubbelrum',
  Svit:   'Svit',
};


const TYPE_BADGE: Record<string, string> = {
  Enkel:  'bg-stone-100 dark:bg-stone-800   text-stone-600 dark:text-stone-300',
  Dubbel: 'bg-stone-200 dark:bg-stone-700   text-stone-700 dark:text-stone-200',
  Svit:   'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400',
};

const BAR_COLOR: Record<string, { bg: string; text: string }> = {
  Enkel:  { bg: 'bg-stone-300 dark:bg-stone-600', text: 'text-stone-900 dark:text-stone-100' },
  Dubbel: { bg: 'bg-stone-400 dark:bg-stone-500', text: 'text-stone-950 dark:text-white'     },
  Svit:   { bg: 'bg-amber-400 dark:bg-amber-500', text: 'text-amber-950 dark:text-amber-50'  },
};

// ── Helpers ─────────────────────────────────────────────────────────────────

function toKey(d: Date) {
  return d.toISOString().split('T')[0];
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function diffDays(a: string, b: string): number {
  return Math.round(
    (new Date(b + 'T00:00:00').getTime() - new Date(a + 'T00:00:00').getTime()) / 86400000,
  );
}

function fmtShort(iso: string): string {
  return new Date(iso + 'T00:00:00').toLocaleDateString('sv-SE', {
    day: 'numeric',
    month: 'short',
  });
}

function fmtLong(iso: string): string {
  return new Date(iso + 'T00:00:00').toLocaleDateString('sv-SE', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function todayMidnight(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function startOfWeek(d: Date): Date {
  const r = new Date(d);
  const shift = (r.getDay() + 6) % 7; // Mon=0 … Sun=6
  r.setDate(r.getDate() - shift);
  return r;
}

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function daysInMonth(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
}

function addMonths(d: Date, n: number): Date {
  const r = new Date(d);
  r.setMonth(r.getMonth() + n);
  return r;
}

// ── Sub-components ───────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-16 h-16 rounded-2xl bg-[var(--surface-alt)] border border-[var(--border)] flex items-center justify-center mb-5 float-animation">
        <svg
          width="26"
          height="26"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-[var(--text-muted)]"
        >
          <path d="M8 2v4M16 2v4" />
          <path d="M3 9h18" />
          <path d="M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2" />
        </svg>
      </div>
      <p className="text-[var(--text-secondary)] font-semibold text-sm">Inga aktiva bokningar</p>
      <p className="text-[var(--text-muted)] text-xs mt-1.5 max-w-[260px] leading-relaxed">
        Klicka på ett tillgängligt rum för att skapa en bokning, eller ring Kollegan.
      </p>
    </div>
  );
}

function SegmentedControl({
  options,
  value,
  onChange,
  size = 'md',
}: {
  options: { key: string; label: React.ReactNode }[];
  value: string;
  onChange: (v: string) => void;
  size?: 'sm' | 'md';
}) {
  const base = size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3.5 py-1.5 text-sm';
  return (
    <div className="flex bg-[var(--surface-alt)] border border-[var(--border)] rounded-xl p-0.5">
      {options.map((o) => (
        <button
          key={o.key}
          onClick={() => onChange(o.key)}
          className={[
            base,
            'font-medium rounded-[10px] transition-all flex items-center gap-1.5',
            value === o.key
              ? 'bg-[var(--surface)] shadow-sm text-[var(--text-primary)]'
              : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]',
          ].join(' ')}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

// Google Calendar brand icon
function GoogleCalendarIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="4" width="20" height="18" rx="2" fill="#fff" stroke="#dadce0" strokeWidth="1"/>
      <rect x="2" y="4" width="20" height="6" rx="2" fill="#1a73e8"/>
      <rect x="2" y="8" width="20" height="2" fill="#1a73e8"/>
      <path d="M8 2v4M16 2v4" stroke="#1a73e8" strokeWidth="1.5" strokeLinecap="round"/>
      <text x="12" y="19" textAnchor="middle" fontSize="7" fontWeight="700" fill="#1a73e8" fontFamily="sans-serif">31</text>
    </svg>
  );
}

// ── List view ────────────────────────────────────────────────────────────────

function ListView({
  rooms,
  onRoomClick,
}: {
  rooms: Room[];
  onRoomClick?: (r: Room) => void;
}) {
  const booked = useMemo(
    () => rooms.filter((r) => r.status === 'booked').sort((a, b) => a.id.localeCompare(b.id)),
    [rooms],
  );

  if (booked.length === 0) return <EmptyState />;

  return (
    <div className="space-y-2">
      {/* Table header */}
      <div className="hidden sm:grid grid-cols-[1fr_1.4fr_1fr_1fr_auto] gap-4 px-4 py-2 text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-widest">
        <span>Rum</span>
        <span>Gäst</span>
        <span>Incheckning</span>
        <span>Utcheckning</span>
        <span>Nätter</span>
      </div>

      {booked.map((room) => {
        const nights =
          room.checkIn && room.checkOut ? diffDays(room.checkIn, room.checkOut) : null;
        const badge = TYPE_BADGE[room.type] || TYPE_BADGE.Enkel;
        const bar   = BAR_COLOR[room.type] || BAR_COLOR.Enkel;

        return (
          <button
            key={room.id}
            onClick={() => onRoomClick?.(room)}
            className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-2xl px-4 py-3.5 text-left hover:shadow-md hover:border-[var(--text-muted)] transition-all active:scale-[0.995] group"
          >
            {/* Mobile layout */}
            <div className="flex items-start gap-3 sm:hidden">
              <div
                className={[
                  'w-2 self-stretch rounded-full shrink-0 mt-1',
                  bar.bg,
                ].join(' ')}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-sm text-[var(--text-primary)]">
                    Rum {room.id}
                  </span>
                  <span className={['text-[10px] font-medium px-1.5 py-0.5 rounded-md', badge].join(' ')}>
                    {ROOM_LABEL[room.type]}
                  </span>
                </div>
                <p className="text-sm text-[var(--text-secondary)] mt-0.5 truncate">
                  {room.guestName}
                </p>
                {room.checkIn && room.checkOut && (
                  <p className="text-xs text-[var(--text-muted)] mt-1">
                    {fmtShort(room.checkIn)} → {fmtShort(room.checkOut)}
                    {nights !== null && <> · {nights} {nights === 1 ? 'natt' : 'nätter'}</>}
                  </p>
                )}
              </div>
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="shrink-0 text-[var(--text-muted)] mt-1 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </div>

            {/* Desktop layout */}
            <div className="hidden sm:grid grid-cols-[1fr_1.4fr_1fr_1fr_auto] gap-4 items-center">
              {/* Room */}
              <div className="flex items-center gap-2.5 min-w-0">
                <div className={['w-1.5 h-8 rounded-full shrink-0', bar.bg].join(' ')} />
                <div className="min-w-0">
                  <p className="font-semibold text-sm text-[var(--text-primary)] truncate">
                    {ROOM_LABEL[room.type]} {room.number}
                  </p>
                  <p className="text-[10px] text-[var(--text-muted)]">Våning {room.floor}</p>
                </div>
              </div>

              {/* Guest */}
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-full bg-[var(--surface-alt)] border border-[var(--border)] flex items-center justify-center shrink-0">
                  <span className="text-[10px] font-bold text-[var(--text-secondary)]">
                    {room.guestName?.charAt(0).toUpperCase() ?? '?'}
                  </span>
                </div>
                <span className="text-sm text-[var(--text-primary)] font-medium truncate">
                  {room.guestName}
                </span>
              </div>

              {/* Check-in */}
              <div>
                {room.checkIn ? (
                  <>
                    <p className="text-sm font-medium text-[var(--text-primary)]">
                      {fmtShort(room.checkIn)}
                    </p>
                    <p className="text-[10px] text-[var(--text-muted)]">
                      {new Date(room.checkIn + 'T00:00:00').toLocaleDateString('sv-SE', { weekday: 'long' })}
                    </p>
                  </>
                ) : (
                  <span className="text-xs text-[var(--text-muted)]">—</span>
                )}
              </div>

              {/* Check-out */}
              <div>
                {room.checkOut ? (
                  <>
                    <p className="text-sm font-medium text-[var(--text-primary)]">
                      {fmtShort(room.checkOut)}
                    </p>
                    <p className="text-[10px] text-[var(--text-muted)]">
                      {new Date(room.checkOut + 'T00:00:00').toLocaleDateString('sv-SE', { weekday: 'long' })}
                    </p>
                  </>
                ) : (
                  <span className="text-xs text-[var(--text-muted)]">—</span>
                )}
              </div>

              {/* Nights + arrow */}
              <div className="flex items-center gap-3">
                {nights !== null ? (
                  <div className="text-right">
                    <span className="text-sm font-bold text-[var(--text-primary)] tabular-nums">
                      {nights}
                    </span>
                    <p className="text-[10px] text-[var(--text-muted)] leading-none mt-0.5">
                      {nights === 1 ? 'natt' : 'nätter'}
                    </p>
                  </div>
                ) : (
                  <span className="text-xs text-[var(--text-muted)]">—</span>
                )}
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

// ── Timeline view ────────────────────────────────────────────────────────────

function TimelineView({
  rooms,
  onRoomClick,
}: {
  rooms: Room[];
  onRoomClick?: (r: Room) => void;
}) {
  const [viewKey, setViewKey] = useState<View>('month');
  const [baseDate, setBaseDate] = useState(() => todayMidnight());

  const today = useMemo(todayMidnight, []);
  const todayKey = toKey(today);

  // Compute view boundaries: snap to week/month start
  const { startDate, totalDays } = useMemo(() => {
    switch (viewKey) {
      case 'week': {
        const s = startOfWeek(baseDate);
        return { startDate: s, totalDays: 7 };
      }
      case 'month': {
        const s = startOfMonth(baseDate);
        return { startDate: s, totalDays: daysInMonth(s) };
      }
      case '2months': {
        const s = startOfMonth(baseDate);
        const next = addMonths(s, 1);
        return { startDate: s, totalDays: daysInMonth(s) + daysInMonth(next) };
      }
    }
  }, [viewKey, baseDate]);

  const startKey = toKey(startDate);

  const dates = useMemo(
    () => Array.from({ length: totalDays }, (_, i) => addDays(startDate, i)),
    [startDate, totalDays],
  );

  const sortedRooms = useMemo(
    () => [...rooms].sort((a, b) => a.floor - b.floor || a.number - b.number),
    [rooms],
  );

  // Group dates by month for the double-row header
  const monthGroups = useMemo(() => {
    const groups: { label: string; span: number }[] = [];
    for (const d of dates) {
      const lbl = d.toLocaleDateString('sv-SE', { month: 'long', year: 'numeric' });
      const cap = lbl[0].toUpperCase() + lbl.slice(1);
      if (!groups.length || groups[groups.length - 1].label !== cap) {
        groups.push({ label: cap, span: 1 });
      } else {
        groups[groups.length - 1].span++;
      }
    }
    return groups;
  }, [dates]);

  // Period label – Google Calendar style
  const periodLabel = useMemo(() => {
    const cap = (s: string) => s[0].toUpperCase() + s.slice(1);
    if (viewKey === 'month') {
      return cap(startDate.toLocaleDateString('sv-SE', { month: 'long', year: 'numeric' }));
    }
    if (viewKey === 'week') {
      const end = addDays(startDate, 6);
      if (startDate.getMonth() === end.getMonth()) {
        const m = cap(startDate.toLocaleDateString('sv-SE', { month: 'short', year: 'numeric' }));
        return `${startDate.getDate()} – ${end.getDate()} ${m}`;
      }
      const sm = cap(startDate.toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' }));
      const em = cap(end.toLocaleDateString('sv-SE', { day: 'numeric', month: 'short', year: 'numeric' }));
      return `${sm} – ${em}`;
    }
    // 2months
    const end = addDays(startDate, totalDays - 1);
    const sm = cap(startDate.toLocaleDateString('sv-SE', { month: 'long' }));
    const em = cap(end.toLocaleDateString('sv-SE', { month: 'long', year: 'numeric' }));
    return `${sm} – ${em}`;
  }, [viewKey, startDate, totalDays]);

  // Check if today falls within the current visible period
  const isShowingToday = useMemo(() => {
    const t = today.getTime();
    return t >= startDate.getTime() && t < addDays(startDate, totalDays).getTime();
  }, [today, startDate, totalDays]);

  function navigate(direction: -1 | 1) {
    setBaseDate((d) => {
      switch (viewKey) {
        case 'week': return addDays(d, 7 * direction);
        case 'month': return addMonths(d, direction);
        case '2months': return addMonths(d, 2 * direction);
      }
    });
  }

  function getBar(room: Room) {
    if (room.status !== 'booked' || !room.checkIn || !room.checkOut) return null;
    const s  = diffDays(startKey, room.checkIn);
    const e  = diffDays(startKey, room.checkOut);
    const cs = Math.max(0, s);
    const ce = Math.min(totalDays, e);
    return ce - cs > 0 ? { col: cs, span: ce - cs } : null;
  }

  return (
    <div className="space-y-3">
      {/* ── Toolbar row (Google Calendar layout) ── */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Today button – always visible, outlined like Google Calendar */}
        <Button
          size="sm"
          variant="outline"
          onClick={() => setBaseDate(todayMidnight())}
          disabled={isShowingToday}
          className="h-8 px-3 text-sm font-medium border-[var(--border)] text-[var(--text-primary)] bg-[var(--surface)] hover:bg-[var(--surface-alt)] disabled:opacity-40"
        >
          Idag
        </Button>

        {/* Prev / Next arrows */}
        <div className="flex items-center gap-0.5">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => navigate(-1)}
            aria-label="Föregående period"
            className="h-8 w-8 text-[var(--text-secondary)]"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </Button>

          <Button
            size="icon"
            variant="ghost"
            onClick={() => navigate(1)}
            aria-label="Nästa period"
            className="h-8 w-8 text-[var(--text-secondary)]"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </Button>
        </div>

        {/* Period label */}
        <span className="text-lg font-semibold text-[var(--text-primary)] select-none">
          {periodLabel}
        </span>

        {/* View selector – pushed to the right */}
        <div className="ml-auto">
          <SegmentedControl
            options={VIEWS.map((v) => ({ key: v.key, label: v.label }))}
            value={viewKey}
            onChange={(k) => setViewKey(k as View)}
            size="sm"
          />
        </div>
      </div>

      {/* ── Calendar grid ── */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl overflow-hidden">

            {/* ── Row 1: Month groups ── */}
            <div
              className="flex border-b border-[var(--border)] bg-[var(--surface-alt)]"
              style={{ height: HEAD1_H }}
            >
              {/* Label column header */}
              <div
                className="shrink-0 border-r border-[var(--border)] flex items-center px-4"
                style={{ width: LABEL_W }}
              >
                <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">
                  Rum
                </span>
              </div>

              {/* Month spans */}
              <div className="flex flex-1 min-w-0">
                {monthGroups.map((mg, i) => (
                  <div
                    key={i}
                    className="border-r border-[var(--border-light)] last:border-r-0 flex items-center px-3 min-w-0"
                    style={{ flex: mg.span }}
                  >
                    <span className="text-[11px] font-semibold text-[var(--text-secondary)] capitalize truncate">
                      {mg.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Row 2: Day numbers ── */}
            <div
              className="flex border-b border-[var(--border)]"
              style={{ height: HEAD2_H }}
            >
              {/* Label column spacer */}
              <div
                className="shrink-0 border-r border-[var(--border)] bg-[var(--surface-alt)]"
                style={{ width: LABEL_W }}
              />

              {/* Day cells */}
              <div className="flex flex-1 min-w-0">
                {dates.map((d) => {
                  const k         = toKey(d);
                  const isToday   = k === todayKey;
                  const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                  return (
                    <div
                      key={k}
                      className={[
                        'flex-1 flex flex-col items-center justify-center border-r border-[var(--border-light)] last:border-r-0 select-none overflow-hidden',
                        isToday
                          ? 'bg-amber-50 dark:bg-amber-900/20'
                          : isWeekend
                          ? 'bg-[var(--surface-alt)]/60'
                          : 'bg-[var(--surface)]',
                      ].join(' ')}
                    >
                      {totalDays <= 31 && (
                        <span
                          className={[
                            'text-[9px] font-semibold uppercase leading-none',
                            isToday
                              ? 'text-amber-600 dark:text-amber-400'
                              : 'text-[var(--text-muted)]',
                          ].join(' ')}
                        >
                          {d.toLocaleDateString('sv-SE', { weekday: 'narrow' })}
                        </span>
                      )}
                      {isToday ? (
                        <TooltipProvider delayDuration={400}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div
                                className={[
                                  'flex items-center justify-center rounded-full font-bold leading-none',
                                  totalDays > 31
                                    ? 'text-[9px] w-5 h-5 mt-0'
                                    : 'text-[11px] w-6 h-6 mt-0.5',
                                  'bg-amber-500 text-white cursor-default',
                                ].join(' ')}
                              >
                                {d.getDate()}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="bottom">Idag</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ) : (
                        <div
                          className={[
                            'flex items-center justify-center rounded-full font-bold leading-none',
                            totalDays > 31
                              ? 'text-[9px] w-5 h-5 mt-0'
                              : 'text-[11px] w-6 h-6 mt-0.5',
                            'text-[var(--text-secondary)]',
                          ].join(' ')}
                        >
                          {d.getDate()}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── Room rows ── */}
            {sortedRooms.map((room, idx) => {
              const bar    = getBar(room);
              const colors = BAR_COLOR[room.type] || BAR_COLOR.Enkel;
              const nights = room.checkIn && room.checkOut ? diffDays(room.checkIn, room.checkOut) : 0;

              return (
                <div
                  key={room.id}
                  className={[
                    'flex relative',
                    idx < sortedRooms.length - 1
                      ? 'border-b border-[var(--border-light)]'
                      : '',
                  ].join(' ')}
                  style={{ height: ROW_H }}
                >
                  {/* Room label */}
                  <div
                    className="shrink-0 border-r border-[var(--border)] bg-[var(--surface-alt)] flex items-center gap-2.5 px-4"
                    style={{ width: LABEL_W }}
                  >
                    <div
                      className={['w-2 h-8 rounded-full shrink-0', colors.bg].join(' ')}
                    />
                    <div className="min-w-0">
                      <p className="text-[12px] font-semibold text-[var(--text-primary)] leading-tight truncate">
                        {ROOM_LABEL[room.type]} {room.number}
                      </p>
                      <Badge
                        variant={room.type === 'Svit' ? 'warning' : 'secondary'}
                        className="h-[18px] mt-0.5 text-[9px] font-semibold px-1.5 py-0 rounded-md"
                      >
                        Vån {room.floor}
                      </Badge>
                    </div>
                  </div>

                  {/* Day cells + booking bar */}
                  <div className="flex-1 relative flex">
                    {dates.map((d) => {
                      const k         = toKey(d);
                      const isToday   = k === todayKey;
                      const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                      return (
                        <div
                          key={k}
                          className={[
                            'flex-1 border-r border-[var(--border-light)] last:border-r-0',
                            isToday
                              ? 'bg-amber-50/60 dark:bg-amber-900/10'
                              : isWeekend
                              ? 'bg-[var(--surface-alt)]/30'
                              : '',
                          ].join(' ')}
                        />
                      );
                    })}

                    {bar && (
                      <TooltipProvider delayDuration={200}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              onClick={() => onRoomClick?.(room)}
                              className={[
                                'absolute top-3 bottom-3 flex items-center px-2.5 rounded-lg shadow-sm',
                                'transition-all hover:brightness-105 hover:shadow-md active:scale-[0.99]',
                                colors.bg,
                              ].join(' ')}
                              style={{
                                left:  `calc(${(bar.col / totalDays) * 100}% + 2px)`,
                                width: `calc(${(bar.span / totalDays) * 100}% - 4px)`,
                              }}
                            >
                              <span
                                className={[
                                  'text-[11px] font-semibold truncate leading-none',
                                  colors.text,
                                ].join(' ')}
                              >
                                {room.guestName}
                              </span>
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="px-3 py-2">
                            <div className="min-w-[160px]">
                              <p className="font-semibold text-sm">{room.guestName}</p>
                              <p className="text-xs text-[var(--text-muted)] mb-2">
                                {ROOM_LABEL[room.type]} · Rum {room.number} · Vån {room.floor}
                              </p>
                              <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-xs">
                                <span className="text-[var(--text-muted)]">Incheckning</span>
                                <span className="font-medium">{room.checkIn ? fmtShort(room.checkIn) : '–'}</span>
                                <span className="text-[var(--text-muted)]">Utcheckning</span>
                                <span className="font-medium">{room.checkOut ? fmtShort(room.checkOut) : '–'}</span>
                                <span className="text-[var(--text-muted)]">Nätter</span>
                                <span className="font-medium">{nights}</span>
                              </div>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                </div>
              );
            })}

            {sortedRooms.length === 0 && (
              <div className="flex items-center justify-center" style={{ height: ROW_H * 3 }}>
                <p className="text-sm text-[var(--text-muted)]">Laddar rum…</p>
              </div>
            )}

        {/* Legend */}
        <div className="flex flex-wrap gap-4 px-4 py-3 border-t border-[var(--border-light)] bg-[var(--surface-alt)]">
          {(['Enkel', 'Dubbel', 'Svit'] as const).map((type) => (
            <div key={type} className="flex items-center gap-1.5">
              <div className={['w-3 h-3 rounded-sm', BAR_COLOR[type].bg].join(' ')} />
              <span className="text-[11px] text-[var(--text-muted)]">{ROOM_LABEL[type]}</span>
            </div>
          ))}
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-amber-500" />
            <span className="text-[11px] text-[var(--text-muted)]">Idag</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Google Calendar view ─────────────────────────────────────────────────────

const FUTURE_INTEGRATIONS = [
  {
    name: 'Outlook Kalender',
    desc: 'Microsoft 365 synk',
    color: '#0078d4',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="2" y="4" width="13" height="16" rx="1.5" fill="#0078d4"/>
        <rect x="9" y="7" width="13" height="13" rx="1.5" fill="#28a8e8"/>
        <rect x="9" y="7" width="13" height="7" rx="1.5" fill="#0078d4"/>
        <circle cx="15.5" cy="13.5" r="3.5" fill="#fff"/>
      </svg>
    ),
  },
  {
    name: 'Booking.com',
    desc: 'Kanalhantering',
    color: '#003580',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="24" height="24" rx="4" fill="#003580"/>
        <text x="12" y="16" textAnchor="middle" fontSize="10" fontWeight="900" fill="#fff" fontFamily="sans-serif">B.</text>
      </svg>
    ),
  },
  {
    name: 'Apple iCal',
    desc: 'CalDAV-synk',
    color: '#f3111b',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="2" y="4" width="20" height="18" rx="3" fill="#fff" stroke="#d1d5db" strokeWidth="1.5"/>
        <rect x="2" y="4" width="20" height="6" rx="3" fill="#f3111b"/>
        <rect x="2" y="8" width="20" height="2" fill="#f3111b"/>
        <text x="12" y="19" textAnchor="middle" fontSize="7" fontWeight="700" fill="#1d1d1f" fontFamily="sans-serif">iCal</text>
      </svg>
    ),
  },
  {
    name: 'Airtable',
    desc: 'Databas & API',
    color: '#18BFFF',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="24" height="24" rx="4" fill="#18BFFF"/>
        <rect x="4" y="6" width="16" height="4" rx="1" fill="#fff" opacity="0.9"/>
        <rect x="4" y="12" width="10" height="3" rx="1" fill="#fff" opacity="0.9"/>
        <rect x="4" y="17" width="13" height="3" rx="1" fill="#fff" opacity="0.9"/>
      </svg>
    ),
  },
];

function ComingSoonBadge() {
  return (
    <span className="text-[9px] font-bold uppercase tracking-wide text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-full px-1.5 py-0.5">
      Snart
    </span>
  );
}

function GoogleCalendarView() {
  const [loading, setLoading]       = useState(true);
  const [configured, setConfigured] = useState(false);
  const [embedUrl, setEmbedUrl]     = useState<string | null>(null);
  const [hovered, setHovered]       = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/calendar/events')
      .then((r) => r.json())
      .then((data) => {
        setConfigured(data.configured ?? false);
        setEmbedUrl(data.embedUrl ?? null);
      })
      .catch(() => {/* stay unconfigured */})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3" style={{ minHeight: 480 }}>
        <div className="w-9 h-9 rounded-full border-2 border-[var(--border)] border-t-[#1a73e8] animate-spin" />
        <p className="text-sm text-[var(--text-muted)]">Ansluter till Google Kalender…</p>
      </div>
    );
  }

  if (!configured) {
    return (
      <div className="space-y-4">
        {/* Setup card */}
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl overflow-hidden">
          {/* Header */}
          <div className="px-6 py-5 border-b border-[var(--border)] bg-gradient-to-br from-[#1a73e8]/5 to-transparent flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-sm flex items-center justify-center shrink-0">
              <GoogleCalendarIcon size={28} />
            </div>
            <div>
              <p className="text-base font-semibold text-[var(--text-primary)]">Anslut Google Kalender</p>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                Bokningar skapas och synkroniseras automatiskt i realtid via Kollegan AI.
              </p>
            </div>
          </div>

          {/* Steps */}
          <div className="px-6 py-5 space-y-4">
            {[
              {
                step: '1',
                title: 'Skapa ett Service Account',
                body: 'Gå till Google Cloud Console → IAM & Admin → Service Accounts. Skapa ett nytt konto och ladda ner JSON-nyckeln.',
              },
              {
                step: '2',
                title: 'Lägg till miljövariabler',
                body: null,
                code: [
                  'GOOGLE_SERVICE_ACCOUNT_EMAIL=namn@projekt.iam.gserviceaccount.com',
                  'GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\n..."',
                  'GOOGLE_CALENDAR_ID=din-kalender@group.calendar.google.com',
                ],
              },
              {
                step: '3',
                title: 'Dela kalendern med service account',
                body: 'Öppna Google Kalender → Inställningar för din kalender → Dela med specifika personer. Lägg till service account-e-posten med rollen "Göra ändringar i händelser".',
              },
            ].map((item) => (
              <div key={item.step} className="flex gap-3.5">
                <div className="w-6 h-6 rounded-full bg-[#1a73e8] text-white flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5">
                  {item.step}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[var(--text-primary)]">{item.title}</p>
                  {item.body && (
                    <p className="text-xs text-[var(--text-muted)] mt-0.5 leading-relaxed">{item.body}</p>
                  )}
                  {item.code && (
                    <div className="mt-2 bg-[var(--surface-alt)] border border-[var(--border)] rounded-xl p-3 space-y-1">
                      {item.code.map((line) => (
                        <code key={line} className="block text-[10px] font-mono text-[var(--text-secondary)] break-all leading-relaxed">
                          {line}
                        </code>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="px-6 py-4 border-t border-[var(--border)] bg-[var(--surface-alt)] flex items-center gap-2 text-xs text-[var(--text-muted)]">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            Starta om servern med <code className="font-mono mx-1 bg-[var(--surface)] border border-[var(--border)] px-1 py-px rounded text-[10px]">npm run dev</code> efter att du lagt till variabler i <code className="font-mono mx-1 bg-[var(--surface)] border border-[var(--border)] px-1 py-px rounded text-[10px]">.env.local</code>.
          </div>
        </div>

        {/* Coming-soon integrations grid */}
        <div>
          <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-widest mb-2.5 px-0.5">
            Fler integrationer — kommer snart
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {FUTURE_INTEGRATIONS.map((fi) => (
              <button
                key={fi.name}
                onMouseEnter={() => setHovered(fi.name)}
                onMouseLeave={() => setHovered(null)}
                className="relative bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 text-left transition-all hover:border-[var(--text-muted)] hover:shadow-sm active:scale-[0.98] group"
              >
                <div className="flex items-start justify-between mb-2.5">
                  <div className="w-10 h-10 rounded-xl bg-[var(--surface-alt)] border border-[var(--border)] flex items-center justify-center">
                    {fi.icon}
                  </div>
                  <ComingSoonBadge />
                </div>
                <p className="text-xs font-semibold text-[var(--text-primary)] leading-tight">{fi.name}</p>
                <p className="text-[10px] text-[var(--text-muted)] mt-0.5">{fi.desc}</p>

                {/* Hover overlay */}
                {hovered === fi.name && (
                  <div className="absolute inset-0 rounded-2xl bg-[var(--surface-alt)]/80 flex items-center justify-center">
                    <span className="text-xs font-semibold text-[var(--text-secondary)]">Kommer snart</span>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* ── Integration header ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2.5">
          <GoogleCalendarIcon size={22} />
          <div>
            <p className="text-sm font-semibold text-[var(--text-primary)] leading-tight">Google Kalender</p>
            <p className="text-[10px] text-[var(--text-muted)] leading-tight">Live-synkad · realtidsbokningar</p>
          </div>
          <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 rounded-full px-2 py-0.5 ml-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Ansluten
          </span>
        </div>

        {/* Future integrations – compact row */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-[var(--text-muted)] mr-1">Lägg till:</span>
          {FUTURE_INTEGRATIONS.map((fi) => (
            <button
              key={fi.name}
              onMouseEnter={() => setHovered(fi.name)}
              onMouseLeave={() => setHovered(null)}
              title={`${fi.name} – Kommer snart`}
              className="relative w-8 h-8 rounded-xl bg-[var(--surface-alt)] border border-[var(--border)] flex items-center justify-center transition-all hover:border-[var(--text-muted)] hover:shadow-sm active:scale-95"
            >
              {fi.icon}
              {hovered === fi.name && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 whitespace-nowrap bg-[var(--surface)] border border-[var(--border)] shadow-md rounded-lg px-2 py-1 text-[10px] font-semibold text-[var(--text-primary)] pointer-events-none z-10">
                  {fi.name}
                  <div className="mt-0.5"><ComingSoonBadge /></div>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Embedded Google Calendar iframe ── */}
      <div className="rounded-2xl overflow-hidden border border-[var(--border)] bg-[var(--surface)]" style={{ height: '64vh' }}>
        <iframe
          src={embedUrl!}
          style={{ width: '100%', height: '100%', border: 0 }}
          title="Google Kalender"
          allowFullScreen
        />
      </div>

      <p className="text-[10px] text-[var(--text-muted)] text-center">
        Bokningar skapade via Kollegan synkroniseras automatiskt · Kalendern måste vara offentlig för iframe-visning
      </p>
    </div>
  );
}

// ── Main export ──────────────────────────────────────────────────────────────

export default function BookingsCalendar({ rooms, onRoomClick }: Props) {
  const [subTab, setSubTab] = useState<SubTab>('timeline');

  const bookedCount = rooms.filter((r) => r.status === 'booked').length;

  return (
    <div className="space-y-5">
      {/* ── Top bar: sub-tabs + badge ── */}
      <div className="flex items-center gap-3 flex-wrap">
        <SegmentedControl
          options={[
            { key: 'list',     label: 'Listvy'   },
            { key: 'timeline', label: 'Tidslinje' },
            {
              key: 'google',
              label: (
                <>
                  <GoogleCalendarIcon size={14} />
                  Google Kalender
                </>
              ),
            },
          ]}
          value={subTab}
          onChange={(v) => setSubTab(v as SubTab)}
        />

        {subTab !== 'google' && bookedCount > 0 && (
          <span className="text-xs font-medium text-[var(--text-muted)] bg-[var(--surface-alt)] border border-[var(--border)] rounded-full px-2 py-0.5 tabular-nums">
            {bookedCount} {bookedCount === 1 ? 'bokning' : 'bokningar'}
          </span>
        )}
      </div>

      {/* ── Content ── */}
      {subTab === 'list' ? (
        <ListView rooms={rooms} onRoomClick={onRoomClick} />
      ) : subTab === 'timeline' ? (
        <TimelineView rooms={rooms} onRoomClick={onRoomClick} />
      ) : (
        <GoogleCalendarView />
      )}
    </div>
  );
}
