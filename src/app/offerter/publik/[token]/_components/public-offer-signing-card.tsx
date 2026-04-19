'use client';

import Image from 'next/image';
import { AnimatePresence, motion } from 'framer-motion';
import {
  CalendarIcon,
  CheckCircleIcon,
  EditIcon,
  ShieldIcon,
  TrashIcon,
  UserIcon,
  XCircleIcon,
} from '@shared/ui/icons';
import type { SigMode } from '../_types/public-offer.types';

type SignatureFont = {
  id: string;
  family: string;
  label: string;
};

export function PublicOfferSigningCard({
  isDecline,
  errMsg,
  totalAmountLabel,
  displayModeLabel,
  signerName,
  onSignerNameChange,
  dateLabel,
  sigMode,
  onUseTypedSignature,
  onOpenDrawModal,
  sigFonts,
  activeFontId,
  onFontChange,
  typedSignatureText,
  selectedFontFamily,
  drawnSignature,
  onClearSavedDrawSignature,
  onStartDecline,
  onSign,
  busy,
  comment,
  onCommentChange,
  onCancelDecline,
  onDecline,
}: {
  isDecline: boolean;
  errMsg: string;
  totalAmountLabel: string;
  displayModeLabel: string;
  signerName: string;
  onSignerNameChange: (value: string) => void;
  dateLabel: string;
  sigMode: SigMode;
  onUseTypedSignature: () => void;
  onOpenDrawModal: () => void;
  sigFonts: readonly SignatureFont[];
  activeFontId: string;
  onFontChange: (id: string) => void;
  typedSignatureText: string;
  selectedFontFamily: string;
  drawnSignature: string | null;
  onClearSavedDrawSignature: () => void;
  onStartDecline: () => void;
  onSign: () => void;
  busy: boolean;
  comment: string;
  onCommentChange: (value: string) => void;
  onCancelDecline: () => void;
  onDecline: () => void;
}) {
  return (
    <AnimatePresence mode="wait">
      {!isDecline ? (
        <motion.section
          key="sign"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="overflow-hidden rounded-[24px] border border-slate-200/70 bg-white/95 shadow-[0_18px_40px_rgba(15,23,42,0.06)] backdrop-blur"
        >
          <div className="border-b border-slate-200/60 px-4 py-4 sm:px-6 sm:py-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-[16px] bg-gradient-to-br from-slate-900 to-slate-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]">
                  <ShieldIcon size={14} className="text-white" />
                </div>
                <div>
                  <h2 className="text-[15px] font-bold text-slate-900 sm:text-sm">Godkännande och underskrift</h2>
                  <p className="mt-1 text-[12px] leading-relaxed text-slate-500">
                    Underteckna för att bekräfta offerten. Namn, datum och signatur sparas tillsammans med offerten.
                  </p>
                </div>
              </div>
              <div className="self-start rounded-[16px] border border-slate-200 bg-slate-50/90 px-3 py-2 text-left sm:text-right">
                <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-400">Total</p>
                <p className="mt-1 text-sm font-bold tabular-nums text-slate-800">{totalAmountLabel}</p>
                <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-slate-500">{displayModeLabel}</p>
              </div>
            </div>
          </div>

          <AnimatePresence>
            {errMsg && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="mx-4 mt-3 flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2.5 text-[13px] text-red-600 sm:mx-6">
                  <XCircleIcon size={14} className="shrink-0" />
                  {errMsg}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="px-4 pt-4 sm:px-6">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                  <UserIcon size={12} />
                  Fullständigt namn
                </label>
                <input
                  type="text"
                  value={signerName}
                  onChange={(event) => onSignerNameChange(event.target.value)}
                  placeholder="Ditt namn"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition-[border-color,box-shadow] focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                />
              </div>
              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                  <CalendarIcon size={12} />
                  Datum
                </label>
                <input
                  type="text"
                  value={dateLabel}
                  readOnly
                  className="w-full cursor-default rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-500 outline-none"
                />
              </div>
            </div>
          </div>

          <div className="px-4 pb-4 pt-3 sm:px-6 sm:pb-5">
            <div className="mb-2 flex items-center justify-between">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                <EditIcon size={13} />
                Signatur
              </label>
              <div className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-50 p-1">
                <button
                  type="button"
                  onClick={onUseTypedSignature}
                  className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                    sigMode === 'type'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Skriv
                </button>
                <button
                  type="button"
                  onClick={onOpenDrawModal}
                  className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                    sigMode === 'draw'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Rita
                </button>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {sigMode === 'type' ? (
                <motion.div
                  key="type"
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 8 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="mb-2 flex flex-wrap gap-1.5">
                    {sigFonts.map((font) => (
                      <button
                        key={font.id}
                        type="button"
                        onClick={() => onFontChange(font.id)}
                        className={`rounded-md px-2.5 py-1.5 text-[11px] transition-all ${
                          activeFontId === font.id
                            ? 'border-2 border-slate-900 bg-slate-50 font-semibold text-slate-900'
                            : 'border border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                        }`}
                        style={{ fontFamily: font.family }}
                      >
                        {font.label}
                      </button>
                    ))}
                  </div>
                  <p className="mb-2 text-[11px] text-slate-500">
                    Signaturen uppdateras automatiskt från fältet{' '}
                    <span className="font-semibold text-slate-700">Fullständigt namn</span>.
                  </p>
                  <div className="flex min-h-[86px] items-center rounded-xl border border-slate-200 bg-white px-4 py-4">
                    {typedSignatureText ? (
                      <span
                        className="block w-full text-[32px] leading-none text-slate-900"
                        style={{ fontFamily: selectedFontFamily }}
                      >
                        {typedSignatureText}
                      </span>
                    ) : (
                      <span className="text-sm text-slate-300">Ditt namn visas här när du fyllt i det ovan.</span>
                    )}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="draw"
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <div className="flex min-h-[96px] items-center justify-center overflow-hidden rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 py-4">
                      {drawnSignature ? (
                        <Image
                          src={drawnSignature}
                          alt="Ritad signatur"
                          width={260}
                          height={72}
                          unoptimized
                          className="max-h-[72px] w-auto object-contain"
                        />
                      ) : (
                        <div className="text-center">
                          <p className="text-sm font-medium text-slate-700">Ingen ritad signatur sparad ännu</p>
                          <p className="mt-1 text-xs text-slate-500">Tryck på knappen nedan för att öppna ritytan.</p>
                        </div>
                      )}
                    </div>
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={onOpenDrawModal}
                        className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-slate-800"
                      >
                        {drawnSignature ? 'Rita om i modal' : 'Öppna rityta'}
                      </button>
                      <button
                        type="button"
                        onClick={onClearSavedDrawSignature}
                        disabled={!drawnSignature}
                        className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <TrashIcon size={11} />
                        Rensa
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex flex-col-reverse gap-2 border-t border-slate-200/70 bg-slate-50/50 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <button
              type="button"
              onClick={onStartDecline}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-500 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-500 sm:w-auto sm:py-2"
            >
              Avvisa
            </button>
            <button
              type="button"
              onClick={onSign}
              disabled={busy}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-slate-800 active:scale-[0.98] disabled:opacity-50 sm:w-auto sm:min-w-[210px] sm:py-2.5"
            >
              <CheckCircleIcon size={15} />
              {busy ? 'Signerar...' : 'Signera offert'}
            </button>
          </div>
        </motion.section>
      ) : (
        <motion.section
          key="decline"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 6 }}
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          className="overflow-hidden rounded-[30px] border border-red-200/70 bg-gradient-to-b from-red-50/75 to-white shadow-[0_18px_42px_rgba(15,23,42,0.08)]"
        >
          <div className="border-b border-red-100 px-5 py-4 sm:px-7 sm:py-5">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-100 text-red-600">
                <XCircleIcon size={18} />
              </div>
              <div>
                <h2 className="text-base font-bold text-red-700">Avvisa offert</h2>
                <p className="mt-0.5 text-[13px] text-red-700/75">
                  Vi skickar besked direkt till ansvarig kontakt när du bekräftar avvisningen.
                </p>
              </div>
            </div>
          </div>
          <div className="px-5 py-5 sm:px-7">
            <AnimatePresence>
              {errMsg && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="mb-3 overflow-hidden rounded-md border border-red-200 bg-red-50 px-3 py-2.5 text-[13px] text-red-600"
                >
                  {errMsg}
                </motion.div>
              )}
            </AnimatePresence>
            <label className="mb-1.5 block text-xs font-semibold text-slate-600">Anledning (valfri)</label>
            <textarea
              value={comment}
              onChange={(event) => onCommentChange(event.target.value)}
              rows={3}
              placeholder="Berätta gärna varför..."
              className="w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition-[border-color,box-shadow] focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
            />
          </div>
          <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50/60 px-5 py-4 sm:px-7">
            <button
              type="button"
              onClick={onCancelDecline}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50"
            >
              Avbryt
            </button>
            <button
              type="button"
              onClick={onDecline}
              disabled={busy}
              className="rounded-lg bg-red-600 px-5 py-2 text-sm font-semibold text-white transition-opacity hover:bg-red-700 disabled:opacity-50"
            >
              {busy ? 'Avvisar...' : 'Bekräfta avvisning'}
            </button>
          </div>
        </motion.section>
      )}
    </AnimatePresence>
  );
}
