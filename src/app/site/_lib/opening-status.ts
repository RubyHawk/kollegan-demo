import type { PublicRestaurantSite } from '@modules/supporting/restaurant-menu';

// Pure helpers for deriving "is Fluffy's open right now?" from portal opening hours.
// All wall-clock reasoning happens in Europe/Stockholm regardless of the visitor's timezone,
// so a phone set to another country still shows the restaurant's real status.

export type OpeningHour = PublicRestaurantSite['openingHours'][number];

const TZ = 'Europe/Stockholm';
const MINUTES_PER_DAY = 24 * 60;

export const DAY_LABELS: Record<number, string> = {
  1: 'Måndag',
  2: 'Tisdag',
  3: 'Onsdag',
  4: 'Torsdag',
  5: 'Fredag',
  6: 'Lördag',
  7: 'Söndag',
};

const WEEKDAY_INDEX: Record<string, number> = {
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
  Sun: 7,
};

export type StockholmNow = {
  /** 1 = Monday … 7 = Sunday */
  dayOfWeek: number;
  /** minutes since local midnight */
  minutes: number;
  /** e.g. "fredag 19 juni" */
  dateText: string;
};

export function stockholmNow(now: Date = new Date()): StockholmNow {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TZ,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
  const dayOfWeek = WEEKDAY_INDEX[get('weekday')] ?? 1;
  const hour = Number.parseInt(get('hour'), 10);
  const minute = Number.parseInt(get('minute'), 10);
  const dateText = new Intl.DateTimeFormat('sv-SE', {
    timeZone: TZ,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(now);
  return {
    dayOfWeek,
    minutes: (Number.isFinite(hour) ? hour : 0) * 60 + (Number.isFinite(minute) ? minute : 0),
    dateText,
  };
}

export function parseHHMM(value: string | null | undefined): number | null {
  if (!value) return null;
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  return hours * 60 + minutes;
}

export function formatTime(minutes: number): string {
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function formatDuration(totalMinutes: number): string {
  const min = Math.max(0, Math.round(totalMinutes));
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} tim`;
  return `${h} tim ${m} min`;
}

/** A normalized opening window for a given weekday, or null when closed/unknown. */
function windowFor(hour: OpeningHour | undefined): { open: number; close: number } | null {
  if (!hour || hour.isClosed) return null;
  const open = parseHHMM(hour.opensAt);
  const close = parseHHMM(hour.closesAt);
  if (open == null || close == null) return null;
  // Overnight windows (e.g. 18:00–02:00) are stored with close <= open; push close past midnight.
  const normalizedClose = close <= open ? close + MINUTES_PER_DAY : close;
  return { open, close: normalizedClose };
}

export type OpeningStatus = {
  hasHours: boolean;
  isOpen: boolean;
  /** today's raw record (for rendering today's hours / closed label) */
  today: OpeningHour | null;
  /** "22:00" when currently open */
  closesAtText: string | null;
  /** minutes left until close, when open */
  minutesUntilClose: number | null;
  /** 0..1 position within today's open window, when open */
  progress: number | null;
  /** about to close within the next hour */
  closingSoon: boolean;
  /** next opening: same day (later today) or a future weekday */
  nextOpenDayOfWeek: number | null;
  nextOpenAtText: string | null;
  /** minutes until the next opening, when known */
  minutesUntilOpen: number | null;
};

const CLOSED: Omit<OpeningStatus, 'hasHours' | 'today'> = {
  isOpen: false,
  closesAtText: null,
  minutesUntilClose: null,
  progress: null,
  closingSoon: false,
  nextOpenDayOfWeek: null,
  nextOpenAtText: null,
  minutesUntilOpen: null,
};

export function getOpeningStatus(hours: OpeningHour[], now: Date = new Date()): OpeningStatus {
  const byDay = new Map<number, OpeningHour>();
  for (const hour of hours) byDay.set(hour.dayOfWeek, hour);

  const { dayOfWeek, minutes } = stockholmNow(now);
  const today = byDay.get(dayOfWeek) ?? null;
  const base = { hasHours: hours.length > 0, today };

  if (hours.length === 0) return { ...base, ...CLOSED };

  // 1) Currently inside today's window?
  const todayWindow = windowFor(today ?? undefined);
  if (todayWindow && minutes >= todayWindow.open && minutes < todayWindow.close) {
    return {
      ...base,
      ...CLOSED,
      isOpen: true,
      closesAtText: formatTime(todayWindow.close),
      minutesUntilClose: todayWindow.close - minutes,
      progress: clamp01((minutes - todayWindow.open) / (todayWindow.close - todayWindow.open)),
      closingSoon: todayWindow.close - minutes <= 60,
    };
  }

  // 2) Still inside yesterday's overnight window that spilled past midnight?
  const yesterdayDow = ((dayOfWeek + 5) % 7) + 1; // 1..7, day before
  const yWindow = windowFor(byDay.get(yesterdayDow));
  if (yWindow && yWindow.close > MINUTES_PER_DAY) {
    const spill = yWindow.close - MINUTES_PER_DAY; // minutes into today
    if (minutes < spill) {
      return {
        ...base,
        ...CLOSED,
        isOpen: true,
        closesAtText: formatTime(spill),
        minutesUntilClose: spill - minutes,
        progress: null,
        closingSoon: spill - minutes <= 60,
      };
    }
  }

  // 3) Closed now — opens later today?
  if (todayWindow && minutes < todayWindow.open) {
    return {
      ...base,
      ...CLOSED,
      nextOpenDayOfWeek: dayOfWeek,
      nextOpenAtText: formatTime(todayWindow.open),
      minutesUntilOpen: todayWindow.open - minutes,
    };
  }

  // 4) Otherwise scan the next 7 days for the first opening.
  for (let offset = 1; offset <= 7; offset += 1) {
    const dow = ((dayOfWeek - 1 + offset) % 7) + 1;
    const w = windowFor(byDay.get(dow));
    if (w) {
      return {
        ...base,
        ...CLOSED,
        nextOpenDayOfWeek: dow,
        nextOpenAtText: formatTime(w.open),
        minutesUntilOpen: offset * MINUTES_PER_DAY - minutes + w.open,
      };
    }
  }

  return { ...base, ...CLOSED };
}

function clamp01(value: number): number {
  if (Number.isNaN(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

/** Normalize stray non-Swedish "closed" labels coming from portal data. */
export function closedLabel(raw: string | null | undefined): string {
  const text = (raw ?? '').trim();
  if (!text) return 'Stängt';
  if (/^closed$/i.test(text) || /^stängt$/i.test(text) || /^stangt$/i.test(text)) return 'Stängt';
  return text;
}

/** "idag" / "imorgon" / weekday name for a target weekday relative to today. */
export function relativeDayWord(targetDow: number, todayDow: number, dayLabels: Record<number, string>): string {
  if (targetDow === todayDow) return 'idag';
  if (targetDow === (todayDow % 7) + 1) return 'imorgon';
  return (dayLabels[targetDow] ?? '').toLowerCase();
}
