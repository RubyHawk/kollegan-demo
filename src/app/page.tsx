'use client';

import { useEffect, useState, useCallback } from 'react';
import { Room, ActivityEvent, SSEMessage } from '@/lib/types';
import HotelGrid from '@/app/components/HotelGrid';
import ActivityLog from '@/app/components/ActivityLog';
import CallIndicator from '@/app/components/CallIndicator';

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
    <main className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-3xl font-bold tracking-tight">Grand Hotel Kollegan</h1>
              <span className="text-2xl">🏨</span>
            </div>
            <p className="text-gray-500 text-sm">Realtidsvy — receptionsöversikt</p>
          </div>

          <div className="flex flex-col sm:items-end gap-3">
            <CallIndicator onCall={onCall} />

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs text-gray-600">
                <div
                  className={[
                    'w-1.5 h-1.5 rounded-full',
                    connected ? 'bg-green-500' : 'bg-red-600',
                  ].join(' ')}
                />
                {connected ? 'Live' : 'Frånkopplad'}
              </div>

              <button
                onClick={handleReset}
                className="text-xs text-gray-600 hover:text-gray-400 border border-gray-800 hover:border-gray-700 rounded-lg px-3 py-1.5 transition-colors"
              >
                Återställ rum
              </button>
            </div>
          </div>
        </header>

        {rooms.length === 0 && (
          <div className="text-center py-20 text-gray-700">
            <div className="text-4xl mb-3">📡</div>
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
          <footer className="mt-8 pt-6 border-t border-gray-900 flex flex-wrap gap-6 text-xs text-gray-600">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-green-800" />
              <span>Tillgänglig</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-yellow-800" />
              <span>Reserveras (pågående samtal)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-gray-700" />
              <span>Bokad &amp; bekräftad</span>
            </div>
            <div className="ml-auto">
              Ring <span className="text-gray-400 font-mono">Maja</span> på Vapi för att boka
            </div>
          </footer>
        )}
      </div>
    </main>
  );
}
