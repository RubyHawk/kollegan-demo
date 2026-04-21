'use client';

import ToastContainer from '@shared/ui/toast/toast-container';
import { ConfirmDestructiveDialog } from '@shared/ui/confirm-destructive-dialog';
import type { Toast } from '@shared/ui/toast/types';
import type { Offer } from '../_store/types';
import { OfferPreviewDialog } from './offer-preview-dialog';
import { OfferTemplatePreviewModal } from './offer-template-preview-modal';
import { SendOfferDialog } from './send-offer-dialog';

interface TemplatePreviewState {
  loading: boolean;
  html: string | null;
}

interface OffersPageDialogsProps {
  confirmSend: Offer | null;
  confirmDeleteOffer: string | null;
  previewDoc: string | null;
  templatePreview: TemplatePreviewState | null;
  acting: string | null;
  toasts: Toast[];
  onCloseSend: () => void;
  onConfirmSend: () => void;
  onCloseTemplatePreview: () => void;
  onDeleteDialogOpenChange: (open: boolean) => void;
  onConfirmDelete: () => void;
  onClosePreview: () => void;
  onDismissToast: (id: string) => void;
}

export function OffersPageDialogs({
  confirmSend,
  confirmDeleteOffer,
  previewDoc,
  templatePreview,
  acting,
  toasts,
  onCloseSend,
  onConfirmSend,
  onCloseTemplatePreview,
  onDeleteDialogOpenChange,
  onConfirmDelete,
  onClosePreview,
  onDismissToast,
}: OffersPageDialogsProps) {
  return (
    <>
      <SendOfferDialog
        open={Boolean(confirmSend)}
        onClose={onCloseSend}
        recipientName={confirmSend?.recipientName ?? ''}
        recipientEmail={confirmSend?.recipientEmail ?? ''}
        recipientCompany={confirmSend?.recipientCompany}
        loading={confirmSend ? acting === confirmSend.id : false}
        onConfirm={onConfirmSend}
      />

      <OfferTemplatePreviewModal
        open={Boolean(templatePreview)}
        html={templatePreview?.html ?? null}
        loading={templatePreview?.loading ?? false}
        onClose={onCloseTemplatePreview}
      />

      <ConfirmDestructiveDialog
        open={Boolean(confirmDeleteOffer)}
        onOpenChange={onDeleteDialogOpenChange}
        title="Ta bort offert?"
        description="Offerten tas bort permanent och kan inte återställas."
        confirmLabel="Ta bort"
        onConfirm={onConfirmDelete}
      />

      <OfferPreviewDialog
        open={Boolean(previewDoc)}
        onClose={onClosePreview}
        srcDoc={previewDoc ?? ''}
      />

      <ToastContainer toasts={toasts} onDismiss={onDismissToast} />
    </>
  );
}
