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
      className="relative bg-[var(--ui-surface-raised)] px-6 py-7 md:px-10 md:py-10"
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
        <header className="grid gap-6 border-b border-[var(--ui-border)] pb-6 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="flex items-start gap-4 border-l-4 border-[var(--ui-success-border)] bg-[var(--ui-surface-subtle)] px-5 py-4">
            {settings?.showLogo !== false && (
              <div className="mt-1 h-16 w-16 rounded-md border border-[var(--ui-border)] bg-[var(--ui-surface-raised)] shadow-[var(--ui-shadow-raised)]" />
            )}
            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase text-[var(--ui-text-muted)]">{'Avs\u00e4ndare'}</p>
              {settings?.showSenderDetails !== false ? (
                <>
                  <div className="h-3 w-32 rounded-full bg-[var(--ui-border-strong)]" />
                  <div className="h-2.5 w-44 rounded-full bg-[var(--ui-surface-hover)]" />
                  <div className="h-2.5 w-36 rounded-full bg-[var(--ui-surface-hover)]" />
                  <div className="h-2.5 w-28 rounded-full bg-[var(--ui-surface-hover)]" />
                </>
              ) : (
                <p className="text-sm text-[var(--ui-text-muted)]">{'F\u00f6retagsblocket \u00e4r dolt p\u00e5 den h\u00e4r offertsidan.'}</p>
              )}
            </div>
          </div>

          <div className="border border-[var(--ui-border)] bg-[var(--ui-surface-raised)] p-5">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="inline-flex border border-[var(--ui-border)] bg-[var(--ui-surface-subtle)] px-2.5 py-1 text-[11px] font-semibold uppercase text-[var(--ui-text-secondary)]">
                Offertstatus
              </div>
              <CanvasHintPill tone="system">Metadata</CanvasHintPill>
            </div>
            <div className="space-y-3">
              {['Offertnummer', 'Offertdatum', 'Giltig till'].map((label) => (
                <div key={label} className="grid grid-cols-[110px_minmax(0,1fr)] items-center gap-4">
                  <span className="text-[11px] font-semibold uppercase text-[var(--ui-text-muted)]">{label}</span>
                  <div className="h-3 rounded-full bg-[var(--ui-surface-hover)]" />
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
          <div className="space-y-4 border-l-4 border-[var(--ui-info-border)] bg-[var(--ui-surface-raised)] px-5 py-5">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[11px] font-semibold uppercase text-[var(--ui-text-muted)]">Offertsida</p>
              <CanvasHintPill tone="dialog">{'Rubrik styrs i panelen'}</CanvasHintPill>
            </div>
            <h1 className="max-w-[12ch] text-[34px] font-semibold leading-[1.03] text-[var(--ui-text)] md:text-[40px]">
              {title}
            </h1>
            <p className="max-w-[50ch] text-sm leading-7 text-[var(--ui-text-secondary)]">
              {'H\u00e4r ser du kundens slutliga offertstruktur. Varje block har nu en egen yta och tydligare markering f\u00f6r vad som \u00e4r skrivbart, styrt i panelen eller helt systemgenererat.'}
            </p>
          </div>

          {settings?.showCustomerBlock !== false && (
            <aside className="border border-[var(--ui-border)] bg-[var(--ui-surface-subtle)] p-5">
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="text-[11px] font-semibold uppercase text-[var(--ui-text-muted)]">Kundblock</p>
                <CanvasHintPill tone="system">Systemblock</CanvasHintPill>
              </div>
              <div className="space-y-2">
                <div className="h-3 w-28 rounded-full bg-[var(--ui-border-strong)]" />
                <div className="h-2.5 w-40 rounded-full bg-[var(--ui-surface-hover)]" />
                <div className="h-2.5 w-32 rounded-full bg-[var(--ui-surface-hover)]" />
              </div>
            </aside>
          )}
        </section>

        <section className="space-y-6">
          {settings?.showIntro !== false && (
            <div
              className={cn(
                'border border-[var(--ui-border)] bg-[var(--ui-surface-raised)]',
                introLayout === 'roomy' ? 'p-7' : 'p-5'
              )}
            >
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-[11px] font-semibold uppercase text-[var(--ui-text-muted)]">Fri offerttext</p>
                    <CanvasHintPill tone="editable">{'Skriv direkt h\u00e4r'}</CanvasHintPill>
                  </div>
                  <p className="mt-1 text-xs leading-5 text-[var(--ui-text-muted)]">
                    {'Introduktion, f\u00f6rtydliganden och kompletterande offerttext skrivs direkt i den markerade ytan.'}
                  </p>
                </div>
                <span className="rounded-full bg-[var(--ui-surface-raised)] px-3 py-1 text-[10px] font-semibold uppercase text-[var(--ui-text-secondary)] shadow-[var(--ui-shadow-raised)]">
                  {introLayout === 'roomy' ? 'Rymlig' : 'Kompakt'}
                </span>
              </div>
              <div className="border border-dashed border-[var(--ui-info-border)] bg-[var(--ui-info-bg)] p-4">
                <EditorContent
                  key={`structured-editor:${pageKey}`}
                  editor={pageReady ? editor : null}
                  className="doc-editor doc-editor--structured"
                />
              </div>
            </div>
          )}

          {settings?.showLineItems !== false && (
            <div className="border border-[var(--ui-border)] bg-[var(--ui-surface-raised)] p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase text-[var(--ui-text-muted)]">Prisdel</p>
                  <h3 className="mt-1 text-lg font-semibold text-[var(--ui-text)]">{'Produkter och tj\u00e4nster'}</h3>
                </div>
                <CanvasHintPill tone="system">Systemblock</CanvasHintPill>
              </div>
              <div className="border border-[var(--ui-border)] bg-[var(--ui-surface-raised)]">
                <div className="grid grid-cols-[minmax(220px,1.6fr)_86px_110px_90px_112px] gap-4 border-b border-[var(--ui-border)] bg-[var(--ui-surface-subtle)] px-4 py-3 text-[11px] font-semibold uppercase text-[var(--ui-text-muted)]">
                  <span>{'Produkt eller tj\u00e4nst'}</span>
                  <span className="text-right">Antal</span>
                  <span className="text-right">{'A-pris'}</span>
                  <span className="text-right">Moms</span>
                  <span className="text-right">Belopp</span>
                </div>
                <div className="grid grid-cols-[minmax(220px,1.6fr)_86px_110px_90px_112px] gap-4 px-4 py-4">
                  <div className="space-y-2">
                    <div className="h-3 w-48 rounded-full bg-[var(--ui-border-strong)]" />
                    <div className="h-2.5 w-64 rounded-full bg-[var(--ui-surface-hover)]" />
                  </div>
                  <div className="h-3 rounded-full bg-[var(--ui-surface-hover)]" />
                  <div className="h-3 rounded-full bg-[var(--ui-surface-hover)]" />
                  <div className="h-3 rounded-full bg-[var(--ui-surface-hover)]" />
                  <div className="h-3 rounded-full bg-[var(--ui-border-strong)]" />
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
            <div className="border-l-4 border-[var(--ui-warning-border)] bg-[var(--ui-warning-bg)] p-5">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[11px] font-semibold uppercase text-[var(--ui-text-muted)]">Juridik</p>
                <CanvasHintPill tone="dialog">{'Redigeras i dialog'}</CanvasHintPill>
              </div>
              <h3 className="mt-2 text-lg font-semibold text-[var(--ui-text)]">{settings?.termsHeading ?? 'Juridiska villkor'}</h3>
              <p className="mt-3 max-w-[72ch] text-sm leading-7 text-[var(--ui-text-secondary)]">
                {'Den juridiska standardtexten h\u00e5lls samlad i en dialog i sidpanelen, men visas h\u00e4r med lugnare kontrast s\u00e5 den inte flyter ihop med prisdelen.'}
              </p>
            </div>
          )}

          {settings?.showNotes !== false && (
            <div className="border border-dashed border-[var(--ui-border-strong)] bg-[var(--ui-surface-subtle)] p-5">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[11px] font-semibold uppercase text-[var(--ui-text-muted)]">Anteckningar</p>
                <CanvasHintPill tone="dialog">{'Redigeras i dialog'}</CanvasHintPill>
              </div>
              <p className="mt-2 text-sm leading-7 text-[var(--ui-text-secondary)]">
                {'Rubriken f\u00f6r offertspecifika anteckningar s\u00e4tts i sidpanelen och anv\u00e4nds n\u00e4r en offert har egen kommentar eller projektnotering.'}
              </p>
            </div>
          )}
        </section>

        {settings?.showFooter !== false && (
          <footer className="grid gap-4 border-t border-[var(--ui-border)] pt-5 text-sm text-[var(--ui-text-secondary)] md:grid-cols-3">
            {['Soleria', 'Ansvarig', 'Kontakt'].map((label) => (
              <div key={label} className="border border-[var(--ui-border)] bg-[var(--ui-surface-raised)] px-4 py-4">
                <p className="text-[11px] font-semibold uppercase text-[var(--ui-text-muted)]">{label}</p>
                <div className="mt-2 space-y-2">
                  <div className="h-2.5 w-24 rounded-full bg-[var(--ui-surface-hover)]" />
                  <div className="h-2.5 w-32 rounded-full bg-[var(--ui-surface-hover)]" />
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
    <div className="rounded-lg border border-dashed border-[var(--ui-border)] bg-[var(--ui-surface-subtle)] px-5 py-6 text-sm leading-6 text-[var(--ui-text-muted)]">
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
        'overflow-hidden border border-[var(--ui-border-strong)] bg-[var(--ui-surface-raised)]',
        className,
      )}
    >
      <div className="px-5 pt-5">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[11px] font-semibold uppercase text-[var(--ui-text-muted)]">Summering</p>
          <CanvasHintPill tone="system">Systemblock</CanvasHintPill>
        </div>
        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-between gap-4 border-b border-[var(--ui-border-subtle)] px-3 py-3">
            <span className="text-sm text-[var(--ui-text-secondary)]">Delsumma</span>
            <div className="h-3 w-24 rounded-full bg-[var(--ui-surface-hover)]" />
          </div>
          <div className="flex items-center justify-between gap-4 px-3 py-3">
            <span className="text-sm text-[var(--ui-text-secondary)]">Moms</span>
            <div className="h-3 w-20 rounded-full bg-[var(--ui-surface-hover)]" />
          </div>
        </div>
      </div>
      <div className="mt-5 bg-[var(--ui-text)] px-5 py-4 text-[var(--ui-text-inverse)]">
        <div className="flex items-center justify-between gap-4">
          <span className="text-sm font-semibold text-[var(--ui-text-inverse)]">Totalsumma</span>
          <div className="h-3.5 w-28 rounded-full bg-[var(--ui-surface)]" />
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
      ? 'border-[var(--ui-info-border)] bg-[var(--ui-info-bg)] text-[var(--ui-info-text)]'
      : tone === 'dialog'
        ? 'border-[var(--ui-border-strong)] bg-[var(--ui-surface-raised)] text-[var(--ui-text-secondary)]'
        : 'border-[var(--ui-success-border)] bg-[var(--ui-success-bg)] text-[var(--ui-success-text)]';

  return (
    <span
      className={cn(
        'inline-flex items-center border px-2 py-0.5 text-[10px] font-semibold uppercase ',
        toneClassName,
      )}
    >
      {children}
    </span>
  );
}
