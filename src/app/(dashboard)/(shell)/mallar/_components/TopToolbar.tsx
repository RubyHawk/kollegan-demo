'use client';

import { useMemo } from 'react';
import { useTemplateEditor } from './editor-context';
import { useHeaderFooter } from './header-footer-context';
import { cn } from '@shared/lib/utils';
import {
  ArrowUUpLeft,
  ArrowUUpRight,
  Link as LinkIcon,
  ListBullets,
  ListNumbers,
  Minus,
  Table,
  TextAlignCenter,
  TextAlignLeft,
  TextAlignRight,
  TextB,
  TextHOne,
  TextHTwo,
  TextItalic,
  TextUnderline,
} from '@phosphor-icons/react';

const STYLE_OPTIONS = [
  { label: 'Brödtext', action: 'paragraph' },
  { label: 'Rubrik 1', action: 'h1' },
  { label: 'Rubrik 2', action: 'h2' },
] as const;

export default function TopToolbar() {
  const editor = useTemplateEditor();
  const hf = useHeaderFooter();

  const activePage = hf?.pages[hf.activeIdx];
  const isDocumentPage = activePage?.kind === 'document';

  const activeStyle = useMemo(() => {
    if (!editor) return 'Brödtext';
    if (editor.isActive('heading', { level: 1 })) return 'Rubrik 1';
    if (editor.isActive('heading', { level: 2 })) return 'Rubrik 2';
    return 'Brödtext';
  }, [editor]);

  if (!editor) return null;
  const activeEditor = editor;

  function applyStyle(style: (typeof STYLE_OPTIONS)[number]['action']) {
    if (style === 'paragraph') {
      activeEditor.chain().focus().setParagraph().run();
      return;
    }
    if (style === 'h1') {
      activeEditor.chain().focus().toggleHeading({ level: 1 }).run();
      return;
    }
    activeEditor.chain().focus().toggleHeading({ level: 2 }).run();
  }

  function insertLink() {
    const previous = activeEditor.getAttributes('link').href as string | undefined;
    const url = window.prompt('Länkadress', previous ?? '');
    if (url === null) return;
    if (!url.trim()) {
      activeEditor.chain().focus().unsetLink().run();
      return;
    }
    activeEditor.chain().focus().setLink({ href: url.trim() }).run();
  }

  return (
    <div className="border-b border-[var(--border)] bg-[var(--surface-1)] px-4 py-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1 rounded-full border border-[var(--border)] bg-[var(--surface)] p-1">
          <ToolbarIconButton title="Ångra" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()}>
            <ArrowUUpLeft size={15} />
          </ToolbarIconButton>
          <ToolbarIconButton title="Gör om" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()}>
            <ArrowUUpRight size={15} />
          </ToolbarIconButton>
        </div>

        <div className="flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-2 py-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">Text</span>
          <select
            value={activeStyle}
            onChange={(event) => applyStyle(STYLE_OPTIONS.find((option) => option.label === event.target.value)?.action ?? 'paragraph')}
            className="rounded-full bg-[var(--surface-1)] px-3 py-1 text-xs font-medium text-[var(--text-primary)] focus:outline-none"
          >
            {STYLE_OPTIONS.map((option) => (
              <option key={option.label} value={option.label}>{option.label}</option>
            ))}
          </select>
          <ToolbarIconButton title="Fet" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}>
            <TextB size={15} weight="bold" />
          </ToolbarIconButton>
          <ToolbarIconButton title="Kursiv" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}>
            <TextItalic size={15} />
          </ToolbarIconButton>
          <ToolbarIconButton title="Understruken" active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()}>
            <TextUnderline size={15} />
          </ToolbarIconButton>
        </div>

        <div className="flex items-center gap-1 rounded-full border border-[var(--border)] bg-[var(--surface)] p-1">
          <ToolbarIconButton title="Vänsterställ" active={editor.isActive({ textAlign: 'left' })} onClick={() => editor.chain().focus().setTextAlign('left').run()}>
            <TextAlignLeft size={15} />
          </ToolbarIconButton>
          <ToolbarIconButton title="Centrera" active={editor.isActive({ textAlign: 'center' })} onClick={() => editor.chain().focus().setTextAlign('center').run()}>
            <TextAlignCenter size={15} />
          </ToolbarIconButton>
          <ToolbarIconButton title="Högerställ" active={editor.isActive({ textAlign: 'right' })} onClick={() => editor.chain().focus().setTextAlign('right').run()}>
            <TextAlignRight size={15} />
          </ToolbarIconButton>
        </div>

        <div className="flex items-center gap-1 rounded-full border border-[var(--border)] bg-[var(--surface)] p-1">
          <ToolbarIconButton title="Punktlista" active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()}>
            <ListBullets size={15} />
          </ToolbarIconButton>
          <ToolbarIconButton title="Numrerad lista" active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
            <ListNumbers size={15} />
          </ToolbarIconButton>
          {!isDocumentPage && (
            <>
              <ToolbarIconButton title="Avdelare" onClick={() => editor.chain().focus().setHorizontalRule().run()}>
                <Minus size={15} />
              </ToolbarIconButton>
              <ToolbarIconButton title="Tabell" onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}>
                <Table size={15} />
              </ToolbarIconButton>
            </>
          )}
          <ToolbarIconButton title="Lägg till länk" active={editor.isActive('link')} onClick={insertLink}>
            <LinkIcon size={15} />
          </ToolbarIconButton>
        </div>

        <div className="ml-auto flex items-center gap-2 rounded-[20px] border border-[var(--border)] bg-[var(--surface)] px-3 py-2">
          <div className="flex items-center gap-2 text-[var(--text-secondary)]">
            {isDocumentPage ? <TextHOne size={16} /> : <TextHTwo size={16} />}
            <div>
              <p className="text-xs font-semibold text-[var(--text-primary)]">
                {isDocumentPage ? 'Strukturerad offertsida' : 'Presentationssida'}
              </p>
              <p className="text-[11px] leading-5 text-[var(--text-muted)]">
                {isDocumentPage
                  ? 'Pris, summering och godkännande styrs i sidoinställningarna till höger.'
                  : 'Använd enkla sektioner och bygg innehållet sida för sida.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ToolbarIconButton({
  title,
  children,
  onClick,
  active = false,
  disabled = false,
}: {
  title: string;
  children: React.ReactNode;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'inline-flex h-8 w-8 items-center justify-center rounded-full text-[var(--text-secondary)] transition-colors',
        active && 'bg-[var(--accent-subtle)] text-[var(--accent)]',
        !active && !disabled && 'hover:bg-[var(--surface-active)] hover:text-[var(--text-primary)]',
        disabled && 'cursor-default opacity-40'
      )}
    >
      {children}
    </button>
  );
}
