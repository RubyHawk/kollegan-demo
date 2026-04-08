'use client';

import { useEffect, useRef, useState } from 'react';
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
  TextStrikethrough,
  TextUnderline,
  X,
} from '@phosphor-icons/react';

const STYLE_OPTIONS = [
  { label: 'Brödtext', action: 'paragraph' },
  { label: 'Rubrik 1', action: 'h1' },
  { label: 'Rubrik 2', action: 'h2' },
] as const;

const FONT_SIZE_OPTIONS = ['10', '11', '12', '13', '14', '15', '16', '18', '20', '24', '28', '32', '40', '48'] as const;
const LINE_HEIGHT_OPTIONS = [
  { label: '1.0', value: '1' },
  { label: '1.15', value: '1.15' },
  { label: '1.5', value: '1.5' },
  { label: '2.0', value: '2' },
] as const;
const PRESET_COLORS = [
  '#0f172a',
  '#475569',
  '#94a3b8',
  '#ef4444',
  '#f97316',
  '#eab308',
  '#22c55e',
  '#06b6d4',
  '#3b82f6',
  '#a855f7',
];

export default function TopToolbar() {
  const editor = useTemplateEditor();
  const hf = useHeaderFooter();
  // Force re-render whenever the TipTap editor transaction/selection changes, so
  // active-state (`editor.isActive(...)`) reflects the current cursor position.
  const [, forceRender] = useState(0);

  const activePage = hf?.pages[hf.activeIdx];
  const isDocumentPage = activePage?.kind === 'document';

  useEffect(() => {
    if (!editor) return;
    const rerender = () => forceRender((v) => v + 1);
    editor.on('transaction', rerender);
    editor.on('selectionUpdate', rerender);
    editor.on('focus', rerender);
    editor.on('blur', rerender);
    return () => {
      editor.off('transaction', rerender);
      editor.off('selectionUpdate', rerender);
      editor.off('focus', rerender);
      editor.off('blur', rerender);
    };
  }, [editor]);

  if (!editor) return null;
  const currentEditor = editor;

  const activeStyle = currentEditor.isActive('heading', { level: 1 })
    ? 'Rubrik 1'
    : currentEditor.isActive('heading', { level: 2 })
      ? 'Rubrik 2'
      : 'Brödtext';

  const activeFontSize =
    (currentEditor.getAttributes('textStyle') as { fontSize?: string | null }).fontSize ?? '';
  const activeColor =
    (currentEditor.getAttributes('textStyle') as { color?: string | null }).color ?? '';
  const activeLineHeight = (() => {
    const paragraph = currentEditor.getAttributes('paragraph') as { lineHeight?: string | null };
    if (paragraph.lineHeight) return paragraph.lineHeight;
    const heading = currentEditor.getAttributes('heading') as { lineHeight?: string | null };
    return heading.lineHeight ?? '';
  })();

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

  function applyFontSize(value: string) {
    if (!value) {
      currentEditor.chain().focus().unsetFontSize().run();
      return;
    }
    currentEditor.chain().focus().setFontSize(value).run();
  }

  function applyLineHeight(value: string) {
    if (!value) {
      currentEditor.chain().focus().unsetLineHeight().run();
      return;
    }
    currentEditor.chain().focus().setLineHeight(value).run();
  }

  function applyColor(value: string) {
    currentEditor.chain().focus().setColor(value).run();
  }

  function clearColor() {
    currentEditor.chain().focus().unsetColor().run();
  }

  return (
    <div className="border-b border-[var(--border)] bg-[var(--surface-1)] px-3 py-2">
      <div className="overflow-x-auto">
        <div className="flex min-w-max items-center gap-2">
          <ToolbarGroup>
            <ToolbarIconButton title="Ångra (Ctrl+Z)" onClick={() => currentEditor.chain().focus().undo().run()} disabled={!currentEditor.can().undo()}>
              <ArrowUUpLeft size={15} />
            </ToolbarIconButton>
            <ToolbarIconButton title="Gör om (Ctrl+Shift+Z)" onClick={() => currentEditor.chain().focus().redo().run()} disabled={!currentEditor.can().redo()}>
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
            <select
              value={activeFontSize}
              onChange={(event) => applyFontSize(event.target.value)}
              title="Teckenstorlek"
              className="rounded-full bg-[var(--surface-1)] px-2 py-1 text-xs font-medium text-[var(--text-primary)] focus:outline-none"
            >
              <option value="">Storlek</option>
              {FONT_SIZE_OPTIONS.map((size) => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
            <ToolbarIconButton title="Fet (Ctrl+B)" active={currentEditor.isActive('bold')} onClick={() => currentEditor.chain().focus().toggleBold().run()}>
              <TextB size={15} weight="bold" />
            </ToolbarIconButton>
            <ToolbarIconButton title="Kursiv (Ctrl+I)" active={currentEditor.isActive('italic')} onClick={() => currentEditor.chain().focus().toggleItalic().run()}>
              <TextItalic size={15} />
            </ToolbarIconButton>
            <ToolbarIconButton title="Understruken (Ctrl+U)" active={currentEditor.isActive('underline')} onClick={() => currentEditor.chain().focus().toggleUnderline().run()}>
              <TextUnderline size={15} />
            </ToolbarIconButton>
            <ToolbarIconButton title="Genomstruken" active={currentEditor.isActive('strike')} onClick={() => currentEditor.chain().focus().toggleStrike().run()}>
              <TextStrikethrough size={15} />
            </ToolbarIconButton>
            <ColorPickerButton activeColor={activeColor} onPick={applyColor} onClear={clearColor} />
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
            <select
              value={activeLineHeight}
              onChange={(event) => applyLineHeight(event.target.value)}
              title="Radavstånd"
              className="ml-1 rounded-full bg-[var(--surface-1)] px-2 py-1 text-xs font-medium text-[var(--text-primary)] focus:outline-none"
            >
              <option value="">Radavstånd</option>
              {LINE_HEIGHT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
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
            <LinkButton editor={currentEditor} />
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

function ColorPickerButton({
  activeColor,
  onPick,
  onClear,
}: {
  activeColor: string;
  onPick: (color: string) => void;
  onClear: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleMouseDown(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    }
    function handleKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        title="Textfärg"
        onClick={() => setOpen((value) => !value)}
        className="relative inline-flex h-8 w-8 items-center justify-center rounded-full text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-active)] hover:text-[var(--text-primary)]"
      >
        <span className="text-[13px] font-bold leading-none">A</span>
        <span
          className="absolute bottom-1 left-1/2 h-[3px] w-4 -translate-x-1/2 rounded-sm"
          style={{ backgroundColor: activeColor || '#0f172a' }}
        />
      </button>
      {open && (
        <div className="absolute left-0 top-[calc(100%+6px)] z-30 w-[188px] rounded-xl border border-[var(--border)] bg-[var(--surface)] p-2 shadow-[0_12px_32px_rgba(15,23,42,0.12)]">
          <div className="grid grid-cols-5 gap-1.5">
            {PRESET_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                title={color}
                onClick={() => {
                  onPick(color);
                  setOpen(false);
                }}
                className="h-6 w-6 rounded-full border border-[var(--border)] transition-transform hover:scale-110"
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
          <div className="mt-2 flex items-center gap-2">
            <label className="flex items-center gap-1 text-[11px] text-[var(--text-muted)]">
              <span>Egen</span>
              <input
                type="color"
                value={activeColor || '#0f172a'}
                onChange={(event) => onPick(event.target.value)}
                className="h-6 w-8 cursor-pointer rounded border border-[var(--border)] bg-transparent p-0"
              />
            </label>
            <button
              type="button"
              onClick={() => {
                onClear();
                setOpen(false);
              }}
              className="ml-auto text-[11px] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            >
              Återställ
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function LinkButton({ editor }: { editor: NonNullable<ReturnType<typeof useTemplateEditor>> }) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleMouseDown(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    }
    function handleKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  function openPopover() {
    const existing = (editor.getAttributes('link') as { href?: string }).href ?? '';
    setUrl(existing);
    setOpen(true);
    // Focus on next frame so the input exists in the DOM.
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  function save() {
    const trimmed = url.trim();
    if (!trimmed) {
      editor.chain().focus().unsetLink().run();
    } else {
      editor.chain().focus().setLink({ href: trimmed }).run();
    }
    setOpen(false);
  }

  function remove() {
    editor.chain().focus().unsetLink().run();
    setOpen(false);
  }

  const isActive = editor.isActive('link');

  return (
    <div className="relative" ref={ref}>
      <ToolbarIconButton
        title="Lägg till länk"
        active={isActive}
        onClick={() => (open ? setOpen(false) : openPopover())}
      >
        <LinkIcon size={15} />
      </ToolbarIconButton>
      {open && (
        <div className="absolute right-0 top-[calc(100%+6px)] z-30 w-[260px] rounded-xl border border-[var(--border)] bg-[var(--surface)] p-2 shadow-[0_12px_32px_rgba(15,23,42,0.12)]">
          <div className="flex items-center gap-1">
            <input
              ref={inputRef}
              type="url"
              placeholder="https://..."
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  save();
                }
              }}
              className="min-w-0 flex-1 rounded-md border border-[var(--border)] bg-[var(--surface-1)] px-2 py-1 text-xs text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-none"
            />
            <button
              type="button"
              onClick={save}
              className="shrink-0 rounded-md bg-[var(--accent)] px-2 py-1 text-xs font-semibold text-white hover:opacity-90"
            >
              Spara
            </button>
          </div>
          {isActive && (
            <button
              type="button"
              onClick={remove}
              className="mt-2 flex items-center gap-1 text-[11px] text-[var(--text-muted)] hover:text-red-600"
            >
              <X size={11} /> Ta bort länk
            </button>
          )}
        </div>
      )}
    </div>
  );
}
