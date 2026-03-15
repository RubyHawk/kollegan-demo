'use client';

/**
 * TemplateEditor — 3-panel document builder.
 *
 * Owns the TipTap editor instance (body) and four mini-editors (header/footer
 * for default and first-page). Provides both EditorCtx (body editor) and
 * HFCtx (header/footer editors + settings) to all child components.
 *
 * Content is serialized as a TemplateDoc v2 object (see template-doc.ts).
 *
 * Layout:
 *   [BlocksSidebar 208px] | [TopToolbar + DocumentCanvas flex-1] | [BlockSettingsSidebar 256px]
 */

import { useEffect, useRef, useState } from 'react';
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
import { TableCellWithBg, TableHeaderWithBg } from './extensions/table-cell-background.extension';
import FontFamily from '@tiptap/extension-font-family';
import Highlight from '@tiptap/extension-highlight';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import { VariableNode } from './extensions/variable-node.extension';
import { SignatureBlockNode } from './extensions/signature-block.extension';
import { DragHandleExtension } from './extensions/drag-handle.extension';
import { FontSize } from './extensions/font-size.extension';
import { LineHeight } from './extensions/line-height.extension';
import { TextIndent } from './extensions/indent.extension';
import type { EditorView } from '@tiptap/pm/view';

import dynamic from 'next/dynamic';
import { EditorCtx } from './editor-context';
import { HFCtx } from './header-footer-context';
import type { HFSettings } from './header-footer-context';
import { parseTemplateDoc, EMPTY_DOC, DEFAULT_HF_SETTINGS } from './template-doc';
import BlocksSidebar from './BlocksSidebar';
import BlockSettingsSidebar from './BlockSettingsSidebar';
import TopToolbar from './TopToolbar';

const DocumentCanvas = dynamic(() => import('./DocumentCanvas'), { ssr: false });

// ── Shared extensions for header/footer mini-editors ──────────────────────────
// Lighter than the body editor: no tables, images, signature blocks, or drag handles.
const MINI_EXTENSIONS = [
  StarterKit.configure({ dropcursor: false }),
  TextAlign.configure({ types: ['heading', 'paragraph'] }),
  TextStyle,
  Color,
  Underline,
  FontFamily,
  FontSize,
  Highlight.configure({ multicolor: true }),
  VariableNode,
];

// ── Public handle ─────────────────────────────────────────────────────────────

export interface TemplateEditorHandle {
  getJSON:    () => object;
  setContent: (json: object | string) => void;
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  initialContent?: string;
  editorRef?:      React.MutableRefObject<TemplateEditorHandle | null>;
}

// ── Image drop helper ─────────────────────────────────────────────────────────

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

// ── Component ─────────────────────────────────────────────────────────────────

export default function TemplateEditor({ initialContent, editorRef }: Props) {
  // Parse the full doc once (ref avoids re-parsing on every render)
  const initDoc = useRef(parseTemplateDoc(initialContent));

  // Header/footer display settings (live state — drives DocumentCanvas)
  const [hfSettings, setHfSettings] = useState<HFSettings>(
    () => ({ ...DEFAULT_HF_SETTINGS, ...initDoc.current.settings }),
  );

  function patchSettings(patch: Partial<HFSettings>) {
    setHfSettings((prev) => ({ ...prev, ...patch }));
  }

  // ── Body editor ────────────────────────────────────────────────────────────

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
      TableHeaderWithBg,
      TableCellWithBg,
      FontFamily,
      FontSize,
      Highlight.configure({ multicolor: true }),
      Subscript,
      Superscript,
      LineHeight,
      TextIndent,
      VariableNode,
      SignatureBlockNode,
      DragHandleExtension,
    ],
    content: initDoc.current.body,
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

  // ── Header / footer mini-editors ────────────────────────────────────────────
  // All 4 are always created (hooks must not be conditional).

  const headerDefault = useEditor({
    immediatelyRender: false,
    extensions: MINI_EXTENSIONS,
    content: initDoc.current.header.default,
  });

  const headerFirstPage = useEditor({
    immediatelyRender: false,
    extensions: MINI_EXTENSIONS,
    content: initDoc.current.header.firstPage,
  });

  const footerDefault = useEditor({
    immediatelyRender: false,
    extensions: MINI_EXTENSIONS,
    content: initDoc.current.footer.default,
  });

  const footerFirstPage = useEditor({
    immediatelyRender: false,
    extensions: MINI_EXTENSIONS,
    content: initDoc.current.footer.firstPage,
  });

  // ── Expose handle to parent pages ──────────────────────────────────────────

  useEffect(() => {
    if (!editorRef || !editor) return;

    editorRef.current = {
      getJSON() {
        // Serialize as TemplateDoc v2
        return {
          _v:      2,
          body:    editor.getJSON(),
          header: {
            default:   headerDefault?.getJSON()   ?? EMPTY_DOC,
            firstPage: headerFirstPage?.getJSON() ?? EMPTY_DOC,
          },
          footer: {
            default:   footerDefault?.getJSON()   ?? EMPTY_DOC,
            firstPage: footerFirstPage?.getJSON() ?? EMPTY_DOC,
          },
          settings: hfSettings,
        };
      },

      setContent(json) {
        const doc = parseTemplateDoc(
          typeof json === 'string' ? json : JSON.stringify(json),
        );
        editor.commands.setContent(doc.body);
        headerDefault?.commands.setContent(doc.header.default);
        headerFirstPage?.commands.setContent(doc.header.firstPage);
        footerDefault?.commands.setContent(doc.footer.default);
        footerFirstPage?.commands.setContent(doc.footer.firstPage);
        setHfSettings({ ...DEFAULT_HF_SETTINGS, ...doc.settings });
      },
    };

    return () => { if (editorRef.current) editorRef.current = null; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor, headerDefault, headerFirstPage, footerDefault, footerFirstPage, hfSettings]);

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <EditorCtx.Provider value={editor}>
      <HFCtx.Provider value={{
        headerDefault,
        headerFirstPage,
        footerDefault,
        footerFirstPage,
        settings:      hfSettings,
        patchSettings,
      }}>
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
      </HFCtx.Provider>
    </EditorCtx.Provider>
  );
}
