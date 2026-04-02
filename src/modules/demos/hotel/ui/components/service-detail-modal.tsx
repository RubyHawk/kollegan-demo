'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Restaurant, HotelActivity, Amenity } from '../../domain/service.entity';

type ServiceItem = Restaurant | HotelActivity | Amenity;
type ServiceType = 'restaurant' | 'activity' | 'amenity';

interface Props {
  type: ServiceType;
  item: ServiceItem;
  onClose: () => void;
  onEdit: (item: ServiceItem) => void;
  onToggleActive: (id: string, isActive: boolean) => void;
  onDelete: (id: string) => void;
}

/* ── Category icons (large versions) ── */
function RestaurantIconLg() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />
      <path d="M7 2v20" />
      <path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zm0 0v7" />
    </svg>
  );
}

function ActivityIconLg({ category }: { category?: string }) {
  if (category === 'wellness') return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
  if (category === 'fitness') return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8h1a4 4 0 0 1 0 8h-1M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8zM6 1v3M10 1v3M14 1v3" />
    </svg>
  );
  if (category === 'transport') return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="5.5" cy="17.5" r="2.5" /><circle cx="17.5" cy="17.5" r="2.5" />
      <path d="M15 6H9m-4 8H1V6l3-3h13l3 3v3m0 3h-1" />
    </svg>
  );
  if (category === 'konferens') return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function AmenityIconLg({ amenityType }: { amenityType?: string }) {
  if (amenityType === 'parkering') return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="3" width="15" height="13" rx="2" />
      <path d="M16 8h4l3 3v5h-7V8z" />
      <circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" />
    </svg>
  );
  if (amenityType === 'kiosk') return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  );
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

type HeaderStyle = {
  gradient: string;
  iconBg: string;
  iconColor: string;
  icon: React.ReactNode;
  subtitle: string;
};

function getHeaderStyle(type: ServiceType, item: ServiceItem): HeaderStyle {
  if (type === 'restaurant') {
    return {
      gradient: 'from-orange-700 via-amber-800 to-stone-900',
      iconBg: 'bg-white/20',
      iconColor: 'text-white',
      icon: <RestaurantIconLg />,
      subtitle: (item as Restaurant).cuisineType,
    };
  }
  if (type === 'activity') {
    const act = item as HotelActivity;
    const styles: Record<string, { gradient: string }> = {
      wellness: { gradient: 'from-pink-700 via-rose-800 to-stone-900' },
      fitness: { gradient: 'from-blue-700 via-blue-900 to-slate-900' },
      transport: { gradient: 'from-emerald-700 via-teal-800 to-stone-900' },
      konferens: { gradient: 'from-violet-700 via-purple-900 to-indigo-950' },
      kultur: { gradient: 'from-amber-600 via-amber-800 to-stone-900' },
    };
    const categoryLabels: Record<string, string> = {
      wellness: 'Wellness & Spa', fitness: 'Fitness & Gym', transport: 'Transport',
      konferens: 'Konferens', kultur: 'Kultur & Upplevelser', övrigt: 'Övrigt',
    };
    return {
      gradient: styles[act.category]?.gradient ?? 'from-stone-600 via-stone-800 to-stone-900',
      iconBg: 'bg-white/20',
      iconColor: 'text-white',
      icon: <ActivityIconLg category={act.category} />,
      subtitle: categoryLabels[act.category] ?? act.category,
    };
  }
  const am = item as Amenity;
  const amenityLabels: Record<string, string> = {
    kiosk: 'Kiosk & Shop', parkering: 'Parkering', service: 'Service', övrigt: 'Övrigt',
  };
  return {
    gradient: 'from-slate-600 via-slate-800 to-slate-900',
    iconBg: 'bg-white/20',
    iconColor: 'text-white',
    icon: <AmenityIconLg amenityType={am.type} />,
    subtitle: amenityLabels[am.type] ?? am.type,
  };
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4 py-3 border-b border-[var(--border-light)] last:border-0">
      <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide w-28 shrink-0 pt-0.5">{label}</span>
      <div className="flex-1 text-sm text-[var(--text-primary)]">{children}</div>
    </div>
  );
}

export default function ServiceDetailModal({ type, item, onClose, onEdit, onToggleActive, onDelete }: Props) {
  const { gradient, iconBg, iconColor, icon, subtitle } = getHeaderStyle(type, item);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const restaurant = type === 'restaurant' ? (item as Restaurant) : null;
  const activity = type === 'activity' ? (item as HotelActivity) : null;
  const amenity = type === 'amenity' ? (item as Amenity) : null;

  const serviceLabels: Record<string, string> = {
    frukost: 'Frukost', lunch: 'Lunch', middag: 'Middag', bar: 'Bar', rumsservice: 'Rumsservice',
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 dark:bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 10 }}
        transition={{ type: 'spring', stiffness: 420, damping: 32 }}
        className="bg-[var(--surface)] rounded-2xl w-full max-w-lg shadow-2xl border border-[var(--border)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header card ── */}
        <div className={`relative bg-gradient-to-br ${gradient} px-6 pt-6 pb-8`}>
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>

          {/* Icon + name */}
          <div className="flex items-start gap-4">
            <div className={`w-14 h-14 rounded-2xl ${iconBg} ${iconColor} flex items-center justify-center shrink-0`}>
              {icon}
            </div>
            <div className="flex-1 min-w-0 pt-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-heading font-bold text-xl text-white leading-tight">{item.name}</h2>
                {!item.isActive && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/20 text-white/80 border border-white/20">
                    Inaktiv
                  </span>
                )}
              </div>
              <p className="text-sm text-white/70 mt-0.5">{subtitle}</p>
            </div>
          </div>

          {/* Status pill */}
          <div className="mt-4 flex items-center gap-2">
            <span className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${
              item.isActive
                ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-400/30'
                : 'bg-white/10 text-white/60 border border-white/20'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${item.isActive ? 'bg-emerald-400' : 'bg-white/40'}`} />
          {item.isActive ? 'Aktiv — visas för Soleria' : 'Inaktiv — dold för Soleria'}
            </span>
          </div>
        </div>

        {/* ── Details body ── */}
        <div className="px-6 py-2 overflow-y-auto max-h-[45vh]">
          {item.description && (
            <DetailRow label="Beskrivning">
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{item.description}</p>
            </DetailRow>
          )}

          {item.openingHours?.default && (
            <DetailRow label="Öppettider">
              <div className="flex items-center gap-1.5">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--text-muted)] shrink-0">
                  <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                </svg>
                <span>{item.openingHours.default}</span>
              </div>
            </DetailRow>
          )}

          {/* Restaurant-specific */}
          {restaurant && (
            <>
              {restaurant.cuisineType && (
                <DetailRow label="Typ av kök">
                  <span>{restaurant.cuisineType}</span>
                </DetailRow>
              )}
              {restaurant.services.length > 0 && (
                <DetailRow label="Tjänster">
                  <div className="flex flex-wrap gap-1.5">
                    {restaurant.services.map((s) => (
                      <span key={s} className="text-[11px] px-2.5 py-1 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800/50 font-medium">
                        {serviceLabels[s] ?? s}
                      </span>
                    ))}
                  </div>
                </DetailRow>
              )}
              {restaurant.menuHighlights.length > 0 && (
                <DetailRow label="Menyhöjdpunkter">
                  <div className="space-y-1">
                    {restaurant.menuHighlights.map((h, i) => (
                      <div key={i} className="flex justify-between text-sm">
                        <span className="text-[var(--text-secondary)]">{h.name}</span>
                        <span className="font-medium text-[var(--text-primary)]">{h.price} kr</span>
                      </div>
                    ))}
                  </div>
                </DetailRow>
              )}
            </>
          )}

          {/* Activity-specific */}
          {activity && (
            <>
              {activity.price && (
                <DetailRow label="Pris">
                  <span>{activity.price}</span>
                </DetailRow>
              )}
              <DetailRow label="Bokning">
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${
                  activity.bookingRequired
                    ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/50'
                    : 'bg-[var(--surface-alt)] text-[var(--text-muted)] border-[var(--border)]'
                }`}>
                  {activity.bookingRequired ? 'Bokning krävs' : 'Ingen bokning krävs'}
                </span>
              </DetailRow>
            </>
          )}

          {/* Amenity-specific */}
          {amenity && amenity.pricing && (
            <DetailRow label="Prissättning">
              <span>{amenity.pricing}</span>
            </DetailRow>
          )}
        </div>

        {/* ── Footer actions ── */}
        <div className="flex items-center gap-2 px-6 py-4 border-t border-[var(--border)] bg-[var(--surface-alt)]">
          {/* Delete */}
          <button
            onClick={() => {
              if (window.confirm(`Ta bort "${item.name}"?`)) onDelete(item.id);
            }}
            className="flex items-center gap-1 text-[11px] text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg px-2.5 py-2 transition-all"
            title="Ta bort"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
            </svg>
            Ta bort
          </button>

          <div className="flex-1" />

          {/* Toggle active */}
          <button
            onClick={() => onToggleActive(item.id, !item.isActive)}
            className={`flex items-center gap-1.5 text-xs font-medium rounded-xl px-3 py-2 transition-all border ${
              item.isActive
                ? 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800/40 hover:bg-amber-100'
                : 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800/40 hover:bg-emerald-100'
            }`}
          >
            {item.isActive ? 'Inaktivera' : 'Aktivera'}
          </button>

          {/* Edit — primary CTA */}
          <button
            onClick={() => onEdit(item)}
            className="flex items-center gap-2 text-sm font-semibold text-white bg-amber-600 hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-400 dark:text-stone-900 rounded-xl px-4 py-2 transition-all active:scale-95 shadow-sm"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            Ändra uppgifter
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
