'use client';

import { BubbleMenu } from '@tiptap/react/menus';
import { EditorContent } from '@tiptap/react';
import { NodeSelection } from '@tiptap/pm/state';
import { useTemplateEditor } from './editor-context';
import { useHeaderFooter } from './header-footer-context';
import { PRESENTATION_PAGE_HEIGHT, PRESENTATION_PAGE_WIDTH } from './presentation-page-height';
import { cn } from '@shared/lib/utils';
import { Link as LinkIcon } from '@phosphor-icons/react';
import { PresentationPageLoadingState, StructuredOfferCanvas } from './document-canvas-structured';

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
