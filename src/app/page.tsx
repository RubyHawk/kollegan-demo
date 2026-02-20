'use client';

import { useEffect, useState, useCallback } from 'react';
import { Room, ActivityEvent, SSEMessage } from '@/lib/types';
import HotelGrid from '@/app/components/HotelGrid';
import ActivityLog from '@/app/components/ActivityLog';
import CallIndicator from '@/app/components/CallIndicator';
import MajaContact from '@/app/components/MajaContact';

export default function HomePage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [activities, setActivities] = useState<ActivityEvent[]>([]);
  const [onCall, setOnCall] = useState(false);
  const [connected, setConnected] = useState(false);

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

  return (
    <main className="min-h-screen bg-navy-950 text-cream-100">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-10">
          <div>
            <h1 className="font-heading text-3xl font-bold tracking-tight text-cream-100">
              Grand Hotel Kollegan
            </h1>
            <div className="w-12 h-0.5 bg-gold-500 mt-2 mb-1.5 rounded-full" />
            <p className="text-cream-400 text-sm">Realtidsvy — receptionsöversikt</p>
          </div>

          <div className="flex flex-col sm:items-end gap-3">
            <CallIndicator onCall={onCall} />

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs text-cream-600">
                <div
                  className={[
                    'w-1.5 h-1.5 rounded-full',
                    connected ? 'bg-gold-500' : 'bg-burgundy-400',
                  ].join(' ')}
                />
                {connected ? 'Live' : 'Frånkopplad'}
              </div>

              <button
                onClick={handleReset}
                className="text-xs text-cream-400 hover:text-gold-400 border border-navy-700 hover:border-gold-600 rounded-lg px-3 py-1.5 transition-colors"
              >
                Återställ rum
              </button>
            </div>
          </div>
        </header>

        {rooms.length === 0 && (
          <div className="text-center py-20 text-cream-600">
            <div className="w-6 h-6 border-2 border-gold-600 border-t-gold-400 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm">Ansluter till realtidsström...</p>
          </div>
        )}

        {rooms.length > 0 && (
          <div className="flex gap-6 items-start">
            <div className="flex-1 min-w-0">
              <HotelGrid rooms={rooms} />
            </div>

            <aside className="w-72 shrink-0 sticky top-8">
              <ActivityLog activities={activities} />
            </aside>
          </div>
        )}

        {rooms.length > 0 && (
          <footer className="mt-10 pt-6 border-t border-navy-700 flex flex-wrap gap-6 text-xs text-cream-600">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-emerald-800" />
              <span>Tillgänglig</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-gold-900 border border-gold-600" />
              <span>Reserveras (pågående samtal)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-navy-800" />
              <span>Bokad &amp; bekräftad</span>
            </div>
            <div className="ml-auto text-cream-600">
              Ring <span className="text-gold-400 font-mono">Maja</span> på Vapi för att boka
            </div>
          </footer>
        )}
      </div>

      <MajaContact />
    </main>
  );
}
