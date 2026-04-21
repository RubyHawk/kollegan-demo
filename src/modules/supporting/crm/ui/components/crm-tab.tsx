'use client';

import { useState } from 'react';
import type { ActivityEvent } from '@demos/hotel/activity/types';
import { BookingLogTab } from './crm-booking-log-tab';
import { CallLogTab } from './crm-call-log-tab';
import { CustomerList } from './crm-customer-list';
import { buildCallLog, buildCrmEntries } from './crm-tab-model';
import { TabBtn } from './crm-tab-shared';

interface Props {
  activities: ActivityEvent[];
  onCountChange?: (n: number) => void;
}

export default function CrmTab({ activities, onCountChange }: Props) {
  const [subTab, setSubTab] = useState<'kunder' | 'bokningar' | 'samtal'>('kunder');

  const entries = buildCrmEntries(activities);
  const bookingCount = activities.filter(e => e.type === 'room_confirmed' || e.type === 'room_cancelled').length;
  const callCount = buildCallLog(activities).length;

  if (onCountChange) setTimeout(() => onCountChange(entries.length), 0);

  return (
    <div>
      {/* ── Page header ── */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="font-heading text-xl font-semibold text-[var(--text-primary)]">Kundregister</h2>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">Kundprofiler, bokningar och samtal via Soleria</p>
        </div>
        <span className="text-xs font-medium text-purple-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40 rounded-full px-3 py-1.5">
          {entries.length} {entries.length === 1 ? 'kund' : 'kunder'}
        </span>
      </div>

      {/* ── Sub-tab switcher ── */}
      <div className="flex items-center gap-1.5 mb-5 p-1 bg-[var(--surface-alt)] border-2 border-[var(--border)] rounded-xl w-fit shadow-card">
        <TabBtn
          active={subTab === 'kunder'}
          onClick={() => setSubTab('kunder')}
          count={entries.length}
          label="Kunder"
          icon={
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          }
        />
        <TabBtn
          active={subTab === 'bokningar'}
          onClick={() => setSubTab('bokningar')}
          count={bookingCount}
          label="Bokningslogg"
          icon={
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 20v-8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v8" />
              <path d="M4 10V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4" />
              <path d="M2 18h20" />
            </svg>
          }
        />
        <TabBtn
          active={subTab === 'samtal'}
          onClick={() => setSubTab('samtal')}
          count={callCount}
          label="Samtalslogg"
          icon={
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
          }
        />
      </div>

      {/* ── Tab content ── */}
      <div className="tab-content-enter">
        {subTab === 'kunder'    && <CustomerList entries={entries} />}
        {subTab === 'bokningar' && <BookingLogTab activities={activities} />}
        {subTab === 'samtal'    && <CallLogTab activities={activities} />}
      </div>
    </div>
  );
}
