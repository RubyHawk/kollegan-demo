'use client';

import { useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@shared/ui/tooltip';
import { Button } from '@shared/ui/button';
import { Badge } from '@shared/ui/badge';
import { Room } from '@demos/hotel/domain/room.entity';
import { SPRING_STANDARD } from '@shared/lib/motion';

interface Props {
  rooms: Room[];
  onRoomClick?: (room: Room) => void;
}

type View = 'week' | 'month' | '2months';
type SubTab = 'list' | 'timeline' | 'google';

const VIEWS: { key: View; label: string }[] = [
  { key: 'week',    label: 'Vecka'  },
  { key: 'month',   label: 'Månad'  },
  { key: '2months', label: '2 mån'  },
];

// Fixed pixel dimensions — matching Google Calendar proportions
const LABEL_W = 180;
const ROW_H   = 52;
const HEAD1_H = 32;
const HEAD2_H = 42;

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

// ── Helpers ──────────────────────────────────────────────────────────────────

function toKey(d: Date) { return d.toISOString().split('T')[0]; }

function addDays(d: Date, n: number): Date {
  const r = new Date(d); r.setDate(r.getDate() + n); return r;
}

function diffDays(a: string, b: string): number {
  return Math.round(
    (new Date(b + 'T00:00:00').getTime() - new Date(a + 'T00:00:00').getTime()) / 86400000,
  );
}

function fmtShort(iso: string): string {
  return new Date(iso + 'T00:00:00').toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' });
}

function todayMidnight(): Date { const d = new Date(); d.setHours(0,0,0,0); return d; }

function startOfWeek(d: Date): Date {
  const r = new Date(d);
  const shift = (r.getDay() + 6) % 7;
  r.setDate(r.getDate() - shift);
  return r;
}

function startOfMonth(d: Date): Date { return new Date(d.getFullYear(), d.getMonth(), 1); }

function daysInMonth(d: Date): number { return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate(); }

function addMonths(d: Date, n: number): Date {
  const r = new Date(d); r.setMonth(r.getMonth() + n); return r;
}

// ── Real Google Calendar icon (accurate brand icon) ───────────────────────

function GoogleCalendarIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Google Kalender">
      {/* White base */}
      <rect width="64" height="64" rx="10" fill="#fff"/>
      {/* Red top bar */}
      <rect x="0" y="0" width="64" height="18" rx="10" fill="#EA4335"/>
      <rect x="0" y="10" width="64" height="8" fill="#EA4335"/>
      {/* Border */}
      <rect x="0.5" y="0.5" width="63" height="63" rx="9.5" stroke="#DADCE0" strokeWidth="1" fill="none"/>
      {/* Calendar lines */}
      <line x1="0" y1="18" x2="64" y2="18" stroke="#DADCE0" strokeWidth="1"/>
      <line x1="0" y1="34" x2="64" y2="34" stroke="#DADCE0" strokeWidth="0.75"/>
      <line x1="0" y1="50" x2="64" y2="50" stroke="#DADCE0" strokeWidth="0.75"/>
      <line x1="22" y1="18" x2="22" y2="64" stroke="#DADCE0" strokeWidth="0.75"/>
      <line x1="43" y1="18" x2="43" y2="64" stroke="#DADCE0" strokeWidth="0.75"/>
      {/* "31" number */}
      <text x="33" y="44" fontFamily="'Google Sans',Arial,sans-serif" fontSize="20" fontWeight="700" fill="#3C4043" textAnchor="middle">31</text>
      {/* Colored event dots */}
      <circle cx="11" cy="26" r="4" fill="#4285F4"/>
      <circle cx="32" cy="58" r="4" fill="#0F9D58"/>
      <circle cx="53" cy="26" r="4" fill="#F4B400"/>
    </svg>
  );
}

// ── CRM-style tab button ──────────────────────────────────────────────────

function TabBtn({ active, onClick, icon, label, count }: {
  active: boolean; onClick: () => void; icon?: React.ReactNode; label: string; count?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={[
        'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all',
        active
          ? 'bg-purple-700 dark:bg-amber-500 text-white shadow-sm'
          : 'text-[var(--text-secondary)] hover:bg-[var(--surface-alt)] border border-transparent hover:border-[var(--border)]',
      ].join(' ')}
    >
      {icon}
      {label}
      {count !== undefined && (
        <span className={[
          'rounded-full px-1.5 py-0.5 text-[9px] font-bold tabular-nums',
          active ? 'bg-white/25 text-white' : 'bg-[var(--surface-alt)] border border-[var(--border)] text-[var(--text-muted)]',
        ].join(' ')}>
          {count}
        </span>
      )}
    </button>
  );
}

// ── Segmented control (for timeline view/week/month) ──────────────────────

function SegmentedControl({
  options, value, onChange, size = 'md', layoutId = 'segmented-pill',
}: {
  options: { key: string; label: React.ReactNode }[];
  value: string;
  onChange: (v: string) => void;
  size?: 'sm' | 'md';
  layoutId?: string;
}) {
  const base = size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3.5 py-1.5 text-sm';
  return (
    <div className="relative flex bg-[var(--surface-alt)] border border-[var(--border)] rounded-xl p-0.5">
      {options.map((o) => (
        <button
          key={o.key}
          onClick={() => onChange(o.key)}
          className={[
            base,
            'relative font-medium rounded-[10px] flex items-center gap-1.5 transition-colors duration-150',
            value === o.key
              ? 'text-[var(--text-primary)]'
              : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]',
          ].join(' ')}
        >
          {value === o.key && (
            <motion.div
              layoutId={layoutId}
              className="absolute inset-0 bg-[var(--surface)] rounded-[10px] shadow-sm"
              transition={SPRING_STANDARD}
            />
          )}
          <span className="relative z-10">{o.label}</span>
        </button>
      ))}
    </div>
  );
}

// ── Empty state ────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-16 h-16 rounded-2xl bg-[var(--surface-alt)] border border-[var(--border)] flex items-center justify-center mb-5 float-animation">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--text-muted)]">
          <path d="M8 2v4M16 2v4"/><path d="M3 9h18"/><path d="M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2"/>
        </svg>
      </div>
      <p className="text-[var(--text-secondary)] font-semibold text-sm">Inga aktiva bokningar</p>
      <p className="text-[var(--text-muted)] text-xs mt-1.5 max-w-[260px] leading-relaxed">
        Klicka på ett tillgängligt rum för att skapa en bokning, eller ring Kollegan.
      </p>
    </div>
  );
}

// ── List view ──────────────────────────────────────────────────────────────

function ListView({ rooms, onRoomClick }: { rooms: Room[]; onRoomClick?: (r: Room) => void }) {
  const booked = useMemo(
    () => rooms.filter((r) => r.status === 'booked').sort((a, b) => a.id.localeCompare(b.id)),
    [rooms],
  );

  if (booked.length === 0) return <EmptyState />;

  return (
    <div className="space-y-2">
      <div className="hidden sm:grid grid-cols-[1fr_1.4fr_1fr_1fr_auto] gap-4 px-4 py-2 text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-widest">
        <span>Rum</span><span>Gäst</span><span>Incheckning</span><span>Utcheckning</span><span>Nätter</span>
      </div>

      {booked.map((room) => {
        const nights = room.checkIn && room.checkOut ? diffDays(room.checkIn, room.checkOut) : null;
        const badge  = TYPE_BADGE[room.type] || TYPE_BADGE.Enkel;
        const bar    = BAR_COLOR[room.type]  || BAR_COLOR.Enkel;

        return (
          <button
            key={room.id}
            onClick={() => onRoomClick?.(room)}
            className="w-full bg-[var(--surface)] border-2 border-[var(--border)] rounded-2xl px-4 py-3.5 text-left hover:shadow-card-hover hover:border-purple-200 dark:hover:border-amber-900/40 transition-all active:scale-[0.995] group shadow-card"
          >
            {/* Mobile */}
            <div className="flex items-start gap-3 sm:hidden">
              <div className={['w-2 self-stretch rounded-full shrink-0 mt-1', bar.bg].join(' ')} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-sm text-[var(--text-primary)]">Rum {room.id}</span>
                  <span className={['text-[10px] font-medium px-1.5 py-0.5 rounded-md', badge].join(' ')}>
                    {ROOM_LABEL[room.type]}
                  </span>
                </div>
                <p className="text-sm text-[var(--text-secondary)] mt-0.5 truncate">{room.guestName}</p>
                {room.checkIn && room.checkOut && (
                  <p className="text-xs text-[var(--text-muted)] mt-1">
                    {fmtShort(room.checkIn)} → {fmtShort(room.checkOut)}
                    {nights !== null && <> · {nights} {nights === 1 ? 'natt' : 'nätter'}</>}
                  </p>
                )}
              </div>
            </div>

            {/* Desktop */}
            <div className="hidden sm:grid grid-cols-[1fr_1.4fr_1fr_1fr_auto] gap-4 items-center">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className={['w-1.5 h-8 rounded-full shrink-0', bar.bg].join(' ')} />
                <div className="min-w-0">
                  <p className="font-semibold text-sm text-[var(--text-primary)] truncate">
                    {ROOM_LABEL[room.type]} {room.number}
                  </p>
                  <p className="text-[10px] text-[var(--text-muted)]">Våning {room.floor}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-full bg-[var(--surface-alt)] border border-[var(--border)] flex items-center justify-center shrink-0">
                  <span className="text-[10px] font-bold text-[var(--text-secondary)]">
                    {room.guestName?.charAt(0).toUpperCase() ?? '?'}
                  </span>
                </div>
                <span className="text-sm text-[var(--text-primary)] font-medium truncate">{room.guestName}</span>
              </div>
              <div>
                {room.checkIn ? (
                  <>
                    <p className="text-sm font-medium text-[var(--text-primary)]">{fmtShort(room.checkIn)}</p>
                    <p className="text-[10px] text-[var(--text-muted)]">
                      {new Date(room.checkIn + 'T00:00:00').toLocaleDateString('sv-SE', { weekday: 'long' })}
                    </p>
                  </>
                ) : <span className="text-xs text-[var(--text-muted)]">—</span>}
              </div>
              <div>
                {room.checkOut ? (
                  <>
                    <p className="text-sm font-medium text-[var(--text-primary)]">{fmtShort(room.checkOut)}</p>
                    <p className="text-[10px] text-[var(--text-muted)]">
                      {new Date(room.checkOut + 'T00:00:00').toLocaleDateString('sv-SE', { weekday: 'long' })}
                    </p>
                  </>
                ) : <span className="text-xs text-[var(--text-muted)]">—</span>}
              </div>
              <div className="flex items-center gap-3">
                {nights !== null ? (
                  <div className="text-right">
                    <span className="text-sm font-bold text-[var(--text-primary)] tabular-nums">{nights}</span>
                    <p className="text-[10px] text-[var(--text-muted)] leading-none mt-0.5">{nights === 1 ? 'natt' : 'nätter'}</p>
                  </div>
                ) : <span className="text-xs text-[var(--text-muted)]">—</span>}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  className="text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

// ── Timeline view (Google Calendar style) ─────────────────────────────────

function TimelineView({ rooms, onRoomClick }: { rooms: Room[]; onRoomClick?: (r: Room) => void }) {
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

const FUTURE_INTEGRATIONS = [
  {
    name: 'Outlook',
    desc: 'Microsoft 365',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="2" y="4" width="13" height="16" rx="1.5" fill="#0078d4"/>
        <rect x="9" y="7" width="13" height="13" rx="1.5" fill="#28a8e8"/>
        <rect x="9" y="7" width="13" height="7" rx="1.5" fill="#0078d4"/>
        <circle cx="15.5" cy="13.5" r="3.5" fill="#fff"/>
      </svg>
    ),
  },
  {
    name: 'Apple iCal',
    desc: 'CalDAV-synk',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="2" y="4" width="20" height="18" rx="3" fill="#fff" stroke="#d1d5db" strokeWidth="1"/>
        <rect x="2" y="4" width="20" height="6" rx="3" fill="#f3111b"/>
        <rect x="2" y="8" width="20" height="2" fill="#f3111b"/>
        <line x1="9" y1="13" x2="9" y2="19" stroke="#e5e7eb" strokeWidth="0.75"/>
        <line x1="15" y1="13" x2="15" y2="19" stroke="#e5e7eb" strokeWidth="0.75"/>
        <line x1="2" y1="16" x2="22" y2="16" stroke="#e5e7eb" strokeWidth="0.75"/>
        <rect x="10" y="12.5" width="4" height="3" rx="0.5" fill="#f3111b" opacity="0.9"/>
      </svg>
    ),
  },
  {
    name: 'Booking.com',
    desc: 'Kanalhantering',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="24" height="24" rx="4" fill="#003580"/>
        <rect x="7" y="6" width="2" height="12" rx="0.5" fill="#fff"/>
        <path d="M9 6h3a2.5 2.5 0 0 1 0 5H9V6z" fill="#fff"/>
        <path d="M9 11h3.5a2.5 2.5 0 0 1 0 5H9v-5z" fill="#fff"/>
        <circle cx="18" cy="17" r="1.5" fill="#ffcc00"/>
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
      .then((data) => { setConfigured(data.configured ?? false); setEmbedUrl(data.embedUrl ?? null); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3" style={{ minHeight: 480 }}>
        <div className="w-9 h-9 rounded-full border-2 border-[var(--border)] border-t-[#4285F4] animate-spin" />
        <p className="text-sm text-[var(--text-muted)]">Ansluter till Google Kalender…</p>
      </div>
    );
  }

  if (!configured) {
    return (
      <div className="space-y-4">
        <div className="bg-[var(--surface)] border-2 border-[var(--border)] rounded-2xl overflow-hidden shadow-card">
          <div className="px-6 py-5 border-b border-[var(--border)] bg-gradient-to-br from-[#4285F4]/5 to-transparent flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-sm flex items-center justify-center shrink-0">
              <GoogleCalendarIcon size={32} />
            </div>
            <div>
              <p className="text-base font-semibold text-[var(--text-primary)]">Anslut Google Kalender</p>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                Bokningar skapas och synkroniseras automatiskt i realtid via Kollegan AI.
              </p>
            </div>
          </div>

          <div className="px-6 py-5 space-y-4">
            {[
              { step: '1', title: 'Skapa ett Service Account', body: 'Gå till Google Cloud Console → IAM & Admin → Service Accounts. Skapa ett nytt konto och ladda ner JSON-nyckeln.' },
              { step: '2', title: 'Lägg till miljövariabler', body: null, code: ['GOOGLE_SERVICE_ACCOUNT_EMAIL=namn@projekt.iam.gserviceaccount.com', 'GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\n..."', 'GOOGLE_CALENDAR_ID=din-kalender@group.calendar.google.com'] },
              { step: '3', title: 'Dela kalendern med service account', body: 'Öppna Google Kalender → Inställningar för din kalender → Dela med specifika personer. Lägg till service account-e-posten med rollen "Göra ändringar i händelser".' },
            ].map((item) => (
              <div key={item.step} className="flex gap-3.5">
                <div className="w-6 h-6 rounded-full bg-[#4285F4] text-white flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5">
                  {item.step}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[var(--text-primary)]">{item.title}</p>
                  {item.body && <p className="text-xs text-[var(--text-muted)] mt-0.5 leading-relaxed">{item.body}</p>}
                  {item.code && (
                    <div className="mt-2 bg-[var(--surface-alt)] border border-[var(--border)] rounded-xl p-3 space-y-1">
                      {item.code.map((line) => (
                        <code key={line} className="block text-[10px] font-mono text-[var(--text-secondary)] break-all leading-relaxed">{line}</code>
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

        <div>
          <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-widest mb-2.5 px-0.5">
            Fler integrationer — kommer snart
          </p>
          <div className="grid grid-cols-3 sm:grid-cols-3 gap-2.5">
            {FUTURE_INTEGRATIONS.map((fi) => (
              <button
                key={fi.name}
                onMouseEnter={() => setHovered(fi.name)}
                onMouseLeave={() => setHovered(null)}
                className="relative bg-[var(--surface)] border-2 border-[var(--border)] rounded-2xl p-4 text-left transition-all hover:border-purple-200/60 dark:hover:border-amber-900/30 hover:shadow-card-hover shadow-card active:scale-[0.98] group"
              >
                <div className="flex items-start justify-between mb-2.5">
                  <div className="w-9 h-9 rounded-xl bg-[var(--surface-alt)] border border-[var(--border)] flex items-center justify-center">{fi.icon}</div>
                  <ComingSoonBadge />
                </div>
                <p className="text-xs font-semibold text-[var(--text-primary)] leading-tight">{fi.name}</p>
                <p className="text-[10px] text-[var(--text-muted)] mt-0.5">{fi.desc}</p>
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
      {/* Integration header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2.5">
          <GoogleCalendarIcon size={24} />
          <div>
            <p className="text-sm font-semibold text-[var(--text-primary)] leading-tight">Google Kalender</p>
            <p className="text-[10px] text-[var(--text-muted)] leading-tight">Live-synkad · realtidsbokningar</p>
          </div>
          <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 rounded-full px-2 py-0.5 ml-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Ansluten
          </span>
        </div>

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

      {/* Embedded Google Calendar — full viewport height, responsive like real Google Calendar */}
      <div
        className="rounded-2xl overflow-hidden border-2 border-[var(--border)] bg-[var(--surface)] shadow-card"
        style={{ height: 'calc(100vh - 300px)', minHeight: 520 }}
      >
        <iframe
          src={embedUrl!}
          style={{ width: '100%', height: '100%', border: 0, display: 'block' }}
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

// ── Main export ───────────────────────────────────────────────────────────

export default function CalendarTab({ rooms, onRoomClick }: Props) {
  const [subTab, setSubTab] = useState<SubTab>('timeline');

  const bookedCount = rooms.filter((r) => r.status === 'booked').length;

  return (
    <div>
      {/* CRM-style page header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="font-heading text-xl font-semibold text-[var(--text-primary)]">Bokningskalender</h2>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">Rumsbeläggning, tidslinje och Google Kalender-integration</p>
        </div>
        <span className="text-xs font-medium text-purple-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40 rounded-full px-3 py-1.5">
          {bookedCount} {bookedCount === 1 ? 'bokning' : 'bokningar'}
        </span>
      </div>

      {/* CRM-style sub-tab switcher */}
      <div className="flex items-center gap-1.5 mb-5 p-1 bg-[var(--surface-alt)] border-2 border-[var(--border)] rounded-xl w-fit shadow-card">
        <TabBtn
          active={subTab === 'list'}
          onClick={() => setSubTab('list')}
          count={bookedCount}
          label="Listvy"
          icon={
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
              <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
            </svg>
          }
        />
        <TabBtn
          active={subTab === 'timeline'}
          onClick={() => setSubTab('timeline')}
          label="Tidslinje"
          icon={
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
          }
        />
        <TabBtn
          active={subTab === 'google'}
          onClick={() => setSubTab('google')}
          label="Google Kalender"
          icon={<GoogleCalendarIcon size={14} />}
        />
      </div>

      {/* Tab content */}
      <div className="tab-content-enter">
        {subTab === 'list'     && <ListView     rooms={rooms} onRoomClick={onRoomClick} />}
        {subTab === 'timeline' && <TimelineView rooms={rooms} onRoomClick={onRoomClick} />}
        {subTab === 'google'   && <GoogleCalendarView />}
      </div>
    </div>
  );
}
