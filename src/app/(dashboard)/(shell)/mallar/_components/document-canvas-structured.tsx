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
      className="relative bg-white px-6 py-7 md:px-10 md:py-10"
      style={{
        minHeight: 840,
        fontFamily: `${fontFamily}, Arial, sans-serif`,
      }}
    >
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
          <div className="flex items-start gap-4 border-l-4 border-emerald-500 bg-slate-50 px-5 py-4">
            {settings?.showLogo !== false && (
              <div className="mt-1 h-16 w-16 rounded-md border border-slate-200 bg-white shadow-sm" />
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

          <div className="border border-slate-200 bg-white p-5">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="inline-flex border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-700">
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
          <div className="space-y-4 border-l-4 border-sky-500 bg-white px-5 py-5">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Offertsida</p>
              <CanvasHintPill tone="dialog">{'Rubrik styrs i panelen'}</CanvasHintPill>
            </div>
            <h1 className="max-w-[12ch] text-[34px] font-semibold leading-[1.03] text-slate-950 md:text-[40px]">
              {title}
            </h1>
            <p className="max-w-[50ch] text-sm leading-7 text-slate-600">
              {'H\u00e4r ser du kundens slutliga offertstruktur. Varje block har nu en egen yta och tydligare markering f\u00f6r vad som \u00e4r skrivbart, styrt i panelen eller helt systemgenererat.'}
            </p>
          </div>

          {settings?.showCustomerBlock !== false && (
            <aside className="border border-slate-200 bg-slate-50 p-5">
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
                'border border-slate-200 bg-white',
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
              <div className="border border-dashed border-sky-300 bg-sky-50/35 p-4">
                <EditorContent
                  key={`structured-editor:${pageKey}`}
                  editor={pageReady ? editor : null}
                  className="doc-editor doc-editor--structured"
                />
              </div>
            </div>
          )}

          {settings?.showLineItems !== false && (
            <div className="border border-slate-200 bg-white p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Prisdel</p>
                  <h3 className="mt-1 text-lg font-semibold text-slate-900">{'Produkter och tj\u00e4nster'}</h3>
                </div>
                <CanvasHintPill tone="system">Systemblock</CanvasHintPill>
              </div>
              <div className="border border-slate-200 bg-white">
                <div className="grid grid-cols-[minmax(220px,1.6fr)_86px_110px_90px_112px] gap-4 border-b border-slate-200 bg-slate-50 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
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
            <div className="border-l-4 border-amber-500 bg-amber-50/50 p-5">
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
            <div className="border border-dashed border-slate-300 bg-slate-50 p-5">
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
              <div key={label} className="border border-slate-200 bg-white px-4 py-4">
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
        'overflow-hidden border border-slate-300 bg-white',
        className,
      )}
    >
      <div className="px-5 pt-5">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Summering</p>
          <CanvasHintPill tone="system">Systemblock</CanvasHintPill>
        </div>
        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-3 py-3">
            <span className="text-sm text-slate-600">Delsumma</span>
            <div className="h-3 w-24 rounded-full bg-slate-200" />
          </div>
          <div className="flex items-center justify-between gap-4 px-3 py-3">
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
      ? 'border-sky-300 bg-sky-50 text-sky-800'
      : tone === 'dialog'
        ? 'border-slate-300 bg-white text-slate-700'
        : 'border-emerald-300 bg-emerald-50 text-emerald-800';

  return (
    <span
      className={cn(
        'inline-flex items-center border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em]',
        toneClassName,
      )}
    >
      {children}
    </span>
  );
}
