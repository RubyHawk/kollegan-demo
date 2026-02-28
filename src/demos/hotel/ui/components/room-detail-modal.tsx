'use client';

import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@shared/ui/dialog';
import { Button } from '@shared/ui/button';
import { Input } from '@shared/ui/input';
import { Label } from '@shared/ui/label';
import { Room } from '../../domain/room.entity';
import { getRoomMeta, AMENITY_ICONS, AmenityDef } from '../../domain/room-meta';
import { bookRoom, cancelBooking } from '../../api/rooms';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';

// ── Custom date field ─────────────────────────────────────────────────────────
function DateField({
  id, label, value, min, onChange, required,
}: {
  id: string; label: string; value: string; min?: string;
  onChange: (v: string) => void; required?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const display = value
    ? new Date(value + 'T00:00:00').toLocaleDateString('sv-SE', { day: 'numeric', month: 'short', year: 'numeric' })
    : '—';

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide">{label}</Label>
      <div
        className="relative flex items-center gap-2 px-3 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] cursor-pointer hover:border-purple-400/70 dark:hover:border-amber-400/60 transition-all group shadow-sm"
        onClick={() => inputRef.current?.showPicker?.()}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--text-muted)] shrink-0 pointer-events-none group-hover:text-[var(--accent)] transition-colors" aria-hidden="true">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
        <span className="text-sm text-[var(--text-primary)] pointer-events-none select-none flex-1 font-medium">{display}</span>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--text-muted)] shrink-0 pointer-events-none" aria-hidden="true">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
        <input
          ref={inputRef} id={id} type="date" value={value} min={min}
          onChange={(e) => onChange(e.target.value)} required={required}
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
  open: boolean;
  onClose: () => void;
  onBooked: () => void;
}

const TYPE_LABELS: Record<string, string> = {
  Enkel: 'Enkelt rum',
  Dubbel: 'Dubbelrum',
  Svit: 'Svit',
};

const TYPE_COLOR: Record<string, { dot: string; badge: string }> = {
  Enkel:  { dot: 'bg-stone-400',  badge: 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 border-stone-200 dark:border-stone-700' },
  Dubbel: { dot: 'bg-blue-400',   badge: 'bg-blue-50  dark:bg-blue-900/30 text-blue-700  dark:text-blue-300  border-blue-200  dark:border-blue-800/40' },
  Svit:   { dot: 'bg-amber-400',  badge: 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-700/40' },
};

function AmenityPill({ amenity }: { amenity: AmenityDef }) {
  return (
    <div className="flex items-center gap-1.5 bg-[var(--surface-alt)] border border-[var(--border)] rounded-lg px-2.5 py-1.5">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-purple-600 dark:text-amber-400 shrink-0">
        <path d={AMENITY_ICONS[amenity.key]} />
      </svg>
      <span className="text-[11px] font-medium text-[var(--text-secondary)]">{amenity.label}</span>
    </div>
  );
}

export default function RoomDetailModal({ room, open, onClose, onBooked }: Props) {
  const today = new Date().toISOString().split('T')[0];

  const [guestName, setGuestName] = useState('');
  const [email, setEmail]         = useState('');
  const [phone, setPhone]         = useState('');
  const [checkIn, setCheckIn]     = useState(today);
  const [checkOut, setCheckOut]   = useState(() => {
    const d = new Date(); d.setDate(d.getDate() + 2); return d.toISOString().split('T')[0];
  });
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');

  const meta     = getRoomMeta(room.id, room.type);
  const isBooked = room.status === 'booked';
  const tc       = TYPE_COLOR[room.type] ?? TYPE_COLOR.Enkel;

  const minCheckOut = (() => {
    const d = new Date(checkIn + 'T00:00:00'); d.setDate(d.getDate() + 1); return d.toISOString().split('T')[0];
  })();

  const nights = Math.round(
    (new Date(checkOut + 'T00:00:00').getTime() - new Date(checkIn + 'T00:00:00').getTime()) / (1000 * 60 * 60 * 24),
  );
  const total = Math.max(0, nights) * meta.price;

  const handleCheckInChange = (val: string) => {
    setCheckIn(val);
    if (checkOut <= val) {
      const d = new Date(val + 'T00:00:00'); d.setDate(d.getDate() + 1); setCheckOut(d.toISOString().split('T')[0]);
    }
  };

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName.trim()) return;
    if (checkOut <= checkIn) { setError('Utcheckning måste vara efter incheckning.'); return; }
    if (checkIn < today)     { setError('Incheckning kan inte vara i det förflutna.'); return; }
    setLoading(true); setError('');
    try {
      const data = await bookRoom({ room_id: room.id, guest_name: guestName.trim(), check_in: checkIn, check_out: checkOut });
      if (data.success) onBooked();
      else setError(data.message || 'Något gick fel.');
    } catch { setError('Nätverksfel. Försök igen.'); }
    finally  { setLoading(false); }
  };

  const handleCancel = async () => {
    setLoading(true); setError('');
    try {
      const data = await cancelBooking(room.id);
      if (data.success) onBooked();
      else setError(data.message || 'Kunde inte avboka.');
    } catch { setError('Nätverksfel. Försök igen.'); }
    finally  { setLoading(false); }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        className="max-w-xl p-0 bg-[var(--surface)] dark:bg-zinc-900 rounded-2xl overflow-hidden"
        aria-describedby={undefined}
      >
        <VisuallyHidden><DialogTitle>Rum {room.id} – {TYPE_LABELS[room.type] ?? room.type}</DialogTitle></VisuallyHidden>

        {/* ── Header ── */}
        <div className="px-6 pt-5 pb-4 border-b border-[var(--border)] bg-[var(--surface)]">
          <div className="flex items-start gap-4">

            {/* Room number badge */}
            <div className={['w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border-2', tc.badge].join(' ')}>
              <span className="font-heading text-xl font-extrabold tabular-nums leading-none">{room.id}</span>
            </div>

            {/* Room info */}
            <div className="flex-1 min-w-0 pt-0.5">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-heading text-lg font-bold text-[var(--text-primary)] leading-tight">
                  {TYPE_LABELS[room.type] ?? room.type}
                </h2>
                {isBooked ? (
                  <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-700/40">
                    Bokat
                  </span>
                ) : (
                  <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-700/40">
                    Ledigt
                  </span>
                )}
              </div>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                Våning {room.floor} · {meta.size} m² · {meta.view} · {meta.bedType}
              </p>
            </div>

            {/* Price + close */}
            <div className="flex items-start gap-3 shrink-0">
              <div className="text-right">
                <div className="text-base font-bold text-[var(--text-primary)] tabular-nums leading-tight">
                  {meta.price.toLocaleString('sv-SE')} kr
                </div>
                <div className="text-[10px] text-[var(--text-muted)] leading-tight">per natt</div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-xl bg-[var(--surface-alt)] border border-[var(--border)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] hover:border-[var(--text-muted)]/40 transition-all"
                aria-label="Stäng"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
          </div>

          {/* Description */}
          <p className="text-xs text-[var(--text-secondary)] mt-3 leading-relaxed">{meta.fullDescription}</p>

          {/* Amenities */}
          <div className="flex flex-wrap gap-1.5 mt-3">
            {meta.amenities.map((a) => <AmenityPill key={a.key} amenity={a} />)}
          </div>
        </div>

        {/* ── Body ── */}
        <div className="px-6 py-5 max-h-[55vh] overflow-y-auto bg-[var(--surface-alt)]/30">

          {isBooked ? (
            /* Current booking info */
            <div className="space-y-4">
              <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-sm">
                <div className="px-5 py-3.5 border-b border-[var(--border)] bg-indigo-50/60 dark:bg-indigo-900/15 flex items-center gap-2.5">
                  <div className="w-2 h-2 rounded-full bg-indigo-500" />
                  <span className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">Aktiv bokning</span>
                </div>
                <div className="px-5 py-4 space-y-3">
                  <InfoRow label="Gäst" value={room.guestName ?? '—'} bold />
                  {room.checkIn  && <InfoRow label="Incheckning"  value={formatDate(room.checkIn)} />}
                  {room.checkOut && <InfoRow label="Utcheckning"  value={formatDate(room.checkOut)} />}
                  {room.checkIn && room.checkOut && (
                    <div className="pt-3 border-t border-[var(--border)] flex items-center justify-between">
                      <span className="text-xs text-[var(--text-muted)]">Totalt ({getNights(room.checkIn, room.checkOut)} nätter)</span>
                      <span className="text-base font-bold text-[var(--text-primary)] tabular-nums">
                        {(getNights(room.checkIn, room.checkOut) * meta.price).toLocaleString('sv-SE')} kr
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

              <div className="flex gap-3">
                <Button variant="secondary" onClick={onClose} className="flex-1">Stäng</Button>
                <Button
                  variant="destructive"
                  onClick={handleCancel}
                  disabled={loading}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                >
                  {loading ? 'Avbokar...' : 'Avboka rum'}
                </Button>
              </div>
            </div>
          ) : (
            /* Booking form */
            <form onSubmit={handleBook} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="guestName" className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide">
                  Gästnamn
                </Label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                    </svg>
                  </div>
                  <Input
                    id="guestName" placeholder="Anna Svensson"
                    value={guestName} onChange={(e) => setGuestName(e.target.value)}
                    required autoFocus
                    className="pl-9 bg-[var(--surface)] border-[var(--border)] hover:border-purple-400/60 dark:hover:border-amber-400/50 focus-visible:ring-purple-600 dark:focus-visible:ring-amber-500 shadow-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide">E-post</Label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
                      </svg>
                    </div>
                    <Input id="email" type="email" placeholder="anna@exempel.se" value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-9 bg-[var(--surface)] border-[var(--border)] hover:border-purple-400/60 dark:hover:border-amber-400/50 focus-visible:ring-purple-600 dark:focus-visible:ring-amber-500 shadow-sm"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="phone" className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide">Telefon</Label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                      </svg>
                    </div>
                    <Input id="phone" type="tel" placeholder="+46 70 000 00 00" value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="pl-9 bg-[var(--surface)] border-[var(--border)] hover:border-purple-400/60 dark:hover:border-amber-400/50 focus-visible:ring-purple-600 dark:focus-visible:ring-amber-500 shadow-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <DateField id="checkIn"  label="Incheckning"  value={checkIn}  min={today}         onChange={handleCheckInChange} required />
                <DateField id="checkOut" label="Utcheckning"  value={checkOut} min={minCheckOut}   onChange={setCheckOut}         required />
              </div>

              {/* Price summary */}
              <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl px-4 py-3.5 flex items-center justify-between shadow-sm">
                <div>
                  <p className="text-xs text-[var(--text-muted)]">
                    {nights > 0 ? `${nights} natt${nights !== 1 ? 'er' : ''}` : '—'}
                    {' '}×{' '}
                    {meta.price.toLocaleString('sv-SE')} kr/natt
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-[var(--text-primary)] tabular-nums leading-tight">
                    {nights > 0 ? `${total.toLocaleString('sv-SE')} kr` : '—'}
                  </p>
                  <p className="text-[10px] text-[var(--text-muted)]">totalt</p>
                </div>
              </div>

              {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

              <div className="flex gap-3 pt-1">
                <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
                  Avbryt
                </Button>
                <Button
                  type="submit"
                  disabled={loading || !guestName.trim() || nights <= 0 || checkIn < today}
                  className="flex-1 font-semibold bg-purple-700 dark:bg-amber-500 text-white hover:bg-purple-800 dark:hover:bg-amber-600 shadow-sm"
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

function InfoRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-[var(--text-muted)]">{label}</span>
      <span className={['text-sm text-[var(--text-primary)]', bold ? 'font-semibold' : ''].join(' ')}>{value}</span>
    </div>
  );
}

function formatDate(iso: string): string {
  return new Date(iso + 'T00:00:00').toLocaleDateString('sv-SE', { day: 'numeric', month: 'long', year: 'numeric' });
}

function getNights(checkIn: string, checkOut: string): number {
  const a = new Date(checkIn + 'T00:00:00');
  const b = new Date(checkOut + 'T00:00:00');
  return Math.max(1, Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24)));
}
