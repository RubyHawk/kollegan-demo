/**
 * Offers list store — all state for the list view, filters, search, bulk ops.
 * Async actions (load, loadCounts) live here so components just call store.load().
 */

import { create } from 'zustand';
import { countOffers, listOffers } from '@shared/lib/api/offers.api';
import type { Offer, OfferStatus, BulkResult, OfferTemplate } from './types';

const PAGE_SIZE = 25;
const EMPTY_COUNTS = { all: 0, draft: 0, sent: 0, viewed: 0, accepted: 0, declined: 0, expired: 0 };

// ─── State + Actions interface ─────────────────────────────────────────────────

interface OffersListState {
  // Data
  allOffers:   Offer[];
  serverTotal: number;
  tabCounts:   Record<string, number>;
  loading:     boolean;
  error:       string | null;
  templates:   OfferTemplate[]; // loaded once for the wizard

  // Search (split: controlled input vs debounced query)
  searchInput: string;
  search:      string;

  // Filters
  tab:         OfferStatus | 'all';
  sortAsc:     boolean;
  dateFrom:    string;
  dateTo:      string;
  currentPage: number;

  // Bulk selection
  selected:    Set<string>;
  bulkSending: boolean;
  bulkResult:  BulkResult | null;

  // Action/dialog state (list-level)
  acting:              string | null;
  confirmDeleteOffer:  string | null;
  copied:              string | null;
  confirmSend:         Offer | null;

  // ── Setters ─────────────────────────────────────────────────────────────────
  setAllOffers:   (offers: Offer[]) => void;
  setServerTotal: (total: number) => void;
  setTabCounts:   (counts: Record<string, number>) => void;
  setLoading:     (loading: boolean) => void;
  setError:       (error: string | null) => void;
  setTemplates:   (templates: OfferTemplate[]) => void;

  setSearchInput: (v: string) => void;
  setSearch:      (v: string) => void;

  setTab:         (tab: OfferStatus | 'all') => void;
  setSortAsc:     (asc: boolean) => void;
  setDateFrom:    (date: string) => void;
  setDateTo:      (date: string) => void;
  setCurrentPage: (page: number | ((prev: number) => number)) => void;

  setSelected:    (selected: Set<string> | ((prev: Set<string>) => Set<string>)) => void;
  toggleSelected: (id: string) => void;
  selectAll:      (ids: string[]) => void;
  clearSelected:  () => void;
  setBulkSending: (sending: boolean) => void;
  setBulkResult:  (result: BulkResult | null) => void;

  setActing:             (id: string | null) => void;
  setConfirmDeleteOffer: (id: string | null) => void;
  setCopied:             (id: string | null) => void;
  setConfirmSend:        (offer: Offer | null) => void;

  resetFilters: () => void;

  // ── Async actions ────────────────────────────────────────────────────────────
  load:       (silent?: boolean) => Promise<void>;
  loadCounts: () => Promise<void>;
}

// ─── Store ─────────────────────────────────────────────────────────────────────

export const useOffersListStore = create<OffersListState>()((set, get) => ({
  // Data
  allOffers:   [],
  serverTotal: 0,
  tabCounts:   { ...EMPTY_COUNTS },
  loading:     true,
  error:       null,
  templates:   [],

  // Search
  searchInput: '',
  search:      '',

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

  // Dialogs
  acting:             null,
  confirmDeleteOffer: null,
  copied:             null,
  confirmSend:        null,

  // ── Setters ──────────────────────────────────────────────────────────────────
  setAllOffers:   (allOffers)   => set({ allOffers }),
  setServerTotal: (serverTotal) => set({ serverTotal }),
  setTabCounts:   (tabCounts)   => set({ tabCounts }),
  setLoading:     (loading)     => set({ loading }),
  setError:       (error)       => set({ error }),
  setTemplates:   (templates)   => set({ templates }),

  setSearchInput: (searchInput) => set({ searchInput }),
  setSearch:      (search)      => set({ search, currentPage: 0 }),

  setTab:         (tab)         => set({ tab, currentPage: 0 }),
  setSortAsc:     (sortAsc)     => set({ sortAsc }),
  setDateFrom:    (dateFrom)    => set({ dateFrom, currentPage: 0 }),
  setDateTo:      (dateTo)      => set({ dateTo, currentPage: 0 }),
  setCurrentPage: (page)        => set((s) => ({
    currentPage: typeof page === 'function' ? page(s.currentPage) : page,
  })),

  setSelected: (selected) => set((s) => ({
    selected: typeof selected === 'function' ? selected(s.selected) : selected,
  })),
  toggleSelected: (id) => set((s) => {
    const next = new Set(s.selected);
    if (next.has(id)) next.delete(id); else next.add(id);
    return { selected: next };
  }),
  selectAll:      (ids)  => set({ selected: new Set(ids) }),
  clearSelected:  ()     => set({ selected: new Set<string>() }),
  setBulkSending: (bulkSending) => set({ bulkSending }),
  setBulkResult:  (bulkResult)  => set({ bulkResult }),

  setActing:             (acting)             => set({ acting }),
  setConfirmDeleteOffer: (confirmDeleteOffer) => set({ confirmDeleteOffer }),
  setCopied:             (copied)             => set({ copied }),
  setConfirmSend:        (confirmSend)        => set({ confirmSend }),

  resetFilters: () => set({ tab: 'all', dateFrom: '', dateTo: '', currentPage: 0, search: '', searchInput: '' }),

  // ── Async: load offers page for current tab/filter ────────────────────────────
  load: async (silent = false) => {
    const s = get();
    if (!silent) set({ loading: true });
    set({ error: null });
    try {
      const result = await listOffers({
        limit: PAGE_SIZE,
        offset: s.currentPage * PAGE_SIZE,
        status: s.tab !== 'all' ? s.tab : undefined,
        search: s.search.trim() || undefined,
        dateFrom: s.dateFrom || undefined,
        dateTo: s.dateTo || undefined,
      });
      set({ allOffers: result.offers, serverTotal: result.total });
    } catch (e) {
      set({ error: (e as Error).message });
    } finally {
      set({ loading: false });
    }
  },

  // ── Async: lightweight groupBy counts for tab badges ─────────────────────────
  loadCounts: async () => {
    const s = get();
    try {
      const counts = await countOffers({ search: s.search.trim() || undefined });
      set({ tabCounts: counts });
    } catch { /* non-critical */ }
  },
}));

export { PAGE_SIZE };
