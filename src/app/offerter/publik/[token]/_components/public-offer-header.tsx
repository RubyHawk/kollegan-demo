import { BrandMark } from '@shared/ui/brand';

import { PdfBadgePill } from './pdf-badge-pill';

const NAVBAR_DOWNLOAD_BUTTON_CLASS_NAME = 'flex h-10 shrink-0 items-center gap-2 rounded-[15px] border border-slate-200/90 bg-white px-3.5 text-[12.5px] font-semibold text-slate-700 shadow-[0_6px_16px_rgba(15,23,42,0.06)] transition-all duration-200 hover:bg-slate-50 active:scale-[0.97] disabled:opacity-40';

function DownloadButton({
  downloading,
  disabled,
  onDownloadPdf,
  mobile = false,
}: {
  downloading: boolean;
  disabled: boolean;
  onDownloadPdf: () => void;
  mobile?: boolean;
}) {
  return (
    <button
      onClick={onDownloadPdf}
      disabled={disabled}
      className={NAVBAR_DOWNLOAD_BUTTON_CLASS_NAME}
      title="Ladda ner PDF"
      aria-label={mobile ? (downloading ? 'Genererar PDF' : 'Ladda ner PDF') : undefined}
    >
      {downloading ? (
        <svg
          className="animate-spin"
          width={mobile ? '14' : '13'}
          height={mobile ? '14' : '13'}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={mobile ? '2.4' : '2.5'}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </svg>
      ) : (
        <>
          <span>Ladda ner</span>
          <PdfBadgePill className="min-w-[32px] px-2 py-[4px] text-[8px]" />
        </>
      )}
      {downloading ? <span>Genererar...</span> : null}
    </button>
  );
}

function TotalPanel({
  totalLabel,
  displayModeLabel,
  validUntilLabel,
  desktop = false,
}: {
  totalLabel: string;
  displayModeLabel: string;
  validUntilLabel: string;
  desktop?: boolean;
}) {
  if (!desktop) {
    return (
      <div className="min-w-0">
        <div className="flex items-baseline gap-2">
          <p className="text-[9px] font-semibold uppercase tracking-[0.1em] text-slate-400">
            Total
          </p>
          <span className="text-[11px] font-medium text-slate-500">{displayModeLabel}</span>
        </div>
        <p className="mt-1 text-[18px] font-semibold tabular-nums leading-none text-slate-950">
          {totalLabel}
        </p>
        <p className="mt-1 text-[10.5px] text-slate-500">Giltig till {validUntilLabel}</p>
      </div>
    );
  }

  return (
    <div className="hidden min-w-[280px] rounded-[16px] border border-slate-200/85 bg-slate-50/92 px-4 py-2.5 sm:block">
      <div className="flex items-baseline gap-2">
        <p className="text-[9px] font-semibold uppercase tracking-[0.1em] text-slate-400">
          Total
        </p>
        <span className="text-[11px] font-medium text-slate-500">{displayModeLabel}</span>
      </div>
      <p className="mt-1 text-[24px] font-semibold tabular-nums leading-none text-slate-950">
        {totalLabel}
      </p>
      <p className="mt-1.5 text-[11px] text-slate-500">Giltig till {validUntilLabel}</p>
    </div>
  );
}

export function PublicOfferHeader({
  title,
  recipientName,
  recipientCompany,
  totalLabel,
  displayModeLabel,
  validUntilLabel,
  hasGeneratedDocument,
  hasPromoHero,
  downloading,
  onDownloadPdf,
}: {
  title: string;
  recipientName: string;
  recipientCompany?: string;
  totalLabel: string;
  displayModeLabel: string;
  validUntilLabel: string;
  hasGeneratedDocument: boolean;
  hasPromoHero: boolean;
  downloading: boolean;
  onDownloadPdf: () => void;
}) {
  const disabled = downloading || !hasGeneratedDocument;

  return (
    <header className="sticky top-0 z-20 px-3 pt-3 sm:px-6 sm:pt-4">
      <div className={`mx-auto overflow-hidden rounded-[22px] border backdrop-blur-xl transition-colors sm:max-w-[1000px] sm:border-slate-200/80 sm:bg-white/95 sm:shadow-[0_8px_20px_rgba(15,23,42,0.07)] ${hasPromoHero ? 'border-white/18 bg-white/12 shadow-[0_18px_42px_rgba(9,18,35,0.18)]' : 'border-slate-200/80 bg-white/92 shadow-[0_10px_24px_rgba(15,23,42,0.08)]'}`}>
        <div className="px-4 py-2.5 sm:px-4 sm:py-2.5">
          <div className="flex items-center gap-3 sm:min-h-0 sm:gap-3.5">
            <div className="hidden min-w-0 flex-1 items-center gap-3 sm:flex">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[14px] border border-slate-200 bg-gradient-to-br from-white to-slate-100 text-slate-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)]">
                <BrandMark size={16} alt="" />
              </div>
              <div className="min-w-0">
                <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                  Publik offert
                </p>
                <h1 className="truncate text-[16px] font-semibold leading-[1.08] text-slate-900">{title}</h1>
                <p className="truncate pt-0.5 text-[12px] leading-tight text-slate-500">
                  {recipientName}
                  {recipientCompany ? ` \u00b7 ${recipientCompany}` : ''}
                </p>
              </div>
            </div>

            <div className="flex min-w-0 flex-1 items-center justify-between gap-3 sm:hidden">
              <TotalPanel
                totalLabel={totalLabel}
                displayModeLabel={displayModeLabel}
                validUntilLabel={validUntilLabel}
              />
              <DownloadButton
                downloading={downloading}
                disabled={disabled}
                onDownloadPdf={onDownloadPdf}
                mobile
              />
            </div>

            <div className="hidden shrink-0 items-center gap-2.5 sm:flex">
              <TotalPanel
                totalLabel={totalLabel}
                displayModeLabel={displayModeLabel}
                validUntilLabel={validUntilLabel}
                desktop
              />
              <DownloadButton
                downloading={downloading}
                disabled={disabled}
                onDownloadPdf={onDownloadPdf}
              />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
