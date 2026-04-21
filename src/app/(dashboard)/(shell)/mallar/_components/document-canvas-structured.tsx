'use client';

import { EditorContent } from '@tiptap/react';
import { cn } from '@shared/lib/utils';
import { useTemplateEditor } from './editor-context';

export function StructuredOfferCanvas({
  pageKey,
  editor,
  title,
  settings,
  fontFamily,
  pageReady,
}: {
  pageKey: string;
  editor: NonNullable<ReturnType<typeof useTemplateEditor>>;
  title: string;
  settings?: {
    backgroundImageSrc?: string;
    backgroundOpacity?: number;
    watermarkMode?: 'none' | 'top' | 'bottom' | 'full';
    showLogo?: boolean;
    showSenderDetails?: boolean;
    showCustomerBlock?: boolean;
    showIntro?: boolean;
    introLayout?: 'compact' | 'roomy';
    showLineItems?: boolean;
    showSummary?: boolean;
    showNotes?: boolean;
    showTerms?: boolean;
    showFooter?: boolean;
    termsHeading?: string;
    notesHeading?: string;
    summaryPlacement?: 'below';
  };
  fontFamily: string;
  pageReady: boolean;
}) {
  const introLayout = settings?.introLayout ?? 'compact';
  const showSummary = settings?.showSummary !== false;

  return (
    <div
      className="relative overflow-hidden rounded-[24px] border border-slate-200/90 bg-[linear-gradient(180deg,#f8fbff_0%,#fcfdfd_30%,#f8fafc_100%)] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] md:rounded-[28px] md:p-8"
      style={{
        minHeight: 840,
        fontFamily: `${fontFamily}, Arial, sans-serif`,
      }}
    >
      <div className="pointer-events-none absolute -right-16 top-[-72px] h-48 w-48 rounded-full bg-[radial-gradient(circle,rgba(96,165,250,0.18)_0%,rgba(96,165,250,0)_72%)]" />
      <div className="pointer-events-none absolute -left-14 bottom-[-88px] h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(251,191,36,0.12)_0%,rgba(251,191,36,0)_72%)]" />
      <div className="pointer-events-none absolute inset-[18px] rounded-[22px] border border-white/80" />

      {settings?.backgroundImageSrc && (
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            opacity: settings.backgroundOpacity ?? 0.08,
            backgroundImage: `url(${settings.backgroundImageSrc})`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition:
              settings.watermarkMode === 'top'
                ? 'center top'
                : settings.watermarkMode === 'full'
                  ? 'center center'
                  : 'center bottom',
            backgroundSize: settings.watermarkMode === 'full' ? '100% 100%' : '72% auto',
          }}
        />
      )}

      <div className="relative z-10 space-y-5">
        <header className="grid gap-6 border-b border-slate-200/90 pb-6 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="flex items-start gap-4 rounded-[26px] border border-white/80 bg-white/70 px-4 py-4 shadow-[0_14px_28px_rgba(148,163,184,0.12)] backdrop-blur-sm">
            {settings?.showLogo !== false && (
              <div className="mt-1 h-16 w-16 rounded-2xl border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f5f9ff_100%)] shadow-sm" />
            )}
            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">{'Avs\u00e4ndare'}</p>
              {settings?.showSenderDetails !== false ? (
                <>
                  <div className="h-3 w-32 rounded-full bg-slate-300" />
                  <div className="h-2.5 w-44 rounded-full bg-slate-200" />
                  <div className="h-2.5 w-36 rounded-full bg-slate-200" />
                  <div className="h-2.5 w-28 rounded-full bg-slate-200" />
                </>
              ) : (
                <p className="text-sm text-slate-500">{'F\u00f6retagsblocket \u00e4r dolt p\u00e5 den h\u00e4r offertsidan.'}</p>
              )}
            </div>
          </div>

          <div className="rounded-[24px] border border-blue-100 bg-[linear-gradient(180deg,#fdfefe_0%,#eef5ff_100%)] p-5 shadow-[0_18px_40px_rgba(96,165,250,0.12)]">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-blue-700">
                Offertstatus
              </div>
              <CanvasHintPill tone="system">Metadata</CanvasHintPill>
            </div>
            <div className="space-y-3">
              {['Offertnummer', 'Offertdatum', 'Giltig till'].map((label) => (
                <div key={label} className="grid grid-cols-[110px_minmax(0,1fr)] items-center gap-4">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">{label}</span>
                  <div className="h-3 rounded-full bg-slate-200" />
                </div>
              ))}
            </div>
          </div>
        </header>

        <section
          className={cn(
            'grid gap-6',
            settings?.showCustomerBlock !== false ? 'lg:grid-cols-[minmax(0,1fr)_280px]' : 'grid-cols-1'
          )}
        >
          <div className="space-y-4 rounded-[28px] border border-white/80 bg-white/65 px-5 py-5 shadow-[0_16px_32px_rgba(148,163,184,0.12)] backdrop-blur-sm">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Offertsida</p>
              <CanvasHintPill tone="dialog">{'Rubrik styrs i panelen'}</CanvasHintPill>
            </div>
            <h1 className="max-w-[12ch] text-[34px] font-semibold leading-[1.03] tracking-[-0.05em] text-slate-950 md:text-[40px]">
              {title}
            </h1>
            <p className="max-w-[50ch] text-sm leading-7 text-slate-600">
              {'H\u00e4r ser du kundens slutliga offertstruktur. Varje block har nu en egen yta och tydligare markering f\u00f6r vad som \u00e4r skrivbart, styrt i panelen eller helt systemgenererat.'}
            </p>
          </div>

          {settings?.showCustomerBlock !== false && (
            <aside className="rounded-[24px] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f6f9ff_100%)] p-5 shadow-[0_12px_28px_rgba(15,23,42,0.06)]">
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Kundblock</p>
                <CanvasHintPill tone="system">Systemblock</CanvasHintPill>
              </div>
              <div className="space-y-2">
                <div className="h-3 w-28 rounded-full bg-slate-300" />
                <div className="h-2.5 w-40 rounded-full bg-slate-200" />
                <div className="h-2.5 w-32 rounded-full bg-slate-200" />
              </div>
            </aside>
          )}
        </section>

        <section className="space-y-6">
          {settings?.showIntro !== false && (
            <div
              className={cn(
                'rounded-[28px] border border-blue-100 bg-[linear-gradient(180deg,#ffffff_0%,#f3f8ff_100%)] shadow-[0_18px_34px_rgba(96,165,250,0.10)]',
                introLayout === 'roomy' ? 'p-7' : 'p-5'
              )}
            >
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Fri offerttext</p>
                    <CanvasHintPill tone="editable">{'Skriv direkt h\u00e4r'}</CanvasHintPill>
                  </div>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    {'Introduktion, f\u00f6rtydliganden och kompletterande offerttext skrivs direkt i den markerade ytan.'}
                  </p>
                </div>
                <span className="rounded-full bg-white px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-600 shadow-sm">
                  {introLayout === 'roomy' ? 'Rymlig' : 'Kompakt'}
                </span>
              </div>
              <div className="rounded-[24px] border border-dashed border-blue-200 bg-white/88 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
                <EditorContent
                  key={`structured-editor:${pageKey}`}
                  editor={pageReady ? editor : null}
                  className="doc-editor doc-editor--structured"
                />
              </div>
            </div>
          )}

          {settings?.showLineItems !== false && (
            <div className="rounded-[28px] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f6f8fb_100%)] p-5 shadow-[0_16px_34px_rgba(15,23,42,0.06)]">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Prisdel</p>
                  <h3 className="mt-1 text-lg font-semibold text-slate-900">{'Produkter och tj\u00e4nster'}</h3>
                </div>
                <CanvasHintPill tone="system">Systemblock</CanvasHintPill>
              </div>
              <div className="rounded-[22px] border border-slate-200 bg-white shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
                <div className="grid grid-cols-[minmax(220px,1.6fr)_86px_110px_90px_112px] gap-4 rounded-t-[22px] border-b border-slate-200 bg-slate-50 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                  <span>{'Produkt eller tj\u00e4nst'}</span>
                  <span className="text-right">Antal</span>
                  <span className="text-right">{'A-pris'}</span>
                  <span className="text-right">Moms</span>
                  <span className="text-right">Belopp</span>
                </div>
                <div className="grid grid-cols-[minmax(220px,1.6fr)_86px_110px_90px_112px] gap-4 px-4 py-4">
                  <div className="space-y-2">
                    <div className="h-3 w-48 rounded-full bg-slate-300" />
                    <div className="h-2.5 w-64 rounded-full bg-slate-200" />
                  </div>
                  <div className="h-3 rounded-full bg-slate-200" />
                  <div className="h-3 rounded-full bg-slate-200" />
                  <div className="h-3 rounded-full bg-slate-200" />
                  <div className="h-3 rounded-full bg-slate-300" />
                </div>
              </div>
            </div>
          )}

          {showSummary && (
            <div className="flex justify-end">
              <SummaryCard className="w-full max-w-[340px]" />
            </div>
          )}

          {settings?.showTerms !== false && (
            <div className="rounded-[28px] border border-amber-100 bg-[linear-gradient(180deg,#ffffff_0%,#fff9ef_100%)] p-5 shadow-[0_16px_34px_rgba(245,158,11,0.08)]">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Juridik</p>
                <CanvasHintPill tone="dialog">{'Redigeras i dialog'}</CanvasHintPill>
              </div>
              <h3 className="mt-2 text-lg font-semibold text-slate-900">{settings?.termsHeading ?? 'Juridiska villkor'}</h3>
              <p className="mt-3 max-w-[72ch] text-sm leading-7 text-slate-600">
                {'Den juridiska standardtexten h\u00e5lls samlad i en dialog i sidpanelen, men visas h\u00e4r med lugnare kontrast s\u00e5 den inte flyter ihop med prisdelen.'}
              </p>
            </div>
          )}

          {settings?.showNotes !== false && (
            <div className="rounded-[28px] border border-dashed border-indigo-200 bg-[linear-gradient(180deg,rgba(255,255,255,0.92)_0%,rgba(238,242,255,0.86)_100%)] p-5 shadow-[0_14px_28px_rgba(99,102,241,0.06)]">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Anteckningar</p>
                <CanvasHintPill tone="dialog">{'Redigeras i dialog'}</CanvasHintPill>
              </div>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                {'Rubriken f\u00f6r offertspecifika anteckningar s\u00e4tts i sidpanelen och anv\u00e4nds n\u00e4r en offert har egen kommentar eller projektnotering.'}
              </p>
            </div>
          )}
        </section>

        {settings?.showFooter !== false && (
          <footer className="grid gap-4 border-t border-slate-200/90 pt-5 text-sm text-slate-600 md:grid-cols-3">
            {['Soleria', 'Ansvarig', 'Kontakt'].map((label) => (
              <div key={label} className="rounded-[22px] border border-white/80 bg-white/70 px-4 py-4 shadow-[0_10px_20px_rgba(148,163,184,0.08)]">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</p>
                <div className="mt-2 space-y-2">
                  <div className="h-2.5 w-24 rounded-full bg-slate-200" />
                  <div className="h-2.5 w-32 rounded-full bg-slate-200" />
                </div>
              </div>
            ))}
          </footer>
        )}
      </div>
    </div>
  );
}
export function PresentationPageLoadingState({ role }: { role?: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 px-5 py-6 text-sm leading-6 text-slate-500">
      {role === 'appendix'
        ? 'Laddar bilagan. När sidan är klar kan du lägga in bilden från vänsterpanelen utan att den hamnar på fel sida.'
        : 'Laddar sidans innehåll…'}
    </div>
  );
}

function SummaryCard({ className }: { className?: string }) {
  return (
    <aside
      className={cn(
        'overflow-hidden rounded-[28px] border border-blue-100 bg-[linear-gradient(180deg,#ffffff_0%,#eef5ff_100%)] shadow-[0_18px_34px_rgba(96,165,250,0.12)]',
        className,
      )}
    >
      <div className="px-5 pt-5">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Summering</p>
          <CanvasHintPill tone="system">Systemblock</CanvasHintPill>
        </div>
        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-between gap-4 rounded-2xl bg-white/80 px-3 py-3">
            <span className="text-sm text-slate-600">Delsumma</span>
            <div className="h-3 w-24 rounded-full bg-slate-200" />
          </div>
          <div className="flex items-center justify-between gap-4 rounded-2xl bg-white/80 px-3 py-3">
            <span className="text-sm text-slate-600">Moms</span>
            <div className="h-3 w-20 rounded-full bg-slate-200" />
          </div>
        </div>
      </div>
      <div className="mt-5 bg-slate-950 px-5 py-4 text-white">
        <div className="flex items-center justify-between gap-4">
          <span className="text-sm font-semibold text-white">Totalsumma</span>
          <div className="h-3.5 w-28 rounded-full bg-white/70" />
        </div>
      </div>
    </aside>
  );
}

function CanvasHintPill({
  tone,
  children,
}: {
  tone: 'editable' | 'dialog' | 'system';
  children: React.ReactNode;
}) {
  const toneClassName =
    tone === 'editable'
      ? 'border-blue-200 bg-blue-50 text-blue-700'
      : tone === 'dialog'
        ? 'border-indigo-200 bg-indigo-50 text-indigo-700'
        : 'border-emerald-200 bg-emerald-50 text-emerald-700';

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em]',
        toneClassName,
      )}
    >
      {children}
    </span>
  );
}
