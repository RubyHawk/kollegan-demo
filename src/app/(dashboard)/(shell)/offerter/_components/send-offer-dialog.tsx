'use client';

import { Button } from '@shared/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  ModalActionFooter,
  ModalBody,
  ModalMetaCard,
} from '@shared/ui/dialog';
import { InlineAlert } from '@shared/ui/inline-alert';

interface SendOfferDialogProps {
  open: boolean;
  onClose: () => void;
  recipientName: string;
  recipientEmail: string;
  recipientCompany?: string | null;
  onConfirm: () => void;
  loading?: boolean;
}

export function SendOfferDialog({
  open,
  onClose,
  recipientName,
  recipientEmail,
  recipientCompany,
  onConfirm,
  loading = false,
}: SendOfferDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) onClose(); }}>
      <DialogContent mobileVariant="center" size="md">
        <div className="flex min-h-0 flex-1 flex-col">
          <DialogHeader>
            <DialogTitle>Bekräfta utskick</DialogTitle>
            <DialogDescription>
              Offerten skickas via e-post och öppnas sedan i den säkra offertvyn där pris, villkor och signering visas.
            </DialogDescription>
          </DialogHeader>

          <ModalBody className="pt-2">
            <ModalMetaCard>
              <dl className="space-y-3 text-sm">
                <div className="flex items-start justify-between gap-4">
                  <dt className="text-[var(--ui-text-muted)]">Mottagare</dt>
                  <dd className="text-right font-medium text-[var(--ui-text)]">{recipientName}</dd>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <dt className="text-[var(--ui-text-muted)]">E-post</dt>
                  <dd className="break-all text-right text-[var(--ui-text)]">{recipientEmail}</dd>
                </div>
                {recipientCompany ? (
                  <div className="flex items-start justify-between gap-4">
                    <dt className="text-[var(--ui-text-muted)]">Företag</dt>
                    <dd className="text-right text-[var(--ui-text)]">{recipientCompany}</dd>
                  </div>
                ) : null}
              </dl>
            </ModalMetaCard>

            <InlineAlert tone="warning" className="mt-4">
              Kontrollera mottagaren noggrant. Efter utskick är det kundens länkade offertvy som blir den aktiva källan.
            </InlineAlert>
          </ModalBody>

          <ModalActionFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Avbryt
            </Button>
            <Button type="button" onClick={onConfirm} disabled={loading} loading={loading}>
              {loading ? 'Skickar...' : 'Skicka offert'}
            </Button>
          </ModalActionFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
