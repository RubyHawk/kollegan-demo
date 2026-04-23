'use client';

import { useState } from 'react';
import type { Room } from '@demos/hotel/domain/room.entity';
import { GoogleCalendarIcon, TabBtn } from './calendar-tab-shared';
import { GoogleCalendarView } from './calendar-tab-google-view';
import { ListView } from './calendar-tab-list-view';
import { TimelineView } from './calendar-tab-timeline-view';

interface Props {
  rooms: Room[];
  onRoomClick?: (room: Room) => void;
}

type SubTab = 'list' | 'timeline' | 'google';

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
