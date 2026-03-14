'use client';

/**
 * TemplateEditor — 3-panel document builder.
 *
 * Owns the TipTap editor instance and provides it via EditorCtx so that
 * BlocksSidebar, TopToolbar, BlockSettingsSidebar, and DocumentCanvas can all
 * read the same editor.
 *
 * Layout:
 *   [BlocksSidebar 208px] | [TopToolbar + DocumentCanvas flex-1] | [BlockSettingsSidebar 256px]
 */

import { useEffect, useRef } from 'react';
import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { CustomImage } from './extensions/custom-image.extension';
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
import type { EditorView } from '@tiptap/pm/view';

import dynamic from 'next/dynamic';
import { EditorCtx } from './editor-context';
import BlocksSidebar from './BlocksSidebar';
import BlockSettingsSidebar from './BlockSettingsSidebar';
import TopToolbar from './TopToolbar';

const DocumentCanvas = dynamic(() => import('./DocumentCanvas'), { ssr: false });

export interface TemplateEditorHandle {
  getJSON:    () => object;
  setContent: (json: object | string) => void;
}

interface Props {
  initialContent?: string;
  editorRef?:      React.MutableRefObject<TemplateEditorHandle | null>;
}

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

export default function TemplateEditor({ initialContent, editorRef }: Props) {
  const initialContentRef = useRef(initialContent);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        dropcursor: { color: 'var(--accent)', width: 2 },
      }),
      CustomImage.configure({ allowBase64: true }),
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
        class: 'outline-none',
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
        if (moved) return false;
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

  // Expose handle to parent pages
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

  return (
    <EditorCtx.Provider value={editor}>
      <div className="flex h-full overflow-hidden">
        {/* Left panel */}
        <BlocksSidebar />

        {/* Center column */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <TopToolbar />
          <DocumentCanvas />
        </div>

        {/* Right panel */}
        <BlockSettingsSidebar />
      </div>
    </EditorCtx.Provider>
  );
}
