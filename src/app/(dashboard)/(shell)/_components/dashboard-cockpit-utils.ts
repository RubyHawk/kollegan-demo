import type { DashboardTone } from '@modules/generic/dashboard';

export const currencyFormatter = new Intl.NumberFormat('sv-SE', {
  style: 'currency',
  currency: 'SEK',
  maximumFractionDigits: 0,
});

export function fmtSEK(value: number): string {
  return currencyFormatter.format(value);
}

export function fmtCompactSEK(value: number): string {
  if (value >= 1_000_000) return `${Math.round(value / 100_000) / 10} mkr`;
  if (value >= 10_000) return `${Math.round(value / 1000)} tkr`;
  return fmtSEK(value);
}

export function fmtTime(iso: string | null): string {
  if (!iso) return '';
  return new Intl.DateTimeFormat('sv-SE', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Stockholm',
  }).format(new Date(iso));
}

export function fmtRelativeDate(iso: string): string {
  const value = new Date(iso);
  const now = new Date();
  const day = startOfLocalDay(value);
  const today = startOfLocalDay(now);
  const diffDays = Math.round((today.getTime() - day.getTime()) / 86400000);
  const time = fmtTime(iso);

  if (diffDays === 0) return `Idag ${time}`;
  if (diffDays === 1) return `Igår ${time}`;
  if (diffDays > 1 && diffDays < 7) return `${diffDays} dagar sedan`;
  return new Intl.DateTimeFormat('sv-SE', {
    day: 'numeric',
    month: 'short',
    timeZone: 'Europe/Stockholm',
  }).format(value);
}

function startOfLocalDay(date: Date): Date {
  const local = new Date(date.toLocaleString('en-US', { timeZone: 'Europe/Stockholm' }));
  local.setHours(0, 0, 0, 0);
  return local;
}

export function toneClasses(tone: DashboardTone): string {
  switch (tone) {
    case 'success':
      return 'bg-[var(--status-accepted-bg)] text-[var(--status-accepted-text)] border-[color-mix(in_srgb,var(--status-accepted-text)_24%,var(--border))]';
    case 'warning':
      return 'bg-[var(--status-warning-bg)] text-[var(--status-warning-text)] border-[color-mix(in_srgb,var(--status-warning-text)_24%,var(--border))]';
    case 'danger':
      return 'bg-[var(--status-danger-bg)] text-[var(--status-danger-text)] border-[color-mix(in_srgb,var(--status-danger-text)_24%,var(--border))]';
    case 'accent':
      return 'bg-[var(--accent-subtle)] text-[var(--accent)] border-[var(--accent-border)]';
    case 'info':
      return 'bg-[var(--status-viewed-bg)] text-[var(--status-viewed-text)] border-[color-mix(in_srgb,var(--status-viewed-text)_24%,var(--border))]';
    default:
      return 'bg-[var(--surface-2)] text-[var(--text-secondary)] border-[var(--border)]';
  }
}
