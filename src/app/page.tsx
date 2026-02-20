'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { Room, ActivityEvent, SSEMessage } from '@/lib/types';
import HotelGrid from '@/app/components/HotelGrid';
import BookingsCalendar from '@/app/components/BookingsCalendar';
import ActivityLog from '@/app/components/ActivityLog';
import CallIndicator from '@/app/components/CallIndicator';
import KolleganContact from '@/app/components/KolleganContact';
import RoomDetailModal from '@/app/components/RoomDetailModal';
import HotelInfoTab from '@/app/components/HotelInfoTab';
import ThemeToggle from '@/app/components/ThemeToggle';

type Tab = 'available' | 'booked' | 'activity' | 'hotel-info';

/* ───── Animated number counter ───── */
function AnimatedNumber({ value, duration = 600 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0);
  const prevRef = useRef(0);

  useEffect(() => {
    const from = prevRef.current;
    const to = value;
    if (from === to) return;

    const start = performance.now();
    let raf: number;

    const step = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(from + (to - from) * eased));
      if (t < 1) {
        raf = requestAnimationFrame(step);
      } else {
        prevRef.current = to;
      }
    };

    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  return <>{display}</>;
}

/* ───── Splash Screen ───── */
function SplashScreen({ onDone }: { onDone: () => void }) {
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const holdTimer = setTimeout(() => setExiting(true), 2000);
    const doneTimer = setTimeout(() => onDone(), 2500);
    return () => {
      clearTimeout(holdTimer);
      clearTimeout(doneTimer);
    };
  }, [onDone]);

  return (
    <div
      className={[
        'fixed inset-0 z-[100] flex items-center justify-center bg-[var(--page-bg)]',
        exiting ? 'splash-exit' : 'splash-enter',
      ].join(' ')}
    >
      <div className="flex flex-col items-center gap-5">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg splash-icon-pulse">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 21h18" />
            <path d="M5 21V7l7-4 7 4v14" />
            <path d="M9 21v-4h6v4" />
            <path d="M9 9h1" />
            <path d="M14 9h1" />
            <path d="M9 13h1" />
            <path d="M14 13h1" />
          </svg>
        </div>
        <div className="text-center">
          <h1 className="font-heading text-3xl font-bold text-[var(--text-primary)]">
            Grand Hotel Kollegan
          </h1>
          <p className="text-[var(--text-muted)] text-sm mt-1.5">Storgatan 1, Stockholm</p>
        </div>
      </div>
    </div>
  );
}

/* ───── Activity Summary Row ───── */
function SummaryRow({ label, count, color }: { label: string; count: number; color: string }) {
  return (
    <div className="flex items-center justify-between py-1">
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${color}`} />
        <span className="text-sm text-[var(--text-secondary)]">{label}</span>
      </div>
      <span className="text-sm font-semibold text-[var(--text-primary)]">{count}</span>
    </div>
  );
}

/* ───── Nav items config ───── */
const NAV_ITEMS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  {
    key: 'available',
    label: 'Rum',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 7v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-6l-2-2H5a2 2 0 0 0-2 2z" />
      </svg>
    ),
  },
  {
    key: 'booked',
    label: 'Bokningar',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
  },
  {
    key: 'activity',
    label: 'Aktivitet',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
  },
  {
    key: 'hotel-info',
    label: 'Hotellinfo',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
];

export default function HomePage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [activities, setActivities] = useState<ActivityEvent[]>([]);
  const [onCall, setOnCall] = useState(false);
  const [connected, setConnected] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('available');
  const [showSplash, setShowSplash] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [hotelServiceCount, setHotelServiceCount] = useState(0);

  /* ── SSE ── */
  useEffect(() => {
    const es = new EventSource('/api/sse');

    es.onopen = () => setConnected(true);
    es.onerror = () => setConnected(false);

    es.onmessage = (event) => {
      const msg: SSEMessage = JSON.parse(event.data);

      if (msg.type === 'full_state') {
        const state = msg.payload as {
          rooms: Room[];
          recentActivity: ActivityEvent[];
          onCall: boolean;
        };
        setRooms(state.rooms);
        setActivities(state.recentActivity);
        setOnCall(state.onCall);
      } else if (msg.type === 'room_update') {
        const updated = msg.payload as Room;
        setRooms((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
        setSelectedRoom((prev) => (prev?.id === updated.id ? updated : prev));
      } else if (msg.type === 'activity') {
        setActivities((prev) => [msg.payload as ActivityEvent, ...prev].slice(0, 50));
      } else if (msg.type === 'call_status') {
        setOnCall((msg.payload as { onCall: boolean }).onCall);
      }
    };

    return () => es.close();
  }, []);

  const handleReset = useCallback(async () => {
    await fetch('/api/rooms', { method: 'DELETE' });
  }, []);

  const handleRoomClick = useCallback((room: Room) => {
    if (room.status === 'locked') return;
    setSelectedRoom(room);
  }, []);

  const handleSplashDone = useCallback(() => setShowSplash(false), []);

  const availableCount = rooms.filter((r) => r.status === 'available').length;
  const bookedCount = rooms.filter((r) => r.status === 'booked').length;
  const lockedCount = rooms.filter((r) => r.status === 'locked').length;
  const occupancy = rooms.length > 0 ? Math.round(((bookedCount + lockedCount) / rooms.length) * 100) : 0;

  const tabCounts: Record<Tab, number> = {
    available: availableCount + lockedCount,
    booked: bookedCount,
    activity: activities.length,
    'hotel-info': hotelServiceCount,
  };

  return (
    <>
      {/* ───── Splash Screen ───── */}
      {showSplash && <SplashScreen onDone={handleSplashDone} />}

      <div className="min-h-screen grid grid-rows-[auto_1fr_auto]">
        {/* ═══════ HEADER ═══════ */}
        <header className="bg-[var(--surface)] border-b border-[var(--border)] relative z-30">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between gap-4">
              {/* Left: logo + name */}
              <div className="flex items-center gap-3">
                {/* Mobile hamburger */}
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="lg:hidden p-1.5 rounded-lg hover:bg-[var(--surface-alt)] transition-colors"
                  aria-label="Meny"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    {mobileMenuOpen ? (
                      <>
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </>
                    ) : (
                      <>
                        <line x1="3" y1="12" x2="21" y2="12" />
                        <line x1="3" y1="6" x2="21" y2="6" />
                        <line x1="3" y1="18" x2="21" y2="18" />
                      </>
                    )}
                  </svg>
                </button>

                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-sm shrink-0">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 21h18" />
                    <path d="M5 21V7l7-4 7 4v14" />
                    <path d="M9 21v-4h6v4" />
                    <path d="M9 9h1" />
                    <path d="M14 9h1" />
                  </svg>
                </div>
                <div className="hidden sm:block">
                  <h1 className="font-heading text-xl font-bold tracking-tight text-[var(--text-primary)] leading-tight">
                    Grand Hotel Kollegan
                  </h1>
                  <p className="text-[var(--text-muted)] text-xs flex items-center gap-1">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    Storgatan 1, Stockholm
                  </p>
                </div>
              </div>

              {/* Center: compact stat chips */}
              {rooms.length > 0 && (
                <div className="hidden md:flex items-center gap-3 flex-wrap justify-center">
                  <StatChip color="bg-emerald-500" label="Lediga" value={availableCount} />
                  <StatChip color="bg-amber-500" label="Res." value={lockedCount} />
                  <StatChip color="bg-indigo-500" label="Bokade" value={bookedCount} />
                  <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                    <div className="w-20 h-1.5 bg-[var(--surface-alt)] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-500 bar-grow"
                        style={{ width: `${occupancy}%` }}
                      />
                    </div>
                    <span className="font-semibold text-[var(--text-primary)]"><AnimatedNumber value={occupancy} />%</span>
                  </div>
                </div>
              )}

              {/* Right: status + controls */}
              <div className="flex items-center gap-2.5">
                <CallIndicator onCall={onCall} />

                <div className="hidden sm:flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
                  <div className={['w-1.5 h-1.5 rounded-full', connected ? 'bg-emerald-500' : 'bg-red-400'].join(' ')} />
                  {connected ? 'Live' : 'Offline'}
                </div>

                <button
                  onClick={handleReset}
                  className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-[var(--surface-alt)] border border-[var(--border)] hover:border-[var(--text-muted)] rounded-lg px-2.5 py-1.5 transition-all hover:shadow-sm active:scale-95"
                >
                  Återställ
                </button>

                <ThemeToggle />
              </div>
            </div>
          </div>
          {/* Decorative gradient line */}
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-400/40 to-transparent" />
        </header>

        {/* ═══════ BODY: Sidebar + Main ═══════ */}
        <div className="flex relative">
          {/* ── Mobile menu overlay ── */}
          {mobileMenuOpen && (
            <div
              className="fixed inset-0 bg-black/30 z-30 lg:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
          )}

          {/* ── Sidebar ── */}
          <aside
            className={[
              'w-64 shrink-0 bg-[var(--surface)] border-r border-[var(--border)] flex flex-col z-40',
              // Mobile: fixed slide-in, Desktop: sticky
              'fixed lg:sticky top-0 lg:top-0 h-screen lg:h-auto lg:max-h-[calc(100vh-65px)] overflow-y-auto',
              'transition-transform duration-300 lg:translate-x-0',
              mobileMenuOpen ? 'translate-x-0' : '-translate-x-full',
            ].join(' ')}
          >
            {/* Nav */}
            <nav className="p-4 space-y-1">
              <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-widest px-3 mb-2">Navigation</p>
              {NAV_ITEMS.map((item) => (
                <button
                  key={item.key}
                  onClick={() => {
                    setActiveTab(item.key);
                    setMobileMenuOpen(false);
                  }}
                  className={[
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all active:scale-[0.97]',
                    activeTab === item.key
                      ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50'
                      : 'text-[var(--text-secondary)] hover:bg-[var(--surface-alt)] hover:text-[var(--text-primary)]',
                  ].join(' ')}
                >
                  {item.icon}
                  <span>{item.label}</span>
                  <span
                    className={[
                      'ml-auto text-xs px-1.5 py-0.5 rounded-full min-w-[22px] text-center',
                      activeTab === item.key
                        ? 'bg-amber-200/60 dark:bg-amber-800/40 text-amber-800 dark:text-amber-300'
                        : 'bg-[var(--surface-alt)] text-[var(--text-muted)]',
                    ].join(' ')}
                  >
                    {tabCounts[item.key]}
                  </span>
                </button>
              ))}
            </nav>

            {/* Divider */}
            <div className="mx-4 h-px bg-gradient-to-r from-transparent via-[var(--border)] to-transparent" />

            {/* Room type legend */}
            <div className="p-4">
              <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-widest px-3 mb-3">Rumstyper</p>
              <div className="space-y-2 px-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center text-xs font-bold text-emerald-700 dark:text-emerald-400">1</div>
                  <div>
                    <p className="text-xs font-medium text-[var(--text-primary)]">Enkelt rum</p>
                    <p className="text-[10px] text-[var(--text-muted)]">1 495 kr/natt</p>
                  </div>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-xs font-bold text-blue-700 dark:text-blue-400">2</div>
                  <div>
                    <p className="text-xs font-medium text-[var(--text-primary)]">Dubbelrum</p>
                    <p className="text-[10px] text-[var(--text-muted)]">2 495 kr/natt</p>
                  </div>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center text-xs font-bold text-violet-700 dark:text-violet-400">S</div>
                  <div>
                    <p className="text-xs font-medium text-[var(--text-primary)]">Svit</p>
                    <p className="text-[10px] text-[var(--text-muted)]">3 995 kr/natt</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="mx-4 h-px bg-gradient-to-r from-transparent via-[var(--border)] to-transparent" />

            {/* Mini activity (sidebar) */}
            <div className="p-4">
              <div className="flex items-center justify-between px-3 mb-2">
                <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-widest">Senaste</p>
                {activeTab !== 'activity' && (
                  <button
                    onClick={() => setActiveTab('activity')}
                    className="text-[10px] text-amber-600 dark:text-amber-400 hover:underline font-medium"
                  >
                    Visa alla
                  </button>
                )}
              </div>
              <div className="space-y-1 px-3">
                {activities.length === 0 && (
                  <p className="text-xs text-[var(--text-muted)] py-3 text-center">Inga händelser än</p>
                )}
                {activities.slice(0, 4).map((event) => (
                  <div key={event.id} className="text-[11px] text-[var(--text-secondary)] leading-snug py-1.5 border-b border-[var(--border-light)] last:border-b-0">
                    <span className="line-clamp-1">{event.message}</span>
                    <span className="text-[var(--text-muted)] text-[10px]">
                      {new Date(event.timestamp).toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Spacer pushes Maja to bottom */}
            <div className="flex-1" />

            {/* Divider */}
            <div className="mx-4 h-px bg-gradient-to-r from-transparent via-[var(--border)] to-transparent" />

            {/* Kollegan section */}
            <div className="p-4">
              <KolleganContact variant="sidebar" />
            </div>
          </aside>

          {/* ── Main content ── */}
          <main className="flex-1 min-w-0 p-6">
            {/* ── Mobile stat chips (visible below md) ── */}
            {rooms.length > 0 && (
              <div className="flex md:hidden items-center gap-2 flex-wrap mb-4">
                <StatChip color="bg-emerald-500" label="Lediga" value={availableCount} />
                <StatChip color="bg-amber-500" label="Res." value={lockedCount} />
                <StatChip color="bg-indigo-500" label="Bokade" value={bookedCount} />
                <span className="text-xs font-semibold text-[var(--text-primary)]"><AnimatedNumber value={occupancy} />%</span>
              </div>
            )}

            {/* ── Loading (Skeleton) ── */}
            {rooms.length === 0 && (
              <div className="space-y-6 py-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                  {[0, 1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="rounded-2xl border border-[var(--border)] p-5 space-y-3 fade-in-up" style={{ animationDelay: `${i * 60}ms` }}>
                      <div className="flex justify-between">
                        <div className="h-7 w-12 skeleton" />
                        <div className="h-7 w-7 rounded-lg skeleton" />
                      </div>
                      <div className="h-3 w-20 skeleton" />
                      <div className="h-3 w-16 skeleton mt-4" />
                    </div>
                  ))}
                </div>
                <p className="text-center text-sm text-[var(--text-muted)] mt-4">Ansluter till realtidsström...</p>
              </div>
            )}

            {/* ── Available Tab ── */}
            {rooms.length > 0 && activeTab === 'available' && (
              <div key="available" className="tab-content-enter">
                <HotelGrid rooms={rooms} onRoomClick={handleRoomClick} />
              </div>
            )}

            {/* ── Booked Tab ── */}
            {rooms.length > 0 && activeTab === 'booked' && (
              <div key="booked" className="tab-content-enter">
                <BookingsCalendar rooms={rooms} onRoomClick={handleRoomClick} />
              </div>
            )}

            {/* ── Activity Tab ── */}
            {rooms.length > 0 && activeTab === 'activity' && (
              <div key="activity" className="tab-content-enter">
                {/* Inline summary */}
                <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 mb-6 flex flex-wrap gap-x-6 gap-y-2">
                  <SummaryRow label="Bokningar" count={activities.filter(e => e.type === 'room_confirmed').length} color="bg-emerald-500" />
                  <SummaryRow label="Avbokningar" count={activities.filter(e => e.type === 'room_cancelled').length} color="bg-red-500" />
                  <SummaryRow label="Samtal" count={activities.filter(e => e.type === 'call_started').length} color="bg-blue-500" />
                  <SummaryRow label="Sökningar" count={activities.filter(e => e.type === 'rooms_queried').length} color="bg-violet-500" />
                </div>
                <ActivityLog activities={activities} />
              </div>
            )}

            {/* ── Hotellinfo Tab ── */}
            {activeTab === 'hotel-info' && (
              <div key="hotel-info" className="tab-content-enter">
                <HotelInfoTab onCountChange={setHotelServiceCount} />
              </div>
            )}
          </main>
        </div>

        {/* ═══════ FOOTER ═══════ */}
        <footer className="border-t border-[var(--border)] bg-[var(--surface)]">
          <div className="px-6 py-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shrink-0">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 21h18" />
                    <path d="M5 21V7l7-4 7 4v14" />
                    <path d="M9 21v-4h6v4" />
                  </svg>
                </div>
                <div>
                  <span className="font-heading text-sm font-semibold text-[var(--text-primary)]">Grand Hotel Kollegan</span>
                  <div className="flex items-center gap-4 mt-0.5">
                    <span className="text-xs text-[var(--text-muted)] flex items-center gap-1">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                      Storgatan 1, Stockholm
                    </span>
                    <span className="text-xs text-[var(--text-muted)] flex items-center gap-1">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72" />
                      </svg>
                      08-123 456 78
                    </span>
                  </div>
                </div>
              </div>
              <p className="text-xs text-[var(--text-muted)]">
                Demo — Powered by Vapi AI
              </p>
            </div>
          </div>
        </footer>
      </div>

      {selectedRoom && (
        <RoomDetailModal
          room={selectedRoom}
          onClose={() => setSelectedRoom(null)}
          onBooked={() => setSelectedRoom(null)}
        />
      )}
    </>
  );
}

/* ───── Stat chip (compact) ───── */
function StatChip({ color, label, value }: { color: string; label: string; value: number }) {
  return (
    <div className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
      <div className={`w-2 h-2 rounded-full ${color}`} />
      <span className="font-semibold text-[var(--text-primary)]"><AnimatedNumber value={value} /></span>
      <span>{label}</span>
    </div>
  );
}
