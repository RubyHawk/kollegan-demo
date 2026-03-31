/**
 * Offers list store — manages the list view state for the offers page.
 *
 * Separates list/pagination/filter state from the form/wizard state so that
 * tab navigation, search, and bulk selection don't trigger full-component
 * re-renders when only a slice of state changes.
 */

import { create } from 'zustand';
import type { Offer, OfferStatus } from '@modules/supporting/offers';

const PAGE_SIZE = 25;

interface BulkResult { sent: number; failed: number }

interface OffersListState {
  // ── Data ──────────────────────────────────────────────────────────────────────
  allOffers:   Offer[];
  serverTotal: number;
  tabCounts:   Record<string, number>;
  loading:     boolean;
  error:       string | null;

  // ── Filters ───────────────────────────────────────────────────────────────────
  tab:         OfferStatus | 'all';
  sortAsc:     boolean;
  dateFrom:    string;
  dateTo:      string;
  currentPage: number;

  // ── Bulk selection ────────────────────────────────────────────────────────────
  selected:     Set<string>;
  bulkSending:  boolean;
  bulkResult:   BulkResult | null;

  // ── Actions ───────────────────────────────────────────────────────────────────
  setAllOffers:   (offers: Offer[]) => void;
  setServerTotal: (total: number) => void;
  setTabCounts:   (counts: Record<string, number>) => void;
  setLoading:     (loading: boolean) => void;
  setError:       (error: string | null) => void;

  setTab:         (tab: OfferStatus | 'all') => void;
  setSortAsc:     (asc: boolean) => void;
  setDateFrom:    (date: string) => void;
  setDateTo:      (date: string) => void;
  setCurrentPage: (page: number) => void;

  setSelected:    (selected: Set<string>) => void;
  toggleSelected: (id: string) => void;
  selectAll:      (ids: string[]) => void;
  clearSelected:  () => void;
  setBulkSending: (sending: boolean) => void;
  setBulkResult:  (result: BulkResult | null) => void;

  resetFilters:   () => void;
}

const EMPTY_COUNTS = { all: 0, draft: 0, sent: 0, viewed: 0, accepted: 0, declined: 0, expired: 0 };

export const useOffersListStore = create<OffersListState>()((set) => ({
  // Data
  allOffers:   [],
  serverTotal: 0,
  tabCounts:   { ...EMPTY_COUNTS },
  loading:     true,
  error:       null,

  // Filters
  tab:         'all',
  sortAsc:     false,
  dateFrom:    '',
  dateTo:      '',
  currentPage: 0,

  // Bulk
  selected:    new Set<string>(),
  bulkSending: false,
  bulkResult:  null,

  // Actions
  setAllOffers:   (allOffers)   => set({ allOffers }),
  setServerTotal: (serverTotal) => set({ serverTotal }),
  setTabCounts:   (tabCounts)   => set({ tabCounts }),
  setLoading:     (loading)     => set({ loading }),
  setError:       (error)       => set({ error }),

  setTab:         (tab)         => set({ tab, currentPage: 0 }),
  setSortAsc:     (sortAsc)     => set({ sortAsc }),
  setDateFrom:    (dateFrom)    => set({ dateFrom, currentPage: 0 }),
  setDateTo:      (dateTo)      => set({ dateTo, currentPage: 0 }),
  setCurrentPage: (currentPage) => set({ currentPage }),

  setSelected:    (selected)    => set({ selected }),
  toggleSelected: (id)          => set((s) => {
    const next = new Set(s.selected);
    if (next.has(id)) next.delete(id); else next.add(id);
    return { selected: next };
  }),
  selectAll:      (ids)         => set({ selected: new Set(ids) }),
  clearSelected:  ()            => set({ selected: new Set<string>() }),
  setBulkSending: (bulkSending) => set({ bulkSending }),
  setBulkResult:  (bulkResult)  => set({ bulkResult }),

  resetFilters:   ()            => set({ tab: 'all', dateFrom: '', dateTo: '', currentPage: 0 }),
}));

export { PAGE_SIZE };
