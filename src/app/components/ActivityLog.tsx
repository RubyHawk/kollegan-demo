'use client';

import { ActivityEvent } from '@/lib/types';
import { ReactNode } from 'react';

interface Props {
  activities: ActivityEvent[];
}

const EVENT_ICONS: Record<ActivityEvent['type'], ReactNode> = {
  call_started: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  ),
  call_ended: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  ),
  rooms_queried: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  room_locked: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  ),
  room_confirmed: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  ),
  room_cancelled: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  ),
  info: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  ),
};

// Icon bg + color
const EVENT_COLORS: Record<ActivityEvent['type'], string> = {
  call_started: 'text-blue-500 bg-blue-50 dark:bg-blue-900/30',
  call_ended: 'text-stone-500 dark:text-slate-400 bg-stone-100 dark:bg-slate-700/30',
  rooms_queried: 'text-violet-500 bg-violet-50 dark:bg-violet-900/30',
  room_locked: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30',
  room_confirmed: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30',
  room_cancelled: 'text-red-500 bg-red-50 dark:bg-red-900/30',
  info: 'text-stone-500 dark:text-slate-400 bg-stone-100 dark:bg-slate-700/30',
};

// Left accent border color
const EVENT_BORDER: Record<ActivityEvent['type'], string> = {
  call_started: 'border-l-blue-400',
  call_ended: 'border-l-stone-300 dark:border-l-slate-600',
  rooms_queried: 'border-l-violet-400',
  room_locked: 'border-l-amber-400',
  room_confirmed: 'border-l-emerald-400',
  room_cancelled: 'border-l-red-400',
  info: 'border-l-stone-300 dark:border-l-slate-600',
};

// Message text color
const EVENT_TEXT_COLORS: Record<ActivityEvent['type'], string> = {
  call_started: 'text-blue-700 dark:text-blue-300',
  call_ended: 'text-[var(--text-secondary)]',
  rooms_queried: 'text-violet-700 dark:text-violet-300',
  room_locked: 'text-amber-700 dark:text-amber-300',
  room_confirmed: 'text-emerald-700 dark:text-emerald-300',
  room_cancelled: 'text-red-700 dark:text-red-300',
  info: 'text-[var(--text-secondary)]',
};

export default function ActivityLog({ activities }: Props) {
  if (activities.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="w-16 h-16 rounded-2xl bg-[var(--surface-alt)] flex items-center justify-center mx-auto mb-4 float-animation">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--text-muted)]">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        </div>
        <p className="text-[var(--text-secondary)] font-medium">Inga aktiviteter än</p>
        <p className="text-[var(--text-muted)] text-sm mt-1.5 max-w-xs mx-auto">
          Ring Kollegan eller boka ett rum manuellt för att se aktiviteten loggas här i realtid.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Feed header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-widest">Live-flöde</span>
        <span className="ml-auto text-xs text-[var(--text-muted)] tabular-nums">{activities.length} händelser</span>
      </div>

      {/* Event list */}
      <div className="space-y-2">
        {activities.map((event, index) => (
          <div
            key={event.id}
            className={[
              'flex gap-3 items-start bg-[var(--surface)] rounded-xl',
              'border border-[var(--border)] border-l-[3px]',
              'px-4 py-3 transition-colors hover:bg-[var(--surface-alt)] slide-in-left',
              EVENT_BORDER[event.type],
            ].join(' ')}
            style={{ animationDelay: `${Math.min(index * 40, 400)}ms` }}
          >
            <div
              className={[
                'w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5',
                EVENT_COLORS[event.type],
              ].join(' ')}
            >
              {EVENT_ICONS[event.type] ?? EVENT_ICONS.info}
            </div>
            <div className="min-w-0 flex-1">
              <p className={['text-sm font-medium leading-snug', EVENT_TEXT_COLORS[event.type]].join(' ')}>
                {event.message}
              </p>
              <p className="text-[var(--text-muted)] text-xs mt-0.5 tabular-nums">
                {new Date(event.timestamp).toLocaleTimeString('sv-SE', {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                })}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
