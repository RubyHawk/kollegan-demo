'use client';

/**
 * DocumentCanvas — renders the A4 canvas and BubbleMenus.
 *
 * Two BubbleMenus:
 *  1. Text formatting (Bold/Italic/Underline/Link) — shows for text selections only
 *  2. Image controls (Align/Delete) — shows when an image node is selected
 *
 * The editor instance is provided by TemplateEditor via EditorCtx.
 */

// Re-export context so sibling components keep their existing imports.
export { EditorCtx, useTemplateEditor } from './editor-context';

import { EditorContent } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import { NodeSelection } from '@tiptap/pm/state';
import { useTemplateEditor } from './editor-context';

export default function DocumentCanvas() {
  const editor = useTemplateEditor();

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* ── BubbleMenu 1: inline text formatting ──────────────────────────── */}
      {editor && (
        <BubbleMenu
          editor={editor}
          options={{ placement: 'top' }}
          shouldShow={({ state }) => {
            const { selection } = state;
            // Never show on node selections (images, signature blocks, etc.)
            if (selection instanceof NodeSelection) return false;
            return selection.from !== selection.to;
          }}
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

      {/* ── BubbleMenu 2: image controls ──────────────────────────────────── */}
      {editor && (
        <BubbleMenu
          editor={editor}
          options={{ placement: 'top' }}
          shouldShow={({ state }) => {
            const { selection } = state;
            return (
              selection instanceof NodeSelection &&
              selection.node.type.name === 'image'
            );
          }}
          className="flex items-center gap-0.5 bg-[var(--surface)] border border-[var(--border)] rounded-lg shadow-lg p-1"
        >
          <BubbleButton
            active={
              !editor.getAttributes('image').align ||
              editor.getAttributes('image').align === 'left'
            }
            onClick={() =>
              editor.chain().focus().updateAttributes('image', { align: 'left' }).run()
            }
            title="Justera vänster"
          >
            <AlignLeftIcon />
          </BubbleButton>
          <BubbleButton
            active={editor.getAttributes('image').align === 'center'}
            onClick={() =>
              editor.chain().focus().updateAttributes('image', { align: 'center' }).run()
            }
            title="Centrera"
          >
            <AlignCenterIcon />
          </BubbleButton>
          <BubbleButton
            active={editor.getAttributes('image').align === 'right'}
            onClick={() =>
              editor.chain().focus().updateAttributes('image', { align: 'right' }).run()
            }
            title="Justera höger"
          >
            <AlignRightIcon />
          </BubbleButton>
          <div className="w-px h-4 bg-[var(--border)] mx-0.5" />
          <BubbleButton
            active={false}
            onClick={() => editor.chain().focus().deleteSelection().run()}
            title="Ta bort bild"
          >
            <TrashIcon />
          </BubbleButton>
        </BubbleMenu>
      )}

      {/* ── Scrollable document background ────────────────────────────────── */}
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

// ── Image toolbar icons ────────────────────────────────────────────────────────

function AlignLeftIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="15" y2="12"/><line x1="3" y1="18" x2="18" y2="18"/>
    </svg>
  );
}

function AlignCenterIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="3" y1="6" x2="21" y2="6"/><line x1="6" y1="12" x2="18" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/>
    </svg>
  );
}

function AlignRightIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="3" y1="6" x2="21" y2="6"/><line x1="9" y1="12" x2="21" y2="12"/><line x1="6" y1="18" x2="21" y2="18"/>
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"/>
      <path d="M19 6l-1 14H6L5 6"/>
      <path d="M10 11v6"/><path d="M14 11v6"/>
      <path d="M9 6V4h6v2"/>
    </svg>
  );
}
