'use client';

import { useEffect, useRef } from 'react';
import { replaceBrowserQuery } from '@shared/lib/browser-query';
import { STATUS_TABS } from '../_lib/offers-dashboard-constants';
import { useOffersListStore } from '../_store/offers-list.store';
import type { OfferStatus } from '../_store/types';

type OfferSearchParams = {
  get: (key: string) => string | null;
};

function parsePageParam(page: string | null) {
  const parsed = Number(page);
  return Number.isFinite(parsed) && parsed > 1 ? parsed - 1 : 0;
}

function parseOfferStatus(status: string | null): OfferStatus | 'all' {
  return STATUS_TABS.some((tab) => tab.id === status) ? (status as OfferStatus | 'all') : 'all';
}

export function useOfferUrlFilters(searchParams: OfferSearchParams) {
  const {
    tab,
    search,
    currentPage,
    dateFrom,
    dateTo,
    sortAsc,
    setSearchInput,
    setSearch,
    setTab,
    setDateFrom,
    setDateTo,
    setSortAsc,
    setCurrentPage,
    load,
    loadCounts,
    clearSelected,
    setBulkResult,
  } = useOffersListStore();
  const filtersHydratedRef = useRef(false);

  useEffect(() => {
    const initialSearch = searchParams.get('search') ?? '';

    setSearchInput(initialSearch);
    setSearch(initialSearch);
    setTab(parseOfferStatus(searchParams.get('status')));
    setDateFrom(searchParams.get('from') ?? '');
    setDateTo(searchParams.get('to') ?? '');
    setSortAsc(searchParams.get('sort') === 'asc');
    setCurrentPage(parsePageParam(searchParams.get('page')));
    filtersHydratedRef.current = true;
  }, [searchParams, setCurrentPage, setDateFrom, setDateTo, setSearch, setSearchInput, setSortAsc, setTab]);

  useEffect(() => {
    if (!filtersHydratedRef.current) return;
    void load();
    void loadCounts();
    clearSelected();
    setBulkResult(null);
  }, [clearSelected, currentPage, dateFrom, dateTo, load, loadCounts, search, setBulkResult, tab]);

  useEffect(() => {
    if (!filtersHydratedRef.current) return;

    replaceBrowserQuery({
      status: tab === 'all' ? null : tab,
      search: search.trim() || null,
      from: dateFrom || null,
      to: dateTo || null,
      page: currentPage > 0 ? currentPage + 1 : null,
      sort: sortAsc ? 'asc' : null,
    });
  }, [currentPage, dateFrom, dateTo, search, sortAsc, tab]);
}
