/**
 * Invoices list store — state for the /fakturor list view: status tab, date
 * range, pagination, and the async load. Async actions live here so components
 * just call store.load().
 */

import { create } from 'zustand';
import { listInvoices, type Invoice, type InvoiceStatus } from '@shared/lib/api/invoices.api';

export const PAGE_SIZE = 25;

interface InvoicesListState {
  invoices: Invoice[];
  total: number;
  loading: boolean;
  error: string | null;

  tab: InvoiceStatus | 'all';
  dateFrom: string;
  dateTo: string;
  currentPage: number;

  setTab: (tab: InvoiceStatus | 'all') => void;
  setDateFrom: (date: string) => void;
  setDateTo: (date: string) => void;
  setCurrentPage: (page: number) => void;
  resetFilters: () => void;

  load: (silent?: boolean) => Promise<void>;
}

export const useInvoicesListStore = create<InvoicesListState>()((set, get) => ({
  invoices: [],
  total: 0,
  loading: true,
  error: null,

  tab: 'all',
  dateFrom: '',
  dateTo: '',
  currentPage: 0,

  setTab: (tab) => set({ tab, currentPage: 0 }),
  setDateFrom: (dateFrom) => set({ dateFrom, currentPage: 0 }),
  setDateTo: (dateTo) => set({ dateTo, currentPage: 0 }),
  setCurrentPage: (currentPage) => set({ currentPage }),
  resetFilters: () => set({ tab: 'all', dateFrom: '', dateTo: '', currentPage: 0 }),

  load: async (silent = false) => {
    const s = get();
    if (!silent) set({ loading: true });
    set({ error: null });
    try {
      const result = await listInvoices({
        limit: PAGE_SIZE,
        offset: s.currentPage * PAGE_SIZE,
        status: s.tab !== 'all' ? s.tab : undefined,
        from: s.dateFrom || undefined,
        to: s.dateTo || undefined,
      });
      set({ invoices: result.invoices, total: result.total });
    } catch {
      set({ error: 'Kunde inte ladda fakturor. Kontrollera anslutningen och försök igen.' });
    } finally {
      set({ loading: false });
    }
  },
}));
