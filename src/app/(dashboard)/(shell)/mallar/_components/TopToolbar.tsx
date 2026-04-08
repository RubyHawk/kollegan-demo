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
  NotePencil,
  Table,
  TextAlignCenter,
  TextAlignLeft,
  TextAlignRight,
  TextB,
  TextColumns,
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
  const currentEditor = editor;

  function applyStyle(style: (typeof STYLE_OPTIONS)[number]['action']) {
    if (style === 'paragraph') {
      currentEditor.chain().focus().setParagraph().run();
      return;
    }
    if (style === 'h1') {
      currentEditor.chain().focus().toggleHeading({ level: 1 }).run();
      return;
    }
    currentEditor.chain().focus().toggleHeading({ level: 2 }).run();
  }

  function insertLink() {
    const previous = currentEditor.getAttributes('link').href as string | undefined;
    const url = window.prompt('Länkadress', previous ?? '');
    if (url === null) return;
    if (!url.trim()) {
      currentEditor.chain().focus().unsetLink().run();
      return;
    }
    currentEditor.chain().focus().setLink({ href: url.trim() }).run();
  }

  return (
    <div className="border-b border-[var(--border)] bg-[var(--surface-1)] px-3 py-2">
      <div className="overflow-x-auto">
        <div className="flex min-w-max items-center gap-2">
          <ToolbarGroup>
            <ToolbarIconButton title="Ångra" onClick={() => currentEditor.chain().focus().undo().run()} disabled={!currentEditor.can().undo()}>
              <ArrowUUpLeft size={15} />
            </ToolbarIconButton>
            <ToolbarIconButton title="Gör om" onClick={() => currentEditor.chain().focus().redo().run()} disabled={!currentEditor.can().redo()}>
              <ArrowUUpRight size={15} />
            </ToolbarIconButton>
          </ToolbarGroup>

          <ToolbarGroup className="gap-2 px-2.5">
            <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">Text</span>
            <select
              value={activeStyle}
              onChange={(event) => applyStyle(STYLE_OPTIONS.find((option) => option.label === event.target.value)?.action ?? 'paragraph')}
              className="rounded-full bg-[var(--surface-1)] px-3 py-1 text-xs font-medium text-[var(--text-primary)] focus:outline-none"
            >
              {STYLE_OPTIONS.map((option) => (
                <option key={option.label} value={option.label}>{option.label}</option>
              ))}
            </select>
            <ToolbarIconButton title="Fet" active={currentEditor.isActive('bold')} onClick={() => currentEditor.chain().focus().toggleBold().run()}>
              <TextB size={15} weight="bold" />
            </ToolbarIconButton>
            <ToolbarIconButton title="Kursiv" active={currentEditor.isActive('italic')} onClick={() => currentEditor.chain().focus().toggleItalic().run()}>
              <TextItalic size={15} />
            </ToolbarIconButton>
            <ToolbarIconButton title="Understruken" active={currentEditor.isActive('underline')} onClick={() => currentEditor.chain().focus().toggleUnderline().run()}>
              <TextUnderline size={15} />
            </ToolbarIconButton>
          </ToolbarGroup>

          <ToolbarGroup>
            <ToolbarIconButton title="Vänsterställ" active={currentEditor.isActive({ textAlign: 'left' })} onClick={() => currentEditor.chain().focus().setTextAlign('left').run()}>
              <TextAlignLeft size={15} />
            </ToolbarIconButton>
            <ToolbarIconButton title="Centrera" active={currentEditor.isActive({ textAlign: 'center' })} onClick={() => currentEditor.chain().focus().setTextAlign('center').run()}>
              <TextAlignCenter size={15} />
            </ToolbarIconButton>
            <ToolbarIconButton title="Högerställ" active={currentEditor.isActive({ textAlign: 'right' })} onClick={() => currentEditor.chain().focus().setTextAlign('right').run()}>
              <TextAlignRight size={15} />
            </ToolbarIconButton>
          </ToolbarGroup>

          <ToolbarGroup>
            <ToolbarIconButton title="Punktlista" active={currentEditor.isActive('bulletList')} onClick={() => currentEditor.chain().focus().toggleBulletList().run()}>
              <ListBullets size={15} />
            </ToolbarIconButton>
            <ToolbarIconButton title="Numrerad lista" active={currentEditor.isActive('orderedList')} onClick={() => currentEditor.chain().focus().toggleOrderedList().run()}>
              <ListNumbers size={15} />
            </ToolbarIconButton>
            {!isDocumentPage && (
              <>
                <ToolbarIconButton title="Avdelare" onClick={() => currentEditor.chain().focus().setHorizontalRule().run()}>
                  <Minus size={15} />
                </ToolbarIconButton>
                <ToolbarIconButton title="Tabell" onClick={() => currentEditor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}>
                  <Table size={15} />
                </ToolbarIconButton>
              </>
            )}
            <ToolbarIconButton title="Lägg till länk" active={currentEditor.isActive('link')} onClick={insertLink}>
              <LinkIcon size={15} />
            </ToolbarIconButton>
          </ToolbarGroup>

          <div className="ml-1 hidden items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs text-[var(--text-secondary)] md:flex">
            {isDocumentPage ? <NotePencil size={14} /> : <TextColumns size={14} />}
            <span className="font-medium text-[var(--text-primary)]">
              {isDocumentPage ? 'Strukturerad offertsida' : 'Presentationssida'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ToolbarGroup({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex items-center gap-1 rounded-full border border-[var(--border)] bg-[var(--surface)] p-1', className)}>
      {children}
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
