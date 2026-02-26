'use client';

import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@shared/ui/dialog';
import { Button } from '@shared/ui/button';
import { Input } from '@shared/ui/input';
import { Label } from '@shared/ui/label';
import { Room } from '@features/hotel/rooms/types';
import { getRoomMeta, AMENITY_ICONS, AmenityDef } from '@features/hotel/rooms/lib/room-meta';
import { bookRoom, cancelBooking } from '@features/hotel/rooms/api';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';

// ── Custom date field — entire surface is clickable ───────────────────────────
function DateField({
  id, label, value, min, onChange, required,
}: {
  id: string;
  label: string;
  value: string;
  min?: string;
  onChange: (v: string) => void;
  required?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const display = value
    ? new Date(value + 'T00:00:00').toLocaleDateString('sv-SE', { day: 'numeric', month: 'short', year: 'numeric' })
    : '—';

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div
        className="relative flex items-center gap-2 px-3 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface-alt)] cursor-pointer hover:border-purple-500/60 dark:hover:border-amber-400/60 transition-all group"
        onClick={() => inputRef.current?.showPicker?.()}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--text-muted)] shrink-0 pointer-events-none group-hover:text-[var(--accent)] transition-colors" aria-hidden="true">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
        <span className="text-sm text-[var(--text-primary)] pointer-events-none select-none flex-1">
          {display}
        </span>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--text-muted)] shrink-0 pointer-events-none" aria-hidden="true">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
        {/* Hidden native input — covers entire area so any click opens picker */}
        <input
          ref={inputRef}
          id={id}
          type="date"
          value={value}
          min={min}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
          style={{ colorScheme: 'light' }}
          aria-label={label}
        />
      </div>
    </div>
  );
}

interface Props {
  room: Room;
  onClose: () => void;
  onBooked: () => void;
}

const TYPE_LABELS: Record<string, string> = {
  Enkel: 'Enkelt rum',
  Dubbel: 'Dubbelrum',
  Svit: 'Svit',
};

const TYPE_GRADIENT: Record<string, string> = {
  Enkel: 'from-amber-800 via-stone-800 to-stone-900',
  Dubbel: 'from-blue-900 via-slate-800 to-slate-900',
  Svit: 'from-violet-900 via-purple-900 to-indigo-950',
};

function AmenityBadge({ amenity }: { amenity: AmenityDef }) {
  return (
    <div className="flex items-center gap-1.5 bg-[var(--surface-alt)] border border-[var(--border)] rounded-lg px-2.5 py-1.5">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-purple-700 dark:text-amber-400 shrink-0">
        <path d={AMENITY_ICONS[amenity.key]} />
      </svg>
      <span className="text-[11px] font-medium text-[var(--text-secondary)]">{amenity.label}</span>
    </div>
  );
}

export default function RoomDetailModal({ room, onClose, onBooked }: Props) {
  const today = new Date().toISOString().split('T')[0];

  const [guestName, setGuestName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [checkIn, setCheckIn] = useState(today);
  const [checkOut, setCheckOut] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toISOString().split('T')[0];
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const meta = getRoomMeta(room.id, room.type);
  const isBooked = room.status === 'booked';

  // minimum checkout = day after check-in
  const minCheckOut = (() => {
    const d = new Date(checkIn + 'T00:00:00');
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  })();

  const nights = Math.round(
    (new Date(checkOut + 'T00:00:00').getTime() - new Date(checkIn + 'T00:00:00').getTime()) /
      (1000 * 60 * 60 * 24),
  );
  const total = Math.max(0, nights) * meta.price;

  const handleCheckInChange = (val: string) => {
    setCheckIn(val);
    // if current checkout is no longer after the new check-in, advance it
    if (checkOut <= val) {
      const d = new Date(val + 'T00:00:00');
      d.setDate(d.getDate() + 1);
      setCheckOut(d.toISOString().split('T')[0]);
    }
  };

  const handleBook = async (e: React.FormEvent) => {
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
      if (data.success) onBooked();
      else setError(data.message || 'Något gick fel.');
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
      if (data.success) onBooked();
      else setError(data.message || 'Kunde inte avboka.');
    } catch {
      setError('Nätverksfel. Försök igen.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-lg p-0 dark:bg-zinc-900" aria-describedby={undefined}>
          <VisuallyHidden>
            <DialogTitle>Rum {room.id} detaljer</DialogTitle>
          </VisuallyHidden>

          {/* ── Compact gradient header ── */}
          <div className={`relative bg-gradient-to-r ${TYPE_GRADIENT[room.type] ?? TYPE_GRADIENT.Enkel} px-6 py-4 overflow-hidden`}>
            {/* dot pattern */}
            <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '20px 20px' }} />
            {room.type === 'Svit' && <div className="absolute inset-0 svit-shimmer opacity-40 pointer-events-none" />}

            <div className="relative z-10 flex items-center justify-between gap-4">
              {/* Left: room id + meta */}
              <div className="flex items-center gap-4">
                <div>
                  <div className="font-heading text-4xl font-bold text-white/95 leading-none">
                    {room.id}
                  </div>
                  <div className="text-white/55 text-xs mt-0.5 font-medium tracking-wide">
                    {TYPE_LABELS[room.type] ?? room.type} · Våning {room.floor} · {meta.size} m² · {meta.view}
                  </div>
                </div>
              </div>

              {/* Right: price + close */}
              <div className="flex items-center gap-3 shrink-0">
                <div className="bg-white/12 border border-white/20 backdrop-blur-sm rounded-xl px-3 py-1.5 text-right">
                  <div className="text-base font-bold text-white leading-tight">
                    {meta.price.toLocaleString('sv-SE')} kr
                  </div>
                  <div className="text-white/50 text-[10px] leading-tight">per natt</div>
                </div>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center text-white/80 hover:bg-white/25 hover:text-white transition-colors"
                  aria-label="Stäng"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* ── Body ── */}
          <div className="p-6 space-y-5 max-h-[60vh] overflow-y-auto">

            {/* Description + amenities */}
            <div>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-3">
                {meta.fullDescription}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {meta.amenities.map((a) => (
                  <AmenityBadge key={a.key} amenity={a} />
                ))}
              </div>
            </div>

            <div className="h-px bg-[var(--border)]" />

            {/* Booking section */}
            {isBooked ? (
              <div className="space-y-4">
                {/* Current booking info */}
                <div className="bg-indigo-50/60 dark:bg-indigo-900/20 border border-indigo-200/50 dark:border-indigo-800/30 rounded-xl p-4 space-y-2.5">
                  <h3 className="text-sm font-semibold text-indigo-700 dark:text-indigo-300 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-indigo-500" />
                    Pågående bokning
                  </h3>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-[var(--text-muted)]">Gäst</span>
                    <span className="text-xs font-semibold text-[var(--text-primary)]">{room.guestName}</span>
                  </div>
                  {room.checkIn && (
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-[var(--text-muted)]">Incheckning</span>
                      <span className="text-xs text-[var(--text-primary)]">{formatDate(room.checkIn)}</span>
                    </div>
                  )}
                  {room.checkOut && (
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-[var(--text-muted)]">Utcheckning</span>
                      <span className="text-xs text-[var(--text-primary)]">{formatDate(room.checkOut)}</span>
                    </div>
                  )}
                  {room.checkIn && room.checkOut && (
                    <div className="flex justify-between items-center pt-2 border-t border-indigo-200/40 dark:border-indigo-800/30">
                      <span className="text-xs text-[var(--text-muted)]">Totalt</span>
                      <span className="text-sm font-bold text-[var(--text-primary)]">
                        {(getNights(room.checkIn, room.checkOut) * meta.price).toLocaleString('sv-SE')} kr
                      </span>
                    </div>
                  )}
                </div>

                {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

                <div className="flex gap-3">
                  <Button variant="secondary" onClick={onClose} className="flex-1">
                    Stäng
                  </Button>
                  <Button variant="destructive" onClick={handleCancel} disabled={loading} className="flex-1">
                    {loading ? 'Avbokar...' : 'Avboka'}
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleBook} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="guestName">Gästnamn</Label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                      </svg>
                    </div>
                    <Input
                      id="guestName"
                      placeholder="Anna Svensson"
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      required
                      autoFocus
                      className="pl-9 hover:border-purple-500/60 dark:hover:border-amber-400/60 focus-visible:ring-purple-600 dark:focus-visible:ring-amber-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="email">E-post</Label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" />
                        </svg>
                      </div>
                      <Input
                        id="email"
                        type="email"
                        placeholder="anna@exempel.se"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-9 hover:border-purple-500/60 dark:hover:border-amber-400/60 focus-visible:ring-purple-600 dark:focus-visible:ring-amber-500"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefon</Label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                        </svg>
                      </div>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="+46 70 000 00 00"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="pl-9 hover:border-purple-500/60 dark:hover:border-amber-400/60 focus-visible:ring-purple-600 dark:focus-visible:ring-amber-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <DateField
                    id="checkIn"
                    label="Incheckning"
                    value={checkIn}
                    min={today}
                    onChange={handleCheckInChange}
                    required
                  />
                  <DateField
                    id="checkOut"
                    label="Utcheckning"
                    value={checkOut}
                    min={minCheckOut}
                    onChange={setCheckOut}
                    required
                  />
                </div>

                {/* Price summary */}
                <div className="flex items-center justify-between bg-purple-50/70 dark:bg-amber-900/15 border border-purple-200/50 dark:border-amber-800/30 rounded-xl px-4 py-3">
                  <span className="text-xs text-[var(--text-secondary)]">
                    {nights > 0 ? `${nights} natt${nights !== 1 ? 'er' : ''}` : '—'} × {meta.price.toLocaleString('sv-SE')} kr
                  </span>
                  <span className="text-sm font-bold text-[var(--text-primary)]">
                    {nights > 0 ? `${total.toLocaleString('sv-SE')} kr` : '—'}
                  </span>
                </div>

                {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

                <div className="flex gap-3">
                  <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
                    Avbryt
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading || !guestName.trim() || nights <= 0 || checkIn < today}
                    className="flex-1 font-semibold bg-purple-700 dark:bg-amber-500 text-white hover:bg-purple-800 dark:hover:bg-amber-600"
                  >
                    {loading ? 'Bokar...' : 'Boka rum'}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </DialogContent>
    </Dialog>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('sv-SE', { day: 'numeric', month: 'long', year: 'numeric' });
}

function getNights(checkIn: string, checkOut: string): number {
  const a = new Date(checkIn + 'T00:00:00');
  const b = new Date(checkOut + 'T00:00:00');
  return Math.max(1, Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24)));
}
