'use client';

import { useMemo, useState } from 'react';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@shared/ui/tooltip';
import { Button } from '@shared/ui/button';
import { Badge } from '@shared/ui/badge';
import type { Room } from '@demos/hotel/domain/room.entity';
import {
  BAR_COLOR,
  HEAD1_H,
  HEAD2_H,
  LABEL_W,
  ROOM_LABEL,
  ROW_H,
  SegmentedControl,
  VIEWS,
  addDays,
  addMonths,
  daysInMonth,
  diffDays,
  fmtShort,
  startOfMonth,
  startOfWeek,
  todayMidnight,
  toKey,
  type View,
} from './calendar-tab-shared';

export function TimelineView({ rooms, onRoomClick }: { rooms: Room[]; onRoomClick?: (r: Room) => void }) {
  const [viewKey, setViewKey] = useState<View>('month');
  const [baseDate, setBaseDate] = useState(() => todayMidnight());

  const today    = useMemo(() => todayMidnight(), []);
  const todayKey = toKey(today);

  const { startDate, totalDays } = useMemo(() => {
    switch (viewKey) {
      case 'week':    { const s = startOfWeek(baseDate);  return { startDate: s, totalDays: 7 }; }
      case 'month':   { const s = startOfMonth(baseDate); return { startDate: s, totalDays: daysInMonth(s) }; }
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

  const periodLabel = useMemo(() => {
    const cap = (s: string) => s[0].toUpperCase() + s.slice(1);
    if (viewKey === 'month') return cap(startDate.toLocaleDateString('sv-SE', { month: 'long', year: 'numeric' }));
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
    const end = addDays(startDate, totalDays - 1);
    const sm  = cap(startDate.toLocaleDateString('sv-SE', { month: 'long' }));
    const em  = cap(end.toLocaleDateString('sv-SE', { month: 'long', year: 'numeric' }));
    return `${sm} – ${em}`;
  }, [viewKey, startDate, totalDays]);

  const isShowingToday = useMemo(() => {
    const t = today.getTime();
    return t >= startDate.getTime() && t < addDays(startDate, totalDays).getTime();
  }, [today, startDate, totalDays]);

  function navigate(direction: -1 | 1) {
    setBaseDate((d) => {
      switch (viewKey) {
        case 'week':    return addDays(d, 7 * direction);
        case 'month':   return addMonths(d, direction);
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
      {/* Toolbar — Google Calendar layout */}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="sm" variant="outline"
          onClick={() => setBaseDate(todayMidnight())}
          disabled={isShowingToday}
          className="h-8 px-3 text-sm font-medium border-[var(--border)] text-[var(--text-primary)] bg-[var(--surface)] hover:bg-[var(--surface-alt)] disabled:opacity-40"
        >
          Idag
        </Button>

        <div className="flex items-center gap-0.5">
          <Button size="icon" variant="ghost" onClick={() => navigate(-1)} aria-label="Föregående period" className="h-8 w-8 text-[var(--accent)]">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          </Button>
          <Button size="icon" variant="ghost" onClick={() => navigate(1)} aria-label="Nästa period" className="h-8 w-8 text-[var(--accent)]">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
          </Button>
        </div>

        <span className="text-lg font-semibold text-[var(--text-primary)] select-none">{periodLabel}</span>

        <div className="ml-auto">
          <SegmentedControl
            options={VIEWS.map((v) => ({ key: v.key, label: v.label }))}
            value={viewKey}
            onChange={(k) => setViewKey(k as View)}
            size="sm"
            layoutId="timeline-view-pill"
          />
        </div>
      </div>

      {/* Calendar grid — scrolls horizontally, fills height like Google Calendar */}
      <div
        className="overflow-x-auto overscroll-x-contain rounded-2xl"
        style={{ height: 'calc(100vh - 340px)', minHeight: 400 }}
      >
        <div
          className="bg-[var(--surface)] border-2 border-[var(--border)] rounded-2xl overflow-hidden h-full flex flex-col"
          style={{ minWidth: `${LABEL_W + totalDays * 28}px` }}
        >
          {/* Row 1: Month groups */}
          <div className="flex border-b border-[var(--border)] bg-[var(--surface-alt)] shrink-0" style={{ height: HEAD1_H }}>
            <div className="shrink-0 border-r border-[var(--border)] flex items-center px-4" style={{ width: LABEL_W }}>
              <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Rum</span>
            </div>
            <div className="flex flex-1 min-w-0">
              {monthGroups.map((mg, i) => (
                <div key={i} className="border-r border-[var(--border-light)] last:border-r-0 flex items-center px-3 min-w-0" style={{ flex: mg.span }}>
                  <span className="text-[11px] font-semibold text-[var(--text-secondary)] capitalize truncate">{mg.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Row 2: Day numbers */}
          <div className="flex border-b border-[var(--border)] shrink-0" style={{ height: HEAD2_H }}>
            <div className="shrink-0 border-r border-[var(--border)] bg-[var(--surface-alt)]" style={{ width: LABEL_W }} />
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
                      isToday ? 'bg-amber-50 dark:bg-amber-900/20' : isWeekend ? 'bg-[var(--surface-alt)]/60' : 'bg-[var(--surface)]',
                    ].join(' ')}
                  >
                    {totalDays <= 31 && (
                      <span className={['text-[9px] font-semibold uppercase leading-none', isToday ? 'text-amber-600 dark:text-amber-400' : 'text-[var(--text-muted)]'].join(' ')}>
                        {d.toLocaleDateString('sv-SE', { weekday: 'narrow' })}
                      </span>
                    )}
                    {isToday ? (
                      <TooltipProvider delayDuration={400}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className={['flex items-center justify-center rounded-full font-bold leading-none', totalDays > 31 ? 'text-[9px] w-5 h-5 mt-0' : 'text-[11px] w-6 h-6 mt-0.5', 'bg-amber-500 text-white cursor-default'].join(' ')}>
                              {d.getDate()}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="bottom">Idag</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ) : (
                      <div className={['flex items-center justify-center rounded-full font-bold leading-none', totalDays > 31 ? 'text-[9px] w-5 h-5 mt-0' : 'text-[11px] w-6 h-6 mt-0.5', 'text-[var(--text-secondary)]'].join(' ')}>
                        {d.getDate()}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Room rows — flex-1 so they expand to fill height */}
          <div className="flex-1 overflow-y-auto">
            {sortedRooms.map((room, idx) => {
              const bar    = getBar(room);
              const colors = BAR_COLOR[room.type] || BAR_COLOR.Enkel;
              const nights = room.checkIn && room.checkOut ? diffDays(room.checkIn, room.checkOut) : 0;

              return (
                <div
                  key={room.id}
                  className={['flex relative', idx < sortedRooms.length - 1 ? 'border-b border-[var(--border-light)]' : ''].join(' ')}
                  style={{ height: ROW_H }}
                >
                  <div className="shrink-0 border-r border-[var(--border)] bg-[var(--surface-alt)] flex items-center gap-2.5 px-4" style={{ width: LABEL_W }}>
                    <div className={['w-2 h-8 rounded-full shrink-0', colors.bg].join(' ')} />
                    <div className="min-w-0">
                      <p className="text-[12px] font-semibold text-[var(--text-primary)] leading-tight truncate">
                        {ROOM_LABEL[room.type]} {room.number}
                      </p>
                      <Badge variant={room.type === 'Svit' ? 'warning' : 'secondary'} className="h-[18px] mt-0.5 text-[9px] font-semibold px-1.5 py-0 rounded-md">
                        Vån {room.floor}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex-1 relative flex">
                    {dates.map((d) => {
                      const k         = toKey(d);
                      const isToday   = k === todayKey;
                      const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                      return (
                        <div
                          key={k}
                          className={['flex-1 border-r border-[var(--border-light)] last:border-r-0', isToday ? 'bg-amber-50/60 dark:bg-amber-900/10' : isWeekend ? 'bg-[var(--surface-alt)]/30' : ''].join(' ')}
                        />
                      );
                    })}

                    {bar && (
                      <TooltipProvider delayDuration={200}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              onClick={() => onRoomClick?.(room)}
                              className={['absolute top-3 bottom-3 flex items-center px-2.5 rounded-lg shadow-sm transition-all hover:brightness-105 hover:shadow-md active:scale-[0.99]', colors.bg].join(' ')}
                              style={{
                                left:  `calc(${(bar.col / totalDays) * 100}% + 2px)`,
                                width: `calc(${(bar.span / totalDays) * 100}% - 4px)`,
                              }}
                            >
                              <span className={['text-[11px] font-semibold truncate leading-none', colors.text].join(' ')}>{room.guestName}</span>
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="px-3 py-2">
                            <div className="min-w-[160px]">
                              <p className="font-semibold text-sm">{room.guestName}</p>
                              <p className="text-xs text-[var(--text-muted)] mb-2">{ROOM_LABEL[room.type]} · Rum {room.number} · Vån {room.floor}</p>
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
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-4 px-4 py-3 border-t border-[var(--border-light)] bg-[var(--surface-alt)] shrink-0">
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
    </div>
  );
}

// ── Google Calendar iframe view ───────────────────────────────────────────
