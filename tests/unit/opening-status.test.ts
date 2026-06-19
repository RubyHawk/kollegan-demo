import { describe, expect, it } from 'vitest';
import { closedLabel, formatDuration, getOpeningStatus, parseHHMM, type OpeningHour } from '@/app/site/_lib/opening-status';

function hour(dayOfWeek: number, opensAt: string | null, closesAt: string | null, isClosed = false, label: string | null = null): OpeningHour {
  return { id: `oh-${dayOfWeek}`, dayOfWeek, opensAt, closesAt, isClosed, label } as OpeningHour;
}

// Mon closed; Tue–Thu 11–22; Fri 11–23; Sat 12–23; Sun 12–21.
const WEEK: OpeningHour[] = [
  hour(1, null, null, true, 'Closed'),
  hour(2, '11:00', '22:00'),
  hour(3, '11:00', '22:00'),
  hour(4, '11:00', '22:00'),
  hour(5, '11:00', '23:00'),
  hour(6, '12:00', '23:00'),
  hour(7, '12:00', '21:00'),
];

describe('getOpeningStatus', () => {
  it('is open inside today’s window (Fri 14:00)', () => {
    const s = getOpeningStatus(WEEK, new Date('2026-06-19T12:00:00Z'));
    expect(s.isOpen).toBe(true);
    expect(s.closesAtText).toBe('23:00');
    expect(s.minutesUntilClose).toBe(9 * 60);
    expect(s.progress).toBeGreaterThan(0);
    expect(s.progress).toBeLessThan(1);
    expect(s.closingSoon).toBe(false);
  });

  it('flags closing soon within the last hour (Fri 22:30)', () => {
    const s = getOpeningStatus(WEEK, new Date('2026-06-19T20:30:00Z'));
    expect(s.isOpen).toBe(true);
    expect(s.minutesUntilClose).toBe(30);
    expect(s.closingSoon).toBe(true);
  });

  it('is closed before opening and points to later today (Fri 09:00)', () => {
    const s = getOpeningStatus(WEEK, new Date('2026-06-19T07:00:00Z'));
    expect(s.isOpen).toBe(false);
    expect(s.nextOpenDayOfWeek).toBe(5);
    expect(s.nextOpenAtText).toBe('11:00');
    expect(s.minutesUntilOpen).toBe(2 * 60);
  });

  it('finds the next open day after close (Fri 23:30 → Sat 12:00)', () => {
    const s = getOpeningStatus(WEEK, new Date('2026-06-19T21:30:00Z'));
    expect(s.isOpen).toBe(false);
    expect(s.nextOpenDayOfWeek).toBe(6);
    expect(s.nextOpenAtText).toBe('12:00');
  });

  it('skips a closed weekday (Mon → Tue)', () => {
    const s = getOpeningStatus(WEEK, new Date('2026-06-15T12:00:00Z'));
    expect(s.isOpen).toBe(false);
    expect(s.today?.isClosed).toBe(true);
    expect(s.nextOpenDayOfWeek).toBe(2);
    expect(s.nextOpenAtText).toBe('11:00');
  });

  it('stays open through an overnight window (Fri 18:00–02:00, now Sat 00:30)', () => {
    const overnight: OpeningHour[] = [hour(5, '18:00', '02:00'), hour(6, '18:00', '02:00')];
    const s = getOpeningStatus(overnight, new Date('2026-06-19T22:30:00Z')); // Sat 00:30 Stockholm
    expect(s.isOpen).toBe(true);
    expect(s.closesAtText).toBe('02:00');
    expect(s.minutesUntilClose).toBe(90);
  });

  it('reports no hours gracefully', () => {
    const s = getOpeningStatus([], new Date('2026-06-19T12:00:00Z'));
    expect(s.hasHours).toBe(false);
    expect(s.isOpen).toBe(false);
    expect(s.nextOpenDayOfWeek).toBeNull();
  });
});

describe('helpers', () => {
  it('normalizes closed labels to Swedish', () => {
    expect(closedLabel('Closed')).toBe('Stängt');
    expect(closedLabel(null)).toBe('Stängt');
    expect(closedLabel('  stängt ')).toBe('Stängt');
    expect(closedLabel('Helgdag')).toBe('Helgdag');
  });

  it('parses HH:MM and formats durations', () => {
    expect(parseHHMM('11:00')).toBe(660);
    expect(parseHHMM('9:5')).toBeNull();
    expect(parseHHMM(null)).toBeNull();
    expect(formatDuration(540)).toBe('9 tim');
    expect(formatDuration(30)).toBe('30 min');
    expect(formatDuration(95)).toBe('1 tim 35 min');
  });
});
