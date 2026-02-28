'use client';

import { useState, useEffect, useCallback } from 'react';
import { Restaurant, HotelActivity, Amenity } from '../../domain/service.entity';
import ServiceCard from './service-card';
import ServiceFormModal from './service-form-modal';
import ServiceDetailModal from './service-detail-modal';
import { fetchRestaurants, fetchActivities, fetchAmenities, deleteService, toggleServiceActive } from '../../api/services';

type ServiceSection = 'restaurants' | 'activities' | 'amenities';
type ServiceItem = Restaurant | HotelActivity | Amenity;
type ServiceType = 'restaurant' | 'activity' | 'amenity';

const SECTION_CONFIG: { key: ServiceSection; label: string; type: ServiceType; addLabel: string }[] = [
  { key: 'restaurants', label: 'Restauranger', type: 'restaurant', addLabel: 'Lägg till restaurang' },
  { key: 'activities', label: 'Tjänster & Aktiviteter', type: 'activity', addLabel: 'Lägg till tjänst' },
  { key: 'amenities', label: 'Faciliteter', type: 'amenity', addLabel: 'Lägg till facilitet' },
];

interface Props {
  onCountChange?: (count: number) => void;
}

export default function HotelInfoTab({ onCountChange }: Props) {
  const [activeSection, setActiveSection] = useState<ServiceSection>('restaurants');
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [activities, setActivities] = useState<HotelActivity[]>([]);
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [loading, setLoading] = useState(true);

  const [viewingItem, setViewingItem] = useState<{ type: ServiceType; item: ServiceItem } | null>(null);
  const [editingItem, setEditingItem] = useState<{ type: ServiceType; item: ServiceItem } | null>(null);
  const [creatingType, setCreatingType] = useState<ServiceType | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [r, a, am] = await Promise.all([
        fetchRestaurants(),
        fetchActivities(),
        fetchAmenities(),
      ]);
      setRestaurants(r);
      setActivities(a);
      setAmenities(am);
      onCountChange?.([...r, ...a, ...am].filter((x) => x.isActive).length);
    } catch (e) {
      console.error('Failed to fetch hotel services:', e);
    } finally {
      setLoading(false);
    }
  }, [onCountChange]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleSave = async () => {
    setEditingItem(null);
    setCreatingType(null);
    await fetchAll();
  };

  const handleDelete = async (type: ServiceType, id: string) => {
    await deleteService(type, id);
    await fetchAll();
  };

  const handleToggleActive = async (type: ServiceType, id: string, isActive: boolean) => {
    await toggleServiceActive(type, id, isActive);
    await fetchAll();
  };

  const currentSection = SECTION_CONFIG.find((s) => s.key === activeSection)!;

  const currentItems: ServiceItem[] =
    activeSection === 'restaurants' ? restaurants :
    activeSection === 'activities' ? activities :
    amenities;

  const activeCount = [...restaurants, ...activities, ...amenities].filter((x) => x.isActive).length;

  return (
    <div className="space-y-5">
      {/* CRM-style page header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading text-xl font-semibold text-[var(--text-primary)]">Hotellinfo</h2>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">All information som Kollegan hämtar och använder under samtal</p>
        </div>
        <span className="text-xs font-medium text-purple-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40 rounded-full px-3 py-1.5">
          {activeCount} aktiva tjänster
        </span>
      </div>

      {/* CRM-style sub-tab switcher */}
      <div className="flex items-center gap-1.5 p-1 bg-[var(--surface-alt)] border-2 border-[var(--border)] rounded-xl w-fit shadow-card">
        {SECTION_CONFIG.map((section) => {
          const count = (
            section.key === 'restaurants' ? restaurants :
            section.key === 'activities' ? activities :
            amenities
          ).length;
          const isActive = activeSection === section.key;
          return (
            <button
              key={section.key}
              onClick={() => setActiveSection(section.key)}
              className={[
                'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all',
                isActive
                  ? 'bg-purple-700 dark:bg-amber-500 text-white shadow-sm'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--surface-alt)] border border-transparent hover:border-[var(--border)]',
              ].join(' ')}
            >
              {section.label}
              <span className={[
                'rounded-full px-1.5 py-0.5 text-[9px] font-bold tabular-nums',
                isActive ? 'bg-white/25 text-white' : 'bg-[var(--surface-alt)] border border-[var(--border)] text-[var(--text-muted)]',
              ].join(' ')}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Add button + content */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-[var(--text-secondary)]">
            {currentSection.label}
            {!loading && <span className="ml-2 text-[var(--text-muted)] font-normal">({currentItems.length} totalt)</span>}
          </h3>
          <button
            onClick={() => setCreatingType(currentSection.type)}
            className="flex items-center gap-1.5 text-sm text-[var(--text-primary)] bg-[var(--surface)] hover:bg-[var(--surface-alt)] border border-[var(--border)] hover:border-amber-300 dark:hover:border-amber-700 rounded-xl px-3 py-2 font-medium transition-all active:scale-95"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            {currentSection.addLabel}
          </button>
        </div>

        {/* Loading skeleton */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="rounded-2xl border border-[var(--border)] p-5 space-y-3 fade-in-up" style={{ animationDelay: `${i * 60}ms` }}>
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-xl skeleton shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-3/4 skeleton" />
                    <div className="h-3 w-1/2 skeleton" />
                  </div>
                </div>
                <div className="h-3 w-full skeleton" />
                <div className="h-3 w-2/3 skeleton" />
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && currentItems.length === 0 && (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-[var(--surface-alt)] border border-[var(--border)] flex items-center justify-center mx-auto mb-4 float">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--text-muted)]">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </div>
            <h3 className="font-heading font-semibold text-[var(--text-primary)] mb-1">Inga {currentSection.label.toLowerCase()} ännu</h3>
            <p className="text-sm text-[var(--text-muted)] mb-4">Lägg till information som Kollegan kan använda under samtal.</p>
            <button
              onClick={() => setCreatingType(currentSection.type)}
              className="text-sm text-amber-600 dark:text-amber-400 hover:underline font-medium"
            >
              + {currentSection.addLabel}
            </button>
          </div>
        )}

        {/* Cards grid */}
        {!loading && currentItems.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {currentItems.map((item) => (
              <ServiceCard
                key={item.id}
                type={currentSection.type}
                item={item}
                onView={(i) => setViewingItem({ type: currentSection.type, item: i })}
                onEdit={(i) => setEditingItem({ type: currentSection.type, item: i })}
                onDelete={(id) => handleDelete(currentSection.type, id)}
                onToggleActive={(id, isActive) => handleToggleActive(currentSection.type, id, isActive)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Info box: how Kollegan uses this data */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-600 dark:text-amber-400">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-1">Hur använder Kollegan denna data?</h4>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              Precis innan ett samtal startar hämtar Kollegan all aktiv information via <code className="bg-[var(--surface-alt)] px-1 py-0.5 rounded text-amber-600 dark:text-amber-400">/api/hotel-info</code>. Under samtalet kan gäster fråga om restauranger, öppettider, aktiviteter, parkering och mer — Kollegan svarar baserat på vad du har lagt in här.
            </p>
          </div>
        </div>
      </div>

      {/* Modals */}
      {creatingType && (
        <ServiceFormModal
          type={creatingType}
          onSave={handleSave}
          onClose={() => setCreatingType(null)}
        />
      )}

      {editingItem && (
        <ServiceFormModal
          type={editingItem.type}
          item={editingItem.item}
          onSave={handleSave}
          onClose={() => setEditingItem(null)}
        />
      )}

      {viewingItem && (
        <ServiceDetailModal
          type={viewingItem.type}
          item={viewingItem.item}
          onClose={() => setViewingItem(null)}
          onEdit={(i) => {
            setViewingItem(null);
            setEditingItem({ type: viewingItem.type, item: i });
          }}
          onToggleActive={(id, isActive) => handleToggleActive(viewingItem.type, id, isActive)}
          onDelete={(id) => { setViewingItem(null); handleDelete(viewingItem.type, id); }}
        />
      )}
    </div>
  );
}
