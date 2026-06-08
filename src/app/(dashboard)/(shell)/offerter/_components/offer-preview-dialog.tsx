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
          <DialogHeader className="shrink-0 border-b border-[var(--ui-border)] pr-16">
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>
              Förhandsgranskningen använder samma dokumentyta som kundens offertvy, men utan extra dekor runt omkring.
            </DialogDescription>
          </DialogHeader>

          <ModalBody className="flex min-h-0 flex-col overflow-hidden bg-[var(--ui-bg)]">
            <div className="mx-auto flex min-h-0 w-full max-w-[1040px] flex-1 flex-col overflow-hidden rounded-[var(--ui-radius-lg)] border border-[var(--ui-border)] bg-[var(--ui-surface-raised)] shadow-[var(--ui-shadow-raised)]">
              <div className="flex shrink-0 items-center justify-between border-b border-[var(--ui-border)] bg-[var(--ui-surface)] px-4 py-3 text-xs font-medium text-[var(--ui-text-muted)]">
                <span>Kundvy</span>
                <span>Offertdokument</span>
              </div>
              <iframe
                srcDoc={srcDoc}
                title="Offertdokument"
                className="min-h-0 w-full flex-1 border-0 bg-[var(--ui-surface-raised)]"
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
