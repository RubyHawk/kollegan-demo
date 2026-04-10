'use client';

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@shared/ui/dialog';
import { Button } from '@shared/ui/button';

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
      <DialogContent
        mobileVariant="fullscreen"
        showMobileClose
        className="sm:max-w-[900px] sm:max-h-[92dvh]"
      >
        <div className="flex h-full min-h-0 flex-col">
          <DialogHeader className="shrink-0 border-b border-[var(--border)] bg-[var(--surface-alt)] px-5 pb-3.5 pt-4 pr-16 sm:pr-5">
            <DialogTitle className="text-sm">{title}</DialogTitle>
          </DialogHeader>

          <div className="min-h-0 flex-1 overflow-auto">
            <iframe
              srcDoc={srcDoc}
              title="Offertdokument"
              className="h-full min-h-[60dvh] w-full border-0"
            />
          </div>

          <DialogFooter className="shrink-0 border-t border-[var(--border)] px-5 pb-5 pt-3">
            <Button type="button" variant="outline" onClick={onClose}>
              Stäng
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
