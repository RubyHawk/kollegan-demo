'use client';

import { useState } from 'react';
import {
  Modal,
  ModalContent,
  ModalBody,
  Button,
  Input,
  Card,
  CardBody,
  Chip,
} from '@heroui/react';
import { Room } from '@/lib/types';
import { getRoomMeta, AMENITY_ICONS, AmenityDef } from '@/lib/roomMeta';

interface Props {
  room: Room;
  onClose: () => void;
  onBooked: () => void;
}

function AmenityBadge({ amenity }: { amenity: AmenityDef }) {
  return (
    <div className="flex items-center gap-1.5 bg-white/50 dark:bg-white/8 border border-white/40 dark:border-white/12 rounded-lg px-2.5 py-1.5">
      <svg
        width="13"
        height="13"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-amber-600 dark:text-amber-400 shrink-0"
      >
        <path d={AMENITY_ICONS[amenity.key]} />
      </svg>
      <span className="text-[11px] font-medium text-[var(--text-secondary)]">{amenity.label}</span>
    </div>
  );
}

const TYPE_LABELS: Record<string, string> = {
  Enkel: 'Enkelt rum',
  Dubbel: 'Dubbelrum',
  Svit: 'Svit',
};

const TYPE_GRADIENT: Record<string, string> = {
  Enkel: 'from-amber-900/30 via-stone-800/60 to-stone-900/80',
  Dubbel: 'from-blue-900/30 via-slate-800/60 to-slate-900/80',
  Svit: 'from-violet-900/30 via-purple-900/60 to-navy-950/90',
};

export default function RoomDetailModal({ room, onClose, onBooked }: Props) {
  const [guestName, setGuestName] = useState('');
  const [checkIn, setCheckIn] = useState(() => new Date().toISOString().split('T')[0]);
  const [checkOut, setCheckOut] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toISOString().split('T')[0];
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const meta = getRoomMeta(room.id, room.type);
  const isBooked = room.status === 'booked';

  const nights = (() => {
    const a = new Date(checkIn + 'T00:00:00');
    const b = new Date(checkOut + 'T00:00:00');
    return Math.max(1, Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24)));
  })();

  const total = nights * meta.price;

  const handleBook = async (e: React.FormEvent) => {
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

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      backdrop="blur"
      size="2xl"
      placement="center"
      scrollBehavior="inside"
      classNames={{
        base: 'bg-white/92 dark:bg-zinc-900/95 backdrop-blur-2xl border border-white/55 dark:border-white/12 shadow-2xl',
        backdrop: 'bg-black/40',
        wrapper: 'p-4',
      }}
    >
      <ModalContent>
        <ModalBody className="p-0">
          <div className="flex flex-col md:flex-row min-h-[440px]">
            {/* ── Left: Room Image Area ── */}
            <div
              className={`relative md:w-[42%] min-h-[200px] bg-gradient-to-br ${TYPE_GRADIENT[room.type] ?? TYPE_GRADIENT.Enkel} flex flex-col items-center justify-center p-8 overflow-hidden rounded-t-xl md:rounded-l-xl md:rounded-tr-none`}
            >
              {/* Decorative pattern */}
              <div
                className="absolute inset-0 opacity-10"
                style={{
                  backgroundImage:
                    'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.3) 1px, transparent 0)',
                  backgroundSize: '24px 24px',
                }}
              />

              {/* Svit shimmer */}
              {room.type === 'Svit' && (
                <div className="absolute inset-0 svit-shimmer opacity-50 pointer-events-none" />
              )}

              {/* Room number */}
              <div className="relative z-10 text-center">
                <div className="font-heading text-7xl font-bold text-white/90 leading-none mb-2 drop-shadow-lg">
                  {room.id}
                </div>
                <div className="text-white/60 text-sm font-medium tracking-wide">
                  {TYPE_LABELS[room.type] ?? room.type}
                </div>
              </div>

              {/* Bed icon */}
              <div className="relative z-10 mt-6 w-16 h-16 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center backdrop-blur-sm">
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="opacity-80"
                >
                  <path d="M2 4v16M2 8h20v12M2 12h20M12 8V4" />
                  <path d="M6 12v-2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2" />
                </svg>
              </div>

              {/* Price badge */}
              <div className="relative z-10 mt-6 bg-white/15 border border-white/25 backdrop-blur-md rounded-xl px-4 py-2 text-center">
                <div className="text-xl font-bold text-white">
                  {meta.price.toLocaleString('sv-SE')} kr
                </div>
                <div className="text-white/60 text-xs">per natt</div>
              </div>

              {/* Close button (mobile) */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 md:hidden w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/30 transition-colors"
                aria-label="Stäng"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* ── Right: Details + Form ── */}
            <div className="flex-1 flex flex-col p-6 overflow-y-auto">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="font-heading text-xl font-bold text-[var(--text-primary)] leading-tight">
                    Rum {room.id} — {TYPE_LABELS[room.type] ?? room.type}
                  </h2>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <span className="text-xs text-[var(--text-muted)] flex items-center gap-1">
                      <svg
                        width="11"
                        height="11"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                      </svg>
                      {meta.size} m²
                    </span>
                    <span className="text-[var(--text-muted)] text-xs">·</span>
                    <span className="text-xs text-[var(--text-muted)]">Våning {room.floor}</span>
                    <span className="text-[var(--text-muted)] text-xs">·</span>
                    <span className="text-xs text-[var(--text-muted)]">{meta.view}</span>
                  </div>
                  <p className="text-xs text-[var(--text-muted)] mt-1">{meta.bedType}</p>
                </div>
                <button
                  onClick={onClose}
                  className="hidden md:flex w-8 h-8 rounded-lg items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-white/40 dark:hover:bg-white/8 transition-colors shrink-0 ml-2"
                  aria-label="Stäng"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              {/* Description */}
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-4">
                {meta.fullDescription}
              </p>

              {/* Amenities */}
              <div className="flex flex-wrap gap-1.5 mb-4">
                {meta.amenities.map((a) => (
                  <AmenityBadge key={a.key} amenity={a} />
                ))}
              </div>

              {/* Divider */}
              <div className="h-px bg-white/30 dark:bg-white/8 mb-4" />

              {/* Booking section */}
              {isBooked ? (
                <div className="space-y-4">
                  <Card
                    shadow="none"
                    className="bg-indigo-50/60 dark:bg-indigo-900/20 border border-indigo-200/50 dark:border-indigo-800/30"
                  >
                    <CardBody className="p-4 space-y-2.5">
                      <h3 className="text-sm font-semibold text-indigo-700 dark:text-indigo-300 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-indigo-500" />
                        Pågående bokning
                      </h3>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-[var(--text-muted)]">Gäst</span>
                        <span className="text-xs font-semibold text-[var(--text-primary)]">
                          {room.guestName}
                        </span>
                      </div>
                      {room.checkIn && (
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-[var(--text-muted)]">Incheckning</span>
                          <span className="text-xs text-[var(--text-primary)]">
                            {formatDate(room.checkIn)}
                          </span>
                        </div>
                      )}
                      {room.checkOut && (
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-[var(--text-muted)]">Utcheckning</span>
                          <span className="text-xs text-[var(--text-primary)]">
                            {formatDate(room.checkOut)}
                          </span>
                        </div>
                      )}
                      {room.checkIn && room.checkOut && (
                        <div className="flex justify-between items-center pt-2 border-t border-indigo-200/50 dark:border-indigo-800/30">
                          <span className="text-xs text-[var(--text-muted)]">Totalt</span>
                          <span className="text-sm font-bold text-[var(--text-primary)]">
                            {(getNights(room.checkIn, room.checkOut) * meta.price).toLocaleString(
                              'sv-SE'
                            )}{' '}
                            kr
                          </span>
                        </div>
                      )}
                    </CardBody>
                  </Card>

                  {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

                  <div className="flex gap-3">
                    <Button
                      variant="flat"
                      onPress={onClose}
                      className="flex-1 bg-white/50 dark:bg-white/8 border border-white/40 dark:border-white/12"
                    >
                      Stäng
                    </Button>
                    <Button
                      color="danger"
                      variant="flat"
                      onPress={handleCancel}
                      isLoading={loading}
                      className="flex-1"
                    >
                      {loading ? 'Avbokar...' : 'Avboka'}
                    </Button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleBook} className="space-y-4">
                  <Input
                    label="Gästnamn"
                    placeholder="Anna Svensson"
                    value={guestName}
                    onValueChange={setGuestName}
                    isRequired
                    autoFocus
                    variant="bordered"
                    classNames={{
                      inputWrapper:
                        'bg-white/50 dark:bg-white/8 border-white/50 dark:border-white/15 hover:border-amber-400/60 focus-within:!border-amber-500',
                    }}
                  />

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5 uppercase tracking-wide">
                        Incheckning
                      </label>
                      <input
                        type="date"
                        value={checkIn}
                        onChange={(e) => setCheckIn(e.target.value)}
                        required
                        className="w-full bg-white/50 dark:bg-white/8 border border-white/50 dark:border-white/15 rounded-xl px-3 py-3 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all [color-scheme:light] dark:[color-scheme:dark]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5 uppercase tracking-wide">
                        Utcheckning
                      </label>
                      <input
                        type="date"
                        value={checkOut}
                        onChange={(e) => setCheckOut(e.target.value)}
                        required
                        className="w-full bg-white/50 dark:bg-white/8 border border-white/50 dark:border-white/15 rounded-xl px-3 py-3 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all [color-scheme:light] dark:[color-scheme:dark]"
                      />
                    </div>
                  </div>

                  {/* Price summary */}
                  <Card
                    shadow="none"
                    className="bg-amber-50/60 dark:bg-amber-900/15 border border-amber-200/50 dark:border-amber-800/30"
                  >
                    <CardBody className="px-4 py-3 flex-row items-center justify-between">
                      <div className="text-xs text-[var(--text-secondary)]">
                        {nights} natt{nights !== 1 ? 'er' : ''} ×{' '}
                        {meta.price.toLocaleString('sv-SE')} kr
                      </div>
                      <div className="text-sm font-bold text-[var(--text-primary)]">
                        {total.toLocaleString('sv-SE')} kr
                      </div>
                    </CardBody>
                  </Card>

                  {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="flat"
                      onPress={onClose}
                      className="flex-1 bg-white/50 dark:bg-white/8 border border-white/40 dark:border-white/12"
                    >
                      Avbryt
                    </Button>
                    <Button
                      type="submit"
                      color="primary"
                      isLoading={loading}
                      isDisabled={loading || !guestName.trim()}
                      className="flex-1 font-semibold"
                    >
                      {loading ? 'Bokar...' : 'Boka rum'}
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
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
