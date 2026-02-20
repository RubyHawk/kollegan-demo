'use client';

import { useEffect, useState, useCallback } from 'react';
import { Room, ActivityEvent, SSEMessage } from '@/lib/types';
import HotelGrid from '@/app/components/HotelGrid';
import BookingsCalendar from '@/app/components/BookingsCalendar';
import ActivityLog from '@/app/components/ActivityLog';
import CallIndicator from '@/app/components/CallIndicator';
import MajaContact from '@/app/components/MajaContact';
import BookingDialog from '@/app/components/BookingDialog';
import ThemeToggle from '@/app/components/ThemeToggle';

type Tab = 'available' | 'booked' | 'activity';

export default function HomePage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [activities, setActivities] = useState<ActivityEvent[]>([]);
  const [onCall, setOnCall] = useState(false);
  const [connected, setConnected] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('available');

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

  const availableCount = rooms.filter((r) => r.status === 'available').length;
  const bookedCount = rooms.filter((r) => r.status === 'booked').length;
  const lockedCount = rooms.filter((r) => r.status === 'locked').length;
  const occupancy = rooms.length > 0 ? Math.round(((bookedCount + lockedCount) / rooms.length) * 100) : 0;

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: 'available', label: 'Tillgängliga', count: availableCount + lockedCount },
    { key: 'booked', label: 'Bokningar', count: bookedCount },
    { key: 'activity', label: 'Aktivitet', count: activities.length },
  ];

  return (
    <main className="min-h-screen">
      {/* ───── Header ───── */}
      <header className="bg-[var(--surface)] border-b border-[var(--border)]">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="font-heading text-3xl font-bold tracking-tight text-[var(--text-primary)]">
                Grand Hotel Kollegan
              </h1>
              <p className="text-[var(--text-muted)] text-sm mt-1 flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                Storgatan 1, Stockholm
              </p>
            </div>

            <div className="flex items-center gap-3">
              <CallIndicator onCall={onCall} />

              <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
                <div
                  className={[
                    'w-1.5 h-1.5 rounded-full',
                    connected ? 'bg-emerald-500' : 'bg-red-400',
                  ].join(' ')}
                />
                {connected ? 'Live' : 'Frånkopplad'}
              </div>

              <button
                onClick={handleReset}
                className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-[var(--surface-alt)] border border-[var(--border)] hover:border-[var(--text-muted)] rounded-lg px-3 py-1.5 transition-all hover:shadow-sm"
              >
                Återställ
              </button>

              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* ───── Stats ───── */}
        {rooms.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            {/* Available */}
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600 dark:text-emerald-400">
                    <path d="M3 7v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-6l-2-2H5a2 2 0 0 0-2 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-2xl font-bold text-[var(--text-primary)]">{availableCount}</p>
                  <p className="text-xs text-[var(--text-muted)]">Lediga rum</p>
                </div>
              </div>
            </div>

            {/* Locked */}
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-600 dark:text-amber-400">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </div>
                <div>
                  <p className="text-2xl font-bold text-[var(--text-primary)]">{lockedCount}</p>
                  <p className="text-xs text-[var(--text-muted)]">Reserveras</p>
                </div>
              </div>
            </div>

            {/* Booked */}
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-600 dark:text-indigo-400">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                </div>
                <div>
                  <p className="text-2xl font-bold text-[var(--text-primary)]">{bookedCount}</p>
                  <p className="text-xs text-[var(--text-muted)]">Bokade</p>
                </div>
              </div>
            </div>

            {/* Occupancy */}
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-violet-600 dark:text-violet-400">
                    <line x1="18" y1="20" x2="18" y2="10" />
                    <line x1="12" y1="20" x2="12" y2="4" />
                    <line x1="6" y1="20" x2="6" y2="14" />
                  </svg>
                </div>
                <div>
                  <p className="text-2xl font-bold text-[var(--text-primary)]">{occupancy}%</p>
                  <p className="text-xs text-[var(--text-muted)]">Beläggning</p>
                </div>
              </div>
              <div className="mt-3 h-1.5 bg-[var(--surface-alt)] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-500 transition-all duration-700"
                  style={{ width: `${occupancy}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* ───── Tabs ───── */}
        {rooms.length > 0 && (
          <div className="border-b border-[var(--border)] mb-8">
            <nav className="flex gap-1">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={[
                    'px-4 py-3 text-sm font-medium transition-all relative',
                    activeTab === tab.key
                      ? 'text-[var(--text-primary)]'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]',
                  ].join(' ')}
                >
                  {tab.label}
                  {tab.count !== undefined && (
                    <span
                      className={[
                        'ml-1.5 text-xs px-1.5 py-0.5 rounded-full',
                        activeTab === tab.key
                          ? 'bg-stone-800 dark:bg-slate-200 text-white dark:text-slate-800'
                          : 'bg-[var(--surface-alt)] text-[var(--text-muted)]',
                      ].join(' ')}
                    >
                      {tab.count}
                    </span>
                  )}
                  {activeTab === tab.key && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-stone-800 dark:bg-slate-200 rounded-full" />
                  )}
                </button>
              ))}
            </nav>
          </div>
        )}

        {/* ───── Loading ───── */}
        {rooms.length === 0 && (
          <div className="text-center py-20 text-[var(--text-muted)]">
            <div className="w-8 h-8 border-2 border-stone-300 dark:border-slate-600 border-t-stone-500 dark:border-t-slate-400 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm">Ansluter till realtidsström...</p>
          </div>
        )}

        {/* ───── Available Tab (two-column) ───── */}
        {rooms.length > 0 && activeTab === 'available' && (
          <div className="flex gap-6 items-start">
            <div className="flex-1 min-w-0">
              <HotelGrid rooms={rooms} onRoomClick={handleRoomClick} />
            </div>

            {/* Sidebar */}
            <aside className="hidden lg:block w-72 shrink-0 sticky top-6 space-y-4">
              {/* Room type legend */}
              <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4">
                <h3 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-widest mb-3">Rumstyper</h3>
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center text-xs font-bold text-emerald-700 dark:text-emerald-400">1</div>
                    <div>
                      <p className="text-sm font-medium text-[var(--text-primary)]">Enkelt rum</p>
                      <p className="text-xs text-[var(--text-muted)]">1 495 kr/natt</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-xs font-bold text-blue-700 dark:text-blue-400">2</div>
                    <div>
                      <p className="text-sm font-medium text-[var(--text-primary)]">Dubbelrum</p>
                      <p className="text-xs text-[var(--text-muted)]">2 495 kr/natt</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center text-xs font-bold text-violet-700 dark:text-violet-400">S</div>
                    <div>
                      <p className="text-sm font-medium text-[var(--text-primary)]">Svit</p>
                      <p className="text-xs text-[var(--text-muted)]">3 995 kr/natt</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mini activity */}
              <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-widest">Senaste aktivitet</h3>
                  <button
                    onClick={() => setActiveTab('activity')}
                    className="text-xs text-indigo-500 hover:text-indigo-600 font-medium"
                  >
                    Visa alla
                  </button>
                </div>
                <div className="space-y-2">
                  {activities.length === 0 && (
                    <p className="text-xs text-[var(--text-muted)] py-4 text-center">Inga händelser än</p>
                  )}
                  {activities.slice(0, 5).map((event) => (
                    <div key={event.id} className="text-xs text-[var(--text-secondary)] leading-snug py-1 border-b border-[var(--border-light)] last:border-b-0">
                      {event.message}
                      <span className="text-[var(--text-muted)] ml-1">
                        {new Date(event.timestamp).toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        )}

        {/* ───── Booked Tab ───── */}
        {rooms.length > 0 && activeTab === 'booked' && (
          <BookingsCalendar rooms={rooms} onRoomClick={handleRoomClick} />
        )}

        {/* ───── Activity Tab (full-width two-column) ───── */}
        {rooms.length > 0 && activeTab === 'activity' && (
          <div className="flex gap-6 items-start">
            <div className="flex-1 min-w-0">
              <ActivityLog activities={activities} />
            </div>

            {/* Activity summary sidebar */}
            <aside className="hidden lg:block w-64 shrink-0 sticky top-6">
              <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4">
                <h3 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-widest mb-3">Sammanfattning</h3>
                <div className="space-y-2">
                  <SummaryRow label="Bokningar" count={activities.filter(e => e.type === 'room_confirmed').length} color="bg-emerald-500" />
                  <SummaryRow label="Avbokningar" count={activities.filter(e => e.type === 'room_cancelled').length} color="bg-red-500" />
                  <SummaryRow label="Samtal" count={activities.filter(e => e.type === 'call_started').length} color="bg-blue-500" />
                  <SummaryRow label="Sökningar" count={activities.filter(e => e.type === 'rooms_queried').length} color="bg-violet-500" />
                </div>
              </div>
            </aside>
          </div>
        )}
      </div>

      {/* ───── Footer ───── */}
      <footer className="border-t border-[var(--border)] mt-12">
        <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-4">
            <span className="font-heading text-sm font-semibold text-[var(--text-primary)]">Grand Hotel Kollegan</span>
            <span className="text-xs text-[var(--text-muted)]">Storgatan 1, Stockholm</span>
          </div>
          <p className="text-xs text-[var(--text-muted)]">
            Demo — Powered by Vapi AI
          </p>
        </div>
      </footer>

      <MajaContact />

      {selectedRoom && (
        <BookingDialog
          room={selectedRoom}
          onClose={() => setSelectedRoom(null)}
          onBooked={() => setSelectedRoom(null)}
        />
      )}
    </main>
  );
}

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
