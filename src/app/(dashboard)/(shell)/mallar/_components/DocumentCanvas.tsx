'use client';

import { BubbleMenu } from '@tiptap/react/menus';
import { EditorContent } from '@tiptap/react';
import { NodeSelection } from '@tiptap/pm/state';
import { useTemplateEditor } from './editor-context';
import { useHeaderFooter } from './header-footer-context';
import { PRESENTATION_PAGE_HEIGHT, PRESENTATION_PAGE_WIDTH } from './presentation-page-height';
import { cn } from '@shared/lib/utils';
import { Link as LinkIcon } from '@phosphor-icons/react';

const MARGIN_PRESETS = { tight: 40, normal: 56, wide: 80 } as const;

export default function DocumentCanvas() {
  const editor = useTemplateEditor();
  const hf = useHeaderFooter();

  const activePage = hf?.pages[hf.activeIdx] ?? null;
  const isDocumentPage = activePage?.kind === 'document';
  const documentSettings = activePage?.document;
  const pageRenderKey = activePage ? `${activePage.id}:${activePage.kind ?? 'presentation'}` : 'page';

  const activeHeader = hf?.activeHeader ?? { enabled: false, useDefault: true };
  const activeFooter = hf?.activeFooter ?? { enabled: false, useDefault: true };
  const headerEditor = activeHeader.enabled
    ? (activeHeader.useDefault ? hf?.headerDefault : hf?.headerPageOverride) ?? null
    : null;
  const footerEditor = activeFooter.enabled
    ? (activeFooter.useDefault ? hf?.footerDefault : hf?.footerPageOverride) ?? null
    : null;

  const pagePadding = MARGIN_PRESETS[hf?.docSettings?.pageMargin ?? 'normal'];
  const docFont = hf?.docSettings?.defaultFont ?? 'Calibri';
  const activePageReady = hf?.activePageReady ?? true;

  if (!editor || !activePage) return null;

  return (
    <div className="flex-1 overflow-hidden bg-[var(--surface-2)]">
      <BubbleFormattingMenu />

      <div className="h-full overflow-auto px-3 py-4 md:px-4 md:py-6">
        <div
          className="mx-auto w-full"
          style={{ maxWidth: isDocumentPage ? 820 : PRESENTATION_PAGE_WIDTH }}
        >
          <div
            key={pageRenderKey}
            data-a4-page={!isDocumentPage ? 'presentation' : undefined}
            className="relative overflow-hidden rounded-xl border border-[var(--border)] bg-white shadow-[0_8px_28px_rgba(15,23,42,0.08)]"
            style={{ minHeight: isDocumentPage ? 840 : PRESENTATION_PAGE_HEIGHT }}
          >
            {!isDocumentPage && headerEditor && (
              <HFZone
                label={activeHeader.useDefault ? 'Sidhuvud (standard)' : 'Sidhuvud (unik för sidan)'}
                editor={headerEditor}
                hPad={pagePadding}
              />
            )}

            <div className={cn('relative', isDocumentPage ? 'p-5 md:p-8' : '')}>
              {isDocumentPage ? (
                <StructuredOfferCanvas
                  pageKey={pageRenderKey}
                  editor={editor}
                  title={activePage.label}
                  settings={documentSettings}
                  fontFamily={docFont}
                  pageReady={activePageReady}
                />
              ) : (
                <div
                  key={`presentation-shell:${pageRenderKey}`}
                  className="presentation-page"
                  style={{ padding: `${pagePadding}px ${pagePadding}px`, fontFamily: `${docFont}, Arial, sans-serif` }}
                >
                  {activePageReady ? (
                    <EditorContent
                      key={`presentation-editor:${pageRenderKey}`}
                      editor={editor}
                      className="doc-editor doc-editor--presentation"
                    />
                  ) : (
                    <PresentationPageLoadingState role={activePage.role} />
                  )}
                </div>
              )}
            </div>

            {!isDocumentPage && footerEditor && (
              <HFZone
                label={activeFooter.useDefault ? 'Sidfot (standard)' : 'Sidfot (unik för sidan)'}
                editor={footerEditor}
                hPad={pagePadding}
              />
            )}
          </div>
        </div>
      </div>

      <style>{`
        .doc-editor {
          display: contents;
        }
      .doc-editor .ProseMirror {
          outline: none !important;
          border: none !important;
          min-height: 460px;
          color: #0f172a;
          font-size: 14px;
          line-height: 1.75;
          overflow-wrap: anywhere;
        }
        .doc-editor .ProseMirror p { margin: 0 0 12px 0; }
        .doc-editor .ProseMirror h1 {
          margin: 0 0 14px 0;
          font-size: 32px;
          line-height: 1.1;
          letter-spacing: -0.04em;
          font-weight: 700;
          color: #0f172a;
        }
        .doc-editor .ProseMirror h2 {
          margin: 18px 0 10px 0;
          font-size: 20px;
          line-height: 1.2;
          font-weight: 700;
          color: #1e3a8a;
        }
        .doc-editor .ProseMirror h3 {
          margin: 16px 0 8px 0;
          font-size: 16px;
          line-height: 1.3;
          font-weight: 700;
          color: #334155;
        }
        .doc-editor .ProseMirror ul { list-style: disc; padding-left: 24px; margin: 0 0 12px 0; }
        .doc-editor .ProseMirror ol { list-style: decimal; padding-left: 24px; margin: 0 0 12px 0; }
        .doc-editor .ProseMirror li { margin-bottom: 6px; }
        .doc-editor .ProseMirror table { width: 100%; border-collapse: collapse; margin: 0 0 16px 0; }
        .doc-editor .ProseMirror td,
        .doc-editor .ProseMirror th { border: 1px solid #dbe4ee; padding: 10px 12px; vertical-align: top; }
        .doc-editor .ProseMirror th { background: #f8fafc; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; }
        .doc-editor .ProseMirror hr { border: none; border-top: 1px solid #dbe4ee; margin: 18px 0; }
        .doc-editor .ProseMirror a { color: #2563eb; text-decoration: underline; }
        .doc-editor .ProseMirror .variable-chip {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          border-radius: 999px;
          background: #eef2ff;
          color: #4338ca;
          padding: 2px 8px;
          font-size: 12px;
          font-family: system-ui, sans-serif;
          font-weight: 600;
          white-space: nowrap;
        }
        .doc-editor .ProseMirror .selectedCell { background: #dbeafe; }
        .doc-editor .ProseMirror .column-resize-handle { position: absolute; right: -2px; top: 0; bottom: 0; width: 4px; background: #2563eb; pointer-events: none; }
        .doc-editor--structured .ProseMirror {
          min-height: 220px;
          font-size: 14px;
          line-height: 1.78;
        }
        .doc-editor--presentation .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          color: #94a3b8;
          float: left;
          height: 0;
          pointer-events: none;
          font-style: italic;
        }
        .hf-editor .ProseMirror {
          min-height: 60px !important;
          outline: none !important;
        }

        /* Image NodeView toolbar */
        .img-tb-btn {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 26px;
          height: 26px;
          border: none;
          background: transparent;
          color: #475569;
          border-radius: 6px;
          cursor: pointer;
          transition: background 0.12s ease, color 0.12s ease;
          padding: 0;
        }
        .img-tb-btn:hover:not(:disabled) {
          background: #f1f5f9;
          color: #0f172a;
        }
        .img-tb-btn[data-active='true'] {
          background: #e0edff;
          color: #1d4ed8;
        }
        .img-tb-btn[data-danger='true']:hover:not(:disabled) {
          background: #fef2f2;
          color: #dc2626;
        }
        .img-tb-btn:disabled {
          opacity: 0.35;
          cursor: not-allowed;
        }
        .img-tb-btn[data-tooltip]::after {
          content: attr(data-tooltip);
          position: absolute;
          bottom: calc(100% + 6px);
          left: 50%;
          transform: translateX(-50%);
          background: #0f172a;
          color: white;
          font-size: 11px;
          font-family: system-ui, -apple-system, sans-serif;
          font-weight: 500;
          padding: 4px 8px;
          border-radius: 5px;
          white-space: nowrap;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.1s ease;
          z-index: 500;
        }
        .img-tb-btn[data-tooltip]:hover:not(:disabled)::after {
          opacity: 1;
        }
      `}</style>
    </div>
  );
}

function BubbleFormattingMenu() {
  const editor = useTemplateEditor();
  if (!editor) return null;

  return (
    <BubbleMenu
      editor={editor}
      options={{ placement: 'top' }}
      shouldShow={({ state }) => {
        const { selection } = state;
        if (selection instanceof NodeSelection) return false;
        return selection.from !== selection.to;
      }}
      className="flex items-center gap-1 rounded-full border border-[var(--border)] bg-[var(--surface)] p-1 shadow-lg"
    >
      <InlineButton title="Fet" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}>
        B
      </InlineButton>
      <InlineButton title="Kursiv" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}>
        <em>I</em>
      </InlineButton>
      <InlineButton title="Understruken" active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()}>
        <u>U</u>
      </InlineButton>
      <InlineButton
        title="Länk"
        active={editor.isActive('link')}
        onClick={() => {
          const previous = editor.getAttributes('link').href as string | undefined;
          const url = window.prompt('Länkadress', previous ?? '');
          if (url === null) return;
          if (!url.trim()) {
            editor.chain().focus().unsetLink().run();
            return;
          }
          editor.chain().focus().setLink({ href: url.trim() }).run();
        }}
      >
        <LinkIcon size={12} />
      </InlineButton>
    </BubbleMenu>
  );
}

function StructuredOfferCanvas({
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
      className="relative overflow-hidden rounded-[24px] border border-slate-200 bg-[linear-gradient(180deg,#fbfdff_0%,#ffffff_24%)] p-4 md:rounded-[28px] md:p-8"
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
        <header className="grid gap-6 border-b border-slate-200 pb-6 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="flex items-start gap-4">
            {settings?.showLogo !== false && (
              <div className="mt-1 h-16 w-16 rounded-2xl border border-slate-200 bg-white shadow-sm" />
            )}
            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Avsändare</p>
              {settings?.showSenderDetails !== false ? (
                <>
                  <div className="h-3 w-32 rounded-full bg-slate-300" />
                  <div className="h-2.5 w-44 rounded-full bg-slate-200" />
                  <div className="h-2.5 w-36 rounded-full bg-slate-200" />
                  <div className="h-2.5 w-28 rounded-full bg-slate-200" />
                </>
              ) : (
                <p className="text-sm text-slate-500">Företagsblocket är dolt på den här offertsidan.</p>
              )}
            </div>
          </div>

          <div className="rounded-[24px] border border-slate-200 bg-[linear-gradient(180deg,#fcfdff_0%,#f5f9ff_100%)] p-5 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
            <div className="mb-3 ml-auto inline-flex rounded-full bg-blue-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-blue-700">
              Offertstatus
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

        <section className={cn(
          'grid gap-6',
          settings?.showCustomerBlock !== false ? 'lg:grid-cols-[minmax(0,1fr)_280px]' : 'grid-cols-1'
        )}>
          <div className="space-y-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Offertsida</p>
            <h1 className="max-w-[12ch] text-[34px] font-semibold leading-[1.03] tracking-[-0.05em] text-slate-950 md:text-[40px]">
              {title}
            </h1>
            <p className="max-w-[50ch] text-sm leading-7 text-slate-600">
              Här ser du kundens slutliga offertstruktur. Prisrad, summering och juridik hålls konsekventa,
              medan din fria textyta nedan ger plats för introduktion och projektspecifika förtydliganden.
            </p>
          </div>

          {settings?.showCustomerBlock !== false && (
            <aside className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_12px_28px_rgba(15,23,42,0.06)]">
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Kundblock</p>
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
              <div className={cn(
                'rounded-[28px] border border-slate-200 bg-white shadow-[0_14px_34px_rgba(15,23,42,0.05)]',
                introLayout === 'roomy' ? 'p-7' : 'p-5'
              )}>
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Fri offerttext</p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Den här ytan används för introduktion, förtydliganden och kompletterande offerttext.
                    </p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-600">
                    {introLayout === 'roomy' ? 'Rymlig' : 'Kompakt'}
                  </span>
                </div>
                <EditorContent
                  key={`structured-editor:${pageKey}`}
                  editor={pageReady ? editor : null}
                  className="doc-editor doc-editor--structured"
                />
              </div>
            )}

            {settings?.showLineItems !== false && (
              <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.05)]">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Prisdel</p>
                    <h3 className="mt-1 text-lg font-semibold text-slate-900">Produkter och tjänster</h3>
                  </div>
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-700">
                    Systemblock
                  </span>
                </div>
                <div className="rounded-[22px] border border-slate-200 bg-slate-50">
                  <div className="grid grid-cols-[minmax(0,1.6fr)_86px_110px_90px_112px] gap-4 border-b border-slate-200 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                    <span>Produkt eller tjänst</span>
                    <span className="text-right">Antal</span>
                    <span className="text-right">À-pris</span>
                    <span className="text-right">Moms</span>
                    <span className="text-right">Belopp</span>
                  </div>
                  <div className="grid grid-cols-[minmax(0,1.6fr)_86px_110px_90px_112px] gap-4 px-4 py-4">
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
              <div className="clear-both flex justify-end">
                <SummaryCard className="w-full max-w-[300px]" />
              </div>
            )}

            {settings?.showTerms !== false && (
              <div className="clear-both rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.05)]">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Juridik</p>
                <h3 className="mt-2 text-lg font-semibold text-slate-900">{settings?.termsHeading ?? 'Juridiska villkor'}</h3>
                <p className="mt-3 max-w-[72ch] text-sm leading-7 text-slate-600">
                  Standardtexten för juridik och villkor styrs i högerspalten. Här ser du hur den kommer ligga i den slutliga offerten.
                </p>
              </div>
            )}

            {settings?.showNotes !== false && (
              <div className="clear-both rounded-[28px] border border-dashed border-slate-300 bg-white/80 p-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Anteckningar</p>
                <p className="mt-2 text-sm leading-7 text-slate-600">
                  Rubriken för eventuella offertspecifika anteckningar sätts i högerspalten och används när en offert har egen kommentar.
                </p>
              </div>
            )}
        </section>

        {settings?.showFooter !== false && (
          <footer className="grid gap-4 border-t border-slate-200 pt-5 text-sm text-slate-600 md:grid-cols-3">
            {['Soleria', 'Ansvarig', 'Kontakt'].map((label) => (
              <div key={label}>
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

function PresentationPageLoadingState({ role }: { role?: string }) {
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
    <aside className={cn('rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.05)]', className)}>
      <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Summering</p>
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-4">
          <span className="text-sm text-slate-600">Delsumma</span>
          <div className="h-3 w-24 rounded-full bg-slate-200" />
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-sm text-slate-600">Moms</span>
          <div className="h-3 w-20 rounded-full bg-slate-200" />
        </div>
        <div className="flex items-center justify-between gap-4 border-t border-slate-200 pt-3">
          <span className="text-sm font-semibold text-slate-900">Totalsumma</span>
          <div className="h-3.5 w-28 rounded-full bg-slate-300" />
        </div>
      </div>
    </aside>
  );
}

function HFZone({
  label,
  editor,
  hPad,
}: {
  label: string;
  editor: NonNullable<ReturnType<typeof useTemplateEditor>>;
  hPad: number;
}) {
  return (
    <section className="border-b border-[var(--border)] bg-[var(--surface)]/60 px-0 py-4">
      <div className="px-6">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">{label}</p>
      </div>
      <div className="hf-editor" style={{ padding: `0 ${hPad}px` }}>
        <EditorContent editor={editor} />
      </div>
    </section>
  );
}

function InlineButton({
  title,
  active,
  children,
  onClick,
}: {
  title: string;
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={cn(
        'inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold text-[var(--text-secondary)] transition-colors',
        active ? 'bg-[var(--accent-subtle)] text-[var(--accent)]' : 'hover:bg-[var(--surface-active)] hover:text-[var(--text-primary)]'
      )}
    >
      {children}
    </button>
  );
}
