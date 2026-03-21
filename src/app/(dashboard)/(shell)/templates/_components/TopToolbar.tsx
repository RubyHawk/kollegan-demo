'use client';

/**
 * TopToolbar — Word/Office 365-style tabbed ribbon.
 *
 * Tabs: Hem (Home) | Infoga (Insert) | Layout
 */

import { useRef, useState, useCallback, useEffect } from 'react';
import { useTemplateEditor } from './editor-context';
import { useHeaderFooter } from './header-footer-context';
import { cn } from '@shared/lib/utils';
import {
  ArrowUUpLeft, ArrowUUpRight,
  TextAlignLeft, TextAlignCenter, TextAlignRight, TextAlignJustify,
  ListBullets, ListNumbers,
  TextB, TextItalic, TextUnderline, TextStrikethrough,
  TextSubscript, TextSuperscript,
  TextIndent, TextOutdent,
  HighlighterCircle, Palette,
  Eraser, ArrowsOutLineVertical as LineHeight,
  Table, Image as PhImage, Link, Minus as PhMinus,
  ArrowFatLinesUp, ArrowFatLinesDown,
  CaretDown,
  ArrowsIn, ArrowsOut,
  Rows, Columns,
  Layout, FrameCorners,
  ArrowUp, ArrowDown,
} from '@phosphor-icons/react';

// ── Color utilities ──────────────────────────────────────────────────────────

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '').slice(0, 6);
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}
function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map((v) => Math.max(0, Math.min(255, v)).toString(16).padStart(2, '0')).join('');
}
function tintColor(hex: string, t: number) {
  const [r, g, b] = hexToRgb(hex);
  return rgbToHex(Math.round(r + (255 - r) * t), Math.round(g + (255 - g) * t), Math.round(b + (255 - b) * t));
}
function shadeColor(hex: string, t: number) {
  const [r, g, b] = hexToRgb(hex);
  return rgbToHex(Math.round(r * (1 - t)), Math.round(g * (1 - t)), Math.round(b * (1 - t)));
}

// ── Constants ────────────────────────────────────────────────────────────────

const FONTS = [
  // ── Modern sans-serif (enterprise & web favourites) ──
  'Calibri',
  'Arial',
  'Helvetica Neue',
  'Segoe UI',
  'Inter',
  'Open Sans',
  'Roboto',
  'Lato',
  'DM Sans',
  'Montserrat',
  'Source Sans 3',
  'Tahoma',
  'Verdana',
  // ── Classic serif ──
  'Georgia',
  'Garamond',
  'Cambria',
  'Times New Roman',
  'Lora',
  // ── Specialty ──
  'Century Gothic',
  'Trebuchet MS',
  'Courier New',
];
const FONT_SIZES = [8, 9, 10, 11, 12, 14, 16, 18, 20, 22, 24, 26, 28, 36, 48, 72];

// Office 2016 default theme: Text1, BG1, BG2, Text2, Accent1-6
const THEME_BASE = [
  '#000000', '#FFFFFF', '#E7E6E6', '#44546A',
  '#4472C4', '#ED7D31', '#FFC000', '#70AD47', '#5B9BD5', '#FF0000',
];

// Standard Word colors row
const STANDARD_COLORS = [
  '#C00000', '#FF0000', '#FFC000', '#FFFF00', '#92D050',
  '#00B050', '#00B0F0', '#0070C0', '#002060', '#7030A0',
];

// Build 6-row × 10-col theme grid (flat, row-major):
// row 0 = base, rows 1-4 = progressively lighter tints, row 5 = shade
function buildThemeGrid(): string[] {
  const tints = [0, 0.25, 0.50, 0.70, 0.85];
  const rows: string[][] = tints.map((t, i) =>
    THEME_BASE.map((b) => (i === 0 ? b : tintColor(b, t))),
  );
  rows.push(THEME_BASE.map((b) => shadeColor(b, 0.25)));
  // Transpose: grid[row][col] → flat row-major
  return rows.flat();
}

const THEME_GRID = buildThemeGrid(); // 60 cells, 10 per row

const LINE_SPACINGS = [
  { label: 'Enkel (1.0)',   value: '1'    },
  { label: '1,15',          value: '1.15' },
  { label: '1,5 rad',       value: '1.5'  },
  { label: 'Dubbel (2.0)',  value: '2'    },
  { label: '2,5',           value: '2.5'  },
  { label: 'Trippel (3.0)', value: '3'    },
];

const HEADING_DISPLAY_SIZES: Record<number, string> = { 1: '20', 2: '15', 3: '13' };

// ── Main component ───────────────────────────────────────────────────────────

export default function TopToolbar() {
  const editor  = useTemplateEditor();
  const hf      = useHeaderFooter();
  const fileRef = useRef<HTMLInputElement>(null);
  const barRef  = useRef<HTMLDivElement>(null);

  const [tab,      setTab]      = useState<'hem' | 'infoga' | 'layout'>('hem');
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  // ── Subscribe to editor state changes → force re-render ──────────────────
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!editor) return;
    const bump = () => setTick((n) => n + 1);
    editor.on('transaction',    bump);
    editor.on('selectionUpdate', bump);
    return () => {
      editor.off('transaction',    bump);
      editor.off('selectionUpdate', bump);
    };
  }, [editor]);

  // ── Close dropdowns when clicking outside the toolbar ────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (barRef.current && !barRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const toggle = useCallback((name: string) => setOpenMenu((p) => (p === name ? null : name)), []);
  const close  = useCallback(() => setOpenMenu(null), []);

  if (!editor) return null;

  // ── Live derived state ────────────────────────────────────────────────────

  const activeStyle = editor.isActive('heading', { level: 1 }) ? 'Rubrik 1'
    : editor.isActive('heading', { level: 2 }) ? 'Rubrik 2'
    : editor.isActive('heading', { level: 3 }) ? 'Rubrik 3'
    : 'Normal';

  const activeFontFamily = (editor.getAttributes('textStyle').fontFamily as string | undefined) ?? 'Calibri';

  const markFontSize = editor.getAttributes('textStyle').fontSize as string | undefined;
  const activeFontSize = markFontSize
    ?? (editor.isActive('heading', { level: 1 }) ? HEADING_DISPLAY_SIZES[1]
      : editor.isActive('heading', { level: 2 }) ? HEADING_DISPLAY_SIZES[2]
      : editor.isActive('heading', { level: 3 }) ? HEADING_DISPLAY_SIZES[3]
      : '13');

  const activeColor     = (editor.getAttributes('textStyle').color as string | undefined) ?? '#000000';
  const activeHighlight = editor.getAttributes('highlight').color as string | undefined;
  const activeLineH     = (editor.getAttributes('paragraph').lineHeight
    ?? editor.getAttributes('heading').lineHeight) as string | undefined;
  const activeIndent    = (editor.getAttributes('paragraph').indent as number | undefined) ?? 0;

  const isInTable   = editor.isActive('tableCell') || editor.isActive('tableHeader');
  const activeCellBg = (editor.getAttributes('tableCell').backgroundColor
    ?? editor.getAttributes('tableHeader').backgroundColor) as string | undefined;

  // ── Helpers ───────────────────────────────────────────────────────────────

  function handleImageFile(file: File) {
    const reader = new FileReader();
    reader.onload = (e) => {
      editor!.chain().focus().setImage({ src: e.target?.result as string }).run();
    };
    reader.readAsDataURL(file);
  }

  function growFont() {
    const cur  = Number(activeFontSize);
    const next = FONT_SIZES.find((s) => s > cur) ?? cur + 2;
    editor!.chain().focus().setFontSize(String(next)).run();
  }
  function shrinkFont() {
    const cur  = Number(activeFontSize);
    const prev = [...FONT_SIZES].reverse().find((s) => s < cur) ?? Math.max(6, cur - 1);
    editor!.chain().focus().setFontSize(String(prev)).run();
  }

  const styleEntries = [
    { label: 'Normal',   ps: { fontSize: 13, color: '#1e1e1e', fontWeight: 400 }, action: () => editor.chain().focus().setParagraph().run() },
    { label: 'Rubrik 1', ps: { fontSize: 20, color: '#1f3864', fontWeight: 700 }, action: () => editor.chain().focus().toggleHeading({ level: 1 }).run() },
    { label: 'Rubrik 2', ps: { fontSize: 15, color: '#2e74b5', fontWeight: 700 }, action: () => editor.chain().focus().toggleHeading({ level: 2 }).run() },
    { label: 'Rubrik 3', ps: { fontSize: 13, color: '#1f3864', fontWeight: 700 }, action: () => editor.chain().focus().toggleHeading({ level: 3 }).run() },
  ];

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div
      ref={barRef}
      className="border-b border-[var(--border)] bg-[var(--surface-1)]"
      style={{ userSelect: 'none' }}
      onMouseDown={(e) => {
        const tag = (e.target as HTMLElement).tagName;
        if (tag !== 'INPUT') e.preventDefault();
      }}
    >
      {/* ── Tab strip ──────────────────────────────────────────── */}
      <div className="flex items-center px-2 border-b border-[var(--border)] gap-0.5">
        {(['hem', 'infoga', 'layout'] as const).map((t) => {
          const labels: Record<string, string> = { hem: 'Hem', infoga: 'Infoga', layout: 'Layout' };
          const on = tab === t;
          return (
            <button
              key={t}
              type="button"
              onMouseDown={(e) => { e.preventDefault(); setTab(t); close(); }}
              className={cn(
                'px-3 py-1.5 text-xs font-medium rounded-md my-1 transition-colors',
                on
                  ? 'bg-[var(--accent-subtle)] text-[var(--accent)]'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--surface-active)] hover:text-[var(--text-primary)]'
              )}
            >
              {labels[t]}
            </button>
          );
        })}
      </div>

      {/* ── Ribbon content ─────────────────────────────────────── */}
      <div className="flex items-center px-2 py-1 gap-1 overflow-x-auto min-h-[40px]">

        {/* ══ HEM ══════════════════════════════════════════════ */}
        {tab === 'hem' && (
          <>
            {/* Urklipp */}
            <RBtn onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Ångra (Ctrl+Z)"><ArrowUUpLeft size={14} /></RBtn>
            <RBtn onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Gör om (Ctrl+Y)"><ArrowUUpRight size={14} /></RBtn>

            <GroupSep />

            {/* Styckeformat */}
            <Dropdown
              open={openMenu === 'style'}
              onToggle={() => toggle('style')}
              trigger={
                <span className="text-[var(--text-2xs)] min-w-[88px] text-left text-[var(--text-primary)]">
                  {activeStyle}
                </span>
              }
              triggerTitle="Styckeformat"
              minWidth={200}
            >
              {styleEntries.map(({ label, ps, action }) => (
                <DropdownItem key={label} active={activeStyle === label} onSelect={() => { action(); close(); }} style={{ fontSize: ps.fontSize, color: ps.color, fontWeight: ps.fontWeight, lineHeight: 1.4 }}>
                  {label}
                </DropdownItem>
              ))}
            </Dropdown>

            <GroupSep />

            {/* Font family */}
            <Dropdown
              open={openMenu === 'font'}
              onToggle={() => toggle('font')}
              trigger={
                <span className="text-[var(--text-2xs)] min-w-[100px] max-w-[120px] text-left text-[var(--text-primary)] overflow-hidden text-ellipsis whitespace-nowrap block" style={{ fontFamily: activeFontFamily + ', sans-serif' }}>
                  {activeFontFamily}
                </span>
              }
              triggerTitle="Välj teckensnitt"
              minWidth={180}
            >
              {FONTS.map((f) => (
                <DropdownItem key={f} active={activeFontFamily === f} onSelect={() => { editor.chain().focus().setFontFamily(f).run(); close(); }} style={{ fontFamily: f + ', sans-serif', fontSize: 13 }}>
                  {f}
                </DropdownItem>
              ))}
            </Dropdown>

            {/* Font size */}
            <FontSizeControl
              value={activeFontSize}
              open={openMenu === 'size'}
              onToggle={() => toggle('size')}
              onSelect={(s) => { editor.chain().focus().setFontSize(String(s)).run(); close(); }}
              onApply={(v) => { editor.chain().setFontSize(v).run(); }}
              onFocusEditor={() => setTimeout(() => editor.commands.focus(), 0)}
            />

            <RBtn onClick={growFont}   title="Öka teckenstorlek"><ArrowUp size={12} /></RBtn>
            <RBtn onClick={shrinkFont} title="Minska teckenstorlek"><ArrowDown size={12} /></RBtn>

            <GroupSep />

            <RBtn onClick={() => editor.chain().focus().toggleBold().run()}      active={editor.isActive('bold')}      title="Fet (Ctrl+B)">
              <TextB size={14} />
            </RBtn>
            <RBtn onClick={() => editor.chain().focus().toggleItalic().run()}    active={editor.isActive('italic')}    title="Kursiv (Ctrl+I)">
              <TextItalic size={14} />
            </RBtn>
            <RBtn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="Understruken (Ctrl+U)">
              <TextUnderline size={14} />
            </RBtn>
            <RBtn onClick={() => editor.chain().focus().toggleStrike().run()}    active={editor.isActive('strike')}    title="Genomstruken">
              <TextStrikethrough size={14} />
            </RBtn>

            <InlineSep />

            <RBtn onClick={() => editor.chain().focus().toggleSubscript().run()}   active={editor.isActive('subscript')}   title="Nedsänkt">
              <TextSubscript size={14} />
            </RBtn>
            <RBtn onClick={() => editor.chain().focus().toggleSuperscript().run()} active={editor.isActive('superscript')} title="Upphöjd">
              <TextSuperscript size={14} />
            </RBtn>

            <InlineSep />

            {/* Highlight */}
            <div style={{ position: 'relative' }}>
              <button type="button" onMouseDown={(e) => { e.preventDefault(); toggle('highlight'); }} title="Textmarkering" style={swatchBtnStyle(openMenu === 'highlight')}>
                <HighlighterCircle size={14} />
                <ColorBar color={activeHighlight ?? '#ffff00'} />
              </button>
              {openMenu === 'highlight' && (
                <WordColorPalette
                  active={activeHighlight}
                  onSelect={(c) => { editor.chain().focus().toggleHighlight({ color: c }).run(); close(); }}
                  onClear={() => { editor.chain().focus().unsetHighlight().run(); close(); }}
                  clearLabel="Ingen markering"
                />
              )}
            </div>

            {/* Text color */}
            <div style={{ position: 'relative' }}>
              <button type="button" onMouseDown={(e) => { e.preventDefault(); toggle('color'); }} title="Teckenfärg" style={swatchBtnStyle(openMenu === 'color')}>
                <Palette size={14} />
                <ColorBar color={activeColor} />
              </button>
              {openMenu === 'color' && (
                <WordColorPalette
                  active={activeColor}
                  onSelect={(c) => { editor.chain().focus().setColor(c).run(); close(); }}
                  onClear={() => { editor.chain().focus().unsetColor().run(); close(); }}
                  clearLabel="Automatisk färg"
                />
              )}
            </div>

            {/* Clear formatting */}
            <RBtn onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()} title="Rensa all formatering">
              <Eraser size={14} />
            </RBtn>

            <GroupSep />

            {/* Stycke */}
            <RBtn onClick={() => editor.chain().focus().decreaseIndent().run()} disabled={activeIndent === 0} title="Minska indrag"><TextOutdent size={14} /></RBtn>
            <RBtn onClick={() => editor.chain().focus().increaseIndent().run()} active={activeIndent > 0} title={`Öka indrag — nivå ${activeIndent}`}><TextIndent size={14} /></RBtn>
            <InlineSep />
            <RBtn onClick={() => editor.chain().focus().setTextAlign('left').run()}    active={editor.isActive({ textAlign: 'left' })}    title="Vänster (Ctrl+L)"><TextAlignLeft size={14} /></RBtn>
            <RBtn onClick={() => editor.chain().focus().setTextAlign('center').run()}  active={editor.isActive({ textAlign: 'center' })}  title="Centrera (Ctrl+E)"><TextAlignCenter size={14} /></RBtn>
            <RBtn onClick={() => editor.chain().focus().setTextAlign('right').run()}   active={editor.isActive({ textAlign: 'right' })}   title="Höger (Ctrl+R)"><TextAlignRight size={14} /></RBtn>
            <RBtn onClick={() => editor.chain().focus().setTextAlign('justify').run()} active={editor.isActive({ textAlign: 'justify' })} title="Justera (Ctrl+J)"><TextAlignJustify size={14} /></RBtn>
            <InlineSep />
            <RBtn onClick={() => editor.chain().focus().toggleBulletList().run()}  active={editor.isActive('bulletList')}  title="Punktlista"><ListBullets size={14} /></RBtn>
            <RBtn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Numrerad lista"><ListNumbers size={14} /></RBtn>
            <InlineSep />
            {/* Line spacing dropdown */}
            <div style={{ position: 'relative' }}>
              <RBtn onClick={() => toggle('linespacing')} active={openMenu === 'linespacing' || !!activeLineH} title={`Radavstånd${activeLineH ? `: ${activeLineH}` : ''}`}>
                <LineHeight size={14} />
              </RBtn>
              {openMenu === 'linespacing' && (
                <DropdownPanel minWidth={175}>
                  {LINE_SPACINGS.map(({ label, value }) => (
                    <DropdownItem key={value} active={activeLineH === value} onSelect={() => { editor.chain().focus().setLineHeight(value).run(); close(); }} style={{ fontSize: 13 }}>
                      {label}
                    </DropdownItem>
                  ))}
                  <div className="h-px bg-[var(--border)] my-1" />
                  <DropdownItem active={!activeLineH} onSelect={() => { editor.chain().focus().unsetLineHeight().run(); close(); }} style={{ fontSize: 13, color: 'var(--accent)' }}>
                    Återställ standard
                  </DropdownItem>
                </DropdownPanel>
              )}
            </div>
          </>
        )}

        {/* ══ INFOGA ══════════════════════════════════════════ */}
        {tab === 'infoga' && (
          <>
            <div style={{ position: 'relative' }}>
              <RBtn onClick={() => toggle('table')} active={openMenu === 'table'} title="Infoga tabell">
                <Table size={14} />
                <span className="ml-1 text-[var(--text-2xs)]">Tabell</span>
              </RBtn>
              {openMenu === 'table' && (
                <TablePicker onInsert={(rows, cols) => { editor.chain().focus().insertTable({ rows, cols, withHeaderRow: true }).run(); close(); }} />
              )}
            </div>
            <GroupSep />
            <RBtn onClick={() => fileRef.current?.click()} title="Infoga bild från din dator">
              <PhImage size={14} />
              <span className="ml-1 text-[var(--text-2xs)]">Bild</span>
            </RBtn>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }}
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageFile(f); e.target.value = ''; }}
            />
            <GroupSep />
            <RBtn active={editor.isActive('link')} title="Infoga eller redigera hyperlänk"
              onClick={() => {
                const prev = editor.getAttributes('link').href as string | undefined;
                const url  = window.prompt('Ange URL:', prev ?? 'https://');
                if (url === null) return;
                if (url.trim() === '') editor.chain().focus().unsetLink().run();
                else editor.chain().focus().setLink({ href: url.trim() }).run();
              }}
            >
              <Link size={14} />
              <span className="ml-1 text-[var(--text-2xs)]">Länk</span>
            </RBtn>
            <GroupSep />
            <RBtn onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Infoga horisontell avdelare">
              <PhMinus size={14} />
              <span className="ml-1 text-[var(--text-2xs)]">Avdelare</span>
            </RBtn>
          </>
        )}

        {/* ══ LAYOUT ══════════════════════════════════════════ */}
        {tab === 'layout' && (
          <>
            {/* Tabell */}
            {/* Cell background colour */}
            <div style={{ position: 'relative' }}>
              <button
                type="button"
                onMouseDown={(e) => { e.preventDefault(); if (isInTable) toggle('cellbg'); }}
                title={isInTable ? 'Cellbakgrundsfärg' : 'Placera markören i en tabell'}
                disabled={!isInTable}
                style={swatchBtnStyle(openMenu === 'cellbg', !isInTable)}
              >
                <Palette size={14} />
                <ColorBar color={activeCellBg ?? '#ffffff'} bordered />
              </button>
              {openMenu === 'cellbg' && (
                <WordColorPalette
                  active={activeCellBg}
                  onSelect={(c) => { editor.chain().focus().setCellAttribute('backgroundColor', c).run(); close(); }}
                  onClear={() => { editor.chain().focus().setCellAttribute('backgroundColor', null).run(); close(); }}
                  clearLabel="Ingen bakgrundsfärg"
                />
              )}
            </div>

            <InlineSep />

            {/* Merge / Split */}
            <RBtn disabled={!isInTable || !editor.can().mergeCells()} onClick={() => editor.chain().focus().mergeCells().run()} title="Sammanfoga markerade celler">
              <ArrowsIn size={14} /> <span className="ml-1 text-[var(--text-2xs)]">Samm.</span>
            </RBtn>
            <RBtn disabled={!isInTable || !editor.can().splitCell()} onClick={() => editor.chain().focus().splitCell().run()} title="Dela sammanfogad cell">
              <ArrowsOut size={14} /> <span className="ml-1 text-[var(--text-2xs)]">Dela</span>
            </RBtn>

            <InlineSep />

            {/* Header row toggle */}
            <RBtn disabled={!isInTable} active={editor.isActive('tableHeader')} onClick={() => editor.chain().focus().toggleHeaderRow().run()} title="Växla rubrikrad">
              <Rows size={14} /> <span className="ml-1 text-[var(--text-2xs)]">Rubrik</span>
            </RBtn>

            <InlineSep />

            {/* Row operations */}
            <RBtn disabled={!isInTable} onClick={() => editor.chain().focus().addRowBefore().run()} title="Lägg till rad ovanför">
              <ArrowFatLinesUp size={14} /> <span className="ml-1 text-[var(--text-2xs)]">+rad ↑</span>
            </RBtn>
            <RBtn disabled={!isInTable} onClick={() => editor.chain().focus().addRowAfter().run()} title="Lägg till rad nedanför">
              <ArrowFatLinesDown size={14} /> <span className="ml-1 text-[var(--text-2xs)]">+rad ↓</span>
            </RBtn>
            <RBtn disabled={!isInTable} onClick={() => editor.chain().focus().deleteRow().run()} title="Ta bort rad" style={{ color: !isInTable ? undefined : 'var(--color-red-600)' }}>
              <Rows size={14} style={{ opacity: 0.6 }} />
            </RBtn>

            <InlineSep />

            {/* Column operations */}
            <RBtn disabled={!isInTable} onClick={() => editor.chain().focus().addColumnBefore().run()} title="Lägg till kolumn till vänster">
              <Columns size={14} /> <span className="ml-1 text-[var(--text-2xs)]">+kol ←</span>
            </RBtn>
            <RBtn disabled={!isInTable} onClick={() => editor.chain().focus().addColumnAfter().run()} title="Lägg till kolumn till höger">
              <Columns size={14} /> <span className="ml-1 text-[var(--text-2xs)]">+kol →</span>
            </RBtn>
            <RBtn disabled={!isInTable} onClick={() => editor.chain().focus().deleteColumn().run()} title="Ta bort kolumn" style={{ color: !isInTable ? undefined : 'var(--color-red-600)' }}>
              <Columns size={14} style={{ opacity: 0.6 }} />
            </RBtn>

            <InlineSep />

            {/* Delete table */}
            <RBtn disabled={!isInTable} onClick={() => editor.chain().focus().deleteTable().run()} title="Radera hela tabellen" style={{ color: !isInTable ? undefined : 'var(--color-red-600)' }}>
              <Table size={14} style={{ opacity: 0.6 }} />
            </RBtn>

            <GroupSep />

            {/* Radavstånd */}
            {LINE_SPACINGS.slice(0, 3).map(({ label, value }) => (
              <RBtn key={value} onClick={() => editor.chain().focus().setLineHeight(value).run()} active={activeLineH === value} title={`Radavstånd: ${label}`}>
                <span className="text-[var(--text-2xs)] font-medium">{value}×</span>
              </RBtn>
            ))}
            {LINE_SPACINGS.slice(3).map(({ label, value }) => (
              <RBtn key={value} onClick={() => editor.chain().focus().setLineHeight(value).run()} active={activeLineH === value} title={`Radavstånd: ${label}`}>
                <span className="text-[var(--text-2xs)] font-medium">{value}×</span>
              </RBtn>
            ))}
            <RBtn onClick={() => editor.chain().focus().unsetLineHeight().run()} active={!activeLineH} title="Återställ standardradavstånd">
              <LineHeight size={14} />
            </RBtn>

            <GroupSep />

            {/* Indrag */}
            <RBtn onClick={() => editor.chain().focus().decreaseIndent().run()} disabled={activeIndent === 0} title="Minska indrag"><TextOutdent size={14} /></RBtn>
            <RBtn onClick={() => editor.chain().focus().increaseIndent().run()} active={activeIndent > 0} title="Öka indrag"><TextIndent size={14} /></RBtn>

            <GroupSep />

            {/* Sidhuvud & Sidfot */}
            <RBtn
              active={hf?.activeHeader.enabled}
              onClick={() => hf?.patchActiveHeader({ enabled: !hf.activeHeader.enabled })}
              title={hf?.activeHeader.enabled ? 'Stäng av sidhuvud för denna sida' : 'Aktivera sidhuvud för denna sida'}
            >
              <Layout size={14} />
              <span className="ml-1 text-[var(--text-2xs)]">Sidhuvud</span>
            </RBtn>
            <RBtn
              active={hf?.activeFooter.enabled}
              onClick={() => hf?.patchActiveFooter({ enabled: !hf.activeFooter.enabled })}
              title={hf?.activeFooter.enabled ? 'Stäng av sidfot för denna sida' : 'Aktivera sidfot för denna sida'}
            >
              <Layout size={14} style={{ transform: 'rotate(180deg)' }} />
              <span className="ml-1 text-[var(--text-2xs)]">Sidfot</span>
            </RBtn>
            <InlineSep />
            <RBtn
              active={
                (hf?.activeHeader.enabled && !hf.activeHeader.useDefault) ||
                (hf?.activeFooter.enabled && !hf.activeFooter.useDefault)
              }
              disabled={!hf?.activeHeader.enabled && !hf?.activeFooter.enabled}
              onClick={() => {
                if (!hf) return;
                const newVal = !hf.activeHeader.useDefault;
                hf.patchActiveHeader({ useDefault: newVal });
                hf.patchActiveFooter({ useDefault: newVal });
              }}
              title="Unik sidhuvud/sidfot för denna sida (ej standard)"
            >
              <FrameCorners size={14} />
              <span className="ml-1 text-[var(--text-2xs)]">Unik sida</span>
            </RBtn>
          </>
        )}
      </div>
    </div>
  );
}

// ── Word-like colour palette ──────────────────────────────────────────────────
// Theme grid (60 swatches: 6 rows × 10 cols) + standard colors + hex input

function WordColorPalette({ active, onSelect, onClear, clearLabel }: {
  active?: string;
  onSelect: (c: string) => void;
  onClear: () => void;
  clearLabel: string;
}) {
  const [hexVal, setHexVal] = useState('');
  const norm = active?.toLowerCase();

  const applyHex = () => {
    const full = '#' + hexVal;
    if (/^#[0-9A-Fa-f]{6}$/.test(full)) { onSelect(full); setHexVal(''); }
  };

  const swatch = (color: string, key: string | number) => {
    const isActive = color.toLowerCase() === norm;
    return (
      <button
        key={key}
        type="button"
        onMouseDown={(e) => { e.preventDefault(); onSelect(color); }}
        title={color}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.outline = '2px solid #0078d4'; (e.currentTarget as HTMLElement).style.outlineOffset = '1px'; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.outline = isActive ? '2px solid #0078d4' : 'none'; (e.currentTarget as HTMLElement).style.outlineOffset = '1px'; }}
        style={{
          width: 18, height: 18, background: color,
          border: '1px solid rgba(0,0,0,0.15)',
          outline: isActive ? '2px solid #0078d4' : 'none',
          outlineOffset: 1,
          borderRadius: 1, cursor: 'pointer', padding: 0,
        }}
      />
    );
  };

  return (
    <div className="absolute top-full left-0 mt-1 bg-[var(--surface-0)] border border-[var(--border)] shadow-elevated rounded-lg p-3 z-[400] min-w-[230px]">
      {/* Theme colours */}
      <p className="text-[10px] text-[var(--text-muted)] font-semibold mb-1.5">Temafärger</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 18px)', gap: 2, marginBottom: 10 }}>
        {THEME_GRID.map((c, i) => swatch(c, i))}
      </div>

      {/* Standard colours */}
      <p className="text-[10px] text-[var(--text-muted)] font-semibold mb-1.5">Standardfärger</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 18px)', gap: 2, marginBottom: 10 }}>
        {STANDARD_COLORS.map((c) => swatch(c, c))}
      </div>

      <div className="h-px bg-[var(--border)] my-2" />

      {/* Hex input */}
      <div className="flex items-center gap-1.5 mb-2">
        <span className="text-[11px] text-[var(--text-muted)] font-mono">#</span>
        <input
          type="text"
          maxLength={6}
          placeholder="RRGGBB"
          value={hexVal}
          onMouseDown={(e) => e.stopPropagation()}
          onChange={(e) => setHexVal(e.target.value.replace(/[^0-9A-Fa-f]/g, '').toUpperCase())}
          onKeyDown={(e) => { e.stopPropagation(); if (e.key === 'Enter') applyHex(); }}
          className="flex-1 h-6 px-2 text-[11px] font-mono bg-[var(--surface-0)] border border-[var(--border)] rounded text-[var(--text-primary)] outline-none focus:border-[var(--accent)] tracking-wider"
        />
        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); applyHex(); }}
          title="Använd hex-färg"
          className={cn(
            'h-6 px-2 text-[11px] rounded transition-colors border-none cursor-pointer',
            hexVal.length === 6
              ? 'bg-[var(--accent)] text-white'
              : 'bg-[var(--surface-3)] text-[var(--text-muted)] cursor-default'
          )}
        >
          OK
        </button>
      </div>

      {/* Active hex display */}
      {active && (
        <div className="flex items-center gap-1.5 mb-2 text-[10px] text-[var(--text-muted)] font-mono">
          <div style={{ width: 14, height: 14, background: active, borderRadius: 2, border: '1px solid rgba(0,0,0,0.15)' }} />
          {active.toUpperCase()}
        </div>
      )}

      {/* Clear */}
      <button
        type="button"
        onMouseDown={(e) => { e.preventDefault(); onClear(); }}
        className="block w-full text-center py-1.5 text-[11px] text-[var(--accent)] bg-none border-none cursor-pointer border-t border-[var(--border)] hover:bg-[var(--accent-subtle)] rounded transition-colors"
      >
        {clearLabel}
      </button>
    </div>
  );
}

// ── Font size control ─────────────────────────────────────────────────────────

function FontSizeControl({ value, open, onToggle, onSelect, onApply, onFocusEditor }: {
  value: string; open: boolean; onToggle: () => void;
  onSelect: (s: number) => void; onApply: (v: string) => void; onFocusEditor: () => void;
}) {
  return (
    <div className="relative flex">
      <input
        key={value}
        type="text"
        defaultValue={value}
        title="Teckenstorlek — tryck Enter för att tillämpa"
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => { e.stopPropagation(); (e.currentTarget as HTMLInputElement).select(); }}
        onKeyDown={(e) => {
          e.stopPropagation();
          if (e.key === 'Enter') { const v = (e.currentTarget as HTMLInputElement).value; if (v && Number(v) >= 1) { onApply(v); onFocusEditor(); } e.preventDefault(); }
          else if (e.key === 'Escape') onFocusEditor();
        }}
        onBlur={(e) => { const v = e.currentTarget.value; if (v && Number(v) >= 1) onApply(v); }}
        className="w-9 h-7 px-1 text-xs text-center bg-[var(--surface-0)] border border-r-0 border-[var(--border)] rounded-l text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
        style={{ borderRight: 'none' }}
      />
      <button type="button" onMouseDown={(e) => { e.preventDefault(); onToggle(); }} title="Vanliga storlekar"
        className={cn(
          'w-4 h-7 flex items-center justify-center border rounded-r cursor-pointer p-0 shrink-0',
          open
            ? 'bg-[var(--accent-subtle)] border-[var(--accent)]'
            : 'bg-[var(--surface-3)] border-[var(--border)]'
        )}>
        <CaretDown size={8} />
      </button>
      {open && (
        <DropdownPanel minWidth={70}>
          {FONT_SIZES.map((s) => (
            <DropdownItem key={s} active={value === String(s)} onSelect={() => onSelect(s)} style={{ fontSize: 13, textAlign: 'center' }}>
              {s}
            </DropdownItem>
          ))}
        </DropdownPanel>
      )}
    </div>
  );
}

// ── Table hover-grid picker ───────────────────────────────────────────────────

function TablePicker({ onInsert }: { onInsert: (rows: number, cols: number) => void }) {
  const [hovered, setHovered] = useState({ r: 0, c: 0 });
  const MAX = 8;
  return (
    <div className="absolute top-full left-0 mt-1 bg-[var(--surface-0)] border border-[var(--border)] shadow-elevated rounded-lg p-3 z-[300]">
      <p className="text-center mb-2 text-xs text-[var(--text-primary)]">
        {hovered.r > 0 ? `${hovered.c} × ${hovered.r}` : 'Markera tabellstorlek'}
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${MAX}, 18px)`, gap: 2 }} onMouseLeave={() => setHovered({ r: 0, c: 0 })}>
        {Array.from({ length: MAX * MAX }, (_, i) => {
          const row = Math.floor(i / MAX) + 1;
          const col = (i % MAX) + 1;
          const on  = row <= hovered.r && col <= hovered.c;
          return (
            <div key={i} onMouseEnter={() => setHovered({ r: row, c: col })} onMouseDown={(e) => { e.preventDefault(); onInsert(row, col); }} title={`${col}×${row}`}
              style={{ width: 18, height: 18, cursor: 'pointer', background: on ? 'var(--accent-subtle)' : 'var(--surface-0)', border: `1px solid ${on ? 'var(--accent-border)' : 'var(--border)'}`, borderRadius: 2 }}
            />
          );
        })}
      </div>
      <p className="text-center mt-1.5 text-[10px] text-[var(--text-muted)]">Klicka för att infoga</p>
    </div>
  );
}

// ── Building blocks ───────────────────────────────────────────────────────────

function ColorBar({ color, bordered }: { color: string; bordered?: boolean }) {
  return <div style={{ width: 14, height: 3, background: color, borderRadius: 1, border: bordered ? '1px solid rgba(0,0,0,0.15)' : 'none' }} />;
}

function swatchBtnStyle(active: boolean, disabled = false): React.CSSProperties {
  return {
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    width: 28, height: 28, padding: '2px 4px', gap: 1,
    background: active ? 'var(--accent-subtle)' : 'transparent',
    border: active ? '1px solid var(--accent-border)' : '1px solid transparent',
    borderRadius: 4, cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.4 : 1,
  };
}

function GroupSep() {
  return <div className="w-px h-5 bg-[var(--border)] mx-1 self-center shrink-0" />;
}
function InlineSep() {
  return <div className="w-px h-4 bg-[var(--border)] mx-0.5 self-center shrink-0" />;
}

function RBtn({ onClick, active, disabled, title, children, style }: {
  onClick: () => void; active?: boolean; disabled?: boolean;
  title?: string; children: React.ReactNode; style?: React.CSSProperties;
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      disabled={disabled}
      title={title}
      className={cn(
        'flex items-center justify-center h-7 px-2 rounded text-[var(--text-2xs)] font-medium border transition-colors shrink-0',
        active
          ? 'bg-[var(--accent-subtle)] text-[var(--accent)] border-[var(--accent-border)]'
          : 'text-[var(--text-primary)] hover:bg-[var(--surface-active)] border-transparent',
        disabled && 'opacity-40 cursor-not-allowed'
      )}
      style={style}
    >
      {children}
    </button>
  );
}

function Dropdown({ open, onToggle, trigger, triggerTitle, children, minWidth }: {
  open: boolean; onToggle: () => void; trigger: React.ReactNode;
  triggerTitle?: string; children: React.ReactNode; minWidth?: number;
}) {
  return (
    <div className="relative">
      <button type="button" onMouseDown={(e) => { e.preventDefault(); onToggle(); }} title={triggerTitle}
        className={cn(
          'flex items-center gap-1 px-2 h-7 border rounded text-[var(--text-2xs)] cursor-pointer transition-colors',
          open
            ? 'bg-[var(--accent-subtle)] border-[var(--accent-border)] text-[var(--accent)]'
            : 'bg-[var(--surface-0)] border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--surface-active)]'
        )}
      >
        {trigger}
        <CaretDown size={9} />
      </button>
      {open && <DropdownPanel minWidth={minWidth}>{children}</DropdownPanel>}
    </div>
  );
}

function DropdownPanel({ children, minWidth }: { children: React.ReactNode; minWidth?: number }) {
  return (
    <div className="absolute top-full left-0 mt-1 bg-[var(--surface-0)] border border-[var(--border)] shadow-elevated rounded-lg z-[300] max-h-72 overflow-y-auto" style={{ minWidth: minWidth ?? 160 }}>
      {children}
    </div>
  );
}

function DropdownItem({ children, active, onSelect, style }: {
  children: React.ReactNode; active: boolean; onSelect: () => void; style?: React.CSSProperties;
}) {
  return (
    <button type="button" onMouseDown={(e) => { e.preventDefault(); onSelect(); }}
      className={cn(
        'block w-full text-left px-3 py-1.5 text-xs border-none cursor-pointer transition-colors',
        active ? 'bg-[var(--accent-subtle)] text-[var(--accent)]' : 'text-[var(--text-primary)] hover:bg-[var(--surface-active)]'
      )}
      style={style}
    >
      {children}
    </button>
  );
}

// ── Icons (legacy SVGs removed — using @phosphor-icons/react) ─────────────────

const _unusedSv  = {}; // kept to avoid refactoring references


