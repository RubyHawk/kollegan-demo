'use client';

/**
 * DocumentCanvas — A4 canvas + text-formatting BubbleMenu.
 *
 * The image toolbar is rendered INSIDE ImageNodeView (driven by the `selected`
 * prop from ProseMirror — synchronous, zero timing issues).  There is NO image
 * BubbleMenu here.
 *
 * Only the text-formatting BubbleMenu lives here.
 */

export { EditorCtx, useTemplateEditor } from './editor-context';

import { EditorContent } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import { NodeSelection } from '@tiptap/pm/state';
import { useTemplateEditor } from './editor-context';

export default function DocumentCanvas() {
  const editor = useTemplateEditor();

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
          {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
          <div
            className="mx-auto bg-white cursor-text"
            style={{
              maxWidth: 816,
              minHeight: 1056,
              padding: '96px 96px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.08)',
            }}
            onClick={() => editor?.commands.focus()}
          >
            <EditorContent editor={editor} className="doc-editor" />
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
          .doc-editor .ProseMirror ul,
          .doc-editor .ProseMirror ol {
            padding-left: 24px;
            margin: 0 0 8px 0;
          }
          .doc-editor .ProseMirror li { margin-bottom: 2px; }
          .doc-editor .ProseMirror strong { font-weight: 700; }
          .doc-editor .ProseMirror em { font-style: italic; }
          .doc-editor .ProseMirror a { color: #0563c1; text-decoration: underline; }
          .doc-editor .ProseMirror hr {
            border: none;
            border-top: 1px solid #c8c8c8;
            margin: 16px 0;
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
        `}</style>
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
