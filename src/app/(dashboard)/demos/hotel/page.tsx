'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Room } from '@demos/hotel/domain/room.entity';
import { resetRooms } from '@demos/hotel/api/rooms';
import { useRealtimeStore, selectRooms, selectActivities, selectOnCall, selectConnected, selectAvailableCount, selectBookedCount, selectLockedCount, selectOccupancy } from '@demos/hotel/ui/stores/hotel-realtime-store';
import { useToast } from '@shared/ui/toast/toast-context';
import { CheckCircleIcon, XCircleIcon, LockIcon, PhoneIcon, PhoneOffIcon } from '@shared/ui/icons';
import ToastContainer from '@shared/ui/toast/toast-container';
import { TAB_TRANSITION } from '@shared/lib/motion';

import HotelGrid from '@demos/hotel/ui/components/room-grid';
import ActivityLog from '@demos/hotel/activity/components/activity-log';
import KolleganContact from '@modules/core/voice/ui/components/kollegan-contact';
import RoomDetailModal from '@demos/hotel/ui/components/room-detail-modal';
import HotelInfoTab from '@demos/hotel/ui/components/hotel-info-tab';
import CrmTab from '@modules/supporting/crm/ui/components/crm-tab';
import SetupTab from '@modules/generic/dashboard/components/setup-tab';
import CalendarTab from '@demos/hotel/ui/components/calendar-tab';
import AnimatedNumber from '@shared/ui/animated-number';
import SplashScreen from '@modules/generic/dashboard/components/splash-screen';
import DashboardHeader from '@modules/generic/dashboard/components/dashboard-header';
import DashboardSidebar from '@modules/generic/dashboard/components/dashboard-sidebar';

type Tab = 'available' | 'activity' | 'hotel-info' | 'crm' | 'calendar' | 'setup';

export default function HotelDemoPage() {
  const rooms = useRealtimeStore(selectRooms);
  const activities = useRealtimeStore(selectActivities);
  const onCall = useRealtimeStore(selectOnCall);
  const connected = useRealtimeStore(selectConnected);
  const availableCount = useRealtimeStore(selectAvailableCount);
  const bookedCount = useRealtimeStore(selectBookedCount);
  const lockedCount = useRealtimeStore(selectLockedCount);
  const occupancy = useRealtimeStore(selectOccupancy);

  const { toasts, addToast, dismissToast } = useToast();

  /* ── Grid distortion — mouse parallax, pauses when any modal is open ── */
  const gridRafRef = useRef<number | null>(null);
  const isModalOpenRef = useRef(false);
  useEffect(() => {
    let targetX = 0, targetY = 0, currentX = 0, currentY = 0;
    const onMove = (e: MouseEvent) => {
      if (!isModalOpenRef.current) {
        targetX = (e.clientX / window.innerWidth - 0.5) * 20;
        targetY = (e.clientY / window.innerHeight - 0.5) * 20;
      }
    };
    const tick = () => {
      if (isModalOpenRef.current) {
        // Return grid to center when modal is open
        targetX = 0;
        targetY = 0;
      }
      currentX += (targetX - currentX) * 0.06;
      currentY += (targetY - currentY) * 0.06;
      document.documentElement.style.setProperty('--grid-offset-x', `${currentX.toFixed(2)}px`);
      document.documentElement.style.setProperty('--grid-offset-y', `${currentY.toFixed(2)}px`);
      gridRafRef.current = requestAnimationFrame(tick);
    };
    window.addEventListener('mousemove', onMove, { passive: true });
    gridRafRef.current = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener('mousemove', onMove);
      if (gridRafRef.current !== null) cancelAnimationFrame(gridRafRef.current);
    };
  }, []);

  /* ── Scroll ref — passed to header for scroll-linked shadow ── */
  const mainScrollRef = useRef<HTMLElement>(null);

  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const selectedRoom = selectedRoomId ? (rooms.find((r) => r.id === selectedRoomId) ?? null) : null;
  // Keep last room data alive during the Dialog close animation
  const lastSelectedRoomRef = useRef<Room | null>(null);
  if (selectedRoom) lastSelectedRoomRef.current = selectedRoom;
  const modalDisplayRoom = selectedRoom ?? lastSelectedRoomRef.current;
  // Sync modal-open state into ref for parallax pause
  isModalOpenRef.current = selectedRoomId !== null;
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
          : { message: 'Samtal avslutat', color: 'gray', icon: <PhoneOffIcon size={14} className="text-(--text-muted)" /> }
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
    activity: activities.length,
    'hotel-info': hotelServiceCount,
    crm: crmCount,
    calendar: rooms.filter((r) => r.status === 'booked').length,
    setup: 0,
  };

  return (
    <>
      <AnimatePresence>
        {showSplash && <SplashScreen key="splash" onDone={handleSplashDone} />}
      </AnimatePresence>

      <div
        className="relative h-full grid grid-rows-[auto_1fr_auto]"
        style={{ zIndex: 1 }}
        aria-hidden={showSplash ? 'true' : undefined}
      >
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
          scrollRef={mainScrollRef}
        />

        {/* ═══════ BODY ═══════ */}
        <div className="flex relative overflow-hidden">
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
          <main ref={mainScrollRef} className="flex-1 min-w-0 overflow-y-auto overscroll-contain p-6">
            {/* Mobile stat row */}
            {rooms.length > 0 && (
              <div className="flex md:hidden items-center gap-2 flex-wrap mb-4 text-xs text-(--text-muted)">
                <span className="font-semibold text-(--text-primary)">
                  <AnimatedNumber value={availableCount} />
                </span>{' '}
                lediga <span>·</span>
                <span className="font-semibold text-(--text-primary)">
                  <AnimatedNumber value={lockedCount} />
                </span>{' '}
                res. <span>·</span>
                <span className="font-semibold text-(--text-primary)">
                  <AnimatedNumber value={bookedCount} />
                </span>{' '}
                bokade <span>·</span>
                <span className="font-semibold text-(--text-primary)">
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
                      className="rounded-2xl border border-(--border) p-5 space-y-3 fade-in-up glass-panel"
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
                <p className="text-center text-sm text-(--text-muted) mt-4">
                  Ansluter till realtidsström...
                </p>
              </div>
            )}

            {/* Tab content — AnimatePresence for smooth enter/exit */}
            <AnimatePresence mode="wait">
              {rooms.length > 0 && activeTab === 'available' && (
                <motion.div key="available" {...TAB_TRANSITION}>
                  <HotelGrid rooms={rooms} onRoomClick={handleRoomClick} />
                </motion.div>
              )}

              {rooms.length > 0 && activeTab === 'activity' && (
                <motion.div key="activity" {...TAB_TRANSITION}>
                  <ActivityLog
                    activities={activities}
                    focusEventId={focusEventId}
                    onFocusConsumed={() => setFocusEventId(null)}
                  />
                </motion.div>
              )}

              {activeTab === 'hotel-info' && (
                <motion.div key="hotel-info" {...TAB_TRANSITION}>
                  <HotelInfoTab onCountChange={setHotelServiceCount} />
                </motion.div>
              )}

              {activeTab === 'crm' && (
                <motion.div key="crm" {...TAB_TRANSITION}>
                  <CrmTab activities={activities} onCountChange={setCrmCount} />
                </motion.div>
              )}

              {activeTab === 'calendar' && (
                <motion.div key="calendar" {...TAB_TRANSITION}>
                  <CalendarTab rooms={rooms} onRoomClick={handleRoomClick} />
                </motion.div>
              )}

              {activeTab === 'setup' && (
                <motion.div key="setup" {...TAB_TRANSITION}>
                  <SetupTab />
                </motion.div>
              )}
            </AnimatePresence>
          </main>
        </div>

        {/* ═══════ FOOTER ═══════ */}
        <footer className="glass-header border-t border-white/40 dark:border-white/8">
          <div className="px-6 py-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-linear-to-br from-amber-400 to-amber-600 flex items-center justify-center shrink-0">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M3 21h18" /><path d="M5 21V7l7-4 7 4v14" /><path d="M9 21v-4h6v4" />
                  </svg>
                </div>
                <div>
                  <span className="font-heading text-sm font-semibold text-(--text-primary)">
                    Grand Hotel Kollegan
                  </span>
                  <div className="flex items-center gap-4 mt-0.5">
                    <span className="text-xs text-(--text-muted) flex items-center gap-1">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="shrink-0" aria-hidden="true">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
                      </svg>
                      Storgatan 1, Stockholm
                    </span>
                    <span className="text-xs text-(--text-muted) flex items-center gap-1">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="shrink-0" aria-hidden="true">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72" />
                      </svg>
                      08-123 456 78
                    </span>
                  </div>
                </div>
              </div>
              <p className="text-xs text-(--text-muted)">Demo — Powered by Vapi AI</p>
            </div>
          </div>
        </footer>
      </div>

      {/* Room modal — keep mounted during close animation via modalDisplayRoom */}
      {modalDisplayRoom && (
        <RoomDetailModal
          room={modalDisplayRoom}
          open={!!selectedRoom}
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
