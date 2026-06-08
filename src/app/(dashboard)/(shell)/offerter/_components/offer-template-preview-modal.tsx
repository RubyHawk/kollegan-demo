'use client';

import { LoaderCircle } from 'lucide-react';
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

type OfferTemplatePreviewModalProps = {
  open: boolean;
  html: string | null;
  loading: boolean;
  onClose: () => void;
  templateName?: string;
};

export function OfferTemplatePreviewModal({
  open,
  html,
  loading,
  onClose,
  templateName,
}: OfferTemplatePreviewModalProps) {
  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) onClose(); }}>
      <DialogContent mobileVariant="fullscreen" size="xl" showMobileClose className="sm:h-[min(95dvh,960px)]">
        <div className="flex h-full min-h-0 flex-col">
          <DialogHeader className="shrink-0 border-b border-[var(--ui-border)] pr-16">
            <DialogTitle>{templateName ?? 'Förhandsvisning av mall'}</DialogTitle>
            <DialogDescription>
              Kontrollera dokumentets struktur innan du väljer mallen för offerten.
            </DialogDescription>
          </DialogHeader>

          <ModalBody className="flex min-h-0 flex-col overflow-hidden bg-[var(--ui-bg)]">
            <div className="mx-auto flex min-h-0 w-full max-w-[1040px] flex-1 flex-col overflow-hidden rounded-[var(--ui-radius-lg)] border border-[var(--ui-border)] bg-[var(--ui-surface-raised)] shadow-[var(--ui-shadow-raised)]">
              <div className="flex shrink-0 items-center justify-between border-b border-[var(--ui-border)] bg-[var(--ui-surface)] px-4 py-3 text-xs font-medium text-[var(--ui-text-muted)]">
                <span>Kundvy</span>
                <span>Mallförhandsvisning</span>
              </div>

              {loading ? (
                <div className="flex min-h-0 flex-1 items-center justify-center gap-2 text-sm text-[var(--ui-text-muted)]">
                  <LoaderCircle size={16} strokeWidth={1.75} className="animate-spin text-[var(--ui-accent)]" aria-hidden />
                  Laddar förhandsvisning...
                </div>
              ) : (
                <iframe
                  srcDoc={html ?? ''}
                  title="Mallförhandsvisning"
                  className="min-h-0 w-full flex-1 border-0 bg-[var(--ui-surface-raised)]"
                />
              )}
            </div>
          </ModalBody>

          <ModalActionFooter>
            <Button variant="outline" onClick={onClose}>
              Stäng
            </Button>
          </ModalActionFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
