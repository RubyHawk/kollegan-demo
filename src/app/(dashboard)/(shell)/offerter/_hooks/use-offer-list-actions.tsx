'use client';

import { useCallback } from 'react';
import { TriangleAlert } from 'lucide-react';
import {
  OfferActionApiError,
  bulkSendOffers,
  deleteOffer as deleteOfferById,
  getOffer,
  runOfferAction,
  type OfferAction,
} from '@shared/lib/api/offers.api';
import type { Toast } from '@shared/ui/toast/types';
import type { Offer } from '../_store/types';
import {
  buildBlockingAlert,
  type BlockingAlert,
} from '../_components/offer-blocking-alerts';
import { publicUrl } from '../_lib/offers-dashboard-formatters';

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
      await runOfferAction(id, action);
      setBlockingAlert(null);
      await Promise.all([load(true), loadCounts()]);
    } catch (e) {
      if (e instanceof OfferActionApiError) {
        const blockingIssues = e.blockingErrors
          .filter((issue) => issue && (issue.message || issue.code || issue.field));

        if (blockingIssues.length > 0) {
          const nextAlert = buildBlockingAlert(blockingIssues);
          setBlockingAlert(nextAlert);
          setError(e.detail ?? nextAlert.title);
          addToast({
            message: 'Offerten stoppades av kvalitetskontrollen. Läs vad som måste rättas innan du skickar igen.',
            color: 'amber',
            icon: (
              <TriangleAlert aria-hidden="true" size={14} strokeWidth={2} />
            ),
          });
          return;
        }
      }

      setBlockingAlert(null);
      setError('Åtgärden misslyckades. Kontrollera anslutningen och försök igen.');
    } finally {
      setActing(null);
    }
  }, [addToast, dismissNotices, load, loadCounts, setActing, setBlockingAlert, setError]);

  const deleteOffer = useCallback(async (id: string) => {
    setConfirmDeleteOffer(null);
    try {
      await deleteOfferById(id);
      await Promise.all([load(true), loadCounts()]);
    } catch {
      setError('Kunde inte ta bort offert. Kontrollera anslutningen och försök igen.');
    }
  }, [load, loadCounts, setConfirmDeleteOffer, setError]);

  const fetchAndPreviewDoc = useCallback(async (offerId: string) => {
    setFetchingDocId(offerId);
    try {
      const offer = await getOffer(offerId);
      setPreviewDoc(offer.generatedDocument ?? null);
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
      const result = await bulkSendOffers(ids);
      setBulkResult(result);
      clearSelected();
      await Promise.all([load(true), loadCounts()]);
    } catch {
      setBlockingAlert(null);
      setError('Kunde inte skicka offerterna. Kontrollera anslutningen och försök igen.');
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
