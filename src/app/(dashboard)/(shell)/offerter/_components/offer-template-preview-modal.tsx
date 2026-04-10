'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@shared/ui/dialog';
import { Button } from '@shared/ui/button';

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
      <DialogContent
        mobileVariant="fullscreen"
        showMobileClose
        className="sm:max-w-[1180px] sm:max-h-[94dvh]"
      >
        <div className="flex h-full min-h-0 flex-col">
          <DialogHeader className="border-b border-[var(--border)] bg-[var(--surface-alt)] px-5 pb-3.5 pt-4 pr-16 sm:pr-5">
            <DialogTitle>
              {templateName ?? 'Förhandsvisning av mall'}
            </DialogTitle>
            <DialogDescription>
              Kontrollera strukturen innan du väljer mallen för offerten.
            </DialogDescription>
          </DialogHeader>

          <div className="relative min-h-0 flex-1 overflow-auto bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.96),_rgba(236,240,248,0.9)_48%,_rgba(226,232,240,0.88)_100%)] p-5">
            <div className="mx-auto w-full max-w-[1040px] rounded-[28px] border border-white/70 bg-white/55 p-4 shadow-[0_18px_50px_rgba(0,0,0,0.08)] backdrop-blur">
              <div className="mb-3 flex items-center justify-between gap-4 text-[11px] text-slate-500">
                <div className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-full bg-red-400" />
                  <span className="h-3 w-3 rounded-full bg-yellow-400" />
                  <span className="h-3 w-3 rounded-full bg-green-400" />
                </div>
                <span className="rounded-full border border-slate-200 bg-white/80 px-3 py-1 font-medium">
                  Kundvy
                </span>
              </div>

              <div className="overflow-hidden rounded-[20px] border border-slate-200 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.08)]">
                {loading ? (
                  <div className="flex h-64 items-center justify-center gap-2 text-sm text-[var(--text-muted)]">
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
                    className="min-h-[60dvh] w-full border-0 bg-white"
                  />
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="border-t border-[var(--border)] px-5 pb-5 pt-3">
            <Button variant="outline" onClick={onClose}>
              Stäng
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
