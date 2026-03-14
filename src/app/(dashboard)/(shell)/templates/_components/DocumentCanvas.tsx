'use client';

/**
 * DocumentCanvas — renders the A4 canvas and BubbleMenus.
 *
 * BubbleMenu 1 (text)  — Bold / Italic / Underline / Link — text selections only
 * BubbleMenu 2 (image) — Layout mode + Delete — image NodeSelection only
 *
 *   Layout modes (image BubbleMenu):
 *     [■ Block]  [⬒ Float L]  [⬓ Float R]  ─  [↔ Center]  [🗑]
 *   When block mode is active, the three align buttons (L/C/R) are also shown.
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

      {/* ── BubbleMenu 1: text formatting ─────────────────────────────────── */}
      {editor && (
        <BubbleMenu
          editor={editor}
          options={{ placement: 'top' }}
          shouldShow={({ state }) => {
            const { selection } = state;
            if (selection instanceof NodeSelection) return false;
            return selection.from !== selection.to;
          }}
          className="flex items-center gap-0.5 bg-white border border-slate-200 rounded-lg shadow-md p-1"
        >
          <TBtn
            active={editor.isActive('bold')}
            onClick={() => editor.chain().focus().toggleBold().run()}
            title="Fet (Ctrl+B)"
          ><strong className="text-xs">B</strong></TBtn>
          <TBtn
            active={editor.isActive('italic')}
            onClick={() => editor.chain().focus().toggleItalic().run()}
            title="Kursiv (Ctrl+I)"
          ><em className="text-xs">I</em></TBtn>
          <TBtn
            active={editor.isActive('underline')}
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            title="Understruken (Ctrl+U)"
          ><u className="text-xs">U</u></TBtn>
          <Sep />
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

      {/* ── BubbleMenu 2: image controls ──────────────────────────────────── */}
      {editor && (
        <BubbleMenu
          editor={editor}
          options={{ placement: 'top' }}
          shouldShow={({ state }) => {
            const { selection } = state;
            return selection instanceof NodeSelection && selection.node.type.name === 'image';
          }}
          className="flex items-center gap-0.5 bg-white border border-slate-200 rounded-lg shadow-md px-1.5 py-1"
        >
          {/* ── Layout / text-wrap section ──── */}
          <span className="text-[10px] text-slate-400 px-1 select-none">Layout</span>

          {/* Block (no float) — aligns left */}
          <IBtn
            active={!editor.getAttributes('image').float}
            onClick={() => editor.chain().focus().updateAttributes('image', { float: null, align: 'left' }).run()}
            title="Block — text över och under bilden"
          ><BlockIcon /></IBtn>

          {/* Float left */}
          <IBtn
            active={editor.getAttributes('image').float === 'left'}
            onClick={() => editor.chain().focus().updateAttributes('image', { float: 'left' }).run()}
            title="Text flödar till höger om bilden"
          ><FloatLeftIcon /></IBtn>

          {/* Float right */}
          <IBtn
            active={editor.getAttributes('image').float === 'right'}
            onClick={() => editor.chain().focus().updateAttributes('image', { float: 'right' }).run()}
            title="Text flödar till vänster om bilden"
          ><FloatRightIcon /></IBtn>

          {/* ── Alignment (only relevant in block mode) ── */}
          {!editor.getAttributes('image').float && (
            <>
              <Sep />
              <IBtn
                active={!editor.getAttributes('image').align || editor.getAttributes('image').align === 'left'}
                onClick={() => editor.chain().focus().updateAttributes('image', { align: 'left' }).run()}
                title="Vänsterjustera"
              ><AlignLeftIcon /></IBtn>
              <IBtn
                active={editor.getAttributes('image').align === 'center'}
                onClick={() => editor.chain().focus().updateAttributes('image', { align: 'center' }).run()}
                title="Centrera"
              ><AlignCenterIcon /></IBtn>
              <IBtn
                active={editor.getAttributes('image').align === 'right'}
                onClick={() => editor.chain().focus().updateAttributes('image', { align: 'right' }).run()}
                title="Högerjustera"
              ><AlignRightIcon /></IBtn>
            </>
          )}

          <Sep />

          {/* Delete */}
          <IBtn
            active={false}
            onClick={() => editor.chain().focus().deleteSelection().run()}
            title="Ta bort bild"
            danger
          ><TrashIcon /></IBtn>
        </BubbleMenu>
      )}

      {/* ── Scrollable document area ───────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto" style={{ background: '#f0f2f5' }}>
        <div className="px-8 py-12">
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
          .doc-editor { display: contents; }
          .doc-editor .ProseMirror {
            outline: none !important;
            border: none !important;
            min-height: 720px;
            cursor: text;
          }
          /* Clearfix so floated images don't overflow their paragraph containers */
          .doc-editor .ProseMirror::after { content: ''; display: table; clear: both; }

          /* Tables */
          .doc-editor .ProseMirror table { border-collapse: collapse; width: 100%; margin-bottom: 1em; }
          .doc-editor .ProseMirror td,
          .doc-editor .ProseMirror th { border: 1px solid #e2e8f0; padding: 8px 12px; vertical-align: top; }
          .doc-editor .ProseMirror th { background: #f8fafc; font-weight: 600; font-size: 12px; }
          .doc-editor .ProseMirror .selectedCell { background: #dbeafe; }
          .doc-editor .ProseMirror .column-resize-handle { position: absolute; right: -2px; top: 0; bottom: 0; width: 4px; background: var(--accent,#6366f1); pointer-events: none; }

          /* Empty paragraph placeholder */
          .doc-editor .ProseMirror p.is-editor-empty:first-child::before { content: attr(data-placeholder); color: #94a3b8; pointer-events: none; height: 0; display: block; }
        `}</style>
      </div>
    </div>
  );
}

// ── Shared helpers ─────────────────────────────────────────────────────────────

function Sep() {
  return <div className="w-px h-4 bg-slate-200 mx-0.5 shrink-0" />;
}

/** Text-BubbleMenu button — accent-colored active state */
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

/** Image-BubbleMenu button — soft active state (no brand color) */
function IBtn({ active, onClick, title, children, danger }: {
  active?: boolean; onClick: () => void; title?: string;
  children: React.ReactNode; danger?: boolean;
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      title={title}
      className={`w-7 h-7 flex items-center justify-center rounded transition-colors ${
        danger
          ? 'text-slate-400 hover:bg-red-50 hover:text-red-500'
          : active
            ? 'bg-blue-50 text-blue-600 ring-1 ring-blue-200'
            : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700'
      }`}
    >
      {children}
    </button>
  );
}

// ── SVG icons ──────────────────────────────────────────────────────────────────

/** Block: image fills its own line (no float) */
function BlockIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
      <rect x="2" y="7" width="16" height="6" rx="1.5"/>
      <rect x="2" y="2" width="16" height="2" rx="1" opacity=".4"/>
      <rect x="2" y="16" width="16" height="2" rx="1" opacity=".4"/>
    </svg>
  );
}

/** Float left: small image on left, text lines on right */
function FloatLeftIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
      <rect x="2" y="3" width="7" height="7" rx="1"/>
      <rect x="11" y="3" width="7" height="1.5" rx=".75" opacity=".5"/>
      <rect x="11" y="6" width="7" height="1.5" rx=".75" opacity=".5"/>
      <rect x="11" y="9" width="5" height="1.5" rx=".75" opacity=".5"/>
      <rect x="2" y="13" width="16" height="1.5" rx=".75" opacity=".5"/>
      <rect x="2" y="16" width="12" height="1.5" rx=".75" opacity=".5"/>
    </svg>
  );
}

/** Float right: small image on right, text lines on left */
function FloatRightIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
      <rect x="11" y="3" width="7" height="7" rx="1"/>
      <rect x="2" y="3" width="7" height="1.5" rx=".75" opacity=".5"/>
      <rect x="2" y="6" width="7" height="1.5" rx=".75" opacity=".5"/>
      <rect x="2" y="9" width="5" height="1.5" rx=".75" opacity=".5"/>
      <rect x="2" y="13" width="16" height="1.5" rx=".75" opacity=".5"/>
      <rect x="2" y="16" width="12" height="1.5" rx=".75" opacity=".5"/>
    </svg>
  );
}

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

function LinkIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
    </svg>
  );
}
