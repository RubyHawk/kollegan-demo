'use client';

/**
 * DocumentCanvas — owns the TipTap editor instance.
 *
 * Renders an A4-like page canvas with all extensions initialized.
 * Exposes the editor to siblings via EditorContext.
 * Handles image paste and image drop via editorProps (correct ProseMirror pipeline).
 */

import { useEffect, createContext, useContext, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import { Table } from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableHeader from '@tiptap/extension-table-header';
import TableCell from '@tiptap/extension-table-cell';
import { VariableNode } from './extensions/variable-node.extension';
import { SignatureBlockNode } from './extensions/signature-block.extension';
import { DragHandleExtension } from './extensions/drag-handle.extension';
import type { Editor } from '@tiptap/core';
import type { EditorView } from '@tiptap/pm/view';
import type { TemplateEditorHandle } from './TemplateEditor';

// ── Context ───────────────────────────────────────────────────────────────────

export const EditorCtx = createContext<Editor | null>(null);
export function useTemplateEditor() { return useContext(EditorCtx); }

// ── Image helpers ──────────────────────────────────────────────────────────────

function insertImageFile(view: EditorView, file: File) {
  const reader = new FileReader();
  reader.onload = (e) => {
    const src = e.target?.result as string;
    const node = view.state.schema.nodes['image']?.create({ src });
    if (!node) return;
    const tr = view.state.tr.replaceSelectionWith(node);
    view.dispatch(tr);
  };
  reader.readAsDataURL(file);
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  initialContent?: string;
  editorRef?:      React.MutableRefObject<TemplateEditorHandle | null>;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function DocumentCanvas({ initialContent, editorRef }: Props) {
  const initialContentRef = useRef(initialContent);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        dropcursor: { color: 'var(--accent)', width: 2 },
      }),
      Image.configure({ allowBase64: true }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      TextStyle,
      Color,
      Underline,
      Link.configure({ openOnClick: false }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      VariableNode,
      SignatureBlockNode,
      DragHandleExtension,
    ],
    content: initialContentRef.current
      ? (() => {
          try { return JSON.parse(initialContentRef.current!) as object; }
          catch { return initialContentRef.current; }
        })()
      : '<p></p>',
    editorProps: {
      attributes: {
        class: 'outline-none min-h-[600px]',
        spellcheck: 'true',
      },
      handlePaste(view, event) {
        const items = Array.from(event.clipboardData?.items ?? []);
        const imageItem = items.find((i) => i.type.startsWith('image/'));
        if (!imageItem) return false;
        event.preventDefault();
        const file = imageItem.getAsFile();
        if (file) insertImageFile(view, file);
        return true;
      },
      handleDrop(view, event, _slice, moved) {
        if (moved) return false; // let ProseMirror handle node moves
        const file = Array.from((event as DragEvent).dataTransfer?.files ?? []).find((f) =>
          f.type.startsWith('image/'),
        );
        if (!file) return false;
        event.preventDefault();
        insertImageFile(view, file);
        return true;
      },
    },
  });

  // Expose handle
  useEffect(() => {
    if (!editorRef || !editor) return;
    editorRef.current = {
      getJSON() { return editor.getJSON(); },
      setContent(json) {
        if (typeof json === 'string') {
          try { editor.commands.setContent(JSON.parse(json)); }
          catch { editor.commands.setContent(json); }
        } else {
          editor.commands.setContent(json);
        }
      },
    };
    return () => { if (editorRef.current) editorRef.current = null; };
  }, [editor, editorRef]);

  // Apply initial content when editor mounts after async load
  const appliedRef = useRef(false);
  useEffect(() => {
    if (!editor || appliedRef.current) return;
    if (initialContent && initialContent !== initialContentRef.current) {
      appliedRef.current = true;
      try { editor.commands.setContent(JSON.parse(initialContent)); }
      catch { editor.commands.setContent(initialContent); }
    }
  }, [editor, initialContent]);

  return (
    <EditorCtx.Provider value={editor}>
      {/* BubbleMenu for inline text formatting */}
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

      {/* A4 Canvas */}
      <div className="flex-1 overflow-y-auto bg-[var(--surface-alt,#f1f5f9)] px-4 py-8">
        <div
          className="mx-auto bg-white rounded-xl shadow-sm border border-[var(--border)]"
          style={{ maxWidth: 780, minHeight: 1040, padding: '60px 72px' }}
        >
          <EditorContent editor={editor} />
        </div>

        <style>{`
          .tiptap-drag-handle { display: flex; align-items: center; }
          .tiptap .ProseMirror { outline: none; }
          .tiptap table { border-collapse: collapse; width: 100%; margin-bottom: 1em; }
          .tiptap td, .tiptap th { border: 1px solid #e2e8f0; padding: 8px 12px; vertical-align: top; }
          .tiptap th { background: #f8fafc; font-weight: 600; font-size: 12px; }
          .tiptap .selectedCell { background: #dbeafe; }
          .tiptap .column-resize-handle { position: absolute; right: -2px; top: 0; bottom: 0; width: 4px; background: var(--accent,#6366f1); pointer-events: none; }
          .tiptap p.is-editor-empty:first-child::before { content: attr(data-placeholder); color: #94a3b8; pointer-events: none; height: 0; display: block; }
        `}</style>
      </div>
    </EditorCtx.Provider>
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
