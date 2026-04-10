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
          <DialogHeader className="shrink-0 border-b border-[var(--border)] pr-16">
            <DialogTitle>{templateName ?? 'Förhandsvisning av mall'}</DialogTitle>
            <DialogDescription>
              Kontrollera dokumentets struktur innan du väljer mallen för offerten.
            </DialogDescription>
          </DialogHeader>

          <ModalBody className="flex min-h-0 flex-col overflow-hidden bg-[var(--surface-alt)]">
            <div className="mx-auto flex min-h-0 w-full max-w-[1040px] flex-1 flex-col overflow-hidden rounded-[24px] border border-[var(--border)] bg-white shadow-[0_18px_45px_rgba(15,23,42,0.08)]">
              <div className="shrink-0 flex items-center justify-between border-b border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-xs font-medium text-[var(--text-muted)]">
                <span>Kundvy</span>
                <span>Mallförhandsvisning</span>
              </div>

              {loading ? (
                <div className="flex min-h-0 flex-1 items-center justify-center gap-2 text-sm text-[var(--text-muted)]">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="animate-spin text-[var(--accent)]"
                  >
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </svg>
                  Laddar förhandsvisning…
                </div>
              ) : (
                <iframe
                  srcDoc={html ?? ''}
                  title="Mallförhandsvisning"
                  className="min-h-0 flex-1 w-full border-0 bg-white"
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
