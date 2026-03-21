'use client';

/**
 * TemplateEditor — 3-panel document builder.
 *
 * Owns the TipTap editor instance (body) and four mini-editors:
 *   - headerDefault / footerDefault — shared defaults for all pages
 *   - headerPageOverride / footerPageOverride — per-page overrides (content
 *     swapped when the active page changes via switchPage)
 *
 * Provides both EditorCtx (body editor) and HFCtx (header/footer editors
 * + page management) to all child components.
 *
 * Content is serialized as a TemplateDoc v3 object (see template-doc.ts).
 *
 * Layout:
 *   [BlocksSidebar 208px] | [TopToolbar + DocumentCanvas flex-1] | [BlockSettingsSidebar 256px]
 */

import { useEffect, useRef, useState, useCallback } from 'react';
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
import {
  parseTemplateDoc, EMPTY_DOC, makeEmptyPage, genId,
} from './template-doc';
import type { PageDoc } from './template-doc';
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

  // ── Multi-page state ────────────────────────────────────────────────────────
  const [pages, setPages]       = useState<PageDoc[]>(initDoc.current.pages);
  const [activeIdx, setActiveIdx] = useState(0);

  // Active page header/footer display state (enabled / useDefault toggles)
  const [activeHeader, setActiveHeader] = useState(() => ({
    enabled:    initDoc.current.pages[0]?.header.enabled    ?? false,
    useDefault: initDoc.current.pages[0]?.header.useDefault ?? true,
  }));
  const [activeFooter, setActiveFooter] = useState(() => ({
    enabled:    initDoc.current.pages[0]?.footer.enabled    ?? false,
    useDefault: initDoc.current.pages[0]?.footer.useDefault ?? true,
  }));

  // Keep a ref to pages/activeIdx/activeHeader/activeFooter so callbacks
  // can read the latest value without becoming stale closures.
  const pagesRef       = useRef(pages);
  const activeIdxRef   = useRef(activeIdx);
  const activeHdrRef   = useRef(activeHeader);
  const activeFtrRef   = useRef(activeFooter);
  pagesRef.current     = pages;
  activeIdxRef.current = activeIdx;
  activeHdrRef.current = activeHeader;
  activeFtrRef.current = activeFooter;

  // ── Body editor ─────────────────────────────────────────────────────────────

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
    content: initDoc.current.pages[0]?.body ?? EMPTY_DOC,
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

  // ── Header/footer mini-editors ───────────────────────────────────────────────
  // All 4 are always created (hooks must not be conditional).

  const headerDefault = useEditor({
    immediatelyRender: false,
    extensions: MINI_EXTENSIONS,
    content: initDoc.current.defaultHeader,
  });

  const footerDefault = useEditor({
    immediatelyRender: false,
    extensions: MINI_EXTENSIONS,
    content: initDoc.current.defaultFooter,
  });

  const headerPageOverride = useEditor({
    immediatelyRender: false,
    extensions: MINI_EXTENSIONS,
    content: initDoc.current.pages[0]?.header.content ?? EMPTY_DOC,
  });

  const footerPageOverride = useEditor({
    immediatelyRender: false,
    extensions: MINI_EXTENSIONS,
    content: initDoc.current.pages[0]?.footer.content ?? EMPTY_DOC,
  });

  // ── Flush current page state into pages array ─────────────────────────────

  /**
   * Writes the current editor contents + H/F toggle state back into the
   * pages array for the given index.  Returns the updated pages array.
   */
  const flushPage = useCallback((idx: number, currentPages: PageDoc[]): PageDoc[] => {
    if (!editor) return currentPages;
    const updated = [...currentPages];
    updated[idx] = {
      ...updated[idx],
      body:   editor.getJSON(),
      header: {
        enabled:    activeHdrRef.current.enabled,
        useDefault: activeHdrRef.current.useDefault,
        content:    headerPageOverride?.getJSON() ?? EMPTY_DOC,
      },
      footer: {
        enabled:    activeFtrRef.current.enabled,
        useDefault: activeFtrRef.current.useDefault,
        content:    footerPageOverride?.getJSON() ?? EMPTY_DOC,
      },
    };
    return updated;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor, headerPageOverride, footerPageOverride]);

  // ── Page management callbacks ────────────────────────────────────────────────

  const switchPage = useCallback((newIdx: number) => {
    const curIdx   = activeIdxRef.current;
    const curPages = pagesRef.current;
    if (newIdx === curIdx) return;

    // 1. Flush current page
    const flushed = flushPage(curIdx, curPages);

    // 2. Load new page body
    const newPage = flushed[newIdx];
    if (!newPage || !editor) return;
    editor.commands.setContent(newPage.body as Parameters<typeof editor.commands.setContent>[0]);

    // 3. Load new page override H/F content
    headerPageOverride?.commands.setContent(
      newPage.header.content as Parameters<typeof editor.commands.setContent>[0],
    );
    footerPageOverride?.commands.setContent(
      newPage.footer.content as Parameters<typeof editor.commands.setContent>[0],
    );

    // 4. Load new page H/F display toggles
    setActiveHeader({ enabled: newPage.header.enabled, useDefault: newPage.header.useDefault });
    setActiveFooter({ enabled: newPage.footer.enabled, useDefault: newPage.footer.useDefault });

    // 5. Commit state
    setPages(flushed);
    setActiveIdx(newIdx);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor, headerPageOverride, footerPageOverride, flushPage]);

  const addPage = useCallback((preset?: Partial<Pick<PageDoc, 'label' | 'body'>>) => {
    const curIdx   = activeIdxRef.current;
    const curPages = pagesRef.current;

    const flushed = flushPage(curIdx, curPages);
    const newPage = makeEmptyPage(preset?.label ?? `Sida ${flushed.length + 1}`);
    if (preset?.body) newPage.body = preset.body;

    const newPages  = [...flushed, newPage];
    const newIdx    = newPages.length - 1;

    // Load new page content
    editor?.commands.setContent(newPage.body as Parameters<typeof editor.commands.setContent>[0]);
    headerPageOverride?.commands.setContent(EMPTY_DOC as Parameters<typeof editor.commands.setContent>[0]);
    footerPageOverride?.commands.setContent(EMPTY_DOC as Parameters<typeof editor.commands.setContent>[0]);
    setActiveHeader({ enabled: false, useDefault: true });
    setActiveFooter({ enabled: false, useDefault: true });

    setPages(newPages);
    setActiveIdx(newIdx);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor, headerPageOverride, footerPageOverride, flushPage]);

  const removePage = useCallback((idx: number) => {
    const curIdx   = activeIdxRef.current;
    const curPages = pagesRef.current;
    if (curPages.length <= 1) return;

    // Flush before removing
    const flushed  = flushPage(curIdx, curPages);
    const newPages = flushed.filter((_, i) => i !== idx);
    const newIdx   = idx < curIdx
      ? curIdx - 1
      : Math.min(curIdx, newPages.length - 1);
    const targetPage = newPages[newIdx];

    editor?.commands.setContent(targetPage.body as Parameters<typeof editor.commands.setContent>[0]);
    headerPageOverride?.commands.setContent(
      targetPage.header.content as Parameters<typeof editor.commands.setContent>[0],
    );
    footerPageOverride?.commands.setContent(
      targetPage.footer.content as Parameters<typeof editor.commands.setContent>[0],
    );
    setActiveHeader({ enabled: targetPage.header.enabled, useDefault: targetPage.header.useDefault });
    setActiveFooter({ enabled: targetPage.footer.enabled, useDefault: targetPage.footer.useDefault });

    setPages(newPages);
    setActiveIdx(newIdx);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor, headerPageOverride, footerPageOverride, flushPage]);

  const renamePage = useCallback((idx: number, label: string) => {
    setPages((prev) => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], label };
      return updated;
    });
  }, []);

  const movePage = useCallback((from: number, to: number) => {
    const curIdx = activeIdxRef.current;
    setPages((prev) => {
      const updated = [...prev];
      const [moved] = updated.splice(from, 1);
      updated.splice(to, 0, moved);
      return updated;
    });
    // Keep activeIdx tracking the same page after reorder
    if (curIdx === from) {
      setActiveIdx(to);
    } else if (from < curIdx && to >= curIdx) {
      setActiveIdx(curIdx - 1);
    } else if (from > curIdx && to <= curIdx) {
      setActiveIdx(curIdx + 1);
    }
  }, []);

  // ── Patch active page H/F state ──────────────────────────────────────────────

  const patchActiveHeader = useCallback((p: { enabled?: boolean; useDefault?: boolean }) => {
    setActiveHeader((prev) => ({ ...prev, ...p }));
  }, []);

  const patchActiveFooter = useCallback((p: { enabled?: boolean; useDefault?: boolean }) => {
    setActiveFooter((prev) => ({ ...prev, ...p }));
  }, []);

  // ── Expose handle to parent pages ────────────────────────────────────────────

  useEffect(() => {
    if (!editorRef || !editor) return;

    editorRef.current = {
      getJSON() {
        // Flush current page into a local copy and serialize as v3
        const allPages = flushPage(activeIdxRef.current, pagesRef.current);
        return {
          _v:           3,
          pages:        allPages,
          defaultHeader: headerDefault?.getJSON() ?? EMPTY_DOC,
          defaultFooter: footerDefault?.getJSON()  ?? EMPTY_DOC,
        };
      },

      setContent(json) {
        const doc = parseTemplateDoc(
          typeof json === 'string' ? json : JSON.stringify(json),
        );
        const firstPage = doc.pages[0] ?? makeEmptyPage();
        editor.commands.setContent(firstPage.body as Parameters<typeof editor.commands.setContent>[0]);
        headerDefault?.commands.setContent(doc.defaultHeader as Parameters<typeof editor.commands.setContent>[0]);
        footerDefault?.commands.setContent(doc.defaultFooter as Parameters<typeof editor.commands.setContent>[0]);
        headerPageOverride?.commands.setContent(firstPage.header.content as Parameters<typeof editor.commands.setContent>[0]);
        footerPageOverride?.commands.setContent(firstPage.footer.content as Parameters<typeof editor.commands.setContent>[0]);
        setActiveHeader({ enabled: firstPage.header.enabled, useDefault: firstPage.header.useDefault });
        setActiveFooter({ enabled: firstPage.footer.enabled, useDefault: firstPage.footer.useDefault });
        setPages(doc.pages);
        setActiveIdx(0);
      },
    };

    return () => { if (editorRef.current) editorRef.current = null; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor, headerDefault, footerDefault, headerPageOverride, footerPageOverride, flushPage]);

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <EditorCtx.Provider value={editor}>
      <HFCtx.Provider value={{
        headerDefault,
        footerDefault,
        headerPageOverride,
        footerPageOverride,
        pages,
        activeIdx,
        switchPage,
        addPage,
        removePage,
        renamePage,
        movePage,
        activeHeader,
        activeFooter,
        patchActiveHeader,
        patchActiveFooter,
      }}>
        <div className="template-editor-light flex h-full overflow-hidden">
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
