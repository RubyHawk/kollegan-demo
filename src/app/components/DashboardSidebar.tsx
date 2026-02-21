'use client';

import { ActivityEvent } from '@/lib/types';

type Tab = 'available' | 'booked' | 'activity' | 'hotel-info' | 'crm';

const MINI_ACTIVITY = {
  call_started: {
    icon: (
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
      </svg>
    ),
    badge: 'bg-white/40 dark:bg-white/8 text-[var(--text-muted)]',
    accent: 'border-l-[var(--border)]',
  },
  call_ended: {
    icon: (
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91" />
        <line x1="1" y1="1" x2="23" y2="23" />
      </svg>
    ),
    badge: 'bg-white/40 dark:bg-white/8 text-[var(--text-muted)]',
    accent: 'border-l-[var(--border)]',
  },
  rooms_queried: {
    icon: (
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
    ),
    badge: 'bg-white/40 dark:bg-white/8 text-[var(--text-muted)]',
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
    badge: 'bg-white/40 dark:bg-white/8 text-[var(--text-muted)]',
    accent: 'border-l-[var(--border)]',
  },
};

const NAV_ITEMS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  {
    key: 'available',
    label: 'Rum',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 20v-8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v8" />
        <path d="M4 10V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4" />
        <path d="M12 4v6" /><path d="M2 18h20" />
      </svg>
    ),
  },
  {
    key: 'booked',
    label: 'Bokningar',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
  },
  {
    key: 'activity',
    label: 'Aktivitet',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
  },
  {
    key: 'hotel-info',
    label: 'Hotellinfo',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" />
      </svg>
    ),
  },
  {
    key: 'crm',
    label: 'CRM',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
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
}

export default function DashboardSidebar({
  activeTab,
  onTabChange,
  tabCounts,
  activities,
  mobileMenuOpen,
  onActivityClick,
  onMobileClose,
}: Props) {
  return (
    <aside
      className={[
        'w-64 shrink-0 glass-sidebar border-r border-white/40 dark:border-white/8 flex flex-col z-40',
        'fixed lg:sticky top-0 lg:top-0 h-screen lg:h-auto lg:max-h-[calc(100vh-65px)] overflow-y-auto',
        'transition-transform duration-300 lg:translate-x-0',
        mobileMenuOpen ? 'translate-x-0' : '-translate-x-full',
      ].join(' ')}
    >
      {/* Nav */}
      <nav className="px-4 pt-5 pb-3 space-y-1">
        <p className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-widest px-3 mb-3">
          Navigation
        </p>
        {NAV_ITEMS.map((item) => {
          const isActive = activeTab === item.key;
          return (
            <button
              key={item.key}
              onClick={() => {
                onTabChange(item.key);
                onMobileClose();
              }}
              className={[
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 active:scale-[0.97]',
                isActive
                  ? 'nav-active text-amber-700 dark:text-amber-400'
                  : 'text-[var(--text-secondary)] hover:bg-white/40 dark:hover:bg-white/8 hover:text-[var(--text-primary)]',
              ].join(' ')}
            >
              {item.icon}
              <span>{item.label}</span>
              <span
                className={[
                  'ml-auto text-xs px-2 py-0.5 rounded-full min-w-[24px] text-center tabular-nums',
                  isActive
                    ? 'bg-amber-200/60 dark:bg-amber-800/40 text-amber-800 dark:text-amber-300'
                    : 'bg-white/40 dark:bg-white/8 text-[var(--text-muted)]',
                ].join(' ')}
              >
                {tabCounts[item.key]}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Divider */}
      <div className="mx-4 h-px bg-gradient-to-r from-transparent via-white/30 dark:via-white/10 to-transparent" />

      {/* Room type legend */}
      <div className="px-4 py-5">
        <p className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-widest px-3 mb-4">
          Rumstyper
        </p>
        <div className="space-y-3 px-3">
          {[
            { badge: 'text-[var(--text-secondary)]', bg: 'bg-white/50 dark:bg-white/8 border border-white/40 dark:border-white/12', label: '1', name: 'Enkelt rum', price: '1 495 kr/natt' },
            { badge: 'text-[var(--text-secondary)]', bg: 'bg-white/50 dark:bg-white/8 border border-white/40 dark:border-white/12', label: '2', name: 'Dubbelrum', price: '2 495 kr/natt' },
            { badge: 'text-amber-700 dark:text-amber-400', bg: 'bg-amber-100/80 dark:bg-amber-900/30 border border-amber-200/60 dark:border-amber-800/40', label: 'S', name: 'Svit', price: '3 995 kr/natt' },
          ].map(({ bg, badge, label, name, price }) => (
            <div key={label} className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center text-xs font-bold ${badge} shrink-0`}>
                {label}
              </div>
              <div>
                <p className="text-xs font-semibold text-[var(--text-primary)]">{name}</p>
                <p className="text-[11px] text-[var(--text-muted)] mt-0.5">{price}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div className="mx-4 h-px bg-gradient-to-r from-transparent via-white/30 dark:via-white/10 to-transparent" />

      {/* Mini activity card */}
      <div className="px-4 pb-4 pt-4">
        <div className="glass-panel rounded-xl overflow-hidden shadow-card">
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2.5 border-b border-white/25 dark:border-white/8 bg-white/20 dark:bg-white/3">
            <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-widest">
              Senaste händelser
            </p>
            {activeTab !== 'activity' && (
              <button
                onClick={() => onTabChange('activity')}
                className="text-[10px] text-amber-600 dark:text-amber-400 hover:underline font-medium"
              >
                Visa alla
              </button>
            )}
          </div>

          {/* Event rows */}
          {activities.length === 0 ? (
            <p className="text-[11px] text-[var(--text-muted)] py-4 text-center">Inga händelser än</p>
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
                      'border-b border-white/20 dark:border-white/6 last:border-b-0',
                      'hover:bg-white/30 dark:hover:bg-white/5 transition-colors cursor-pointer active:scale-[0.98]',
                      cfg.accent,
                    ].join(' ')}
                  >
                    <div className={['w-5 h-5 rounded-md flex items-center justify-center shrink-0', cfg.badge].join(' ')}>
                      {cfg.icon}
                    </div>
                    <p className="flex-1 min-w-0 text-[11px] text-[var(--text-secondary)] font-medium line-clamp-1 leading-tight">
                      {event.message}
                    </p>
                    <span className="text-[10px] text-[var(--text-muted)] tabular-nums font-mono shrink-0">
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
    </aside>
  );
}
