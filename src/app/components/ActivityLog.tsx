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

const EVENT_COLORS: Record<ActivityEvent['type'], string> = {
  call_started: 'text-blue-400',
  call_ended: 'text-cream-400',
  rooms_queried: 'text-purple-400',
  room_locked: 'text-gold-400',
  room_confirmed: 'text-emerald-400',
  room_cancelled: 'text-burgundy-400',
  info: 'text-cream-400',
};

export default function ActivityLog({ activities }: Props) {
  return (
    <div className="bg-navy-900 rounded-xl border border-navy-700 flex flex-col h-full">
      <div className="px-4 py-3 border-b border-navy-700 shrink-0">
        <h2 className="text-xs font-bold text-gold-500 uppercase tracking-widest font-heading">
          Aktivitetslogg
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3 max-h-[600px]">
        {activities.length === 0 && (
          <p className="text-cream-600 text-xs text-center mt-10 leading-relaxed">
            Inga aktiviteter än.
            <br />
            Ring Maja för att börja!
          </p>
        )}

        {activities.map((event) => (
          <div key={event.id} className="flex gap-2.5 text-xs group">
            <span className={['shrink-0 mt-0.5 leading-none', EVENT_COLORS[event.type]].join(' ')}>
              {EVENT_ICONS[event.type] ?? EVENT_ICONS.info}
            </span>
            <div className="min-w-0">
              <p className={['font-medium leading-snug', EVENT_COLORS[event.type]].join(' ')}>
                {event.message}
              </p>
              <p className="text-cream-600 mt-0.5">
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
