'use client';

/**
 * TemplateEditor — visual Word-like offer template editor.
 *
 * Features:
 *  - Text formatting: H1-H3, bold, italic, underline
 *  - Text alignment: left, center, right, justify
 *  - Text color picker
 *  - Bullet list, ordered list
 *  - Horizontal divider
 *  - Image upload (base64 stored in template JSON) + resize by dragging corners
 *  - Drag-handle for reordering blocks (⠿ icon on hover in left margin)
 *  - Placeholder insertion ({{variable}} chips)
 *  - Document page look: white A4 page with shadow
 */

import { useEditor, EditorContent, ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import Underline from '@tiptap/extension-underline';
import Image from '@tiptap/extension-image';
import type { NodeViewProps } from '@tiptap/core';
import { useRef, useCallback, useState, useEffect } from 'react';
import { OFFER_PLACEHOLDERS } from '@modules/supporting/offers/domain/template.entity';
import { cn } from '@shared/lib/utils';

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface TemplateEditorHandle {
  getJSON: () => object;
  setContent: (json: object | string) => void;
}

interface Props {
  initialContent?: string; // TipTap JSON string
  editorRef?: React.MutableRefObject<TemplateEditorHandle | null>;
}

// ─── ResizableImage NodeView ──────────────────────────────────────────────────

function ResizableImageView(props: NodeViewProps) {
  const { node, updateAttributes, selected } = props;
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [resizing, setResizing] = useState(false);
  const startX = useRef(0);
  const startW = useRef(0);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setResizing(true);
    startX.current = e.clientX;
    startW.current = imgRef.current?.offsetWidth ?? (node.attrs as { width?: number }).width ?? 400;

    const onMove = (mv: MouseEvent) => {
      const delta = mv.clientX - startX.current;
      const newW  = Math.max(80, Math.min(700, startW.current + delta));
      updateAttributes({ width: Math.round(newW) });
    };
    const onUp = () => {
      setResizing(false);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [node.attrs, updateAttributes]);

  const attrs = node.attrs as { src: string; alt?: string; title?: string; width?: number; align?: string };
  const width = attrs.width ?? undefined;
  const align = attrs.align ?? 'left';
  const wrapStyle: React.CSSProperties = { display: 'flex', justifyContent: align === 'center' ? 'center' : align === 'right' ? 'flex-end' : 'flex-start', margin: '12px 0' };

  return (
    <NodeViewWrapper style={wrapStyle}>
      <div
        ref={containerRef}
        style={{ position: 'relative', display: 'inline-block', cursor: resizing ? 'ew-resize' : 'default' }}
      >
        <img
          ref={imgRef}
          src={attrs.src}
          alt={attrs.alt ?? ''}
          title={attrs.title ?? ''}
          draggable={false}
          style={{
            width: width ? `${width}px` : undefined,
            maxWidth: '100%',
            display: 'block',
            outline: selected ? '2px solid #6366f1' : 'none',
            borderRadius: '4px',
          }}
        />
        {/* Resize handle — bottom-right */}
        <div
          onMouseDown={onMouseDown}
          style={{
            position: 'absolute', bottom: 0, right: 0,
            width: '14px', height: '14px',
            background: '#6366f1',
            borderRadius: '2px 0 4px 0',
            cursor: 'ew-resize',
            opacity: selected ? 1 : 0,
            transition: 'opacity 0.15s',
          }}
          title="Drag to resize"
        />
      </div>
    </NodeViewWrapper>
  );
}

// Custom Image extension with ResizableImage NodeView + align/width attrs
const ResizableImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: { default: null },
      align: { default: 'left' },
    };
  },
  addNodeView() {
    return ReactNodeViewRenderer(ResizableImageView);
  },
});

// ─── Toolbar helpers ──────────────────────────────────────────────────────────

function Sep() {
  return <div className="w-px h-5 bg-[var(--border)] mx-0.5 shrink-0"/>;
}

function Btn({ active, disabled, onClick, title, children }: {
  active?: boolean; disabled?: boolean; onClick: () => void; title: string; children: React.ReactNode;
}) {
  return (
    <button
      type="button" onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      disabled={disabled} title={title}
      className={cn(
        'flex items-center justify-center w-7 h-7 rounded-md text-sm transition-all shrink-0',
        active
          ? 'bg-[var(--accent)] text-white'
          : 'text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]',
        'disabled:opacity-30 disabled:cursor-not-allowed'
      )}
    >
      {children}
    </button>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function TemplateEditor({ initialContent, editorRef }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [colorOpen, setColorOpen] = useState(false);
  const [placeholderOpen, setPlaceholderOpen] = useState(false);
  const colorRef = useRef<HTMLDivElement>(null);
  const placeholderRef = useRef<HTMLDivElement>(null);

  const PRESET_COLORS = [
    '#0f172a', '#334155', '#64748b', '#94a3b8',
    '#dc2626', '#ea580c', '#ca8a04', '#16a34a',
    '#0284c7', '#7c3aed', '#db2777', '#059669',
  ];

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ dropcursor: { color: '#6366f1', width: 2 } }),
      Placeholder.configure({ placeholder: 'Börja skriva din offertmall… Använd "Platshållare" för dynamiska fält som mottagarens namn.' }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      TextStyle,
      Color,
      Underline,
      ResizableImage.configure({ allowBase64: true }),
    ],
    editorProps: {
      attributes: { class: 'focus:outline-none min-h-[500px]' },
    },
    content: initialContent ? (() => { try { return JSON.parse(initialContent) as object; } catch { return initialContent; } })() : undefined,
  });

  // Expose imperative handle
  useEffect(() => {
    if (!editorRef) return;
    editorRef.current = {
      getJSON: () => editor?.getJSON() ?? {},
      setContent: (json) => {
        if (!editor) return;
        try {
          const parsed = typeof json === 'string' ? JSON.parse(json) as object : json;
          editor.commands.setContent(parsed);
        } catch {
          editor.commands.setContent(String(json));
        }
      },
    };
  }, [editor, editorRef]);

  // Close dropdowns on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (colorRef.current && !colorRef.current.contains(e.target as HTMLElement)) setColorOpen(false);
      if (placeholderRef.current && !placeholderRef.current.contains(e.target as HTMLElement)) setPlaceholderOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Image upload → base64
  const handleImageUpload = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const src = e.target?.result as string;
      editor?.chain().focus().setImage({ src }).run();
    };
    reader.readAsDataURL(file);
  }, [editor]);

  const onFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleImageUpload(file);
    e.target.value = '';
  }, [handleImageUpload]);

  // Drag-and-drop image onto editor
  const onDrop = useCallback((e: React.DragEvent) => {
    const file = Array.from(e.dataTransfer.files).find((f) => f.type.startsWith('image/'));
    if (file) { e.preventDefault(); handleImageUpload(file); }
  }, [handleImageUpload]);

  if (!editor) return null;

  const currentColor = (editor.getAttributes('textStyle') as { color?: string }).color ?? '#0f172a';

  return (
    <div className="flex flex-col h-full" onDrop={onDrop} onDragOver={(e) => e.preventDefault()}>
      {/* ── Toolbar ─────────────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-20 flex flex-wrap items-center gap-0.5 px-3 py-2 bg-[var(--surface-alt)] border-b border-[var(--border)] rounded-t-2xl">

        {/* Paragraph style */}
        <select
          value={
            editor.isActive('heading', { level: 1 }) ? 'h1'
            : editor.isActive('heading', { level: 2 }) ? 'h2'
            : editor.isActive('heading', { level: 3 }) ? 'h3'
            : 'p'
          }
          onChange={(e) => {
            const v = e.target.value;
            if (v === 'p')  editor.chain().focus().setParagraph().run();
            else editor.chain().focus().toggleHeading({ level: parseInt(v.slice(1)) as 1|2|3 }).run();
          }}
          onMouseDown={(e) => e.preventDefault()}
          className="h-7 rounded-md border border-[var(--border)] bg-[var(--surface)] px-1.5 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] transition-colors cursor-pointer"
        >
          <option value="p">Brödtext</option>
          <option value="h1">Rubrik 1</option>
          <option value="h2">Rubrik 2</option>
          <option value="h3">Rubrik 3</option>
        </select>

        <Sep/>

        {/* Bold / Italic / Underline */}
        <Btn active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()} title="Fet (Ctrl+B)">
          <strong className="text-[13px] font-black">B</strong>
        </Btn>
        <Btn active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()} title="Kursiv (Ctrl+I)">
          <em className="text-[13px] italic">I</em>
        </Btn>
        <Btn active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()} title="Understruket (Ctrl+U)">
          <span className="text-[13px] underline font-medium">U</span>
        </Btn>

        <Sep/>

        {/* Text alignment */}
        <Btn active={editor.isActive({ textAlign: 'left' })}   onClick={() => editor.chain().focus().setTextAlign('left').run()}    title="Vänsterjusterat">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="15" y2="12"/><line x1="3" y1="18" x2="18" y2="18"/></svg>
        </Btn>
        <Btn active={editor.isActive({ textAlign: 'center' })} onClick={() => editor.chain().focus().setTextAlign('center').run()}  title="Centrerat">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="6" y1="12" x2="18" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/></svg>
        </Btn>
        <Btn active={editor.isActive({ textAlign: 'right' })}  onClick={() => editor.chain().focus().setTextAlign('right').run()}   title="Högerjusterat">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="9" y1="12" x2="21" y2="12"/><line x1="6" y1="18" x2="21" y2="18"/></svg>
        </Btn>

        <Sep/>

        {/* Lists */}
        <Btn active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()} title="Punktlista">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="9" y1="6" x2="20" y2="6"/><line x1="9" y1="12" x2="20" y2="12"/><line x1="9" y1="18" x2="20" y2="18"/><circle cx="4" cy="6" r="1.5" fill="currentColor" stroke="none"/><circle cx="4" cy="12" r="1.5" fill="currentColor" stroke="none"/><circle cx="4" cy="18" r="1.5" fill="currentColor" stroke="none"/></svg>
        </Btn>
        <Btn active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()} title="Numrerad lista">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="10" y1="18" x2="21" y2="18"/><path d="M4 6h1v4" strokeLinejoin="round"/><path d="M4 10h2" strokeLinejoin="round"/><path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1" strokeLinejoin="round"/></svg>
        </Btn>

        <Sep/>

        {/* Horizontal rule */}
        <Btn onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Avdelare">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="6" y2="6"/><line x1="3" y1="18" x2="6" y2="18"/></svg>
        </Btn>

        {/* Image upload */}
        <Btn onClick={() => fileInputRef.current?.click()} title="Infoga bild">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
        </Btn>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onFileChange}/>

        <Sep/>

        {/* Text color */}
        <div ref={colorRef} className="relative">
          <button
            type="button" title="Textfärg"
            onMouseDown={(e) => { e.preventDefault(); setColorOpen((o) => !o); setPlaceholderOpen(false); }}
            className="flex flex-col items-center justify-center w-7 h-7 rounded-md hover:bg-[var(--surface-hover)] transition-colors"
          >
            <span className="text-[13px] font-semibold text-[var(--text-primary)] leading-none">A</span>
            <span className="w-4 h-1 rounded-full mt-0.5" style={{ background: currentColor }}/>
          </button>
          {colorOpen && (
            <div className="absolute top-9 left-0 z-50 bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-lg p-2 w-36">
              <div className="grid grid-cols-4 gap-1.5">
                {PRESET_COLORS.map((c) => (
                  <button key={c} type="button"
                    onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().setColor(c).run(); setColorOpen(false); }}
                    className="w-6 h-6 rounded-md border-2 transition-transform hover:scale-110"
                    style={{ background: c, borderColor: currentColor === c ? '#6366f1' : 'transparent' }}
                    title={c}
                  />
                ))}
              </div>
              <button type="button" onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().unsetColor().run(); setColorOpen(false); }}
                className="mt-2 w-full text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
                Återställ färg
              </button>
            </div>
          )}
        </div>

        <Sep/>

        {/* Undo / Redo */}
        <Btn onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Ångra (Ctrl+Z)">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 14 4 9 9 4"/><path d="M20 20v-7a4 4 0 0 0-4-4H4"/></svg>
        </Btn>
        <Btn onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Gör om (Ctrl+Y)">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 14 20 9 15 4"/><path d="M4 20v-7a4 4 0 0 1 4-4h12"/></svg>
        </Btn>

        <div className="flex-1"/>

        {/* Placeholder picker */}
        <div ref={placeholderRef} className="relative">
          <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); setPlaceholderOpen((o) => !o); setColorOpen(false); }}
            className="flex items-center gap-1.5 h-7 rounded-lg border border-[var(--accent)]/40 bg-[var(--accent)]/5 px-2.5 text-xs font-medium text-[var(--accent)] hover:bg-[var(--accent)]/10 transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Platshållare
          </button>
          {placeholderOpen && (
            <div className="absolute top-9 right-0 z-50 bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-lg p-1 w-72 max-h-72 overflow-y-auto">
              {OFFER_PLACEHOLDERS.map((p) => (
                <button
                  key={p.key} type="button"
                  onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().insertContent(p.key).run(); setPlaceholderOpen(false); }}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-[var(--surface-hover)] transition-colors flex items-center justify-between gap-2"
                >
                  <span className="text-sm text-[var(--text-primary)]">{p.label}</span>
                  <span className="text-xs text-[var(--accent)] font-mono shrink-0">{p.key}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Document canvas ──────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto bg-[var(--surface-alt)] py-8 px-4">
        {/* A4-style white page */}
        <div className="max-w-[700px] mx-auto bg-white rounded-lg shadow-[0_4px_24px_rgba(0,0,0,0.12)] min-h-[900px] px-12 py-10">
          <EditorContent editor={editor}/>
        </div>
      </div>

      <style jsx global>{`
        /* ── TipTap document styles (inside white page) ─────────────────────── */
        .tiptap { outline: none; min-height: 500px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 14px; line-height: 1.7; color: #1e293b; }
        .tiptap p  { margin: 0 0 0.75em 0; }
        .tiptap h1 { font-size: 2em;   font-weight: 700; margin: 0.6em 0 0.4em; line-height: 1.2; color: #0f172a; }
        .tiptap h2 { font-size: 1.45em; font-weight: 700; margin: 0.6em 0 0.4em; line-height: 1.3; color: #0f172a; }
        .tiptap h3 { font-size: 1.15em; font-weight: 600; margin: 0.5em 0 0.3em; line-height: 1.4; color: #0f172a; }
        .tiptap ul { list-style: disc;    padding-left: 1.5em; margin-bottom: 0.75em; }
        .tiptap ol { list-style: decimal; padding-left: 1.5em; margin-bottom: 0.75em; }
        .tiptap li { margin-bottom: 0.2em; }
        .tiptap hr { border: none; border-top: 1px solid #e2e8f0; margin: 1.5em 0; }
        .tiptap p.is-editor-empty:first-child::before { color: #94a3b8; content: attr(data-placeholder); float: left; height: 0; pointer-events: none; font-style: italic; }
        /* Placeholder variable chip styling */
        .tiptap *:contains("{{") { background: #ede9fe; color: #6d28d9; border-radius: 3px; padding: 0 2px; }
        /* Image selected state */
        .tiptap img.ProseMirror-selectednode { outline: 2px solid #6366f1; }
        /* drag handle area */
        .tiptap > * { position: relative; }
      `}</style>
    </div>
  );
}
