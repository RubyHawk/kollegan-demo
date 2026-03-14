'use client';

/**
 * DocumentCanvas — renders the A4 canvas and BubbleMenu.
 *
 * The editor instance is provided by TemplateEditor via EditorCtx.
 * Returns a proper div (not a Fragment) so flex-1 reliably fills the
 * remaining height inside TemplateEditor's center column.
 */

// Re-export context so sibling components keep their existing imports.
export { EditorCtx, useTemplateEditor } from './editor-context';

import { EditorContent } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import { useTemplateEditor } from './editor-context';

export default function DocumentCanvas() {
  const editor = useTemplateEditor();

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* BubbleMenu for inline text formatting — renders as a floating portal */}
      {editor && (
        <BubbleMenu
          editor={editor}
          options={{ placement: 'top' }}
          className="flex items-center gap-0.5 bg-[var(--surface)] border border-[var(--border)] rounded-lg shadow-lg p-1"
        >
          <BubbleButton
            active={editor.isActive('bold')}
            onClick={() => editor.chain().focus().toggleBold().run()}
            title="Fet (Ctrl+B)"
          >
            <strong>B</strong>
          </BubbleButton>
          <BubbleButton
            active={editor.isActive('italic')}
            onClick={() => editor.chain().focus().toggleItalic().run()}
            title="Kursiv (Ctrl+I)"
          >
            <em>I</em>
          </BubbleButton>
          <BubbleButton
            active={editor.isActive('underline')}
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            title="Understruken (Ctrl+U)"
          >
            <u>U</u>
          </BubbleButton>
          <div className="w-px h-4 bg-[var(--border)] mx-0.5" />
          <BubbleButton
            active={editor.isActive('link')}
            onClick={() => {
              const prev = editor.getAttributes('link').href as string | undefined;
              const url  = window.prompt('URL:', prev ?? '');
              if (url === null) return;
              if (url === '') {
                editor.chain().focus().unsetLink().run();
              } else {
                editor.chain().focus().setLink({ href: url }).run();
              }
            }}
            title="Länk"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
            </svg>
          </BubbleButton>
        </BubbleMenu>
      )}

      {/* Scrollable document background — Google Docs / Word style */}
      <div className="flex-1 overflow-y-auto" style={{ background: '#f0f2f5' }}>
        <div className="px-8 py-12">
          {/* A4 paper — clicking empty space focuses the editor */}
          {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
          <div
            className="mx-auto bg-white cursor-text"
            style={{
              maxWidth: 816,
              minHeight: 1056,
              padding: '96px 96px',
              boxShadow: '0 2px 12px rgba(0,0,0,0.12)',
            }}
            onClick={() => editor?.commands.focus()}
          >
            <EditorContent editor={editor} className="doc-editor" />
          </div>
        </div>

        <style>{`
          .tiptap-drag-handle { display: flex; align-items: center; }

          /* doc-editor is the className passed to <EditorContent>.
             In Tiptap v3 EditorContent renders a plain <div> wrapper;
             inside it is the ProseMirror div directly (no .tiptap layer). */
          .doc-editor { display: contents; }
          .doc-editor .ProseMirror {
            outline: none !important;
            border: none !important;
            min-height: 720px;
            cursor: text;
          }

          /* Image alignment via data-align attribute */
          .doc-editor .ProseMirror img { display: block; height: auto; }
          .doc-editor .ProseMirror img[data-align="left"]   { margin-right: auto; }
          .doc-editor .ProseMirror img[data-align="center"] { margin-left: auto; margin-right: auto; }
          .doc-editor .ProseMirror img[data-align="right"]  { margin-left: auto; }

          /* Tables */
          .doc-editor .ProseMirror table { border-collapse: collapse; width: 100%; margin-bottom: 1em; }
          .doc-editor .ProseMirror td,
          .doc-editor .ProseMirror th   { border: 1px solid #e2e8f0; padding: 8px 12px; vertical-align: top; }
          .doc-editor .ProseMirror th   { background: #f8fafc; font-weight: 600; font-size: 12px; }
          .doc-editor .ProseMirror .selectedCell { background: #dbeafe; }
          .doc-editor .ProseMirror .column-resize-handle { position: absolute; right: -2px; top: 0; bottom: 0; width: 4px; background: var(--accent,#6366f1); pointer-events: none; }

          /* Empty paragraph placeholder */
          .doc-editor .ProseMirror p.is-editor-empty:first-child::before { content: attr(data-placeholder); color: #94a3b8; pointer-events: none; height: 0; display: block; }
        `}</style>
      </div>
    </div>
  );
}

// ── BubbleButton helper ────────────────────────────────────────────────────────

function BubbleButton({
  active, onClick, title, children,
}: {
  active?: boolean;
  onClick: () => void;
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      title={title}
      className={`px-2 py-1 rounded text-sm transition-colors ${
        active
          ? 'bg-[var(--accent)] text-white'
          : 'text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]'
      }`}
    >
      {children}
    </button>
  );
}
