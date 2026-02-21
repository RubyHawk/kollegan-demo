'use client';

import { useMemo, useState } from 'react';
import { Tooltip, Button, Chip } from '@heroui/react';
import { Room } from '@/lib/types';

interface Props {
  rooms: Room[];
  onRoomClick?: (room: Room) => void;
}

type View = 'week' | 'month' | '2months';
type SubTab = 'list' | 'timeline';

const VIEWS: { key: View; label: string; days: number; step: number }[] = [
  { key: 'week',    label: 'Vecka', days: 7,  step: 7  },
  { key: 'month',   label: 'Månad', days: 31, step: 14 },
  { key: '2months', label: '2 mån', days: 62, step: 30 },
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
  options: { key: string; label: string }[];
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
            'font-medium rounded-[10px] transition-all',
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
  const [offsetDays, setOffsetDays] = useState(0);

  const view = VIEWS.find((v) => v.key === viewKey)!;
  const today = useMemo(todayMidnight, []);
  const todayKey = toKey(today);

  const startDate = useMemo(() => addDays(today, offsetDays), [today, offsetDays]);
  const startKey  = toKey(startDate);

  const dates = useMemo(
    () => Array.from({ length: view.days }, (_, i) => addDays(startDate, i)),
    [startDate, view.days],
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

  // Period label for the nav bar
  const periodLabel = useMemo(() => {
    const end = addDays(startDate, view.days - 1);
    const sm  = startDate.toLocaleDateString('sv-SE', { month: 'short', year: 'numeric' });
    const em  = end.toLocaleDateString('sv-SE',       { month: 'short', year: 'numeric' });
    const cap = (s: string) => s[0].toUpperCase() + s.slice(1);
    return sm === em ? cap(sm) : `${cap(sm)} – ${cap(em)}`;
  }, [startDate, view.days]);

  function getBar(room: Room) {
    if (room.status !== 'booked' || !room.checkIn || !room.checkOut) return null;
    const s  = diffDays(startKey, room.checkIn);
    const e  = diffDays(startKey, room.checkOut);
    const cs = Math.max(0, s);
    const ce = Math.min(view.days, e);
    return ce - cs > 0 ? { col: cs, span: ce - cs } : null;
  }

  return (
    <div className="space-y-3">
      {/* ── Toolbar row ── */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Prev / period / next */}
        <div className="flex items-center gap-1.5">
          <Button
            isIconOnly
            size="sm"
            variant="bordered"
            onPress={() => setOffsetDays((o) => o - view.step)}
            aria-label="Föregående period"
            className="border-[var(--border)] text-[var(--text-secondary)] bg-transparent"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </Button>

          <span className="text-sm font-semibold text-[var(--text-primary)] min-w-[140px] text-center select-none">
            {periodLabel}
          </span>

          <Button
            isIconOnly
            size="sm"
            variant="bordered"
            onPress={() => setOffsetDays((o) => o + view.step)}
            aria-label="Nästa period"
            className="border-[var(--border)] text-[var(--text-secondary)] bg-transparent"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </Button>

          {offsetDays !== 0 && (
            <Button
              size="sm"
              variant="light"
              color="warning"
              onPress={() => setOffsetDays(0)}
              className="text-xs font-medium ml-1 min-w-0 h-7 px-2"
            >
              Idag
            </Button>
          )}
        </div>

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
                      {view.days <= 31 && (
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
                      <Tooltip
                        content="Idag"
                        placement="bottom"
                        delay={400}
                        closeDelay={0}
                        isDisabled={!isToday}
                        size="sm"
                      >
                        <div
                          className={[
                            'flex items-center justify-center rounded-full font-bold leading-none',
                            view.days > 31
                              ? 'text-[9px] w-5 h-5 mt-0'
                              : 'text-[11px] w-6 h-6 mt-0.5',
                            isToday
                              ? 'bg-amber-500 text-white cursor-default'
                              : 'text-[var(--text-secondary)]',
                          ].join(' ')}
                        >
                          {d.getDate()}
                        </div>
                      </Tooltip>
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
                      <Chip
                        size="sm"
                        variant="flat"
                        color={room.type === 'Svit' ? 'warning' : 'default'}
                        classNames={{
                          base: 'h-[18px] mt-0.5',
                          content: 'text-[9px] font-semibold px-1.5 py-0',
                        }}
                      >
                        Vån {room.floor}
                      </Chip>
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
                      <Tooltip
                        showArrow
                        placement="top"
                        delay={200}
                        closeDelay={0}
                        content={
                          <div className="px-1 py-1 min-w-[160px]">
                            <p className="font-semibold text-sm">{room.guestName}</p>
                            <p className="text-tiny text-default-400 mb-2">
                              {ROOM_LABEL[room.type]} · Rum {room.number} · Vån {room.floor}
                            </p>
                            <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-tiny">
                              <span className="text-default-400">Incheckning</span>
                              <span className="font-medium">{room.checkIn ? fmtShort(room.checkIn) : '–'}</span>
                              <span className="text-default-400">Utcheckning</span>
                              <span className="font-medium">{room.checkOut ? fmtShort(room.checkOut) : '–'}</span>
                              <span className="text-default-400">Nätter</span>
                              <span className="font-medium">{nights}</span>
                            </div>
                          </div>
                        }
                      >
                        <button
                          onClick={() => onRoomClick?.(room)}
                          className={[
                            'absolute top-3 bottom-3 flex items-center px-2.5 rounded-lg shadow-sm',
                            'transition-all hover:brightness-105 hover:shadow-md active:scale-[0.99]',
                            colors.bg,
                          ].join(' ')}
                          style={{
                            left:  `calc(${(bar.col / view.days) * 100}% + 2px)`,
                            width: `calc(${(bar.span / view.days) * 100}% - 4px)`,
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
                      </Tooltip>
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
            { key: 'list',     label: 'Listvy'    },
            { key: 'timeline', label: 'Tidslinje' },
          ]}
          value={subTab}
          onChange={(v) => setSubTab(v as SubTab)}
        />

        {bookedCount > 0 && (
          <span className="text-xs font-medium text-[var(--text-muted)] bg-[var(--surface-alt)] border border-[var(--border)] rounded-full px-2 py-0.5 tabular-nums">
            {bookedCount} {bookedCount === 1 ? 'bokning' : 'bokningar'}
          </span>
        )}
      </div>

      {/* ── Content ── */}
      {subTab === 'list' ? (
        <ListView rooms={rooms} onRoomClick={onRoomClick} />
      ) : (
        <TimelineView rooms={rooms} onRoomClick={onRoomClick} />
      )}
    </div>
  );
}
