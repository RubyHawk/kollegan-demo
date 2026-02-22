/** Format timestamp to HH:MM:SS (sv-SE) */
export function fmtTime(ts: string | Date): string {
  return new Date(ts).toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

/** Format timestamp to HH:MM (sv-SE) */
export function fmtShortTime(ts: string | Date): string {
  return new Date(ts).toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' });
}

/** Format timestamp to "D Mon" (sv-SE) */
export function fmtDate(ts: string | Date): string {
  return new Date(ts).toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' });
}

/** Format timestamp to "D Mon YYYY" (sv-SE) */
export function fmtFullDate(ts: string | Date): string {
  return new Date(ts).toLocaleDateString('sv-SE', { day: 'numeric', month: 'short', year: 'numeric' });
}

/** Format seconds into human-readable duration (e.g. "2m 30s") */
export function fmtDurationSecs(secs: number): string {
  if (secs < 60) return `${secs}s`;
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

/** Format the duration between two dates */
export function fmtDurationRange(start: Date, end: Date): string {
  const secs = Math.round((end.getTime() - start.getTime()) / 1000);
  return fmtDurationSecs(secs);
}
