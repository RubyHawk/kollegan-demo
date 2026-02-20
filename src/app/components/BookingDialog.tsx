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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-navy-900 border border-navy-700 rounded-2xl p-6 w-full max-w-sm shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-xl font-bold font-heading text-cream-100">
              Rum {room.id}
            </h2>
            <p className="text-xs text-cream-500 mt-0.5">
              {TYPE_LABELS[room.type] ?? room.type} — Våning {room.floor}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-cream-600 hover:text-cream-300 transition-colors text-lg leading-none"
          >
            &times;
          </button>
        </div>

        {isBooked ? (
          /* Booked room details */
          <div className="space-y-4">
            <div className="bg-navy-950 rounded-lg p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-cream-500">Gäst</span>
                <span className="text-cream-200 font-medium">{room.guestName}</span>
              </div>
              {room.checkIn && (
                <div className="flex justify-between">
                  <span className="text-cream-500">Incheckning</span>
                  <span className="text-cream-200">{room.checkIn}</span>
                </div>
              )}
              {room.checkOut && (
                <div className="flex justify-between">
                  <span className="text-cream-500">Utcheckning</span>
                  <span className="text-cream-200">{room.checkOut}</span>
                </div>
              )}
            </div>

            {error && (
              <p className="text-xs text-red-400">{error}</p>
            )}

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 text-sm text-cream-400 border border-navy-700 hover:border-cream-600 rounded-lg py-2.5 transition-colors"
              >
                Stäng
              </button>
              <button
                onClick={handleCancel}
                disabled={loading}
                className="flex-1 text-sm bg-red-900/50 text-red-300 border border-red-800 hover:bg-red-900 rounded-lg py-2.5 transition-colors disabled:opacity-50"
              >
                {loading ? 'Avbokar...' : 'Avboka'}
              </button>
            </div>
          </div>
        ) : (
          /* Booking form */
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs text-cream-400 mb-1.5">Gästnamn</label>
              <input
                type="text"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                placeholder="Anna Svensson"
                required
                autoFocus
                className="w-full bg-navy-950 border border-navy-700 rounded-lg px-3 py-2.5 text-sm text-cream-100 placeholder:text-cream-700 focus:outline-none focus:border-gold-600 transition-colors"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-cream-400 mb-1.5">Incheckning</label>
                <input
                  type="date"
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                  required
                  className="w-full bg-navy-950 border border-navy-700 rounded-lg px-3 py-2.5 text-sm text-cream-100 focus:outline-none focus:border-gold-600 transition-colors [color-scheme:dark]"
                />
              </div>
              <div>
                <label className="block text-xs text-cream-400 mb-1.5">Utcheckning</label>
                <input
                  type="date"
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  required
                  className="w-full bg-navy-950 border border-navy-700 rounded-lg px-3 py-2.5 text-sm text-cream-100 focus:outline-none focus:border-gold-600 transition-colors [color-scheme:dark]"
                />
              </div>
            </div>

            {error && (
              <p className="text-xs text-red-400">{error}</p>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 text-sm text-cream-400 border border-navy-700 hover:border-cream-600 rounded-lg py-2.5 transition-colors"
              >
                Avbryt
              </button>
              <button
                type="submit"
                disabled={loading || !guestName.trim()}
                className="flex-1 text-sm bg-gold-900/50 text-gold-300 border border-gold-700 hover:bg-gold-900 rounded-lg py-2.5 transition-colors font-medium disabled:opacity-50"
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
