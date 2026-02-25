'use client';

import { ActivityEvent } from '@features/activity/types';
import ThemeToggle from './ThemeToggle';

type Tab = 'available' | 'booked' | 'activity' | 'hotel-info' | 'crm' | 'setup';

const MINI_ACTIVITY = {
  call_started: {
    icon: (
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
      </svg>
    ),
    badge: 'bg-black/6 dark:bg-white/8 text-[var(--text-muted)]',
    accent: 'border-l-[var(--border)]',
  },
  call_ended: {
    icon: (
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91" />
        <line x1="1" y1="1" x2="23" y2="23" />
      </svg>
    ),
    badge: 'bg-black/6 dark:bg-white/8 text-[var(--text-muted)]',
    accent: 'border-l-[var(--border)]',
  },
  rooms_queried: {
    icon: (
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
    ),
    badge: 'bg-black/6 dark:bg-white/8 text-[var(--text-muted)]',
    accent: 'border-l-[var(--border)]',
  },
  room_locked: {
    icon: (
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
    ),
    badge: 'bg-amber-100/80 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
    accent: 'border-l-amber-400',
  },
  room_confirmed: {
    icon: (
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
      </svg>
    ),
    badge: 'bg-emerald-100/80 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
    accent: 'border-l-emerald-400',
  },
  room_cancelled: {
    icon: (
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
      </svg>
    ),
    badge: 'bg-red-100/80 dark:bg-red-900/30 text-red-500 dark:text-red-400',
    accent: 'border-l-red-400',
  },
  crm_contact: {
    icon: (
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    badge: 'bg-violet-100/80 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400',
    accent: 'border-l-violet-400',
  },
  info: {
    icon: (
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" />
      </svg>
    ),
    badge: 'bg-black/6 dark:bg-white/8 text-[var(--text-muted)]',
    accent: 'border-l-[var(--border)]',
  },
};

const NAV_ITEMS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  {
    key: 'available',
    label: 'Rum',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 20v-8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v8" />
        <path d="M4 10V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4" />
        <path d="M12 4v6" />
        <path d="M2 18h20" />
      </svg>
    ),
  },
  {
    key: 'booked',
    label: 'Bokningar',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 2v4M16 2v4" />
        <path d="M3 9h18" />
        <path d="M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2" />
        <path d="M9 14l2 2 4-4" />
      </svg>
    ),
  },
  {
    key: 'activity',
    label: 'Aktivitet',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 20V10" />
        <path d="M12 20V4" />
        <path d="M6 20v-6" />
      </svg>
    ),
  },
  {
    key: 'hotel-info',
    label: 'Hotellinfo',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20" />
        <path d="M12 16v-4" />
        <path d="M12 8h.01" />
      </svg>
    ),
  },
  {
    key: 'crm',
    label: 'CRM',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <path d="M9 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    key: 'setup',
    label: 'Setup',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <ellipse cx="12" cy="5" rx="9" ry="3" />
        <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
        <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
      </svg>
    ),
  },
];

interface Props {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  tabCounts: Record<Tab, number>;
  activities: ActivityEvent[];
  mobileMenuOpen: boolean;
  onActivityClick: (eventId: string) => void;
  onMobileClose: () => void;
  connected: boolean;
  onReset: () => void;
}

export default function DashboardSidebar({
  activeTab,
  onTabChange,
  tabCounts,
  activities,
  mobileMenuOpen,
  onActivityClick,
  onMobileClose,
  connected,
  onReset,
}: Props) {
  return (
    <aside
      className={[
        'w-64 shrink-0 flex flex-col z-40',
        'bg-[var(--surface)] dark:bg-[#0c0c0c]',
        'border-r border-[var(--border)] dark:border-[#1c1c1c]',
        'fixed lg:sticky top-0 lg:top-0 h-screen lg:h-auto lg:max-h-[calc(100vh-44px)] overflow-y-auto',
        'transition-transform duration-300 lg:translate-x-0',
        mobileMenuOpen ? 'translate-x-0' : '-translate-x-full',
      ].join(' ')}
    >
      {/* Nav */}
      <nav className="px-3 pt-5 pb-2 space-y-0.5">
        <p className="text-[10px] font-semibold text-[var(--text-muted)] dark:text-white/25 uppercase tracking-widest px-3 mb-2.5">
          Navigation
        </p>
        {NAV_ITEMS.map((item) => {
          const isActive = activeTab === item.key;
          const count = tabCounts[item.key];
          return (
            <button
              key={item.key}
              onClick={() => {
                onTabChange(item.key);
                onMobileClose();
              }}
              className={[
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium',
                'transition-colors duration-150 active:scale-[0.97]',
                isActive
                  ? [
                      'bg-[var(--accent-subtle)] text-[var(--accent)] font-semibold',
                      'dark:bg-amber-500/12 dark:text-amber-400',
                    ].join(' ')
                  : [
                      'text-[var(--text-secondary)] hover:text-[var(--text-primary)]',
                      'hover:bg-black/5 dark:text-white/45 dark:hover:text-white/85 dark:hover:bg-white/10',
                    ].join(' '),
              ].join(' ')}
            >
              <span className={isActive ? 'opacity-100' : 'opacity-70'}>{item.icon}</span>
              <span>{item.label}</span>
              {count > 0 && (
                <span
                  className={[
                    'ml-auto text-xs px-2 py-0.5 rounded-full min-w-[22px] text-center tabular-nums font-medium',
                    isActive
                      ? 'bg-[var(--accent)]/15 text-[var(--accent)] dark:bg-amber-500/20 dark:text-amber-400'
                      : 'bg-black/7 text-[var(--text-muted)] dark:bg-white/10 dark:text-white/35',
                  ].join(' ')}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Divider */}
      <div className="mx-4 my-1 h-px bg-gradient-to-r from-transparent via-[var(--border)] dark:via-white/10 to-transparent" />

      {/* Room type legend */}
      <div className="px-4 py-3">
        <p className="text-[10px] font-semibold text-[var(--text-muted)] dark:text-white/25 uppercase tracking-widest px-3 mb-3">
          Rumstyper
        </p>
        <div className="space-y-2 px-3">
          {[
            {
              badge: 'text-[var(--text-secondary)] dark:text-white/60',
              bg: 'bg-black/5 border border-black/8 dark:bg-white/8 dark:border-white/12',
              label: '1',
              name: 'Enkelt rum',
              price: '1 495 kr/natt',
            },
            {
              badge: 'text-[var(--text-secondary)] dark:text-white/60',
              bg: 'bg-black/5 border border-black/8 dark:bg-white/8 dark:border-white/12',
              label: '2',
              name: 'Dubbelrum',
              price: '2 495 kr/natt',
            },
            {
              badge: 'text-amber-600 dark:text-amber-400',
              bg: 'bg-amber-500/15 border border-amber-500/25',
              label: 'S',
              name: 'Svit',
              price: '3 995 kr/natt',
            },
          ].map(({ bg, badge, label, name, price }) => (
            <div key={label} className="flex items-center gap-2.5">
              <div className={`w-6 h-6 rounded-md ${bg} flex items-center justify-center text-[10px] font-bold ${badge} shrink-0`}>
                {label}
              </div>
              <div className="flex items-center justify-between flex-1 min-w-0">
                <p className="text-xs font-medium text-[var(--text-primary)] dark:text-white/80 truncate">{name}</p>
                <p className="text-[10px] text-[var(--text-muted)] dark:text-white/30 ml-2 shrink-0">{price}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div className="mx-4 my-1 h-px bg-gradient-to-r from-transparent via-[var(--border)] dark:via-white/10 to-transparent" />

      {/* Mini activity card */}
      <div className="px-4 pb-4 pt-3">
        <div className="bg-[var(--surface-alt)] dark:bg-white/4 border border-[var(--border)] dark:border-white/8 rounded-xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2.5 border-b border-[var(--border)] dark:border-white/8 bg-[var(--surface-hover)] dark:bg-white/5">
            <p className="text-[10px] font-semibold text-[var(--text-muted)] dark:text-white/30 uppercase tracking-widest">
              Senaste händelser
            </p>
            {activeTab !== 'activity' && (
              <button
                onClick={() => onTabChange('activity')}
                className="text-[10px] font-medium text-[var(--accent)] hover:underline dark:text-amber-400 transition-colors"
              >
                Visa alla
              </button>
            )}
          </div>

          {/* Event rows */}
          {activities.length === 0 ? (
            <p className="text-[11px] text-[var(--text-muted)] dark:text-white/30 py-4 text-center">Inga händelser än</p>
          ) : (
            <div>
              {activities.slice(0, 4).map((event: ActivityEvent) => {
                const cfg =
                  MINI_ACTIVITY[event.type as keyof typeof MINI_ACTIVITY] ?? MINI_ACTIVITY.info;
                return (
                  <button
                    key={event.id}
                    onClick={() => {
                      onActivityClick(event.id);
                      onMobileClose();
                    }}
                    className={[
                      'w-full text-left flex items-center gap-2.5 px-3 py-2.5',
                      'border-l-[3px]',
                      'border-b border-[var(--border-light)] dark:border-white/6 last:border-b-0',
                      'hover:bg-[var(--surface-hover)] dark:hover:bg-white/6 transition-colors duration-150 cursor-pointer active:scale-[0.98]',
                      cfg.accent,
                    ].join(' ')}
                  >
                    <div className={['w-5 h-5 rounded-md flex items-center justify-center shrink-0', cfg.badge].join(' ')}>
                      {cfg.icon}
                    </div>
                    <p className="flex-1 min-w-0 text-[11px] text-[var(--text-secondary)] dark:text-white/60 font-medium line-clamp-1 leading-tight">
                      {event.message}
                    </p>
                    <span className="text-[10px] text-[var(--text-muted)] dark:text-white/30 tabular-nums font-mono shrink-0">
                      {new Date(event.timestamp).toLocaleTimeString('sv-SE', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="flex-1" />

      {/* Divider */}
      <div className="mx-4 h-px bg-gradient-to-r from-transparent via-[var(--border)] dark:via-white/10 to-transparent" />

      {/* Bottom section — hotel identity + controls */}
      <div className="px-4 pt-3 pb-4 space-y-2.5">
        {/* Hotel name row + live status */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2 min-w-0">
            {/* Hotel icon */}
            <div className="w-7 h-7 rounded-lg bg-[var(--accent-subtle)] dark:bg-amber-500/12 flex items-center justify-center shrink-0">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--accent)] dark:text-amber-400">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-[var(--text-primary)] dark:text-white/85 truncate leading-tight">
                Hotell Kollegan
              </p>
              <p className="text-[10px] text-[var(--text-muted)] dark:text-white/35 leading-tight">Demo</p>
            </div>
          </div>

          {/* Live status badge */}
          <div className={[
            'flex items-center gap-1.5 text-[10px] font-semibold px-2 py-1 rounded-full border transition-colors duration-500',
            connected
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/50 text-emerald-700 dark:text-emerald-400'
              : 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800/50 text-red-600 dark:text-red-400',
          ].join(' ')}>
            <div className={[
              'w-1.5 h-1.5 rounded-full transition-colors duration-500',
              connected ? 'bg-emerald-500' : 'bg-red-400',
            ].join(' ')} />
            <span>{connected ? 'Live' : 'Offline'}</span>
          </div>
        </div>

        {/* Controls row */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={onReset}
            title="Återställ data"
            className={[
              'flex-1 flex items-center justify-center gap-1.5 text-[11px] font-medium px-2 py-1.5 rounded-lg transition-colors duration-150 active:scale-95',
              'text-[var(--text-secondary)] hover:text-[var(--text-primary)]',
              'bg-[var(--surface-alt)] hover:bg-[var(--border)] border border-[var(--border)]',
              'dark:text-white/40 dark:hover:text-white/70 dark:bg-white/5 dark:hover:bg-white/10 dark:border-white/10',
            ].join(' ')}
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="1 4 1 10 7 10" />
              <path d="M3.51 15a9 9 0 1 0 .49-3.15" />
            </svg>
            Återställ
          </button>
          <ThemeToggle className={[
            'w-8 h-8 flex items-center justify-center rounded-lg transition-colors duration-150',
            'bg-[var(--surface-alt)] border border-[var(--border)]',
            'hover:border-[var(--accent)]/50 dark:hover:border-amber-400/50',
            'text-[var(--text-secondary)] hover:text-[var(--text-primary)]',
            'dark:bg-white/5 dark:border-white/10 dark:text-white/50 dark:hover:text-white/85',
          ].join(' ')} />
        </div>
      </div>
    </aside>
  );
}
