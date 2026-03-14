'use client';

/**
 * TopToolbar — Word-style ribbon toolbar.
 *
 * Groups: Styles | Undo/Redo | Font (B I U S) | Color | Alignment | Lists | Insert
 * Styling follows Office 365 flat design: #f3f2f1 hover, #ddeeff/#004e8c active.
 */

import { useRef, useState } from 'react';
import { useTemplateEditor } from './editor-context';

// ── Office colour palette (20 colours) ─────────────────────────────────────────
const COLORS = [
  '#000000', '#404040', '#7f7f7f', '#bfbfbf', '#ffffff',
  '#c00000', '#e74c3c', '#e67e22', '#f1c40f', '#2ecc71',
  '#1abc9c', '#3498db', '#2980b9', '#1f3864', '#2e74b5',
  '#8e44ad', '#9b59b6', '#c0392b', '#16a085', '#27ae60',
];

export default function TopToolbar() {
  const editor = useTemplateEditor();
  const fileRef = useRef<HTMLInputElement>(null);
  const [styleOpen,  setStyleOpen]  = useState(false);
  const [colorOpen,  setColorOpen]  = useState(false);

  if (!editor) return null;

  // ── Active style label ────────────────────────────────────────────────────

  const activeStyle = (() => {
    if (editor.isActive('heading', { level: 1 })) return 'Rubrik 1';
    if (editor.isActive('heading', { level: 2 })) return 'Rubrik 2';
    if (editor.isActive('heading', { level: 3 })) return 'Rubrik 3';
    return 'Normal';
  })();

  // ── Active text colour ────────────────────────────────────────────────────

  const activeColor = (editor.getAttributes('textStyle').color as string | undefined) ?? '#000000';

  // ── Image file handler ────────────────────────────────────────────────────

  function handleImageFile(file: File) {
    const reader = new FileReader();
    reader.onload = (e) => {
      editor!.chain().focus().setImage({ src: e.target?.result as string }).run();
    };
    reader.readAsDataURL(file);
  }

  // ── Styles dropdown entries ───────────────────────────────────────────────

  const styleEntries = [
    {
      label: 'Normal',
      previewStyle: { fontFamily: 'Calibri, Carlito, Arial, sans-serif', fontSize: 13, color: '#1e1e1e', fontWeight: 400 },
      action: () => { editor.chain().focus().setParagraph().run(); setStyleOpen(false); },
    },
    {
      label: 'Rubrik 1',
      previewStyle: { fontFamily: 'Calibri, Carlito, Arial, sans-serif', fontSize: 20, color: '#1f3864', fontWeight: 700 },
      action: () => { editor.chain().focus().toggleHeading({ level: 1 }).run(); setStyleOpen(false); },
    },
    {
      label: 'Rubrik 2',
      previewStyle: { fontFamily: 'Calibri, Carlito, Arial, sans-serif', fontSize: 15, color: '#2e74b5', fontWeight: 700 },
      action: () => { editor.chain().focus().toggleHeading({ level: 2 }).run(); setStyleOpen(false); },
    },
    {
      label: 'Rubrik 3',
      previewStyle: { fontFamily: 'Calibri, Carlito, Arial, sans-serif', fontSize: 13, color: '#1f3864', fontWeight: 700 },
      action: () => { editor.chain().focus().toggleHeading({ level: 3 }).run(); setStyleOpen(false); },
    },
  ];

  return (
    <div
      style={{
        background: '#f3f2f1',
        borderBottom: '1px solid #d2d0ce',
        display: 'flex',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 2,
        padding: '4px 8px',
        userSelect: 'none',
        minHeight: 40,
      }}
      onMouseDown={(e) => e.preventDefault()}
    >

      {/* ── Undo / Redo ──────────────────────────────────────────────────── */}
      <RBtn onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Ångra (Ctrl+Z)">
        <UndoIcon />
      </RBtn>
      <RBtn onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Gör om (Ctrl+Y)">
        <RedoIcon />
      </RBtn>

      <Sep />

      {/* ── Styles dropdown ──────────────────────────────────────────────── */}
      <div style={{ position: 'relative' }}>
        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); setStyleOpen((v) => !v); setColorOpen(false); }}
          title="Styckeformat"
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '3px 8px', minWidth: 108,
            background: styleOpen ? '#ddeeff' : 'transparent',
            border: styleOpen ? '1px solid #c0d8f0' : '1px solid transparent',
            borderRadius: 2, cursor: 'pointer',
            fontSize: 13, color: '#1e1e1e',
            fontFamily: 'Calibri, Carlito, Arial, sans-serif',
          }}
        >
          <span style={{ flex: 1, textAlign: 'left', lineHeight: '22px' }}>{activeStyle}</span>
          <ChevronIcon />
        </button>

        {styleOpen && (
          <div style={{
            position: 'absolute', top: '100%', left: 0, marginTop: 2,
            background: 'white', border: '1px solid #d2d0ce',
            boxShadow: '0 4px 16px rgba(0,0,0,0.15)', zIndex: 200,
            minWidth: 200, borderRadius: 2,
          }}>
            {styleEntries.map(({ label, previewStyle, action }) => (
              <button
                key={label}
                type="button"
                onMouseDown={(e) => { e.preventDefault(); action(); }}
                style={{
                  display: 'block', width: '100%', textAlign: 'left',
                  padding: '8px 16px',
                  background: activeStyle === label ? '#ddeeff' : 'transparent',
                  border: 'none', cursor: 'pointer',
                  ...previewStyle,
                  lineHeight: 1.3,
                }}
                onMouseEnter={(e) => { if (activeStyle !== label) (e.currentTarget as HTMLElement).style.background = '#f3f2f1'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = activeStyle === label ? '#ddeeff' : 'transparent'; }}
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </div>

      <Sep />

      {/* ── Font formatting ───────────────────────────────────────────────── */}
      <RBtn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Fet (Ctrl+B)">
        <span style={{ fontWeight: 700, fontFamily: 'Georgia, serif', fontSize: 13, lineHeight: 1 }}>B</span>
      </RBtn>
      <RBtn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Kursiv (Ctrl+I)">
        <span style={{ fontStyle: 'italic', fontFamily: 'Georgia, serif', fontSize: 13, lineHeight: 1 }}>I</span>
      </RBtn>
      <RBtn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="Understruken (Ctrl+U)">
        <span style={{ textDecoration: 'underline', fontFamily: 'Calibri, Arial, sans-serif', fontSize: 13, lineHeight: 1 }}>U</span>
      </RBtn>
      <RBtn onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="Genomstrykning">
        <span style={{ textDecoration: 'line-through', fontFamily: 'Calibri, Arial, sans-serif', fontSize: 13, lineHeight: 1 }}>S</span>
      </RBtn>

      <Sep />

      {/* ── Text colour ───────────────────────────────────────────────────── */}
      <div style={{ position: 'relative' }}>
        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); setColorOpen((v) => !v); setStyleOpen(false); }}
          title="Teckenfärg"
          style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            width: 32, height: 30, padding: '2px 4px',
            background: colorOpen ? '#ddeeff' : 'transparent',
            border: colorOpen ? '1px solid #c0d8f0' : '1px solid transparent',
            borderRadius: 2, cursor: 'pointer', gap: 1,
          }}
        >
          <span style={{ fontWeight: 700, fontFamily: 'Calibri, Arial, sans-serif', fontSize: 13, lineHeight: 1, color: '#1e1e1e' }}>A</span>
          <div style={{ width: 18, height: 3, background: activeColor, borderRadius: 1 }} />
        </button>

        {colorOpen && (
          <div style={{
            position: 'absolute', top: '100%', left: 0, marginTop: 2,
            background: 'white', border: '1px solid #d2d0ce',
            boxShadow: '0 4px 16px rgba(0,0,0,0.15)', zIndex: 200,
            padding: '8px 10px', borderRadius: 2,
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 22px)', gap: 3, marginBottom: 8 }}>
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    editor.chain().focus().setColor(c).run();
                    setColorOpen(false);
                  }}
                  title={c}
                  style={{
                    width: 22, height: 22, background: c,
                    border: c === activeColor ? '2px solid #0078d4' : '1px solid #d2d0ce',
                    borderRadius: 2, cursor: 'pointer', padding: 0,
                  }}
                />
              ))}
            </div>
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                editor.chain().focus().unsetColor().run();
                setColorOpen(false);
              }}
              style={{
                display: 'block', width: '100%', textAlign: 'center',
                fontSize: 11, color: '#0078d4', background: 'none', border: 'none',
                cursor: 'pointer', padding: '2px 0',
              }}
            >
              Rensa färg
            </button>
          </div>
        )}
      </div>

      <Sep />

      {/* ── Alignment ─────────────────────────────────────────────────────── */}
      <RBtn onClick={() => editor.chain().focus().setTextAlign('left').run()}    active={editor.isActive({ textAlign: 'left' })}    title="Vänsterjustera (Ctrl+L)">
        <AlignLeftIcon />
      </RBtn>
      <RBtn onClick={() => editor.chain().focus().setTextAlign('center').run()}  active={editor.isActive({ textAlign: 'center' })}  title="Centrera (Ctrl+E)">
        <AlignCenterIcon />
      </RBtn>
      <RBtn onClick={() => editor.chain().focus().setTextAlign('right').run()}   active={editor.isActive({ textAlign: 'right' })}   title="Högerjustera (Ctrl+R)">
        <AlignRightIcon />
      </RBtn>
      <RBtn onClick={() => editor.chain().focus().setTextAlign('justify').run()} active={editor.isActive({ textAlign: 'justify' })} title="Justera">
        <AlignJustifyIcon />
      </RBtn>

      <Sep />

      {/* ── Lists ─────────────────────────────────────────────────────────── */}
      <RBtn onClick={() => editor.chain().focus().toggleBulletList().run()}  active={editor.isActive('bulletList')}  title="Punktlista">
        <BulletListIcon />
      </RBtn>
      <RBtn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Numrerad lista">
        <OrderedListIcon />
      </RBtn>

      <Sep />

      {/* ── Insert ────────────────────────────────────────────────────────── */}
      <RBtn onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} title="Infoga tabell">
        <TableIcon />
      </RBtn>
      <RBtn onClick={() => fileRef.current?.click()} title="Infoga bild">
        <ImageIcon />
      </RBtn>
      <RBtn onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Avdelare">
        <HrIcon />
      </RBtn>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleImageFile(file);
          e.target.value = '';
        }}
      />

      {/* ── Link ─────────────────────────────────────────────────────────── */}
      <RBtn
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
      </RBtn>

    </div>
  );
}

// ── Ribbon button ───────────────────────────────────────────────────────────────

function RBtn({
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
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: 32, height: 30,
        background: active ? '#ddeeff' : 'transparent',
        border: active ? '1px solid #c0d8f0' : '1px solid transparent',
        color: active ? '#004e8c' : '#1e1e1e',
        borderRadius: 2, cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.4 : 1,
        flexShrink: 0,
        transition: 'background 0.08s',
      }}
      onMouseEnter={(e) => {
        if (!active && !disabled) (e.currentTarget as HTMLElement).style.background = '#e8e6e3';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.background = active ? '#ddeeff' : 'transparent';
      }}
    >
      {children}
    </button>
  );
}

function Sep() {
  return <div style={{ width: 1, height: 20, background: '#d2d0ce', margin: '0 4px', flexShrink: 0 }} />;
}

// ── Icons ───────────────────────────────────────────────────────────────────────

const sv = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

function AlignLeftIcon()    { return <svg width="14" height="14" viewBox="0 0 24 24" {...sv}><line x1="21" y1="6" x2="3" y2="6"/><line x1="15" y1="12" x2="3" y2="12"/><line x1="17" y1="18" x2="3" y2="18"/></svg>; }
function AlignCenterIcon()  { return <svg width="14" height="14" viewBox="0 0 24 24" {...sv}><line x1="21" y1="6" x2="3" y2="6"/><line x1="17" y1="12" x2="7" y2="12"/><line x1="19" y1="18" x2="5" y2="18"/></svg>; }
function AlignRightIcon()   { return <svg width="14" height="14" viewBox="0 0 24 24" {...sv}><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="12" x2="9" y2="12"/><line x1="21" y1="18" x2="7" y2="18"/></svg>; }
function AlignJustifyIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" {...sv}><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="12" x2="3" y2="12"/><line x1="21" y1="18" x2="3" y2="18"/></svg>; }
function BulletListIcon()   { return <svg width="14" height="14" viewBox="0 0 24 24" {...sv}><line x1="9" y1="6" x2="20" y2="6"/><line x1="9" y1="12" x2="20" y2="12"/><line x1="9" y1="18" x2="20" y2="18"/><circle cx="4" cy="6" r="1" fill="currentColor" stroke="none"/><circle cx="4" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="4" cy="18" r="1" fill="currentColor" stroke="none"/></svg>; }
function OrderedListIcon()  { return <svg width="14" height="14" viewBox="0 0 24 24" {...sv}><line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="10" y1="18" x2="21" y2="18"/><path d="M4 6h1v4"/><path d="M4 10H6"/><path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"/></svg>; }
function TableIcon()        { return <svg width="14" height="14" viewBox="0 0 24 24" {...sv}><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="12" y1="3" x2="12" y2="21"/></svg>; }
function HrIcon()           { return <svg width="14" height="14" viewBox="0 0 24 24" {...sv}><line x1="3" y1="12" x2="21" y2="12"/></svg>; }
function ImageIcon()        { return <svg width="14" height="14" viewBox="0 0 24 24" {...sv}><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>; }
function UndoIcon()         { return <svg width="14" height="14" viewBox="0 0 24 24" {...sv}><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.51"/></svg>; }
function RedoIcon()         { return <svg width="14" height="14" viewBox="0 0 24 24" {...sv}><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-.49-3.51"/></svg>; }
function LinkIcon()         { return <svg width="13" height="13" viewBox="0 0 24 24" {...sv}><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>; }
function ChevronIcon()      { return <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>; }
