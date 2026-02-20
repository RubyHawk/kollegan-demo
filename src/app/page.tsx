'use client';

import { useEffect, useState, useCallback } from 'react';
import { Room, ActivityEvent, SSEMessage } from '@/lib/types';
import HotelGrid from '@/app/components/HotelGrid';
import BookingsCalendar from '@/app/components/BookingsCalendar';
import ActivityLog from '@/app/components/ActivityLog';
import CallIndicator from '@/app/components/CallIndicator';
import MajaContact from '@/app/components/MajaContact';
import BookingDialog from '@/app/components/BookingDialog';

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

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: 'available', label: 'Tillgängliga', count: availableCount + lockedCount },
    { key: 'booked', label: 'Bokningar', count: bookedCount },
    { key: 'activity', label: 'Aktivitet', count: activities.length },
  ];

  return (
    <main className="min-h-screen bg-[#F8F7F4]">
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="font-heading text-3xl font-bold tracking-tight text-stone-800">
              Grand Hotel Kollegan
            </h1>
            <p className="text-stone-500 text-sm mt-1">Receptionsöversikt</p>
          </div>

          <div className="flex flex-col sm:items-end gap-3">
            <CallIndicator onCall={onCall} />

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs text-stone-500">
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
                className="text-xs text-stone-500 hover:text-stone-800 bg-white border border-stone-200 hover:border-stone-300 rounded-lg px-3 py-1.5 transition-all hover:shadow-sm"
              >
                Återställ
              </button>
            </div>
          </div>
        </header>

        {/* Stats bar */}
        {rooms.length > 0 && (
          <div className="flex gap-3 mb-8">
            <div className="bg-white border border-stone-200 rounded-xl px-4 py-3 flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="text-sm text-stone-600">
                <span className="font-bold text-stone-800">{availableCount}</span> lediga
              </span>
            </div>
            {lockedCount > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                <span className="text-sm text-amber-700">
                  <span className="font-bold">{lockedCount}</span> reserveras
                </span>
              </div>
            )}
            <div className="bg-white border border-stone-200 rounded-xl px-4 py-3 flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
              <span className="text-sm text-stone-600">
                <span className="font-bold text-stone-800">{bookedCount}</span> bokade
              </span>
            </div>
          </div>
        )}

        {/* Tabs */}
        {rooms.length > 0 && (
          <div className="border-b border-stone-200 mb-8">
            <nav className="flex gap-1">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={[
                    'px-4 py-3 text-sm font-medium transition-all relative',
                    activeTab === tab.key
                      ? 'text-stone-800'
                      : 'text-stone-400 hover:text-stone-600',
                  ].join(' ')}
                >
                  {tab.label}
                  {tab.count !== undefined && (
                    <span
                      className={[
                        'ml-1.5 text-xs px-1.5 py-0.5 rounded-full',
                        activeTab === tab.key
                          ? 'bg-stone-800 text-white'
                          : 'bg-stone-100 text-stone-500',
                      ].join(' ')}
                    >
                      {tab.count}
                    </span>
                  )}
                  {activeTab === tab.key && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-stone-800 rounded-full" />
                  )}
                </button>
              ))}
            </nav>
          </div>
        )}

        {/* Loading state */}
        {rooms.length === 0 && (
          <div className="text-center py-20 text-stone-400">
            <div className="w-8 h-8 border-2 border-stone-300 border-t-stone-500 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm">Ansluter till realtidsström...</p>
          </div>
        )}

        {/* Tab content */}
        {rooms.length > 0 && activeTab === 'available' && (
          <HotelGrid rooms={rooms} onRoomClick={handleRoomClick} />
        )}

        {rooms.length > 0 && activeTab === 'booked' && (
          <BookingsCalendar rooms={rooms} onRoomClick={handleRoomClick} />
        )}

        {rooms.length > 0 && activeTab === 'activity' && (
          <div className="max-w-2xl">
            <ActivityLog activities={activities} />
          </div>
        )}
      </div>

      <MajaContact />

      {/* Booking dialog */}
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
