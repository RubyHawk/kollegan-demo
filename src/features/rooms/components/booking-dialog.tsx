'use client';

import { useState } from 'react';
import { Room } from '@features/rooms/types';
import { bookRoom, cancelBooking } from '@features/rooms/api';

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
  const today = new Date().toISOString().split('T')[0];

  const [guestName, setGuestName] = useState('');
  const [checkIn, setCheckIn] = useState(today);
  const [checkOut, setCheckOut] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toISOString().split('T')[0];
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const minCheckOut = (() => {
    const d = new Date(checkIn + 'T00:00:00');
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  })();

  const handleCheckInChange = (val: string) => {
    setCheckIn(val);
    if (checkOut <= val) {
      const d = new Date(val + 'T00:00:00');
      d.setDate(d.getDate() + 1);
      setCheckOut(d.toISOString().split('T')[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName.trim()) return;
    if (checkOut <= checkIn) {
      setError('Utcheckning måste vara efter incheckning.');
      return;
    }
    if (checkIn < today) {
      setError('Incheckning kan inte vara i det förflutna.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const data = await bookRoom({
        room_id: room.id,
        guest_name: guestName.trim(),
        check_in: checkIn,
        check_out: checkOut,
      });
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
      const data = await cancelBooking(room.id);
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 dark:bg-black/60 backdrop-blur-sm dialog-overlay-enter"
      onClick={onClose}
    >
      <div
        className="bg-[var(--surface)] rounded-2xl p-6 w-full max-w-sm shadow-2xl border border-[var(--border)] dialog-content-enter"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold font-heading text-[var(--text-primary)]">
              Rum {room.id}
            </h2>
            <p className="text-sm text-[var(--text-muted)] mt-0.5">
              {TYPE_LABELS[room.type] ?? room.type} — Våning {room.floor}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[var(--surface-alt)]"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {isBooked ? (
          <div className="space-y-5">
            <div className="bg-[var(--surface-alt)] rounded-xl p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-[var(--text-muted)]">Gäst</span>
                <span className="text-sm text-[var(--text-primary)] font-semibold">{room.guestName}</span>
              </div>
              {room.checkIn && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-[var(--text-muted)]">Incheckning</span>
                  <span className="text-sm text-[var(--text-primary)]">{formatDate(room.checkIn)}</span>
                </div>
              )}
              {room.checkOut && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-[var(--text-muted)]">Utcheckning</span>
                  <span className="text-sm text-[var(--text-primary)]">{formatDate(room.checkOut)}</span>
                </div>
              )}
              {room.checkIn && room.checkOut && (
                <div className="flex justify-between items-center pt-2 border-t border-[var(--border)]">
                  <span className="text-sm text-[var(--text-muted)]">Nätter</span>
                  <span className="text-sm text-[var(--text-primary)] font-semibold">
                    {getNights(room.checkIn, room.checkOut)}
                  </span>
                </div>
              )}
            </div>

            {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 text-sm text-[var(--text-secondary)] bg-[var(--surface-alt)] hover:bg-[var(--border)] rounded-xl py-3 font-medium transition-all active:scale-95"
              >
                Stäng
              </button>
              <button
                onClick={handleCancel}
                disabled={loading}
                className="flex-1 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 border border-red-200 dark:border-red-800 rounded-xl py-3 font-medium transition-all active:scale-95 disabled:opacity-50"
              >
                {loading ? 'Avbokar...' : 'Avboka'}
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Gästnamn</label>
              <input
                type="text"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                placeholder="Anna Svensson"
                required
                autoFocus
                className="w-full bg-[var(--surface-alt)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Incheckning</label>
                <input
                  type="date"
                  value={checkIn}
                  min={today}
                  onChange={(e) => handleCheckInChange(e.target.value)}
                  required
                  className="w-full bg-[var(--surface-alt)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all [color-scheme:light] dark:[color-scheme:dark]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Utcheckning</label>
                <input
                  type="date"
                  value={checkOut}
                  min={minCheckOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  required
                  className="w-full bg-[var(--surface-alt)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all [color-scheme:light] dark:[color-scheme:dark]"
                />
              </div>
            </div>

            {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 text-sm text-[var(--text-secondary)] bg-[var(--surface-alt)] hover:bg-[var(--border)] rounded-xl py-3 font-medium transition-all active:scale-95"
              >
                Avbryt
              </button>
              <button
                type="submit"
                disabled={loading || !guestName.trim() || checkOut <= checkIn || checkIn < today}
                className="flex-1 text-sm text-white bg-stone-800 dark:bg-slate-200 dark:text-slate-800 hover:bg-stone-900 dark:hover:bg-white rounded-xl py-3 font-semibold transition-all active:scale-95 disabled:opacity-40"
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
