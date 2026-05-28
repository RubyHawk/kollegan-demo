'use client';

import { BubbleMenu } from '@tiptap/react/menus';
import { EditorContent } from '@tiptap/react';
import { NodeSelection } from '@tiptap/pm/state';
import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useTemplateEditor } from './editor-context';
import { useHeaderFooter } from './header-footer-context';
import { PRESENTATION_PAGE_HEIGHT, PRESENTATION_PAGE_WIDTH } from './presentation-page-height';
import { cn } from '@shared/lib/utils';
import { Link as LinkIcon, MagnifyingGlassMinus, MagnifyingGlassPlus, NotePencil, Plus, TextHOne } from '@phosphor-icons/react';
import { PresentationPageLoadingState, StructuredOfferCanvas } from './document-canvas-structured';
import { insertTemplateImageIntoEditor } from './template-image-insert';
import { uploadTemplateImage } from './template-image-upload';
import { TEMPLATE_BLOCK_MIME, decodeInsertPayload, insertTemplatePayload, isTipTapDocEmpty } from './template-insert-actions';

const MARGIN_PRESETS = { tight: 40, normal: 56, wide: 80 } as const;
const ZOOM_STEPS = [0.75, 0.9, 1, 1.15, 1.3] as const;

export default function DocumentCanvas() {
  const editor = useTemplateEditor();
  const hf = useHeaderFooter();
  const [zoom, setZoom] = useState<'fit' | number>('fit');
  const pageRef = useRef<HTMLDivElement>(null);
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
  const numericZoom = zoom === 'fit' ? 1 : zoom;

  useLayoutEffect(() => {
    if (!pageRef.current || zoom === 'fit') return;

    const measure = () => {
      const rect = pageRef.current?.getBoundingClientRect();
      if (!rect) return;
      setMeasuredPageHeight(rect.height);
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(pageRef.current);
    return () => observer.disconnect();
  }, [pageRenderKey, zoom]);

  if (!editor || !activePage) return null;

  function stepZoom(direction: -1 | 1) {
    const current = zoom === 'fit' ? 1 : zoom;
    const currentIdx = ZOOM_STEPS.findIndex((value) => value >= current);
    const baseIdx = currentIdx === -1 ? ZOOM_STEPS.indexOf(1) : currentIdx;
    const nextIdx = Math.min(ZOOM_STEPS.length - 1, Math.max(0, baseIdx + direction));
    setZoom(ZOOM_STEPS[nextIdx]);
  }

  function handleCanvasDragOver(event: React.DragEvent<HTMLDivElement>) {
    const hasBlock = event.dataTransfer.types.includes(TEMPLATE_BLOCK_MIME);
    const hasImageFile = Array.from(event.dataTransfer.files).some((file) => file.type.startsWith('image/'));
    if (hasBlock || hasImageFile) {
      event.preventDefault();
      event.dataTransfer.dropEffect = 'copy';
    }
  }

  function handleCanvasDrop(event: React.DragEvent<HTMLDivElement>) {
    const payload = decodeInsertPayload(event.dataTransfer.getData(TEMPLATE_BLOCK_MIME));
    const imageFile = Array.from(event.dataTransfer.files).find((file) => file.type.startsWith('image/'));
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
    <div className="flex-1 overflow-hidden bg-[#d8dde4]">
      <BubbleFormattingMenu />

      <div className="flex h-full min-h-0 flex-col">
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[var(--border)] bg-[var(--surface-1)] px-3 py-2">
          <div className="min-w-0">
            <p className="truncate text-[12px] font-semibold text-[var(--text-primary)]">{activePage.label}</p>
            <p className="text-[11px] text-[var(--text-muted)]">
              {isDocumentPage ? 'Strukturerad offertsida' : activePage.includeInCustomerPdf === false ? 'Intern presentationssida' : 'Kundvy + PDF'}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1 rounded-md border border-[var(--border)] bg-[var(--surface)] p-1">
            <button
              type="button"
              onClick={() => stepZoom(-1)}
              className="inline-flex h-7 w-7 items-center justify-center rounded text-[var(--text-secondary)] hover:bg-[var(--surface-active)] hover:text-[var(--text-primary)]"
              title="Zooma ut"
            >
              <MagnifyingGlassMinus size={14} />
            </button>
            <button
              type="button"
              onClick={() => setZoom('fit')}
              className={cn(
                'h-7 rounded px-2 text-[11px] font-semibold',
                zoom === 'fit' ? 'bg-[var(--accent-subtle)] text-[var(--accent)]' : 'text-[var(--text-secondary)] hover:bg-[var(--surface-active)]',
              )}
            >
              Anpassa
            </button>
            <button
              type="button"
              onClick={() => setZoom(1)}
              className={cn(
                'h-7 rounded px-2 text-[11px] font-semibold',
                zoom === 1 ? 'bg-[var(--accent-subtle)] text-[var(--accent)]' : 'text-[var(--text-secondary)] hover:bg-[var(--surface-active)]',
              )}
            >
              {zoom === 'fit' ? 'Fit' : `${Math.round(numericZoom * 100)}%`}
            </button>
            <button
              type="button"
              onClick={() => stepZoom(1)}
              className="inline-flex h-7 w-7 items-center justify-center rounded text-[var(--text-secondary)] hover:bg-[var(--surface-active)] hover:text-[var(--text-primary)]"
              title="Zooma in"
            >
              <MagnifyingGlassPlus size={14} />
            </button>
          </div>
        </div>

      <div className="min-h-0 flex-1 overflow-auto px-4 py-6 md:px-8 md:py-8">
        <div
          className="mx-auto"
          style={{
            maxWidth: zoom === 'fit' ? basePageWidth : undefined,
            width: zoom === 'fit' ? '100%' : basePageWidth * numericZoom,
            height: zoom === 'fit' ? undefined : (measuredPageHeight ?? basePageMinHeight) * numericZoom,
          }}
        >
          <div
            ref={pageRef}
            style={{
              width: zoom === 'fit' ? '100%' : basePageWidth,
              transform: zoom === 'fit' ? undefined : `scale(${numericZoom})`,
              transformOrigin: 'top left',
            }}
          >
          <div
            key={pageRenderKey}
            data-a4-page={!isDocumentPage ? 'presentation' : undefined}
            onDragOver={handleCanvasDragOver}
            onDrop={handleCanvasDrop}
            className="relative border border-slate-300 bg-white shadow-[0_18px_44px_rgba(15,23,42,0.18)]"
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
          letter-spacing: 0;
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

function BlankPageEmptyState({
  onInsertHeading,
  onAddCover,
  onAddOfferPage,
}: {
  onInsertHeading: () => void;
  onAddCover: () => void;
  onAddOfferPage: () => void;
}) {
  return (
    <div className="mb-6 rounded-lg border border-dashed border-[var(--accent-border)] bg-[var(--accent-subtle)] px-4 py-4">
      <p className="text-sm font-semibold text-[var(--text-primary)]">Börja från en tom sida</p>
      <p className="mt-1 max-w-[58ch] text-xs leading-5 text-[var(--text-secondary)]">
        Klicka in en byggsten från vänster, dra ett block hit eller starta med en vanlig rubrik. Omslag och offertsida kan läggas till när flödet växer.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" onClick={onInsertHeading} className="inline-flex items-center gap-1.5 rounded-md bg-[var(--accent)] px-3 py-1.5 text-xs font-semibold text-white">
          <TextHOne size={13} /> Lägg till rubrik
        </button>
        <button type="button" onClick={onAddCover} className="inline-flex items-center gap-1.5 rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--surface-active)]">
          <Plus size={13} /> Omslag
        </button>
        <button type="button" onClick={onAddOfferPage} className="inline-flex items-center gap-1.5 rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--surface-active)]">
          <NotePencil size={13} /> Offertsida
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
