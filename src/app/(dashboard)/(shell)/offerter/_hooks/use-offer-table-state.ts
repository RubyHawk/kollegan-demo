'use client';

import { useCallback, useMemo } from 'react';
import { PAGE_SIZE, useOffersListStore } from '../_store/offers-list.store';

export function useOfferTableState() {
  const {
    allOffers,
    tabCounts,
    serverTotal,
    sortAsc,
    tab,
    searchInput,
    search,
    dateFrom,
    dateTo,
    selected,
    toggleSelected,
    setSelected,
  } = useOffersListStore();
  const offers = useMemo(() => {
    return allOffers.slice().sort((a, b) => {
      const diff = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      return sortAsc ? diff : -diff;
    });
  }, [allOffers, sortAsc]);

  const draftOffers = useMemo(
    () => allOffers.filter((offer) => offer.status === 'draft'),
    [allOffers],
  );

  const selectedDraftCount = useMemo(() => {
    return Array.from(selected).filter((id) => allOffers.find((offer) => offer.id === id)?.status === 'draft').length;
  }, [allOffers, selected]);

  const allDraftsSelected = draftOffers.length > 0 && draftOffers.every((offer) => selected.has(offer.id));
  const total = tabCounts.all;
  const totalPages = Math.max(1, Math.ceil(serverTotal / PAGE_SIZE));
  const hasActiveOfferFilters = tab !== 'all' || Boolean(searchInput || search || dateFrom || dateTo || sortAsc);

  const toggleSelect = useCallback((id: string) => {
    toggleSelected(id);
  }, [toggleSelected]);

  const toggleSelectAllDrafts = useCallback(() => {
    if (allDraftsSelected) {
      setSelected((previous) => {
        const next = new Set(previous);
        draftOffers.forEach((offer) => next.delete(offer.id));
        return next;
      });
      return;
    }

    setSelected((previous) => {
      const next = new Set(previous);
      draftOffers.forEach((offer) => next.add(offer.id));
      return next;
    });
  }, [allDraftsSelected, draftOffers, setSelected]);

  return {
    allDraftsSelected,
    draftOffers,
    hasActiveOfferFilters,
    offers,
    selectedDraftCount,
    toggleSelect,
    toggleSelectAllDrafts,
    total,
    totalPages,
  };
}
