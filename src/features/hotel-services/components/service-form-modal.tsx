'use client';

import { useState, useEffect } from 'react';
import { Restaurant, HotelActivity, Amenity, RestaurantService, ActivityCategory, AmenityType } from '@features/hotel-services/types';
import { createService, updateService } from '@features/hotel-services/api';

type ServiceType = 'restaurant' | 'activity' | 'amenity';
type ServiceItem = Restaurant | HotelActivity | Amenity;

interface Props {
  type: ServiceType;
  item?: ServiceItem;
  onSave: () => void;
  onClose: () => void;
}

const RESTAURANT_SERVICES: { key: RestaurantService; label: string }[] = [
  { key: 'frukost', label: 'Frukost' },
  { key: 'lunch', label: 'Lunch' },
  { key: 'middag', label: 'Middag' },
  { key: 'bar', label: 'Bar' },
  { key: 'rumsservice', label: 'Rumsservice' },
];

const ACTIVITY_CATEGORIES: { value: ActivityCategory; label: string }[] = [
  { value: 'wellness', label: 'Wellness & Spa' },
  { value: 'fitness', label: 'Fitness & Gym' },
  { value: 'transport', label: 'Transport' },
  { value: 'konferens', label: 'Konferens' },
  { value: 'kultur', label: 'Kultur & Upplevelser' },
  { value: 'övrigt', label: 'Övrigt' },
];

const AMENITY_TYPES: { value: AmenityType; label: string }[] = [
  { value: 'kiosk', label: 'Kiosk & Shop' },
  { value: 'parkering', label: 'Parkering' },
  { value: 'service', label: 'Service' },
  { value: 'övrigt', label: 'Övrigt' },
];

const MODAL_TITLES: Record<ServiceType, { create: string; edit: string }> = {
  restaurant: { create: 'Lägg till restaurang', edit: 'Redigera restaurang' },
  activity: { create: 'Lägg till tjänst', edit: 'Redigera tjänst' },
  amenity: { create: 'Lägg till facilitet', edit: 'Redigera facilitet' },
};

interface MenuRow { name: string; price: string }

export default function ServiceFormModal({ type, item, onSave, onClose }: Props) {
  const isEdit = !!item;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Common fields
  const [name, setName] = useState(item?.name ?? '');
  const [description, setDescription] = useState(item?.description ?? '');
  const [openingHours, setOpeningHours] = useState(item?.openingHours?.default ?? '');
  const [isActive, setIsActive] = useState(item?.isActive !== false);

  // Restaurant-specific
  const [cuisineType, setCuisineType] = useState(type === 'restaurant' ? (item as Restaurant | undefined)?.cuisineType ?? '' : '');
  const [services, setServices] = useState<RestaurantService[]>(type === 'restaurant' ? (item as Restaurant | undefined)?.services ?? [] : []);
  const [menuHighlights, setMenuHighlights] = useState<MenuRow[]>(
    type === 'restaurant'
      ? ((item as Restaurant | undefined)?.menuHighlights ?? []).map((h) => ({ name: h.name, price: String(h.price) }))
      : []
  );

  // Activity-specific
  const [category, setCategory] = useState<ActivityCategory>(type === 'activity' ? (item as HotelActivity | undefined)?.category ?? 'övrigt' : 'övrigt');
  const [price, setPrice] = useState(type === 'activity' ? (item as HotelActivity | undefined)?.price ?? '' : '');
  const [bookingRequired, setBookingRequired] = useState(type === 'activity' ? (item as HotelActivity | undefined)?.bookingRequired ?? false : false);

  // Amenity-specific
  const [amenityType, setAmenityType] = useState<AmenityType>(type === 'amenity' ? (item as Amenity | undefined)?.type ?? 'övrigt' : 'övrigt');
  const [pricing, setPricing] = useState(type === 'amenity' ? (item as Amenity | undefined)?.pricing ?? '' : '');

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const toggleService = (s: RestaurantService) => {
    setServices((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]);
  };

  const addMenuRow = () => setMenuHighlights((prev) => [...prev, { name: '', price: '' }]);
  const removeMenuRow = (i: number) => setMenuHighlights((prev) => prev.filter((_, idx) => idx !== i));
  const updateMenuRow = (i: number, field: 'name' | 'price', value: string) => {
    setMenuHighlights((prev) => prev.map((row, idx) => idx === i ? { ...row, [field]: value } : row));
  };

  const buildPayload = () => {
    const base = {
      name: name.trim(),
      description: description.trim(),
      openingHours: openingHours.trim() ? { default: openingHours.trim() } : {},
      isActive,
    };
    if (type === 'restaurant') {
      return {
        ...base,
        cuisineType: cuisineType.trim(),
        services,
        menuHighlights: menuHighlights
          .filter((r) => r.name.trim())
          .map((r) => ({ name: r.name.trim(), price: Number(r.price) || 0 })),
      };
    }
    if (type === 'activity') {
      return { ...base, category, price: price.trim(), bookingRequired };
    }
    return { ...base, type: amenityType, pricing: pricing.trim() };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError('');
    try {
      if (isEdit) {
        await updateService(type, item!.id, buildPayload());
      } else {
        await createService(type, buildPayload());
      }
      onSave();
    } catch { setError('Nätverksfel. Försök igen.'); }
    finally { setLoading(false); }
  };

  const title = MODAL_TITLES[type][isEdit ? 'edit' : 'create'];

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 dark:bg-black/70 backdrop-blur-sm dialog-overlay-enter p-4"
      onClick={onClose}
    >
      <div
        className="bg-[var(--surface)] rounded-2xl w-full max-w-lg shadow-2xl border border-[var(--border)] dialog-content-enter overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
          <h2 className="font-heading font-bold text-lg text-[var(--text-primary)]">{title}</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-alt)] transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[75vh]">
          <div className="px-6 py-5 space-y-4">

            {/* Name */}
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5 uppercase tracking-wide">Namn *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={type === 'restaurant' ? 'Restaurang Kronan' : type === 'activity' ? 'Spa & Wellness' : 'Hotelbutiken'}
                required
                autoFocus
                className="w-full bg-[var(--surface-alt)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5 uppercase tracking-wide">Beskrivning</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder="Beskriv kort..."
                className="w-full bg-[var(--surface-alt)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all resize-none"
              />
            </div>

            {/* Restaurant-specific */}
            {type === 'restaurant' && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5 uppercase tracking-wide">Typ av kök</label>
                  <input
                    type="text"
                    value={cuisineType}
                    onChange={(e) => setCuisineType(e.target.value)}
                    placeholder="Skandinavisk fine dining"
                    className="w-full bg-[var(--surface-alt)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-2 uppercase tracking-wide">Tjänster</label>
                  <div className="flex flex-wrap gap-2">
                    {RESTAURANT_SERVICES.map((s) => (
                      <button
                        key={s.key}
                        type="button"
                        onClick={() => toggleService(s.key)}
                        className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${
                          services.includes(s.key)
                            ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-700'
                            : 'bg-[var(--surface-alt)] text-[var(--text-secondary)] border-[var(--border)] hover:border-[var(--text-muted)]'
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide">Menyhöjdpunkter</label>
                    <button type="button" onClick={addMenuRow} className="text-[11px] text-amber-600 dark:text-amber-400 hover:underline font-medium">+ Lägg till</button>
                  </div>
                  <div className="space-y-2">
                    {menuHighlights.map((row, i) => (
                      <div key={i} className="flex gap-2 items-center">
                        <input
                          type="text"
                          value={row.name}
                          onChange={(e) => updateMenuRow(i, 'name', e.target.value)}
                          placeholder="Rättnamn"
                          className="flex-1 bg-[var(--surface-alt)] border border-[var(--border)] rounded-lg px-3 py-2 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all"
                        />
                        <input
                          type="number"
                          value={row.price}
                          onChange={(e) => updateMenuRow(i, 'price', e.target.value)}
                          placeholder="Pris"
                          className="w-20 bg-[var(--surface-alt)] border border-[var(--border)] rounded-lg px-3 py-2 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all"
                        />
                        <button type="button" onClick={() => removeMenuRow(i)} className="text-[var(--text-muted)] hover:text-red-500 transition-colors p-1">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                        </button>
                      </div>
                    ))}
                    {menuHighlights.length === 0 && (
                      <p className="text-xs text-[var(--text-muted)] py-2">Inga höjdpunkter tillagda än.</p>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Activity-specific */}
            {type === 'activity' && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5 uppercase tracking-wide">Kategori</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as ActivityCategory)}
                    className="w-full bg-[var(--surface-alt)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all"
                  >
                    {ACTIVITY_CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5 uppercase tracking-wide">Pris</label>
                  <input
                    type="text"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="från 195 kr · Ingår för gäster"
                    className="w-full bg-[var(--surface-alt)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all"
                  />
                </div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <div
                    onClick={() => setBookingRequired(!bookingRequired)}
                    className={`relative w-10 h-5 rounded-full transition-colors ${bookingRequired ? 'bg-amber-500' : 'bg-[var(--border)]'}`}
                  >
                    <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${bookingRequired ? 'translate-x-5' : ''}`} />
                  </div>
                  <span className="text-sm text-[var(--text-secondary)]">Bokning krävs</span>
                </label>
              </>
            )}

            {/* Amenity-specific */}
            {type === 'amenity' && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5 uppercase tracking-wide">Typ</label>
                  <select
                    value={amenityType}
                    onChange={(e) => setAmenityType(e.target.value as AmenityType)}
                    className="w-full bg-[var(--surface-alt)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all"
                  >
                    {AMENITY_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5 uppercase tracking-wide">Prissättning</label>
                  <input
                    type="text"
                    value={pricing}
                    onChange={(e) => setPricing(e.target.value)}
                    placeholder="350 kr/dygn · Kostnadsfritt för gäster"
                    className="w-full bg-[var(--surface-alt)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all"
                  />
                </div>
              </>
            )}

            {/* Opening hours (common) */}
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5 uppercase tracking-wide">Öppettider</label>
              <input
                type="text"
                value={openingHours}
                onChange={(e) => setOpeningHours(e.target.value)}
                placeholder="Mån–Fre 08–22 · Lör–Sön 09–20"
                className="w-full bg-[var(--surface-alt)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all"
              />
            </div>

            {/* Active toggle */}
            <label className="flex items-center gap-3 cursor-pointer">
              <div
                onClick={() => setIsActive(!isActive)}
                className={`relative w-10 h-5 rounded-full transition-colors ${isActive ? 'bg-emerald-500' : 'bg-[var(--border)]'}`}
              >
                <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${isActive ? 'translate-x-5' : ''}`} />
              </div>
              <span className="text-sm text-[var(--text-secondary)]">Aktiv (visas för Kollegan)</span>
            </label>

            {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
          </div>

          {/* Footer */}
          <div className="flex gap-3 px-6 py-4 border-t border-[var(--border)] bg-[var(--surface-alt)]">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 text-sm text-[var(--text-secondary)] bg-[var(--surface)] hover:bg-[var(--border)] border border-[var(--border)] rounded-xl py-2.5 font-medium transition-all active:scale-95"
            >
              Avbryt
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="flex-1 text-sm text-white bg-amber-600 hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-400 dark:text-stone-900 rounded-xl py-2.5 font-semibold transition-all active:scale-95 disabled:opacity-40"
            >
              {loading ? 'Sparar...' : isEdit ? 'Spara ändringar' : 'Lägg till'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
