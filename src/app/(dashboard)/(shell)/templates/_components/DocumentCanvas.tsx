'use client';

/**
 * DocumentCanvas — A4 canvas + text-formatting BubbleMenu + header/footer zones.
 *
 * Header/footer zones are rendered above and below the body area when enabled.
 * Each zone uses its own mini TipTap editor (from HFCtx) and shares the same
 * horizontal margins as the body so text aligns.
 *
 * The image toolbar is rendered INSIDE ImageNodeView (driven by the `selected`
 * prop from ProseMirror — synchronous, zero timing issues). There is NO image
 * BubbleMenu here.
 *
 * Only the text-formatting BubbleMenu lives here.
 */

export { EditorCtx, useTemplateEditor } from './editor-context';

import type { Editor } from '@tiptap/core';
import { EditorContent } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import { NodeSelection } from '@tiptap/pm/state';
import { useTemplateEditor } from './editor-context';
import { useHeaderFooter } from './header-footer-context';

// ── Horizontal margin shared by body, header, and footer (px) ─────────────────
const H_PAD = 96;

export default function DocumentCanvas() {
  const editor = useTemplateEditor();
  const hf     = useHeaderFooter();

  const { headerEnabled, footerEnabled, differentFirstPage } = hf?.settings ?? {
    headerEnabled: false, footerEnabled: false, differentFirstPage: false,
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">

      {/* ── Text formatting BubbleMenu ──────────────────────────────────────── */}
      {editor && (
        <BubbleMenu
          editor={editor}
          options={{ placement: 'top' }}
          shouldShow={({ state }) => {
            const { selection } = state;
            // Never show on node selections (images, signature blocks, variables, etc.)
            if (selection instanceof NodeSelection) return false;
            return selection.from !== selection.to;
          }}
          className="flex items-center gap-0.5 bg-white border border-slate-200 rounded-lg shadow-md p-1"
        >
          <TBtn active={editor.isActive('bold')}
            onClick={() => editor.chain().focus().toggleBold().run()}
            title="Fet (Ctrl+B)">
            <strong className="text-xs font-bold">B</strong>
          </TBtn>
          <TBtn active={editor.isActive('italic')}
            onClick={() => editor.chain().focus().toggleItalic().run()}
            title="Kursiv (Ctrl+I)">
            <em className="text-xs">I</em>
          </TBtn>
          <TBtn active={editor.isActive('underline')}
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            title="Understruken (Ctrl+U)">
            <u className="text-xs">U</u>
          </TBtn>
          <div className="w-px h-4 bg-slate-200 mx-0.5" />
          <TBtn
            active={editor.isActive('link')}
            onClick={() => {
              const prev = editor.getAttributes('link').href as string | undefined;
              const url = window.prompt('URL:', prev ?? '');
              if (url === null) return;
              if (url === '') editor.chain().focus().unsetLink().run();
              else editor.chain().focus().setLink({ href: url }).run();
            }}
            title="Länk"
          >
            <LinkIcon />
          </TBtn>
        </BubbleMenu>
      )}

      {/* ── Scrollable document area ─────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto" style={{ background: '#e8e8e8' }}>
        <div className="px-8 py-10">
          <div
            className="mx-auto bg-white"
            data-a4-page="true"
            style={{
              maxWidth:  816,
              minHeight: 1056,
              boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.08)',
              // Free-positioned images are absolutely placed relative to this div.
              // isolation:isolate creates a stacking context so their z-index values
              // are self-contained (negative z-index → behind body text).
              position:  'relative',
              isolation: 'isolate',
            }}
          >

            {/* ── Header zone ───────────────────────────────────────────────── */}
            {headerEnabled && hf && (
              <>
                {differentFirstPage && (
                  <HFZone
                    label="Sidhuvud — Första sida"
                    editor={hf.headerFirstPage}
                    zone="header"
                  />
                )}
                <HFZone
                  label={differentFirstPage ? 'Sidhuvud — Övriga sidor' : 'Sidhuvud'}
                  editor={hf.headerDefault}
                  zone="header"
                  isLast
                />
              </>
            )}

            {/* ── Body ──────────────────────────────────────────────────────── */}
            {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
            <div
              className="cursor-text"
              style={{ padding: `${H_PAD}px ${H_PAD}px` }}
              onClick={() => editor?.commands.focus()}
            >
              <EditorContent editor={editor} className="doc-editor" />
            </div>

            {/* ── Footer zone ───────────────────────────────────────────────── */}
            {footerEnabled && hf && (
              <>
                <HFZone
                  label={differentFirstPage ? 'Sidfot — Övriga sidor' : 'Sidfot'}
                  editor={hf.footerDefault}
                  zone="footer"
                  isFirst
                />
                {differentFirstPage && (
                  <HFZone
                    label="Sidfot — Första sida"
                    editor={hf.footerFirstPage}
                    zone="footer"
                  />
                )}
              </>
            )}

          </div>
        </div>

        <style>{`
          .tiptap-drag-handle { display: flex; align-items: center; }
          .doc-editor { display: contents; }
          .doc-editor .ProseMirror {
            outline: none !important;
            border: none !important;
            min-height: 720px;
            cursor: text;
            font-family: Calibri, Carlito, Arial, sans-serif;
            font-size: 13px;
            line-height: 1.6;
            color: #1e1e1e;
          }
          /* Header/footer mini-editors have a smaller minimum height */
          .hf-editor .ProseMirror { min-height: 32px !important; }

          /* Clearfix so floated images never overflow the editor */
          .doc-editor .ProseMirror::after { content: ''; display: table; clear: both; }

          /* ── Word-like typography ─────────────────────────────────────── */
          .doc-editor .ProseMirror p {
            margin: 0 0 8px 0;
            font-family: Calibri, Carlito, Arial, sans-serif;
            font-size: 13px;
            line-height: 1.6;
          }
          .doc-editor .ProseMirror h1 {
            font-family: Calibri, Carlito, Arial, sans-serif;
            font-size: 20px; font-weight: 700;
            color: #1f3864;
            margin: 20px 0 6px 0;
            line-height: 1.2;
            border-bottom: 1px solid #dce6f1;
            padding-bottom: 4px;
          }
          .doc-editor .ProseMirror h2 {
            font-family: Calibri, Carlito, Arial, sans-serif;
            font-size: 15px; font-weight: 700;
            color: #2e74b5;
            margin: 16px 0 4px 0;
            line-height: 1.3;
          }
          .doc-editor .ProseMirror h3 {
            font-family: Calibri, Carlito, Arial, sans-serif;
            font-size: 13px; font-weight: 700;
            color: #1f3864;
            margin: 12px 0 4px 0;
            line-height: 1.4;
          }
          /* Lists — Tailwind preflight resets list-style to none; restore Word defaults */
          .doc-editor .ProseMirror ul { list-style: disc;    padding-left: 28px; margin: 0 0 6px 0; }
          .doc-editor .ProseMirror ol { list-style: decimal; padding-left: 28px; margin: 0 0 6px 0; }
          .doc-editor .ProseMirror ul ul  { list-style: circle; margin: 0; }
          .doc-editor .ProseMirror ul ul ul { list-style: square; margin: 0; }
          .doc-editor .ProseMirror ol ol  { list-style: lower-alpha; margin: 0; }
          .doc-editor .ProseMirror li {
            margin-bottom: 2px;
            font-family: Calibri, Carlito, Arial, sans-serif;
            font-size: 13px; line-height: 1.6;
          }
          .doc-editor .ProseMirror li > p { margin: 0; }
          .doc-editor .ProseMirror strong { font-weight: 700; }
          .doc-editor .ProseMirror em { font-style: italic; }
          .doc-editor .ProseMirror s { text-decoration: line-through; }
          .doc-editor .ProseMirror a { color: #0563c1; text-decoration: underline; }
          .doc-editor .ProseMirror hr {
            border: none;
            border-top: 1px solid #c8c8c8;
            margin: 16px 0;
          }

          /* Highlighted text */
          .doc-editor .ProseMirror mark { border-radius: 2px; padding: 0 1px; }

          /* Blockquote */
          .doc-editor .ProseMirror blockquote {
            border-left: 3px solid #4472C4;
            margin: 12px 0;
            padding: 8px 0 8px 16px;
            color: #44546a;
            font-style: italic;
            background: #f8f9fc;
          }
          .doc-editor .ProseMirror blockquote p { margin: 0; }

          /* Inline code */
          .doc-editor .ProseMirror code {
            font-family: 'Courier New', Courier, monospace;
            font-size: 12px;
            background: #f1f3f4;
            border: 1px solid #e1e3e6;
            border-radius: 3px;
            padding: 0.1em 0.35em;
          }

          /* Variable chips */
          .doc-editor .ProseMirror .variable-chip {
            display: inline-flex; align-items: center; gap: 3px;
            background: #ede9fe; color: #5b21b6;
            border: 1px solid #c4b5fd;
            border-radius: 4px; padding: 1px 6px;
            font-size: 12px; font-family: system-ui, sans-serif;
            font-weight: 500; white-space: nowrap;
            user-select: none; cursor: default;
          }

          /* ── Image NodeView toolbar buttons ──────────────────────────────── */
          .img-tb-btn {
            width: 28px; height: 28px;
            display: flex; align-items: center; justify-content: center;
            border: none; border-radius: 6px;
            background: transparent; color: #64748b;
            cursor: pointer; position: relative;
            flex-shrink: 0;
            transition: background 0.1s, color 0.1s;
          }
          .img-tb-btn:hover { background: #f1f5f9; color: #1e293b; }
          .img-tb-btn[data-active="true"] {
            background: #dbeafe; color: #1d4ed8;
            outline: 1px solid #bfdbfe;
          }
          .img-tb-btn[data-danger="true"]:hover { background: #fef2f2; color: #ef4444; }
          .img-tb-btn:disabled { opacity: 0.28; cursor: default; }
          .img-tb-btn:disabled:hover { background: transparent; color: #64748b; }

          /* ── CSS tooltip (data-tooltip attr, shows on hover after 0.5s) ──── */
          .img-tb-btn::after {
            content: attr(data-tooltip);
            position: absolute;
            bottom: calc(100% + 6px);
            left: 50%;
            transform: translateX(-50%);
            background: #1e293b; color: white;
            font-size: 11px; font-family: system-ui, -apple-system, sans-serif;
            font-weight: normal; line-height: 1.4;
            padding: 4px 8px; border-radius: 4px;
            white-space: nowrap; opacity: 0;
            pointer-events: none;
            transition: opacity 0.1s; transition-delay: 0.5s;
            z-index: 200;
          }
          .img-tb-btn:hover::after { opacity: 1; }

          /* Tables */
          .doc-editor .ProseMirror table { border-collapse: collapse; width: 100%; margin-bottom: 1em; }
          .doc-editor .ProseMirror td,
          .doc-editor .ProseMirror th { border: 1px solid #d2d0ce; padding: 6px 10px; vertical-align: top; font-size: 13px; }
          .doc-editor .ProseMirror th { background: #f3f2f1; font-weight: 600; font-size: 12px; color: #323130; }
          .doc-editor .ProseMirror .selectedCell { background: #deecf9; }
          .doc-editor .ProseMirror .column-resize-handle { position: absolute; right: -2px; top: 0; bottom: 0; width: 4px; background: #0078d4; pointer-events: none; }

          /* Empty paragraph placeholder */
          .doc-editor .ProseMirror p.is-editor-empty:first-child::before { content: attr(data-placeholder); color: #a19f9d; pointer-events: none; height: 0; display: block; font-style: italic; }

          /* Print / export layout */
          @media print {
            .doc-editor .ProseMirror { font-size: 11pt; }
            .doc-editor .ProseMirror h1 { font-size: 18pt; }
            .doc-editor .ProseMirror h2 { font-size: 14pt; }
            .doc-editor .ProseMirror h3 { font-size: 12pt; }
          }
        `}</style>
      </div>
    </div>
  );
}

// ── Header/Footer Zone ────────────────────────────────────────────────────────

function HFZone({
  label, editor, zone, isFirst = false, isLast = false,
}: {
  label:    string;
  editor:   Editor | null;
  zone:     'header' | 'footer';
  isFirst?: boolean;
  isLast?:  boolean;
}) {
  const isHeader = zone === 'header';

  return (
    <div
      style={{
        borderTop:    isHeader && !isFirst ? '1px dashed #c0bfbd' : undefined,
        borderBottom: isHeader && isLast   ? '2px solid #d2d0ce'
                    : !isHeader && isFirst ? '2px solid #d2d0ce'
                    : !isHeader            ? '1px dashed #c0bfbd'
                    : undefined,
        background: '#fafaf9',
      }}
    >
      {/* Zone label */}
      <div style={{
        padding:    isHeader ? `8px ${H_PAD}px 2px` : `2px ${H_PAD}px 8px`,
        order:      isHeader ? 0 : 1,
        fontSize:   10,
        fontWeight: 600,
        color:      '#a19f9d',
        fontFamily: 'Calibri, Arial, sans-serif',
        letterSpacing: '0.05em',
        textTransform: 'uppercase',
        userSelect: 'none',
      }}>
        {label}
      </div>

      {/* Editable mini-editor */}
      {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
      <div
        style={{
          padding:   `4px ${H_PAD}px`,
          minHeight: 48,
          cursor:    'text',
        }}
        onClick={() => editor?.commands.focus()}
      >
        <EditorContent editor={editor} className="doc-editor hf-editor" />
      </div>
    </div>
  );
}

// ── Text BubbleMenu button ─────────────────────────────────────────────────────

function TBtn({ active, onClick, title, children }: {
  active?: boolean; onClick: () => void; title?: string; children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      title={title}
      className={`w-7 h-7 flex items-center justify-center rounded text-sm transition-colors ${
        active
          ? 'bg-slate-800 text-white'
          : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
      }`}
    >
      {children}
    </button>
  );
}

function LinkIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
    </svg>
  );
}
