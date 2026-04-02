'use client';

/**
 * DocumentCanvas — A4 canvas + text-formatting BubbleMenu + header/footer zones
 * + Excel-style page tab bar.
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

import { useRef, useState, useSyncExternalStore } from 'react';
import type { Editor } from '@tiptap/core';
import { EditorContent } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import { NodeSelection } from '@tiptap/pm/state';
import { Link as PhLink } from '@phosphor-icons/react';
import { cn } from '@shared/lib/utils';
import { useTemplateEditor } from './editor-context';
import { useHeaderFooter } from './header-footer-context';
import { SECTION_PRESETS } from './section-presets';
import type { PageDoc } from './template-doc';

// ── Horizontal margin presets ──────────────────────────────────────────────────
const MARGIN_PRESETS = { tight: 64, normal: 96, wide: 128 } as const;

export default function DocumentCanvas() {
  const editor = useTemplateEditor();
  const hf     = useHeaderFooter();
  const activePage = hf?.pages[hf.activeIdx] ?? null;
  const isDocumentPage = activePage?.kind === 'document';
  const documentSettings = activePage?.document;

  const isEmpty = useSyncExternalStore(
    (onStoreChange) => {
      if (!editor) return () => {};
      editor.on('update', onStoreChange);
      return () => { editor.off('update', onStoreChange); };
    },
    () => editor?.isEmpty ?? true,
    () => true,
  );

  // Active page H/F display state from context
  const activeHeader = hf?.activeHeader ?? { enabled: false, useDefault: true };
  const activeFooter = hf?.activeFooter ?? { enabled: false, useDefault: true };

  // Document settings
  const H_PAD = MARGIN_PRESETS[hf?.docSettings?.pageMargin ?? 'normal'];
  const docFont = hf?.docSettings?.defaultFont ?? 'Calibri';

  // Derive which editor to show for header/footer
  const headerEditor = activeHeader.enabled
    ? (activeHeader.useDefault ? hf?.headerDefault : hf?.headerPageOverride) ?? null
    : null;
  const headerLabel = activeHeader.enabled
    ? (activeHeader.useDefault ? 'Sidhuvud (standard)' : 'Sidhuvud (unik för denna sida)')
    : '';

  const footerEditor = activeFooter.enabled
    ? (activeFooter.useDefault ? hf?.footerDefault : hf?.footerPageOverride) ?? null
    : null;
  const footerLabel = activeFooter.enabled
    ? (activeFooter.useDefault ? 'Sidfot (standard)' : 'Sidfot (unik för denna sida)')
    : '';

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
          className="flex items-center gap-0.5 bg-[var(--surface-0)] border border-[var(--border)] rounded-lg shadow-elevated p-1"
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
          <div className="w-px h-4 bg-[var(--border)] mx-0.5" />
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
            <PhLink size={13} />
          </TBtn>
        </BubbleMenu>
      )}

      {/* ── Scrollable document area ─────────────────────────────────────────── */}
      <div className="flex-1 overflow-auto bg-[var(--surface-2)]">
        <div className="px-8 py-10" style={{ minWidth: 'fit-content' }}>
          <div
            className="mx-auto bg-white"
            data-a4-page="true"
            style={{
              width:     816,
              minWidth:  816,
              minHeight: 1056,
              boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.08)',
              // Free-positioned images are absolutely placed relative to this div.
              // isolation:isolate creates a stacking context so their z-index values
              // are self-contained (negative z-index → behind body text).
              position:  'relative',
              isolation: 'isolate',
            }}
          >
            {isDocumentPage && (
              <div
                className="pointer-events-none absolute inset-0"
                style={{
                  opacity: documentSettings?.backgroundImageSrc ? (documentSettings?.backgroundOpacity ?? 0.08) : 0,
                  backgroundImage: documentSettings?.backgroundImageSrc ? `url(${documentSettings.backgroundImageSrc})` : 'none',
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition:
                    documentSettings?.watermarkMode === 'top'
                      ? 'center top'
                      : documentSettings?.watermarkMode === 'full'
                        ? 'center center'
                        : 'center bottom',
                  backgroundSize:
                    documentSettings?.watermarkMode === 'full'
                      ? '100% 100%'
                      : '78% auto',
                }}
              />
            )}

            {/* ── Header zone ───────────────────────────────────────────────── */}
            {activeHeader.enabled && headerEditor && (
              <HFZone
                label={headerLabel}
                editor={headerEditor}
                zone="header"
                isLast
                hPad={H_PAD}
              />
            )}

            {/* ── Body ──────────────────────────────────────────────────────── */}
            <div
              className="cursor-text relative"
              style={{ padding: `${H_PAD}px ${H_PAD}px` }}
              onClick={() => editor?.commands.focus()}
            >
              {isDocumentPage && (
                <DocumentPageGuide
                  title={activePage?.label ?? 'Offertsida'}
                  showLogo={documentSettings?.showLogo ?? true}
                  showCustomer={documentSettings?.showCustomerBlock ?? true}
                  showSummary={documentSettings?.showSummary ?? true}
                  showFooter={documentSettings?.showFooter ?? true}
                />
              )}
              <EditorContent editor={editor} className="doc-editor" />

              {/* ── Onboarding overlay (shown when body is empty) ───────────── */}
              {isEmpty && editor && (
                <div
                  className="absolute inset-0 flex items-center justify-center pointer-events-none"
                  style={{ padding: `${H_PAD}px ${H_PAD}px` }}
                >
                  <div className="pointer-events-auto w-full max-w-sm">
                    <p className="text-center text-xs font-semibold text-[var(--text-muted)] uppercase tracking-widest mb-4">
                      
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {SECTION_PRESETS.map((preset) => (
                        <button
                          key={preset.key}
                          type="button"
                          title={preset.tooltip}
                          onClick={(e) => {
                            e.stopPropagation();
                            editor.chain().focus().insertContentAt(0, preset.nodes).run();
                          }}
                          className="flex flex-col items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-0)] px-3 py-4 text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--accent)] hover:bg-[var(--accent-subtle)] transition-all duration-150 shadow-sm"
                        >
                          <span className="text-[var(--text-muted)] group-hover:text-[var(--accent)]">{preset.icon}</span>
                          <span className="text-xs font-medium text-center leading-tight">{preset.label}</span>
                        </button>
                      ))}
                    </div>
                    <p className="text-center text-[10px] text-[var(--text-muted)] mt-3">
                      
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* ── Footer zone ───────────────────────────────────────────────── */}
            {activeFooter.enabled && footerEditor && (
              <HFZone
                label={footerLabel}
                editor={footerEditor}
                zone="footer"
                isFirst
                hPad={H_PAD}
              />
            )}

          </div>
        </div>

        <style>{`
          .tiptap-drag-handle { display: flex; align-items: center; }
          .doc-editor { display: contents; }
          .doc-editor .ProseMirror {
            outline: none !important;
            border: none !important;
            min-height: ${isDocumentPage ? '360px' : '720px'};
            cursor: text;
            font-family: ${docFont}, Carlito, Arial, sans-serif;
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

      {/* ── Page tab bar ──────────────────────────────────────────────────────── */}
      {hf && (
        <div className="flex items-center gap-1 border-t border-[var(--border)] bg-[var(--surface-1)] overflow-x-auto flex-shrink-0 px-3 min-h-[36px]">
          {hf.pages.map((page, i) => (
            <PageTab
              key={page.id}
              page={page}
              active={i === hf.activeIdx}
              onActivate={() => hf.switchPage(i)}
              onRename={(label) => hf.renamePage(i, label)}
              onDelete={hf.pages.length > 1 ? () => hf.removePage(i) : undefined}
            />
          ))}
          <button
            type="button"
            onClick={() => hf.addPage()}
            title="Lägg till sida"
            className="flex items-center justify-center w-6 h-6 rounded text-[var(--text-muted)] hover:bg-[var(--surface-active)] hover:text-[var(--text-primary)] flex-shrink-0 text-base transition-colors ml-1"
          >
            +
          </button>
        </div>
      )}
    </div>
  );
}

// ── Page Tab component ─────────────────────────────────────────────────────────

function DocumentPageGuide({
  title,
  showLogo,
  showCustomer,
  showSummary,
  showFooter,
}: {
  title: string;
  showLogo: boolean;
  showCustomer: boolean;
  showSummary: boolean;
  showFooter: boolean;
}) {
  return (
    <div className="mb-8 rounded-[24px] border border-slate-200 bg-slate-50/80 p-6 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
      <div className="mb-5 flex items-start justify-between gap-8">
        <div className="min-w-0">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Strukturerad offertsida</p>
          <div className="flex items-start gap-4">
            {showLogo && <div className="mt-1 h-14 w-14 rounded-2xl border border-slate-200 bg-white shadow-sm" />}
            <div className="space-y-2">
              <div className="h-3 w-40 rounded-full bg-slate-300" />
              <div className="h-2.5 w-48 rounded-full bg-slate-200" />
              <div className="h-2.5 w-36 rounded-full bg-slate-200" />
            </div>
          </div>
        </div>
        <div className="min-w-[180px] space-y-3 text-right">
          <p className="text-xl font-semibold text-slate-900">{title}</p>
          <div className="space-y-2">
            <div className="ml-auto h-2.5 w-28 rounded-full bg-slate-200" />
            <div className="ml-auto h-2.5 w-32 rounded-full bg-slate-200" />
            <div className="ml-auto h-2.5 w-24 rounded-full bg-slate-200" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-[1.2fr_0.8fr] gap-6">
        <div className="space-y-4">
          {showCustomer && (
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Kundblock</p>
              <div className="space-y-2">
                <div className="h-3 w-32 rounded-full bg-slate-300" />
                <div className="h-2.5 w-44 rounded-full bg-slate-200" />
                <div className="h-2.5 w-36 rounded-full bg-slate-200" />
              </div>
            </div>
          )}
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white/80 p-4">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Redigerbar textyta</p>
            <p className="text-sm leading-6 text-slate-600">
              Texten du skriver här används för tilläggsinformation, anteckningar och villkor.
              Tabell, summering och footer ligger fast i dokumentlayouten.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {showSummary && (
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Summering</p>
              <div className="space-y-2">
                <div className="flex justify-between gap-4"><div className="h-2.5 w-24 rounded-full bg-slate-200" /><div className="h-2.5 w-16 rounded-full bg-slate-300" /></div>
                <div className="flex justify-between gap-4"><div className="h-2.5 w-20 rounded-full bg-slate-200" /><div className="h-2.5 w-14 rounded-full bg-slate-200" /></div>
                <div className="flex justify-between gap-4 border-t border-slate-100 pt-2"><div className="h-3 w-28 rounded-full bg-slate-300" /><div className="h-3 w-20 rounded-full bg-slate-400" /></div>
              </div>
            </div>
          )}
          {showFooter && (
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Footer</p>
              <div className="space-y-2">
                <div className="h-2.5 w-full rounded-full bg-slate-200" />
                <div className="h-2.5 w-4/5 rounded-full bg-slate-200" />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PageTab({
  page, active, onActivate, onRename, onDelete,
}: {
  page:       PageDoc;
  active:     boolean;
  onActivate: () => void;
  onRename:   (label: string) => void;
  onDelete?:  () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft,   setDraft]   = useState(page.label);
  const [hovered, setHovered] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function startEdit() {
    setDraft(page.label);
    setEditing(true);
    setTimeout(() => inputRef.current?.select(), 0);
  }

  function commitEdit() {
    setEditing(false);
    const trimmed = draft.trim();
    if (trimmed && trimmed !== page.label) onRename(trimmed);
    else setDraft(page.label);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') commitEdit();
    if (e.key === 'Escape') { setEditing(false); setDraft(page.label); }
  }

  return (
    <div
      className={cn(
        'flex items-center gap-1 px-3 h-[28px] cursor-pointer select-none flex-shrink-0 rounded-md text-xs transition-colors',
        active
          ? 'bg-[var(--accent-subtle)] text-[var(--accent)] font-semibold'
          : 'text-[var(--text-secondary)] hover:bg-[var(--surface-active)] hover:text-[var(--text-primary)] font-medium',
      )}
      onClick={onActivate}
      onDoubleClick={startEdit}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {editing ? (
        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commitEdit}
          onKeyDown={handleKeyDown}
          onClick={(e) => e.stopPropagation()}
          className="w-20 text-xs bg-[var(--surface-0)] border border-[var(--accent)] rounded px-1 py-0 outline-none text-[var(--text-primary)]"
          autoFocus
        />
      ) : (
        <>
          <span className="overflow-hidden text-ellipsis whitespace-nowrap max-w-[120px] flex-1">
            {page.label}
          </span>
          <span
            className={cn(
              'shrink-0 rounded-full border px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.14em]',
              page.kind === 'document'
                ? 'border-violet-200 bg-violet-50 text-violet-700'
                : 'border-sky-200 bg-sky-50 text-sky-700',
            )}
          >
            {page.kind === 'document' ? 'Dok' : 'Sida'}
          </span>
        </>
      )}

      {/* Delete button — shown on hover when deletion is allowed */}
      {onDelete && !editing && hovered && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          title="Ta bort sida"
          className="w-3.5 h-3.5 flex items-center justify-center rounded-full bg-[var(--text-muted)] text-white text-[10px] leading-none flex-shrink-0 p-0 border-none cursor-pointer hover:bg-[var(--text-secondary)]"
        >
          ×
        </button>
      )}
    </div>
  );
}

// ── Header/Footer Zone ────────────────────────────────────────────────────────

function HFZone({
  label, editor, zone, isFirst = false, isLast = false, hPad,
}: {
  label:    string;
  editor:   Editor | null;
  zone:     'header' | 'footer';
  isFirst?: boolean;
  isLast?:  boolean;
  hPad:     number;
}) {
  const isHeader = zone === 'header';

  return (
    <div
      className={cn(
        'bg-[var(--surface-1)]',
        isHeader && !isFirst && 'border-t border-[var(--border)]',
        isHeader && isLast   && 'border-b-2 border-b-[var(--border)]',
        !isHeader && isFirst && 'border-t-2 border-t-[var(--border)]',
        !isHeader && !isFirst && 'border-b border-[var(--border)]',
      )}
    >
      {/* Zone label */}
      <div
        className={cn(
          'text-[var(--text-muted)] text-[10px] font-semibold uppercase tracking-wider select-none',
          isHeader ? 'pt-2 pb-0.5' : 'pb-2 pt-0.5',
        )}
        style={{ paddingLeft: hPad, paddingRight: hPad }}
      >
        {label}
      </div>

      {/* Editable mini-editor */}
      <div
        className="cursor-text min-h-[48px]"
        style={{ padding: `4px ${hPad}px` }}
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
      className={cn(
        'w-7 h-7 flex items-center justify-center rounded text-sm transition-colors',
        active
          ? 'bg-[var(--accent-subtle)] text-[var(--accent)]'
          : 'text-[var(--text-muted)] hover:bg-[var(--surface-active)] hover:text-[var(--text-primary)]',
      )}
    >
      {children}
    </button>
  );
}

