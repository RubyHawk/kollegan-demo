'use client';

import { Restaurant, HotelActivity, Amenity } from '../../domain/service.entity';

type ServiceItem = Restaurant | HotelActivity | Amenity;
type ServiceType = 'restaurant' | 'activity' | 'amenity';

interface Props {
  type: ServiceType;
  item: ServiceItem;
  onView: (item: ServiceItem) => void;
  onEdit: (item: ServiceItem) => void;
  onDelete: (id: string) => void;
  onToggleActive: (id: string, isActive: boolean) => void;
}

/* ── Category icons ── */
function RestaurantIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />
      <path d="M7 2v20" />
      <path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zm0 0v7" />
    </svg>
  );
}

function ActivityIcon({ category }: { category?: string }) {
  if (category === 'wellness') return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
  if (category === 'fitness') return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8h1a4 4 0 0 1 0 8h-1M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8zM6 1v3M10 1v3M14 1v3" />
    </svg>
  );
  if (category === 'transport') return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="5.5" cy="17.5" r="2.5" /><circle cx="17.5" cy="17.5" r="2.5" />
      <path d="M15 6H9m-4 8H1V6l3-3h13l3 3v3m0 3h-1" />
    </svg>
  );
  if (category === 'konferens') return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function AmenityIcon({ amenityType }: { amenityType?: string }) {
  if (amenityType === 'parkering') return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="3" width="15" height="13" rx="2" />
      <path d="M16 8h4l3 3v5h-7V8z" />
      <circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" />
    </svg>
  );
  if (amenityType === 'kiosk') return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  );
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

function getIconAndColor(type: ServiceType, item: ServiceItem) {
  if (type === 'restaurant') {
    return {
      icon: <RestaurantIcon />,
      bg: 'bg-orange-100 dark:bg-orange-900/30',
      color: 'text-orange-600 dark:text-orange-400',
    };
  }
  if (type === 'activity') {
    const act = item as HotelActivity;
    const colorsMap: Record<string, { bg: string; color: string }> = {
      wellness: { bg: 'bg-pink-100 dark:bg-pink-900/30', color: 'text-pink-600 dark:text-pink-400' },
      fitness: { bg: 'bg-blue-100 dark:bg-blue-900/30', color: 'text-blue-600 dark:text-blue-400' },
      transport: { bg: 'bg-emerald-100 dark:bg-emerald-900/30', color: 'text-emerald-600 dark:text-emerald-400' },
      konferens: { bg: 'bg-violet-100 dark:bg-violet-900/30', color: 'text-violet-600 dark:text-violet-400' },
      kultur: { bg: 'bg-amber-100 dark:bg-amber-900/30', color: 'text-amber-600 dark:text-amber-400' },
    };
    const c = colorsMap[act.category] ?? { bg: 'bg-stone-100 dark:bg-stone-900/30', color: 'text-stone-600 dark:text-stone-400' };
    return { icon: <ActivityIcon category={act.category} />, ...c };
  }
  const am = item as Amenity;
  return {
    icon: <AmenityIcon amenityType={am.type} />,
    bg: 'bg-slate-100 dark:bg-slate-900/30',
    color: 'text-slate-600 dark:text-slate-400',
  };
}

function getSubtitle(type: ServiceType, item: ServiceItem): string {
  if (type === 'restaurant') return (item as Restaurant).cuisineType;
  if (type === 'activity') {
    const act = item as HotelActivity;
    const labels: Record<string, string> = { wellness: 'Wellness', fitness: 'Fitness', transport: 'Transport', konferens: 'Konferens', kultur: 'Kultur', övrigt: 'Övrigt' };
    return labels[act.category] ?? act.category;
  }
  const am = item as Amenity;
  const labels: Record<string, string> = { kiosk: 'Kiosk & Shop', parkering: 'Parkering', service: 'Service', övrigt: 'Övrigt' };
  return labels[am.type] ?? am.type;
}

function getTags(type: ServiceType, item: ServiceItem): string[] {
  if (type === 'restaurant') {
    const r = item as Restaurant;
    const labels: Record<string, string> = { frukost: 'Frukost', lunch: 'Lunch', middag: 'Middag', bar: 'Bar', rumsservice: 'Rumsservice' };
    return r.services.map((s) => labels[s] ?? s);
  }
  if (type === 'activity') {
    const a = item as HotelActivity;
    const tags: string[] = [];
    if (a.price) tags.push(a.price.split('·')[0].trim());
    if (a.bookingRequired) tags.push('Bokning krävs');
    return tags;
  }
  const am = item as Amenity;
  return am.pricing ? [am.pricing] : [];
}

function getHours(item: ServiceItem): string {
  return item.openingHours?.default ?? '';
}

export default function ServiceCard({ type, item, onView, onEdit, onDelete, onToggleActive }: Props) {
  const { icon, bg, color } = getIconAndColor(type, item);
  const subtitle = getSubtitle(type, item);
  const tags = getTags(type, item);
  const hours = getHours(item);

  return (
    <div
      onClick={() => onView(item)}
      className={`service-card cursor-pointer relative bg-[var(--surface)] border rounded-2xl p-5 transition-all duration-200 hover:shadow-md ${item.isActive ? 'border-[var(--border)] hover:border-purple-200 dark:hover:border-amber-800/50' : 'border-[var(--border)] opacity-60'}`}
    >
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <div className={`w-10 h-10 rounded-xl ${bg} ${color} flex items-center justify-center shrink-0`}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-heading font-semibold text-[var(--text-primary)] text-sm truncate">
              {item.name}
            </h3>
            {!item.isActive && (
              <span className="shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-[var(--surface-alt)] text-[var(--text-muted)] border border-[var(--border)]">
                Inaktiv
              </span>
            )}
          </div>
          <p className={`text-xs mt-0.5 font-medium ${color}`}>{subtitle}</p>
        </div>
      </div>

      {/* Description */}
      <p className="text-xs text-[var(--text-secondary)] leading-relaxed line-clamp-2 mb-3">
        {item.description}
      </p>

      {/* Opening hours */}
      {hours && (
        <div className="flex items-center gap-1.5 mb-3">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--text-muted)] shrink-0">
            <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
          </svg>
          <span className="text-xs text-[var(--text-secondary)]">{hours}</span>
        </div>
      )}

      {/* Tags */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {tags.slice(0, 3).map((tag, i) => (
            <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--surface-alt)] text-[var(--text-secondary)] border border-[var(--border)]">
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Actions — always visible */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex items-center gap-1 pt-3 border-t border-[var(--border-light)]"
      >
        <button
          onClick={() => onEdit(item)}
          className="flex items-center gap-1 text-[11px] text-[var(--text-muted)] hover:text-[var(--text-primary)] bg-[var(--surface-alt)] hover:bg-[var(--border)] rounded-lg px-2.5 py-1.5 transition-all"
          title="Redigera"
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
          Redigera
        </button>
        <button
          onClick={() => onToggleActive(item.id, !item.isActive)}
          className={`flex items-center gap-1 text-[11px] rounded-lg px-2.5 py-1.5 transition-all ${item.isActive
            ? 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/40'
            : 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/40'
            }`}
          title={item.isActive ? 'Inaktivera' : 'Aktivera'}
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {item.isActive
              ? <><circle cx="12" cy="12" r="10" /><path d="M10 15l-3-3 3-3" /><path d="M7 12h10" /></>
              : <><circle cx="12" cy="12" r="10" /><path d="M8 12h8" /><path d="M12 8v8" /></>
            }
          </svg>
          {item.isActive ? 'Inaktivera' : 'Aktivera'}
        </button>
        <button
          onClick={() => {
            if (window.confirm(`Ta bort "${item.name}"?`)) onDelete(item.id);
          }}
          className="ml-auto flex items-center gap-1 text-[11px] text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg px-2.5 py-1.5 transition-all"
          title="Ta bort"
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
          </svg>
          Ta bort
        </button>
      </div>
    </div>
  );
}
