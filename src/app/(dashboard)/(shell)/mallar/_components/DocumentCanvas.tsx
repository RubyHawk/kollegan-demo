'use client';

import { EditorContent } from '@tiptap/react';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useTemplateEditor } from './editor-context';
import { useHeaderFooter } from './header-footer-context';
import { PRESENTATION_PAGE_HEIGHT, PRESENTATION_PAGE_WIDTH } from './presentation-page-height';
import { cn } from '@shared/lib/utils';
import { FileText, Heading1, Plus, Redo2, Undo2 } from 'lucide-react';
import { PresentationPageLoadingState, StructuredOfferCanvas } from './document-canvas-structured';
import { CanvasZoomControls } from './CanvasZoomControls';
import { InlineFormattingMenu } from './InlineFormattingMenu';
import { insertTemplateImageIntoEditor } from './template-image-insert';
import { uploadTemplateImage } from './template-image-upload';
import { TEMPLATE_BLOCK_MIME, decodeInsertPayload, insertTemplatePayload, isTipTapDocEmpty } from './template-insert-actions';

const MARGIN_PRESETS = { tight: 40, normal: 56, wide: 80 } as const;
const IS_MAC = typeof navigator !== 'undefined' && /Mac/.test(navigator.userAgent);
export default function DocumentCanvas() {
  const editor = useTemplateEditor();
  const hf = useHeaderFooter();
  const viewportRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });
  const [measuredPageHeight, setMeasuredPageHeight] = useState<number | null>(null);

  const activePage = hf?.pages[hf.activeIdx] ?? null;
  const isDocumentPage = activePage?.kind === 'document';
  const documentSettings = activePage?.document;
  const pageRenderKey = activePage ? `${activePage.id}:${activePage.kind ?? 'presentation'}` : 'page';
  const pageBodyAttrs = (activePage?.body as { attrs?: Record<string, unknown> } | null | undefined)?.attrs ?? {};
  const storedPresentationHeight = typeof pageBodyAttrs.pageHeight === 'number' ? pageBodyAttrs.pageHeight : null;
  const basePageWidth = isDocumentPage ? 860 : PRESENTATION_PAGE_WIDTH;
  const basePageMinHeight = isDocumentPage ? 840 : storedPresentationHeight ?? PRESENTATION_PAGE_HEIGHT;

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
  const isEmptyPage = useMemo(() => isTipTapDocEmpty(activePage?.body), [activePage?.body]);
  const zoom = hf?.canvasZoom ?? 'fit';
  const numericZoom = zoom === 'fit' ? 1 : zoom;
  const pageNaturalHeight = measuredPageHeight ?? basePageMinHeight;
  const fitScale = zoom === 'fit' && viewportSize.width > 0 && viewportSize.height > 0
    ? Math.min(1, Math.max(0.1, Math.min((viewportSize.width - 24) / basePageWidth, (viewportSize.height - 24) / pageNaturalHeight)))
    : 1;
  const renderedScale = zoom === 'fit' ? fitScale : numericZoom;

  useLayoutEffect(() => {
    if (!pageRef.current) return;

    const measure = () => {
      if (!pageRef.current) return;
      setMeasuredPageHeight(pageRef.current.offsetHeight);
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(pageRef.current);
    return () => observer.disconnect();
  }, [pageRenderKey]);

  useLayoutEffect(() => {
    if (!viewportRef.current) return;
    const measure = () => {
      const rect = viewportRef.current?.getBoundingClientRect();
      if (!rect) return;
      setViewportSize({ width: rect.width, height: rect.height });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(viewportRef.current);
    return () => observer.disconnect();
  }, []);

  if (!editor || !activePage) return null;

  function handleCanvasDragOver(event: React.DragEvent<HTMLDivElement>) {
    const hasBlock = event.dataTransfer.types.includes(TEMPLATE_BLOCK_MIME);
    const hasImageFile = Array.from(event.dataTransfer.files).some((file) => file.type.startsWith('image/'));
    if (hasBlock || hasImageFile) {
      event.preventDefault();
      event.dataTransfer.dropEffect = 'copy';
    }
  }

  function handleCanvasDrop(event: React.DragEvent<HTMLDivElement>) {
    if (event.defaultPrevented) return;
    const payload = decodeInsertPayload(event.dataTransfer.getData(TEMPLATE_BLOCK_MIME));
    const imageFile = Array.from(event.dataTransfer.files).find((file) => file.type.startsWith('image/'));
    if (imageFile && event.target instanceof Element && event.target.closest('.ProseMirror')) return;
    if (!payload && !imageFile) return;
    event.preventDefault();
    if (!activePageReady || isDocumentPage) return;
    const currentEditor = editor;
    if (!currentEditor) return;
    if (payload) {
      insertTemplatePayload(currentEditor, payload);
      return;
    }
    if (imageFile) {
      void uploadTemplateImage(imageFile)
        .then((src) => insertTemplateImageIntoEditor(currentEditor, src))
        .catch((error) => {
          window.alert(error instanceof Error ? error.message : 'Kunde inte ladda upp bilden.');
        });
    }
  }

  return (
    <div className="relative flex-1 overflow-hidden bg-[var(--ui-surface-subtle)]">
      <InlineFormattingMenu />
      <UndoRedoControls className="absolute left-3 top-3 z-20" />
      <CanvasZoomControls className="absolute right-3 top-3 z-20" />

      <div className="flex h-full min-h-0 flex-col">
      <div ref={viewportRef} className={cn('min-h-0 flex-1 px-3 py-3', zoom === 'fit' ? 'overflow-hidden' : 'overflow-auto')}>
        <div
          className="mx-auto"
          style={{
            width: basePageWidth * renderedScale,
            height: pageNaturalHeight * renderedScale,
          }}
        >
          <div
            ref={pageRef}
            style={{
              width: basePageWidth,
              transform: `scale(${renderedScale})`,
              transformOrigin: 'top left',
            }}
          >
          <div
            key={pageRenderKey}
            data-a4-page={!isDocumentPage ? 'presentation' : undefined}
            onDragOver={handleCanvasDragOver}
            onDrop={handleCanvasDrop}
            className="relative border border-[var(--ui-border-strong)] bg-[var(--ui-surface-raised)] shadow-[var(--ui-shadow-dialog)]"
            style={{ minHeight: basePageMinHeight }}
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
                    <>
                      {isEmptyPage && (
                        <BlankPageEmptyState
                          onInsertHeading={() => insertTemplatePayload(editor, { kind: 'heading1' })}
                          onAddCover={() => hf?.addPage({ label: 'Omslag', role: 'cover', kind: 'presentation', includeInCustomerPdf: true })}
                          onAddOfferPage={() => hf?.addPage({ label: 'Offertsida', role: 'offer', kind: 'document', includeInCustomerPdf: true })}
                        />
                      )}
                      <EditorContent
                        key={`presentation-editor:${pageRenderKey}`}
                        editor={editor}
                        className="doc-editor doc-editor--presentation"
                      />
                    </>
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
          color: var(--ui-text);
          font-size: 14px;
          line-height: 1.75;
          overflow-wrap: anywhere;
        }
        .doc-editor .ProseMirror p { margin: 0 0 12px 0; }
        .doc-editor .ProseMirror h1 {
          margin: 0 0 14px 0;
          font-size: 32px;
          line-height: 1.1;
          letter-spacing: 0;
          font-weight: 700;
          color: var(--ui-text);
        }
        .doc-editor .ProseMirror h2 {
          margin: 18px 0 10px 0;
          font-size: 20px;
          line-height: 1.2;
          font-weight: 700;
          color: var(--ui-accent);
        }
        .doc-editor .ProseMirror h3 {
          margin: 16px 0 8px 0;
          font-size: 16px;
          line-height: 1.3;
          font-weight: 700;
          color: var(--ui-text-secondary);
        }
        .doc-editor .ProseMirror ul { list-style: disc; padding-left: 24px; margin: 0 0 12px 0; }
        .doc-editor .ProseMirror ol { list-style: decimal; padding-left: 24px; margin: 0 0 12px 0; }
        .doc-editor .ProseMirror li { margin-bottom: 6px; }
        .doc-editor .ProseMirror table { width: 100%; border-collapse: collapse; margin: 0 0 16px 0; }
        .doc-editor .ProseMirror td,
        .doc-editor .ProseMirror th { border: 1px solid var(--ui-border); padding: 10px 12px; vertical-align: top; }
        .doc-editor .ProseMirror th { background: var(--ui-surface-subtle); font-size: 12px; text-transform: uppercase; letter-spacing: 0; color: var(--ui-text-muted); }
        .doc-editor .ProseMirror hr { border: none; border-top: 1px solid var(--ui-border); margin: 18px 0; }
        .doc-editor .ProseMirror a { color: var(--ui-accent); text-decoration: underline; }
        .doc-editor .ProseMirror .variable-chip {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          border-radius: 999px;
          background: var(--ui-surface-selected);
          color: var(--ui-accent);
          padding: 2px 8px;
          font-size: 12px;
          font-family: system-ui, sans-serif;
          font-weight: 600;
          white-space: nowrap;
        }
        .doc-editor .ProseMirror .selectedCell { background: var(--ui-surface-selected); }
        .doc-editor .ProseMirror .column-resize-handle { position: absolute; right: -2px; top: 0; bottom: 0; width: 4px; background: var(--ui-accent); pointer-events: none; }
        .doc-editor--structured .ProseMirror {
          min-height: 220px;
          font-size: 14px;
          line-height: 1.78;
        }
        .doc-editor--presentation .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          color: var(--ui-text-muted);
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
          color: var(--ui-text-secondary);
          border-radius: 6px;
          cursor: pointer;
          transition: background 0.12s ease, color 0.12s ease;
          padding: 0;
        }
        .img-tb-btn:hover:not(:disabled) {
          background: var(--ui-surface-hover);
          color: var(--ui-text);
        }
        .img-tb-btn[data-active='true'] {
          background: var(--ui-surface-selected);
          color: var(--ui-accent);
        }
        .img-tb-btn[data-danger='true']:hover:not(:disabled) {
          background: var(--ui-danger-bg);
          color: var(--ui-danger-text);
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
          background: var(--ui-text);
          color: var(--ui-text-inverse);
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

function UndoRedoControls({ className }: { className?: string }) {
  const editor = useTemplateEditor();
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  useEffect(() => {
    if (!editor) return;
    const update = () => {
      setCanUndo(editor.can().undo());
      setCanRedo(editor.can().redo());
    };
    update();
    editor.on('transaction', update);
    return () => { editor.off('transaction', update); };
  }, [editor]);

  if (!editor) return null;

  return (
    <div className={cn('flex items-center rounded-lg bg-[var(--ui-surface)] p-0.5 ring-1 ring-inset ring-[var(--ui-border)]', className)}>
      <button
        type="button"
        title={IS_MAC ? 'Ångra (⌘Z)' : 'Ångra (Ctrl+Z)'}
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!canUndo}
        className="inline-flex h-7 w-7 items-center justify-center rounded-md text-[var(--ui-text-secondary)] transition-colors hover:bg-[var(--ui-surface-hover)] hover:text-[var(--ui-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ui-focus)] disabled:cursor-not-allowed disabled:text-[var(--ui-text-disabled)] disabled:opacity-80"
      >
        <Undo2 size={14} strokeWidth={1.75} />
      </button>
      <button
        type="button"
        title={IS_MAC ? 'Gör om (⌘⇧Z)' : 'Gör om (Ctrl+Y)'}
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!canRedo}
        className="inline-flex h-7 w-7 items-center justify-center rounded-md text-[var(--ui-text-secondary)] transition-colors hover:bg-[var(--ui-surface-hover)] hover:text-[var(--ui-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ui-focus)] disabled:cursor-not-allowed disabled:text-[var(--ui-text-disabled)] disabled:opacity-80"
      >
        <Redo2 size={14} strokeWidth={1.75} />
      </button>
    </div>
  );
}

function BlankPageEmptyState({ onInsertHeading, onAddCover, onAddOfferPage }: {
  onInsertHeading: () => void;
  onAddCover: () => void;
  onAddOfferPage: () => void;
}) {
  return (
    <div className="mb-6 rounded-lg border border-dashed border-[var(--ui-accent-border)] bg-[var(--ui-surface-selected)] px-4 py-4">
      <p className="text-sm font-semibold text-[var(--ui-text)]">Börja från en tom sida</p>
      <p className="mt-1 max-w-[58ch] text-xs leading-5 text-[var(--ui-text-secondary)]">
        Klicka in en byggsten från vänster, dra ett block hit eller starta med en vanlig rubrik. Omslag och offertsida kan läggas till när flödet växer.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" onClick={onInsertHeading} className="inline-flex items-center gap-1.5 rounded-md bg-[var(--ui-accent)] px-3 py-1.5 text-xs font-semibold text-[var(--ui-text-inverse)] transition-colors hover:bg-[var(--ui-accent-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ui-focus)]">
          <Heading1 size={14} strokeWidth={1.75} /> Lägg till rubrik
        </button>
        <button type="button" onClick={onAddCover} className="inline-flex items-center gap-1.5 rounded-md border border-[var(--ui-border)] bg-[var(--ui-surface)] px-3 py-1.5 text-xs font-semibold text-[var(--ui-text)] transition-colors hover:bg-[var(--ui-surface-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ui-focus)]">
          <Plus size={14} strokeWidth={1.75} /> Omslag
        </button>
        <button type="button" onClick={onAddOfferPage} className="inline-flex items-center gap-1.5 rounded-md border border-[var(--ui-border)] bg-[var(--ui-surface)] px-3 py-1.5 text-xs font-semibold text-[var(--ui-text)] transition-colors hover:bg-[var(--ui-surface-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ui-focus)]">
          <FileText size={14} strokeWidth={1.75} /> Offertsida
        </button>
      </div>
    </div>
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
    <section className="border-b border-[var(--ui-border)] bg-[var(--ui-surface)]/60 px-0 py-4">
      <div className="px-6">
        <p className="mb-2 text-[11px] font-semibold uppercase text-[var(--ui-text-muted)]">{label}</p>
      </div>
      <div className="hf-editor" style={{ padding: `0 ${hPad}px` }}>
        <EditorContent editor={editor} />
      </div>
    </section>
  );
}

