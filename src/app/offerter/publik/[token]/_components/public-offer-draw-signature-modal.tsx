'use client';

import { AnimatePresence, motion } from 'framer-motion';
import type { Ref } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { TrashIcon } from '@shared/ui/icons';

export function PublicOfferDrawSignatureModal({
  open,
  error,
  canvasWrapperRef,
  signatureRef,
  onClose,
  onClear,
  onSave,
}: {
  open: boolean;
  error: string;
  canvasWrapperRef: Ref<HTMLDivElement>;
  signatureRef: Ref<SignatureCanvas>;
  onClose: () => void;
  onClear: () => void;
  onSave: () => void;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end bg-slate-950/55 p-3 sm:items-center sm:justify-center sm:p-6"
        >
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="w-full rounded-[24px] border border-slate-200 bg-white shadow-[0_24px_60px_rgba(15,23,42,0.28)] sm:max-w-2xl"
          >
            <div className="border-b border-slate-100 px-4 py-4 sm:px-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold text-slate-900">Rita din signatur</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Skriv under med finger eller mus och spara signaturen när den ser rätt ut.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-500 transition-colors hover:bg-slate-50"
                >
                  Stäng
                </button>
              </div>
            </div>

            <div className="px-4 py-4 sm:px-6">
              {error && (
                <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
                  {error}
                </div>
              )}
              <div
                ref={canvasWrapperRef}
                className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white"
                style={{ touchAction: 'none' }}
              >
                <SignatureCanvas
                  ref={signatureRef}
                  penColor="#0f172a"
                  canvasProps={{ style: { display: 'block', width: '100%', height: '220px', touchAction: 'none' } }}
                />
                <div className="pointer-events-none absolute bottom-10 left-6 right-6 border-b border-dashed border-slate-200" />
                <span className="pointer-events-none absolute right-4 top-3 text-[11px] tracking-wide text-slate-300">
                  Rita här
                </span>
              </div>
            </div>

            <div className="flex flex-col-reverse gap-2 border-t border-slate-100 bg-slate-50/70 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <button
                type="button"
                onClick={onClear}
                className="inline-flex items-center justify-center gap-1 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
              >
                <TrashIcon size={13} />
                Rensa
              </button>
              <div className="flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
                >
                  Avbryt
                </button>
                <button
                  type="button"
                  onClick={onSave}
                  className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
                >
                  Spara signatur
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
