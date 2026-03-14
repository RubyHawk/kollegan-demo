'use client';

/**
 * TopToolbar — document-level toolbar.
 *
 * Heading style selector, lists, alignment, table insert, image upload,
 * horizontal rule, undo/redo. Text formatting (bold/italic/underline) is
 * in the BubbleMenu (shown on selection) to keep this bar clean.
 */

import { useRef, useState } from 'react';
import { useTemplateEditor } from './DocumentCanvas';

export default function TopToolbar() {
  const editor = useTemplateEditor();
  const fileRef = useRef<HTMLInputElement>(null);
  const [headingOpen, setHeadingOpen] = useState(false);

  if (!editor) return null;

  // ── Helpers ────────────────────────────────────────────────────────────────

  const activeHeadingLabel = (() => {
    if (editor.isActive('heading', { level: 1 })) return 'Rubrik 1';
    if (editor.isActive('heading', { level: 2 })) return 'Rubrik 2';
    if (editor.isActive('heading', { level: 3 })) return 'Rubrik 3';
    return 'Brödtext';
  })();

  function handleImageFile(file: File) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const src = e.target?.result as string;
      editor!.chain().focus().setImage({ src }).run();
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="shrink-0 flex items-center gap-1 px-3 py-1.5 border-b border-[var(--border)] bg-[var(--surface)] flex-wrap">

      {/* Heading style picker */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setHeadingOpen((v) => !v)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] transition-colors border border-[var(--border)] min-w-[108px] justify-between"
        >
          <span>{activeHeadingLabel}</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
        </button>
        {headingOpen && (
          <div className="absolute left-0 top-full mt-1 bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-lg z-50 overflow-hidden min-w-[140px]">
            {[
              { label: 'Brödtext', action: () => editor.chain().focus().setParagraph().run() },
              { label: 'Rubrik 1',  action: () => editor.chain().focus().toggleHeading({ level: 1 }).run() },
              { label: 'Rubrik 2',  action: () => editor.chain().focus().toggleHeading({ level: 2 }).run() },
              { label: 'Rubrik 3',  action: () => editor.chain().focus().toggleHeading({ level: 3 }).run() },
            ].map(({ label, action }) => (
              <button
                key={label}
                type="button"
                onMouseDown={(e) => { e.preventDefault(); action(); setHeadingOpen(false); }}
                className="w-full text-left px-3 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors"
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </div>

      <Divider />

      {/* Alignment */}
      <ToolBtn onClick={() => editor.chain().focus().setTextAlign('left').run()}   active={editor.isActive({ textAlign: 'left' })}   title="Vänsterjustera">
        <AlignLeftIcon />
      </ToolBtn>
      <ToolBtn onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })} title="Centrera">
        <AlignCenterIcon />
      </ToolBtn>
      <ToolBtn onClick={() => editor.chain().focus().setTextAlign('right').run()}  active={editor.isActive({ textAlign: 'right' })}  title="Högerjustera">
        <AlignRightIcon />
      </ToolBtn>

      <Divider />

      {/* Lists */}
      <ToolBtn onClick={() => editor.chain().focus().toggleBulletList().run()}  active={editor.isActive('bulletList')}  title="Punktlista">
        <BulletListIcon />
      </ToolBtn>
      <ToolBtn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Numrerad lista">
        <OrderedListIcon />
      </ToolBtn>

      <Divider />

      {/* Table */}
      <ToolBtn onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} title="Infoga tabell">
        <TableIcon />
      </ToolBtn>

      {/* Horizontal rule */}
      <ToolBtn onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Avdelare">
        <HrIcon />
      </ToolBtn>

      {/* Image upload */}
      <ToolBtn onClick={() => fileRef.current?.click()} title="Infoga bild">
        <ImageIcon />
      </ToolBtn>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleImageFile(file);
          e.target.value = '';
        }}
      />

      <Divider />

      {/* Undo / Redo */}
      <ToolBtn onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Ångra (Ctrl+Z)">
        <UndoIcon />
      </ToolBtn>
      <ToolBtn onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Gör om (Ctrl+Y)">
        <RedoIcon />
      </ToolBtn>
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function Divider() {
  return <div className="w-px h-5 bg-[var(--border)] mx-0.5 shrink-0" />;
}

function ToolBtn({
  onClick, active, disabled, title, children,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      disabled={disabled}
      title={title}
      className={`p-1.5 rounded-lg transition-colors text-sm ${
        active
          ? 'bg-[var(--accent)] text-white'
          : 'text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]'
      } disabled:opacity-40 disabled:cursor-not-allowed`}
    >
      {children}
    </button>
  );
}

// ── Icons ──────────────────────────────────────────────────────────────────────

const stroke = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

function AlignLeftIcon()   { return <svg width="14" height="14" viewBox="0 0 24 24" {...stroke}><line x1="21" y1="6" x2="3" y2="6"/><line x1="15" y1="12" x2="3" y2="12"/><line x1="17" y1="18" x2="3" y2="18"/></svg>; }
function AlignCenterIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" {...stroke}><line x1="21" y1="6" x2="3" y2="6"/><line x1="17" y1="12" x2="7" y2="12"/><line x1="19" y1="18" x2="5" y2="18"/></svg>; }
function AlignRightIcon()  { return <svg width="14" height="14" viewBox="0 0 24 24" {...stroke}><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="12" x2="9" y2="12"/><line x1="21" y1="18" x2="7" y2="18"/></svg>; }
function BulletListIcon()  { return <svg width="14" height="14" viewBox="0 0 24 24" {...stroke}><line x1="9" y1="6" x2="20" y2="6"/><line x1="9" y1="12" x2="20" y2="12"/><line x1="9" y1="18" x2="20" y2="18"/><circle cx="4" cy="6" r="1" fill="currentColor" stroke="none"/><circle cx="4" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="4" cy="18" r="1" fill="currentColor" stroke="none"/></svg>; }
function OrderedListIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" {...stroke}><line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="10" y1="18" x2="21" y2="18"/><path d="M4 6h1v4"/><path d="M4 10H6"/><path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"/></svg>; }
function TableIcon()       { return <svg width="14" height="14" viewBox="0 0 24 24" {...stroke}><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="12" y1="3" x2="12" y2="21"/></svg>; }
function HrIcon()          { return <svg width="14" height="14" viewBox="0 0 24 24" {...stroke}><line x1="3" y1="12" x2="21" y2="12"/></svg>; }
function ImageIcon()       { return <svg width="14" height="14" viewBox="0 0 24 24" {...stroke}><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>; }
function UndoIcon()        { return <svg width="14" height="14" viewBox="0 0 24 24" {...stroke}><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.51"/></svg>; }
function RedoIcon()        { return <svg width="14" height="14" viewBox="0 0 24 24" {...stroke}><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-.49-3.51"/></svg>; }
