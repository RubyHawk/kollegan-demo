'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { Room } from '@features/rooms/types';
import { resetRooms } from '@features/rooms/api';
import { useRealtimeStore, selectRooms, selectActivities, selectOnCall, selectConnected, selectAvailableCount, selectBookedCount, selectLockedCount, selectOccupancy } from '@shared/stores/realtime-store';
import { useToast } from '@shared/ui/toast/toast-context';
import { CheckCircleIcon, XCircleIcon, LockIcon, PhoneIcon, PhoneOffIcon } from '@shared/ui/icons';
import ToastContainer from '@shared/ui/toast/toast-container';

import HotelGrid from '@/app/components/HotelGrid';
import BookingsCalendar from '@/app/components/BookingsCalendar';
import ActivityLog from '@/app/components/ActivityLog';
import KolleganContact from '@/app/components/KolleganContact';
import RoomDetailModal from '@/app/components/RoomDetailModal';
import HotelInfoTab from '@/app/components/HotelInfoTab';
import CRMTab from '@/app/components/CRMTab';
import SetupTab from '@/app/components/SetupTab';
import AnimatedNumber from '@/app/components/AnimatedNumber';
import SplashScreen from '@/app/components/SplashScreen';
import DashboardHeader from '@/app/components/DashboardHeader';
import DashboardSidebar from '@/app/components/DashboardSidebar';

type Tab = 'available' | 'booked' | 'activity' | 'hotel-info' | 'crm' | 'setup';

export default function HomePage() {
  const rooms = useRealtimeStore(selectRooms);
  const activities = useRealtimeStore(selectActivities);
  const onCall = useRealtimeStore(selectOnCall);
  const connected = useRealtimeStore(selectConnected);
  const availableCount = useRealtimeStore(selectAvailableCount);
  const bookedCount = useRealtimeStore(selectBookedCount);
  const lockedCount = useRealtimeStore(selectLockedCount);
  const occupancy = useRealtimeStore(selectOccupancy);

  const { toasts, addToast, dismissToast } = useToast();

  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const selectedRoom = selectedRoomId ? (rooms.find((r) => r.id === selectedRoomId) ?? null) : null;
  const [activeTab, setActiveTab] = useState<Tab>('available');
  const [showSplash, setShowSplash] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [hotelServiceCount, setHotelServiceCount] = useState(0);
  const [crmCount, setCrmCount] = useState(0);
  const [focusEventId, setFocusEventId] = useState<string | null>(null);

  /* ── Activity-based toasts ── */
  const lastActivityIdRef = useRef<string | null>(null);
  const prevOnCallRef = useRef(onCall);

  useEffect(() => {
    if (activities.length === 0) return;
    const latest = activities[0];
    if (!latest || latest.id === lastActivityIdRef.current) return;
    lastActivityIdRef.current = latest.id;

    if (latest.type === 'room_confirmed') {
      addToast({
        message: `Rum ${latest.roomId ?? ''} bokad`,
        color: 'emerald',
        icon: <CheckCircleIcon size={14} className="text-emerald-600" />,
      });
    } else if (latest.type === 'room_cancelled') {
      addToast({
        message: `Rum ${latest.roomId ?? ''} avbokad`,
        color: 'red',
        icon: <XCircleIcon size={14} className="text-red-500" />,
      });
    } else if (latest.type === 'room_locked') {
      addToast({
        message: `Rum ${latest.roomId ?? ''} reserveras...`,
        color: 'amber',
        icon: <LockIcon size={14} className="text-amber-600" />,
      });
    }
  }, [activities, addToast]);

  useEffect(() => {
    if (prevOnCallRef.current !== onCall) {
      prevOnCallRef.current = onCall;
      addToast(
        onCall
          ? { message: 'Inkommande samtal', color: 'indigo', icon: <PhoneIcon size={14} className="text-indigo-600" /> }
          : { message: 'Samtal avslutat', color: 'gray', icon: <PhoneOffIcon size={14} className="text-[var(--text-muted)]" /> }
      );
    }
  }, [onCall, addToast]);

  const handleReset = useCallback(async () => {
    await resetRooms();
  }, []);

  const handleRoomClick = useCallback((room: Room) => {
    if (room.status === 'locked') return;
    setSelectedRoomId(room.id);
  }, []);

  const handleSplashDone = useCallback(() => setShowSplash(false), []);

  const handleActivityClick = useCallback((eventId: string) => {
    setActiveTab('activity');
    setFocusEventId(eventId);
  }, []);

  const tabCounts: Record<Tab, number> = {
    available: availableCount + lockedCount,
    booked: bookedCount,
    activity: activities.length,
    'hotel-info': hotelServiceCount,
    crm: crmCount,
    setup: 0,
  };

  return (
    <>
      {showSplash && <SplashScreen onDone={handleSplashDone} />}

      <div className="min-h-screen grid grid-rows-[auto_1fr_auto]">
        {/* ═══════ HEADER ═══════ */}
        <DashboardHeader
          onCall={onCall}
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
            connected={connected}
            onReset={handleReset}
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

            {/* Setup tab */}
            {activeTab === 'setup' && (
              <div key="setup" className="tab-content-enter">
                <SetupTab />
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
          onClose={() => setSelectedRoomId(null)}
          onBooked={() => setSelectedRoomId(null)}
        />
      )}

      {/* Kollegan widget */}
      <KolleganContact variant="draggable" />

      {/* Toast notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </>
  );
}
