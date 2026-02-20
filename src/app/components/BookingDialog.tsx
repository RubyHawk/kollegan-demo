'use client';

import { useState } from 'react';
import { Room } from '@/lib/types';

const TYPE_LABELS: Record<string, string> = {
  Enkel: 'Enkelt rum',
  Dubbel: 'Dubbelrum',
  Svit: 'Svit',
};

interface Props {
  room: Room;
  onClose: () => void;
  onBooked: () => void;
}

export default function BookingDialog({ room, onClose, onBooked }: Props) {
  const [guestName, setGuestName] = useState('');
  const [checkIn, setCheckIn] = useState(() => {
    const d = new Date();
    return d.toISOString().split('T')[0];
  });
  const [checkOut, setCheckOut] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toISOString().split('T')[0];
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName.trim()) return;

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/rooms/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          room_id: room.id,
          guest_name: guestName.trim(),
          check_in: checkIn,
          check_out: checkOut,
        }),
      });

      const data = await res.json();
      if (data.success) {
        onBooked();
      } else {
        setError(data.message || 'Något gick fel.');
      }
    } catch {
      setError('Nätverksfel. Försök igen.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/rooms/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ room_id: room.id }),
      });

      const data = await res.json();
      if (data.success) {
        onBooked();
      } else {
        setError(data.message || 'Kunde inte avboka.');
      }
    } catch {
      setError('Nätverksfel. Försök igen.');
    } finally {
      setLoading(false);
    }
  };

  const isBooked = room.status === 'booked';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl border border-stone-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold font-heading text-stone-800">
              Rum {room.id}
            </h2>
            <p className="text-sm text-stone-500 mt-0.5">
              {TYPE_LABELS[room.type] ?? room.type} — Våning {room.floor}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-600 transition-colors w-8 h-8 flex items-center justify-center rounded-lg hover:bg-stone-100"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {isBooked ? (
          /* Booked room details */
          <div className="space-y-5">
            <div className="bg-stone-50 rounded-xl p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-stone-500">Gäst</span>
                <span className="text-sm text-stone-800 font-semibold">{room.guestName}</span>
              </div>
              {room.checkIn && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-stone-500">Incheckning</span>
                  <span className="text-sm text-stone-800">{formatDate(room.checkIn)}</span>
                </div>
              )}
              {room.checkOut && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-stone-500">Utcheckning</span>
                  <span className="text-sm text-stone-800">{formatDate(room.checkOut)}</span>
                </div>
              )}
              {room.checkIn && room.checkOut && (
                <div className="flex justify-between items-center pt-2 border-t border-stone-200">
                  <span className="text-sm text-stone-500">Nätter</span>
                  <span className="text-sm text-stone-800 font-semibold">
                    {getNights(room.checkIn, room.checkOut)}
                  </span>
                </div>
              )}
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 text-sm text-stone-600 bg-stone-100 hover:bg-stone-200 rounded-xl py-3 font-medium transition-colors"
              >
                Stäng
              </button>
              <button
                onClick={handleCancel}
                disabled={loading}
                className="flex-1 text-sm text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl py-3 font-medium transition-colors disabled:opacity-50"
              >
                {loading ? 'Avbokar...' : 'Avboka'}
              </button>
            </div>
          </div>
        ) : (
          /* Booking form */
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">Gästnamn</label>
              <input
                type="text"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                placeholder="Anna Svensson"
                required
                autoFocus
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-sm text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">Incheckning</label>
                <input
                  type="date"
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                  required
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">Utcheckning</label>
                <input
                  type="date"
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  required
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all"
                />
              </div>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 text-sm text-stone-600 bg-stone-100 hover:bg-stone-200 rounded-xl py-3 font-medium transition-colors"
              >
                Avbryt
              </button>
              <button
                type="submit"
                disabled={loading || !guestName.trim()}
                className="flex-1 text-sm text-white bg-stone-800 hover:bg-stone-900 rounded-xl py-3 font-semibold transition-colors disabled:opacity-40"
              >
                {loading ? 'Bokar...' : 'Boka rum'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('sv-SE', { day: 'numeric', month: 'long', year: 'numeric' });
}

function getNights(checkIn: string, checkOut: string): number {
  const a = new Date(checkIn + 'T00:00:00');
  const b = new Date(checkOut + 'T00:00:00');
  return Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}
