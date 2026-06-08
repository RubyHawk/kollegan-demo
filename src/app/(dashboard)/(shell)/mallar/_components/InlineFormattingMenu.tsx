'use client';

import { NodeSelection } from '@tiptap/pm/state';
import { BubbleMenu } from '@tiptap/react/menus';
import { Link } from 'lucide-react';
import { cn } from '@shared/lib/utils';
import { useTemplateEditor } from './editor-context';

const STYLE_OPTIONS = [
  { label: 'Brödtext', value: 'paragraph' },
  { label: 'Rubrik 1', value: 'h1' },
  { label: 'Rubrik 2', value: 'h2' },
] as const;
const FONT_SIZES = ['', '11', '12', '14', '16', '20', '24', '32'] as const;

export function InlineFormattingMenu() {
  const editor = useTemplateEditor();
  if (!editor) return null;
  const currentEditor = editor;

  const activeStyle = currentEditor.isActive('heading', { level: 1 })
    ? 'h1'
    : currentEditor.isActive('heading', { level: 2 })
      ? 'h2'
      : 'paragraph';
  const activeFontSize = (currentEditor.getAttributes('textStyle') as { fontSize?: string | null }).fontSize ?? '';

  function applyStyle(value: string) {
    if (value === 'h1') return void currentEditor.chain().focus().toggleHeading({ level: 1 }).run();
    if (value === 'h2') return void currentEditor.chain().focus().toggleHeading({ level: 2 }).run();
    currentEditor.chain().focus().setParagraph().run();
  }

  function applyFontSize(value: string) {
    if (!value) return void currentEditor.chain().focus().unsetFontSize().run();
    currentEditor.chain().focus().setFontSize(value).run();
  }

  return (
    <BubbleMenu
      editor={currentEditor}
      options={{ placement: 'top' }}
      shouldShow={({ state }) => {
        const { selection } = state;
        if (selection instanceof NodeSelection) return false;
        return selection.from !== selection.to;
      }}
      className="flex items-center gap-1 rounded-lg border border-[var(--ui-border)] bg-[var(--ui-surface)] p-1"
    >
      <select
        value={activeStyle}
        onChange={(event) => applyStyle(event.target.value)}
        className="h-7 rounded-md bg-[var(--ui-surface-hover)] px-2 text-[11px] font-semibold text-[var(--ui-text)] outline-none focus:ring-2 focus:ring-[var(--ui-focus)]"
        title="Textstil"
      >
        {STYLE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
      <select
        value={activeFontSize}
        onChange={(event) => applyFontSize(event.target.value)}
        className="h-7 rounded-md bg-[var(--ui-surface-hover)] px-2 text-[11px] font-semibold text-[var(--ui-text)] outline-none focus:ring-2 focus:ring-[var(--ui-focus)]"
        title="Teckenstorlek"
      >
        {FONT_SIZES.map((size) => <option key={size || 'auto'} value={size}>{size ? `${size}px` : 'Auto'}</option>)}
      </select>
      <InlineButton title="Fet" active={currentEditor.isActive('bold')} onClick={() => currentEditor.chain().focus().toggleBold().run()}>B</InlineButton>
      <InlineButton title="Kursiv" active={currentEditor.isActive('italic')} onClick={() => currentEditor.chain().focus().toggleItalic().run()}><em>I</em></InlineButton>
      <InlineButton title="Understruken" active={currentEditor.isActive('underline')} onClick={() => currentEditor.chain().focus().toggleUnderline().run()}><u>U</u></InlineButton>
      <InlineButton
        title="Länk"
        active={currentEditor.isActive('link')}
        onClick={() => {
          const previous = currentEditor.getAttributes('link').href as string | undefined;
          const url = window.prompt('Länkadress', previous ?? '');
          if (url === null) return;
          if (!url.trim()) return void currentEditor.chain().focus().unsetLink().run();
          currentEditor.chain().focus().setLink({ href: url.trim() }).run();
        }}
      >
        <Link size={14} strokeWidth={1.75} />
      </InlineButton>
    </BubbleMenu>
  );
}

function InlineButton({ title, active, onClick, children }: { title: string; active?: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={cn(
        'inline-flex h-7 min-w-7 items-center justify-center rounded-md px-2 text-[12px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ui-focus)]',
        active
          ? 'bg-[var(--ui-surface-selected)] text-[var(--ui-accent)]'
          : 'text-[var(--ui-text-secondary)] hover:bg-[var(--ui-surface-hover)] hover:text-[var(--ui-text)]',
      )}
    >
      {children}
    </button>
  );
}
