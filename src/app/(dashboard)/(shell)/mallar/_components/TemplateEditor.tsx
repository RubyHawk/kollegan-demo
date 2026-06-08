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
 *   [BlocksSidebar] | [DocumentCanvas flex-1] | [BlockSettingsSidebar]
 */

import { useEffect, useLayoutEffect, useRef, useState, useCallback } from 'react';
import { useEditor } from '@tiptap/react';
import { normalizePresentationPages } from './presentation-page-height';
import type { EditorView } from '@tiptap/pm/view';

import dynamic from 'next/dynamic';
import { EditorCtx } from './editor-context';
import { HFCtx } from './header-footer-context';
import type { CanvasZoom } from './header-footer-context';
import { uploadTemplateImage } from './template-image-upload';
import { insertTemplateImageIntoView } from './template-image-insert';
import {
  parseTemplateDoc, EMPTY_DOC, makeEmptyPage, makeDocumentPage,
} from './template-doc';
import type { PageDoc } from './template-doc';
import BlocksSidebar from './BlocksSidebar';
import BlockSettingsSidebar from './BlockSettingsSidebar';
import { MINI_EXTENSIONS, createBodyExtensions } from './template-editor-extensions';

const DocumentCanvas = dynamic(() => import('./DocumentCanvas'), { ssr: false });
const CANVAS_ZOOM_STEPS = [0.75, 0.9, 1, 1.15, 1.3] as const;

// Public handle ─────────────────────────────────────────────────────────────

export interface TemplateEditorHandle {
  getJSON:    () => object;
  setContent: (json: object | string) => void;
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  initialContent?: string;
  editorRef?:      React.MutableRefObject<TemplateEditorHandle | null>;
  onUpdate?:       () => void;
  onMigrationNotice?: (message: string | null) => void;
}

// ── Image drop helper ─────────────────────────────────────────────────────────

async function insertImageFile(view: EditorView, file: File) {
  try {
    const src = await uploadTemplateImage(file);
    insertTemplateImageIntoView(view, src);
  } catch (error) {
    window.alert(error instanceof Error ? error.message : 'Kunde inte ladda upp bilden.');
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function TemplateEditor({ initialContent, editorRef, onUpdate, onMigrationNotice }: Props) {
  // Parse the full doc once (ref avoids re-parsing on every render)
  const initDoc = useRef(parseTemplateDoc(initialContent));
  const loadedPageIdRef = useRef<string | null>(initDoc.current.pages[0]?.id ?? null);

  // ── Multi-page state ────────────────────────────────────────────────────────
  const [pages, setPages]       = useState<PageDoc[]>(initDoc.current.pages);
  const [activeIdx, setActiveIdx] = useState(0);
  const [activePageReady, setActivePageReady] = useState(true);

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
    extensions: createBodyExtensions(),
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
        if (file) void insertImageFile(view, file);
        return true;
      },
      handleDrop(view, event, _slice, moved) {
        if (moved) return false;
        const file = Array.from((event as DragEvent).dataTransfer?.files ?? []).find((f) =>
          f.type.startsWith('image/'),
        );
        if (!file) return false;
        event.preventDefault();
        void insertImageFile(view, file);
        return true;
      },
    },
    onUpdate: onUpdate ? () => onUpdate() : undefined,
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
    const currentBody = (updated[idx]?.body as { attrs?: Record<string, unknown> } | undefined) ?? {};
    const editorBody = editor.getJSON() as { attrs?: Record<string, unknown> };
    updated[idx] = {
      ...updated[idx],
      body: {
        ...editorBody,
        attrs: {
          ...(currentBody.attrs ?? {}),
          ...(editorBody.attrs ?? {}),
        },
      },
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
  }, [editor, headerPageOverride, footerPageOverride]);

  const hydrateEditorsForPage = useCallback((page: PageDoc) => {
    if (!editor || !headerPageOverride || !footerPageOverride) return;

    editor.commands.setContent(
      EMPTY_DOC as Parameters<NonNullable<typeof editor>['commands']['setContent']>[0],
      { emitUpdate: false },
    );
    editor.commands.setContent(
      page.body as Parameters<NonNullable<typeof editor>['commands']['setContent']>[0],
    );
    headerPageOverride.commands.setContent(
      page.header.content as Parameters<NonNullable<typeof editor>['commands']['setContent']>[0],
    );
    footerPageOverride.commands.setContent(
      page.footer.content as Parameters<NonNullable<typeof editor>['commands']['setContent']>[0],
    );
    setActiveHeader({ enabled: page.header.enabled, useDefault: page.header.useDefault });
    setActiveFooter({ enabled: page.footer.enabled, useDefault: page.footer.useDefault });
    loadedPageIdRef.current = page.id;
    setActivePageReady(true);
  }, [editor, footerPageOverride, headerPageOverride]);

  // ── Page management callbacks ────────────────────────────────────────────────

  const switchPage = useCallback((newIdx: number) => {
    const curIdx   = activeIdxRef.current;
    const curPages = pagesRef.current;
    if (newIdx === curIdx) return;

    // 1. Flush current page
    const flushed = flushPage(curIdx, curPages);
    const newPage = flushed[newIdx];
    if (!newPage) return;

    // 2. Commit state first. The page-specific editor content is hydrated by an
    // effect after the correct canvas/wrapper has mounted. Hydrating too early can
    // attach image nodeviews to the previous page shell, which leaves behind empty
    // image wrappers when the next image is inserted or resized.
    loadedPageIdRef.current = null;
    setActivePageReady(false);
    setPages(flushed);
    setActiveIdx(newIdx);
  }, [flushPage]);

  const addPage = useCallback((preset?: Partial<PageDoc>) => {
    const curIdx   = activeIdxRef.current;
    const curPages = pagesRef.current;

    const flushed = flushPage(curIdx, curPages);
    const basePage = preset?.kind === 'document'
      ? makeDocumentPage(preset?.label ?? `Offertsida ${flushed.length + 1}`)
      : makeEmptyPage(preset?.label ?? `Sida ${flushed.length + 1}`);
    const newPage: PageDoc = {
      ...basePage,
      ...preset,
      body: preset?.body ?? basePage.body,
      header: preset?.header ?? basePage.header,
      footer: preset?.footer ?? basePage.footer,
      document: preset?.kind === 'document'
        ? { ...basePage.document, ...(preset.document ?? {}) }
        : preset?.document,
    };

    const newPages  = [...flushed, newPage];
    const newIdx    = newPages.length - 1;

    loadedPageIdRef.current = null;
    setActivePageReady(false);
    setPages(newPages);
    setActiveIdx(newIdx);
  }, [flushPage]);

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
    if (targetPage) {
      loadedPageIdRef.current = null;
      setActivePageReady(false);
    }
    setPages(newPages);
    setActiveIdx(newIdx);
  }, [flushPage]);

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

  const patchActivePage = useCallback((patch: Partial<PageDoc>) => {
    setPages((prev) => {
      const updated = [...prev];
      const current = updated[activeIdxRef.current];
      if (!current) return prev;

      const nextKind = patch.kind ?? current.kind ?? 'presentation';
      const fallbackDoc = nextKind === 'document'
        ? { ...makeDocumentPage(current.label).document }
        : undefined;

      updated[activeIdxRef.current] = {
        ...current,
        ...patch,
        kind: nextKind,
        document: nextKind === 'document'
          ? { ...fallbackDoc, ...(current.document ?? {}), ...(patch.document ?? {}) }
          : patch.document ?? current.document,
      };
      return updated;
    });
  }, []);

  // ── Document settings ─────────────────────────────────────────────────────
  const [docSettings, setDocSettings] = useState({ pageMargin: 'normal' as 'tight' | 'normal' | 'wide', defaultFont: 'Calibri' });
  const [canvasZoom, setCanvasZoom] = useState<CanvasZoom>('fit');
  const patchDocSettings = useCallback((p: Partial<typeof docSettings>) => {
    setDocSettings((prev) => ({ ...prev, ...p }));
  }, []);
  const stepCanvasZoom = useCallback((direction: -1 | 1) => {
    setCanvasZoom((currentZoom) => {
      const current = currentZoom === 'fit' ? 1 : currentZoom;
      const currentIdx = CANVAS_ZOOM_STEPS.findIndex((value) => value >= current);
      const baseIdx = currentIdx === -1 ? CANVAS_ZOOM_STEPS.indexOf(1) : currentIdx;
      return CANVAS_ZOOM_STEPS[Math.min(CANVAS_ZOOM_STEPS.length - 1, Math.max(0, baseIdx + direction))];
    });
  }, []);

  useEffect(() => {
    onMigrationNotice?.(initDoc.current.migrationNotice ?? null);
  }, [onMigrationNotice]);

  useLayoutEffect(() => {
    if (!editor || !headerPageOverride || !footerPageOverride) return;
    const targetPage = pages[activeIdx];
    if (!targetPage) return;
    if (loadedPageIdRef.current === targetPage.id) return;

    hydrateEditorsForPage(targetPage);
  }, [activeIdx, editor, footerPageOverride, headerPageOverride, hydrateEditorsForPage, pages]);

  // ── Expose handle to parent pages ────────────────────────────────────────────

  useEffect(() => {
    if (!editorRef || !editor) return;

    editorRef.current = {
      getJSON() {
        // Flush current page into a local copy and serialize as v3
        const allPages = normalizePresentationPages(flushPage(activeIdxRef.current, pagesRef.current));
        return {
          _v:           4,
          pages:        allPages,
          defaultHeader: headerDefault?.getJSON() ?? EMPTY_DOC,
          defaultFooter: footerDefault?.getJSON()  ?? EMPTY_DOC,
        };
      },

      setContent(json) {
        const doc = parseTemplateDoc(
          typeof json === 'string' ? json : JSON.stringify(json),
        );
        headerDefault?.commands.setContent(doc.defaultHeader as Parameters<NonNullable<typeof editor>['commands']['setContent']>[0]);
        footerDefault?.commands.setContent(doc.defaultFooter as Parameters<NonNullable<typeof editor>['commands']['setContent']>[0]);
        loadedPageIdRef.current = null;
        setActivePageReady(false);
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
        patchActivePage,
        activeHeader,
        activeFooter,
        patchActiveHeader,
        patchActiveFooter,
        docSettings,
        patchDocSettings,
        canvasZoom,
        setCanvasZoom,
        stepCanvasZoom,
        activePageReady,
      }}>
        <div className="template-editor-light grid h-full min-h-0 grid-cols-[clamp(260px,20vw,340px)_minmax(0,1fr)_clamp(300px,24vw,400px)] overflow-hidden bg-[var(--ui-surface-subtle)] max-xl:grid-cols-1">
          <BlocksSidebar />

          <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
            <DocumentCanvas />
          </div>

          <BlockSettingsSidebar />
        </div>
      </HFCtx.Provider>
    </EditorCtx.Provider>
  );
}
