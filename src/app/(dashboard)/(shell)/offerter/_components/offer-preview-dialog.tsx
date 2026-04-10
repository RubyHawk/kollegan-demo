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
} from '@shared/ui/dialog';

interface OfferPreviewDialogProps {
  open: boolean;
  onClose: () => void;
  srcDoc: string;
  title?: string;
}

export function OfferPreviewDialog({
  open,
  onClose,
  srcDoc,
  title = 'Förhandsvisning av offertdokument',
}: OfferPreviewDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) onClose(); }}>
      <DialogContent mobileVariant="fullscreen" size="xl" showMobileClose className="sm:h-[min(95dvh,960px)]">
        <div className="flex h-full min-h-0 flex-col">
          <DialogHeader className="shrink-0 border-b border-[var(--border)] pr-16">
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>
              Förhandsgranskningen använder samma dokumentyta som kundens offertvy, men utan extra dekor runt omkring.
            </DialogDescription>
          </DialogHeader>

          <ModalBody className="flex min-h-0 flex-col overflow-hidden bg-[var(--surface-alt)]">
            <div className="mx-auto flex min-h-0 w-full max-w-[1040px] flex-1 flex-col overflow-hidden rounded-[24px] border border-[var(--border)] bg-white shadow-[0_18px_45px_rgba(15,23,42,0.08)]">
              <div className="shrink-0 flex items-center justify-between border-b border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-xs font-medium text-[var(--text-muted)]">
                <span>Kundvy</span>
                <span>Offertdokument</span>
              </div>
              <iframe
                srcDoc={srcDoc}
                title="Offertdokument"
                className="min-h-0 flex-1 w-full border-0 bg-white"
              />
            </div>
          </ModalBody>

          <ModalActionFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Stäng
            </Button>
          </ModalActionFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
