'use client';

import { useEffect, useState, useCallback } from 'react';
import { Room, ActivityEvent, SSEMessage } from '@/lib/types';

import HotelGrid from '@/app/components/HotelGrid';
import BookingsCalendar from '@/app/components/BookingsCalendar';
import ActivityLog from '@/app/components/ActivityLog';
import KolleganContact from '@/app/components/KolleganContact';
import RoomDetailModal from '@/app/components/RoomDetailModal';
import HotelInfoTab from '@/app/components/HotelInfoTab';
import CRMTab from '@/app/components/CRMTab';
import AnimatedNumber from '@/app/components/AnimatedNumber';
import SplashScreen from '@/app/components/SplashScreen';
import DashboardHeader from '@/app/components/DashboardHeader';
import DashboardSidebar from '@/app/components/DashboardSidebar';
import StatSummaryCards from '@/app/components/StatSummaryCards';
import ToastContainer, { Toast } from '@/app/components/ToastContainer';

type Tab = 'available' | 'booked' | 'activity' | 'hotel-info' | 'crm';

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
  const [crmCount, setCrmCount] = useState(0);
  const [focusEventId, setFocusEventId] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);

  /* ── Toast helpers ── */
  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).slice(2, 9);
    setToasts((prev) => [...prev.slice(-2), { id, ...toast }]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

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
        const activity = msg.payload as ActivityEvent;
        setActivities((prev) => [activity, ...prev].slice(0, 50));

        if (activity.type === 'room_confirmed') {
          addToast({
            message: `Rum ${activity.roomId ?? ''} bokad`,
            color: 'emerald',
            icon: (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            ),
          });
        } else if (activity.type === 'room_cancelled') {
          addToast({
            message: `Rum ${activity.roomId ?? ''} avbokad`,
            color: 'red',
            icon: (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500">
                <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            ),
          });
        } else if (activity.type === 'room_locked') {
          addToast({
            message: `Rum ${activity.roomId ?? ''} reserveras...`,
            color: 'amber',
            icon: (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-600">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            ),
          });
        }
      } else if (msg.type === 'call_status') {
        const { onCall: newOnCall } = msg.payload as { onCall: boolean };
        setOnCall(newOnCall);
        addToast(
          newOnCall
            ? {
                message: 'Inkommande samtal',
                color: 'indigo',
                icon: (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-600">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                ),
              }
            : {
                message: 'Samtal avslutat',
                color: 'gray',
                icon: (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--text-muted)]">
                    <path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ),
              }
        );
      }
    };

    return () => es.close();
  }, [addToast]);

  const handleReset = useCallback(async () => {
    await fetch('/api/rooms', { method: 'DELETE' });
  }, []);

  const handleRoomClick = useCallback((room: Room) => {
    if (room.status === 'locked') return;
    setSelectedRoom(room);
  }, []);

  const handleSplashDone = useCallback(() => setShowSplash(false), []);

  const handleActivityClick = useCallback((eventId: string) => {
    setActiveTab('activity');
    setFocusEventId(eventId);
  }, []);

  /* ── Derived counts ── */
  const availableCount = rooms.filter((r) => r.status === 'available').length;
  const bookedCount = rooms.filter((r) => r.status === 'booked').length;
  const lockedCount = rooms.filter((r) => r.status === 'locked').length;
  const occupancy =
    rooms.length > 0
      ? Math.round(((bookedCount + lockedCount) / rooms.length) * 100)
      : 0;

  const tabCounts: Record<Tab, number> = {
    available: availableCount + lockedCount,
    booked: bookedCount,
    activity: activities.length,
    'hotel-info': hotelServiceCount,
    crm: crmCount,
  };

  return (
    <>
      {showSplash && <SplashScreen onDone={handleSplashDone} />}

      <div className="min-h-screen grid grid-rows-[auto_1fr_auto]">
        {/* ═══════ HEADER ═══════ */}
        <DashboardHeader
          onCall={onCall}
          connected={connected}
          onReset={handleReset}
          onToggleMobileMenu={() => setMobileMenuOpen((v) => !v)}
          mobileMenuOpen={mobileMenuOpen}
          availableCount={availableCount}
          bookedCount={bookedCount}
          lockedCount={lockedCount}
          occupancy={occupancy}
          hasData={rooms.length > 0}
        />

        {/* ═══════ BODY ═══════ */}
        <div className="flex relative">
          {/* Mobile overlay */}
          {mobileMenuOpen && (
            <div
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-30 lg:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
          )}

          {/* Sidebar */}
          <DashboardSidebar
            activeTab={activeTab}
            onTabChange={setActiveTab}
            tabCounts={tabCounts}
            activities={activities}
            mobileMenuOpen={mobileMenuOpen}
            onActivityClick={handleActivityClick}
            onMobileClose={() => setMobileMenuOpen(false)}
          />

          {/* Main */}
          <main className="flex-1 min-w-0 p-6">
            {/* Mobile stat row */}
            {rooms.length > 0 && (
              <div className="flex md:hidden items-center gap-2 flex-wrap mb-4 text-xs text-[var(--text-muted)]">
                <span className="font-semibold text-[var(--text-primary)]">
                  <AnimatedNumber value={availableCount} />
                </span>{' '}
                lediga <span>·</span>
                <span className="font-semibold text-[var(--text-primary)]">
                  <AnimatedNumber value={lockedCount} />
                </span>{' '}
                res. <span>·</span>
                <span className="font-semibold text-[var(--text-primary)]">
                  <AnimatedNumber value={bookedCount} />
                </span>{' '}
                bokade <span>·</span>
                <span className="font-semibold text-[var(--text-primary)]">
                  <AnimatedNumber value={occupancy} />%
                </span>
              </div>
            )}

            {/* Loading skeleton */}
            {rooms.length === 0 && (
              <div className="space-y-6 py-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                  {[0, 1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className="rounded-2xl border border-[var(--border)] p-5 space-y-3 fade-in-up glass-panel"
                      style={{ animationDelay: `${i * 60}ms` }}
                    >
                      <div className="flex justify-between">
                        <div className="h-7 w-12 skeleton" />
                        <div className="h-7 w-7 rounded-lg skeleton" />
                      </div>
                      <div className="h-3 w-20 skeleton" />
                      <div className="h-3 w-16 skeleton mt-4" />
                    </div>
                  ))}
                </div>
                <p className="text-center text-sm text-[var(--text-muted)] mt-4">
                  Ansluter till realtidsström...
                </p>
              </div>
            )}

            {/* Available tab */}
            {rooms.length > 0 && activeTab === 'available' && (
              <div key="available" className="tab-content-enter">
                <StatSummaryCards
                  availableCount={availableCount}
                  lockedCount={lockedCount}
                  bookedCount={bookedCount}
                  occupancy={occupancy}
                  totalRooms={rooms.length}
                />
                <HotelGrid rooms={rooms} onRoomClick={handleRoomClick} />
              </div>
            )}

            {/* Booked tab */}
            {rooms.length > 0 && activeTab === 'booked' && (
              <div key="booked" className="tab-content-enter">
                <BookingsCalendar rooms={rooms} onRoomClick={handleRoomClick} />
              </div>
            )}

            {/* Activity tab */}
            {rooms.length > 0 && activeTab === 'activity' && (
              <div key="activity" className="tab-content-enter">
                <ActivityLog
                  activities={activities}
                  focusEventId={focusEventId}
                  onFocusConsumed={() => setFocusEventId(null)}
                />
              </div>
            )}

            {/* Hotel info tab */}
            {activeTab === 'hotel-info' && (
              <div key="hotel-info" className="tab-content-enter">
                <HotelInfoTab onCountChange={setHotelServiceCount} />
              </div>
            )}

            {/* CRM tab */}
            {activeTab === 'crm' && (
              <div key="crm" className="tab-content-enter">
                <CRMTab activities={activities} onCountChange={setCrmCount} />
              </div>
            )}
          </main>
        </div>

        {/* ═══════ FOOTER ═══════ */}
        <footer className="glass-header border-t border-white/40 dark:border-white/8">
          <div className="px-6 py-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shrink-0">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 21h18" /><path d="M5 21V7l7-4 7 4v14" /><path d="M9 21v-4h6v4" />
                  </svg>
                </div>
                <div>
                  <span className="font-heading text-sm font-semibold text-[var(--text-primary)]">
                    Grand Hotel Kollegan
                  </span>
                  <div className="flex items-center gap-4 mt-0.5">
                    <span className="text-xs text-[var(--text-muted)] flex items-center gap-1">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
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
              <p className="text-xs text-[var(--text-muted)]">Demo — Powered by Vapi AI</p>
            </div>
          </div>
        </footer>
      </div>

      {/* Room modal */}
      {selectedRoom && (
        <RoomDetailModal
          room={selectedRoom}
          onClose={() => setSelectedRoom(null)}
          onBooked={() => setSelectedRoom(null)}
        />
      )}

      {/* Kollegan widget */}
      <KolleganContact variant="draggable" />

      {/* Toast notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </>
  );
}
