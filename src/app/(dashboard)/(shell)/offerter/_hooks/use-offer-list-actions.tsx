'use client';

import { useCallback } from 'react';
import { fetchWithRefresh } from '@shared/lib/api-client';
import type { Toast } from '@shared/ui/toast/types';
import type { Offer } from '../_store/types';
import {
  buildBlockingAlert,
  type BlockingAlert,
  type BlockingErrorPayload,
} from '../_components/offer-blocking-alerts';
import { publicUrl } from '../_lib/offers-dashboard-formatters';

type OfferAction = 'send' | 'accept' | 'decline' | 'duplicate' | 'remind';
type BulkResult = { sent: number; failed: number };

type UseOfferListActionsInput = {
  addToast: (toast: Omit<Toast, 'id'>) => void;
  allOffers: Offer[];
  clearSelected: () => void;
  dismissNotices: () => void;
  load: (silent?: boolean) => Promise<void>;
  loadCounts: () => Promise<void>;
  selected: Set<string>;
  setActing: (id: string | null) => void;
  setBlockingAlert: (alert: BlockingAlert | null) => void;
  setBulkResult: (result: BulkResult | null) => void;
  setBulkSending: (sending: boolean) => void;
  setConfirmDeleteOffer: (id: string | null) => void;
  setCopied: (id: string | null) => void;
  setError: (error: string | null) => void;
  setFetchingDocId: (id: string | null) => void;
  setPreviewDoc: (html: string | null) => void;
};

export function useOfferListActions({
  addToast,
  allOffers,
  clearSelected,
  dismissNotices,
  load,
  loadCounts,
  selected,
  setActing,
  setBlockingAlert,
  setBulkResult,
  setBulkSending,
  setConfirmDeleteOffer,
  setCopied,
  setError,
  setFetchingDocId,
  setPreviewDoc,
}: UseOfferListActionsInput) {
  const doAction = useCallback(async (id: string, action: OfferAction) => {
    setActing(id);
    try {
      dismissNotices();
      const res = await fetchWithRefresh(`/api/offers/${id}?action=${action}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => ({})) as {
          detail?: string;
          blockingErrors?: BlockingErrorPayload[];
        };
        const blockingIssues = (payload.blockingErrors ?? [])
          .filter((issue) => issue && (issue.message || issue.code || issue.field));

        if (blockingIssues.length > 0) {
          const nextAlert = buildBlockingAlert(blockingIssues);
          setBlockingAlert(nextAlert);
          setError(payload.detail ?? nextAlert.title);
          addToast({
            message: 'Offerten stoppades av kvalitetskontrollen. Läs vad som måste rättas innan du skickar igen.',
            color: 'amber',
            icon: (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-600">
                <path d="M12 9v4" />
                <path d="M12 17h.01" />
                <path d="m3.2 18 7.9-13.7a1 1 0 0 1 1.8 0L20.8 18a1 1 0 0 1-.9 1.5H4.1a1 1 0 0 1-.9-1.5Z" />
              </svg>
            ),
          });
          return;
        }

        throw new Error(payload.detail ?? `Fel ${res.status}`);
      }

      setBlockingAlert(null);
      await Promise.all([load(true), loadCounts()]);
    } catch (e) {
      setBlockingAlert(null);
      setError((e as Error).message);
    } finally {
      setActing(null);
    }
  }, [addToast, dismissNotices, load, loadCounts, setActing, setBlockingAlert, setError]);

  const deleteOffer = useCallback(async (id: string) => {
    setConfirmDeleteOffer(null);
    try {
      const res = await fetchWithRefresh(`/api/offers/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(`Fel ${res.status}`);
      await Promise.all([load(true), loadCounts()]);
    } catch (e) {
      setError((e as Error).message);
    }
  }, [load, loadCounts, setConfirmDeleteOffer, setError]);

  const fetchAndPreviewDoc = useCallback(async (offerId: string) => {
    setFetchingDocId(offerId);
    try {
      const res = await fetchWithRefresh(`/api/offers/${offerId}`);
      if (!res.ok) throw new Error(`Fel ${res.status}`);
      const j = await res.json() as { data?: { generatedDocument?: string } };
      setPreviewDoc(j.data?.generatedDocument ?? null);
    } catch {
      /* show nothing on error */
    } finally {
      setFetchingDocId(null);
    }
  }, [setFetchingDocId, setPreviewDoc]);

  const copyLink = useCallback(async (offer: Offer) => {
    const url = publicUrl(offer.publicToken);
    await navigator.clipboard.writeText(url).catch(() => {});
    setCopied(offer.id);
    setTimeout(() => setCopied(null), 2000);
  }, [setCopied]);

  const doBulkSend = useCallback(async () => {
    const ids = Array.from(selected).filter((id) => {
      const offer = allOffers.find((candidate) => candidate.id === id);
      return offer?.status === 'draft';
    });
    if (ids.length === 0) return;

    setBulkSending(true);
    setBulkResult(null);
    dismissNotices();
    try {
      const res = await fetchWithRefresh('/api/offers/bulk-send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      });
      if (!res.ok) throw new Error(`Fel ${res.status}`);
      const j = await res.json() as { data: BulkResult };
      setBulkResult(j.data);
      clearSelected();
      await Promise.all([load(true), loadCounts()]);
    } catch (e) {
      setBlockingAlert(null);
      setError((e as Error).message);
    } finally {
      setBulkSending(false);
    }
  }, [
    allOffers,
    clearSelected,
    dismissNotices,
    load,
    loadCounts,
    selected,
    setBlockingAlert,
    setBulkResult,
    setBulkSending,
    setError,
  ]);

  return {
    copyLink,
    deleteOffer,
    doAction,
    doBulkSend,
    fetchAndPreviewDoc,
  };
}
