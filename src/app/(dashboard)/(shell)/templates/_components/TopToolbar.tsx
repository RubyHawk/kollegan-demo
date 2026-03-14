'use client';

/**
 * TopToolbar — Word/Office 365-style tabbed ribbon.
 *
 * Tabs: Hem (Home) | Infoga (Insert) | Layout
 */

import { useRef, useState, useCallback, useEffect } from 'react';
import { useTemplateEditor } from './editor-context';

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
  'Calibri', 'Arial', 'Arial Black', 'Comic Sans MS',
  'Courier New', 'Georgia', 'Impact', 'Palatino Linotype',
  'Times New Roman', 'Trebuchet MS', 'Verdana',
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
      style={{ background: '#f3f2f1', borderBottom: '1px solid #d2d0ce', userSelect: 'none' }}
      onMouseDown={(e) => {
        const tag = (e.target as HTMLElement).tagName;
        if (tag !== 'INPUT') e.preventDefault();
      }}
    >
      {/* ── Tab strip ──────────────────────────────────────────── */}
      <div style={{ display: 'flex', borderBottom: '1px solid #d2d0ce', padding: '0 4px', background: '#f3f2f1' }}>
        {(['hem', 'infoga', 'layout'] as const).map((t) => {
          const labels: Record<string, string> = { hem: 'Hem', infoga: 'Infoga', layout: 'Layout' };
          const on = tab === t;
          return (
            <button
              key={t}
              type="button"
              onMouseDown={(e) => { e.preventDefault(); setTab(t); close(); }}
              style={{
                padding: '5px 14px', fontSize: 12,
                fontFamily: 'Calibri, Arial, sans-serif',
                background: on ? '#f3f2f1' : 'transparent', border: 'none',
                borderBottom: on ? '2px solid #0078d4' : '2px solid transparent',
                color: on ? '#0078d4' : '#323130', fontWeight: on ? 600 : 400, cursor: 'pointer',
              }}
            >
              {labels[t]}
            </button>
          );
        })}
      </div>

      {/* ── Ribbon content ─────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'stretch', padding: '4px 6px', gap: 6, flexWrap: 'wrap', minHeight: 58 }}>

        {/* ══ HEM ══════════════════════════════════════════════ */}
        {tab === 'hem' && (
          <>
            {/* Urklipp */}
            <RibbonGroup label="Urklipp">
              <RBtn onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Ångra (Ctrl+Z)"><UndoIcon /></RBtn>
              <RBtn onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Gör om (Ctrl+Y)"><RedoIcon /></RBtn>
            </RibbonGroup>

            <GroupSep />

            {/* Styckeformat */}
            <RibbonGroup label="Format">
              <Dropdown
                open={openMenu === 'style'}
                onToggle={() => toggle('style')}
                trigger={
                  <span style={{ fontSize: 12, fontFamily: 'Calibri, Arial, sans-serif', minWidth: 96, textAlign: 'left', color: '#1e1e1e' }}>
                    {activeStyle}
                  </span>
                }
                triggerTitle="Styckeformat"
                minWidth={200}
              >
                {styleEntries.map(({ label, ps, action }) => (
                  <DropdownItem key={label} active={activeStyle === label} onSelect={() => { action(); close(); }} style={{ ...ps, fontFamily: 'Calibri, Arial, sans-serif', lineHeight: 1.4 }}>
                    {label}
                  </DropdownItem>
                ))}
              </Dropdown>
            </RibbonGroup>

            <GroupSep />

            {/* Teckensnitt */}
            <RibbonGroup label="Teckensnitt">
              {/* Font family */}
              <Dropdown
                open={openMenu === 'font'}
                onToggle={() => toggle('font')}
                trigger={
                  <span style={{ fontSize: 12, fontFamily: activeFontFamily + ', sans-serif', minWidth: 110, maxWidth: 130, textAlign: 'left', color: '#1e1e1e', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
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

              <RBtn onClick={growFont}   title="Öka teckenstorlek"><GrowIcon /></RBtn>
              <RBtn onClick={shrinkFont} title="Minska teckenstorlek"><ShrinkIcon /></RBtn>

              <InlineSep />

              <RBtn onClick={() => editor.chain().focus().toggleBold().run()}      active={editor.isActive('bold')}      title="Fet (Ctrl+B)">
                <span style={{ fontWeight: 700, fontFamily: 'Georgia, serif', fontSize: 13, lineHeight: 1 }}>B</span>
              </RBtn>
              <RBtn onClick={() => editor.chain().focus().toggleItalic().run()}    active={editor.isActive('italic')}    title="Kursiv (Ctrl+I)">
                <span style={{ fontStyle: 'italic', fontFamily: 'Georgia, serif', fontSize: 13, lineHeight: 1 }}>I</span>
              </RBtn>
              <RBtn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="Understruken (Ctrl+U)">
                <span style={{ textDecoration: 'underline', fontSize: 13, lineHeight: 1 }}>U</span>
              </RBtn>
              <RBtn onClick={() => editor.chain().focus().toggleStrike().run()}    active={editor.isActive('strike')}    title="Genomstruken">
                <span style={{ textDecoration: 'line-through', fontSize: 13, lineHeight: 1 }}>S</span>
              </RBtn>

              <InlineSep />

              <RBtn onClick={() => editor.chain().focus().toggleSubscript().run()}   active={editor.isActive('subscript')}   title="Nedsänkt">
                <span style={{ fontSize: 11, lineHeight: 1 }}>x<sub style={{ fontSize: 8 }}>2</sub></span>
              </RBtn>
              <RBtn onClick={() => editor.chain().focus().toggleSuperscript().run()} active={editor.isActive('superscript')} title="Upphöjd">
                <span style={{ fontSize: 11, lineHeight: 1 }}>x<sup style={{ fontSize: 8 }}>2</sup></span>
              </RBtn>

              <InlineSep />

              {/* Highlight */}
              <div style={{ position: 'relative' }}>
                <button type="button" onMouseDown={(e) => { e.preventDefault(); toggle('highlight'); }} title="Textmarkering" style={swatchBtnStyle(openMenu === 'highlight')}>
                  <HighlightIcon />
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
                  <span style={{ fontWeight: 700, fontFamily: 'Georgia, serif', fontSize: 13, lineHeight: 1, color: '#1e1e1e' }}>A</span>
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
                <ClearIcon />
              </RBtn>
            </RibbonGroup>

            <GroupSep />

            {/* Stycke */}
            <RibbonGroup label="Stycke">
              <RBtn onClick={() => editor.chain().focus().decreaseIndent().run()} disabled={activeIndent === 0} title="Minska indrag"><IndentDecIcon /></RBtn>
              <RBtn onClick={() => editor.chain().focus().increaseIndent().run()} active={activeIndent > 0} title={`Öka indrag — nivå ${activeIndent}`}><IndentIncIcon /></RBtn>
              <InlineSep />
              <RBtn onClick={() => editor.chain().focus().setTextAlign('left').run()}    active={editor.isActive({ textAlign: 'left' })}    title="Vänster (Ctrl+L)"><AlignLeftIcon /></RBtn>
              <RBtn onClick={() => editor.chain().focus().setTextAlign('center').run()}  active={editor.isActive({ textAlign: 'center' })}  title="Centrera (Ctrl+E)"><AlignCenterIcon /></RBtn>
              <RBtn onClick={() => editor.chain().focus().setTextAlign('right').run()}   active={editor.isActive({ textAlign: 'right' })}   title="Höger (Ctrl+R)"><AlignRightIcon /></RBtn>
              <RBtn onClick={() => editor.chain().focus().setTextAlign('justify').run()} active={editor.isActive({ textAlign: 'justify' })} title="Justera (Ctrl+J)"><AlignJustifyIcon /></RBtn>
              <InlineSep />
              <RBtn onClick={() => editor.chain().focus().toggleBulletList().run()}  active={editor.isActive('bulletList')}  title="Punktlista"><BulletListIcon /></RBtn>
              <RBtn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Numrerad lista"><OrderedListIcon /></RBtn>
              <InlineSep />
              {/* Line spacing dropdown */}
              <div style={{ position: 'relative' }}>
                <RBtn onClick={() => toggle('linespacing')} active={openMenu === 'linespacing' || !!activeLineH} title={`Radavstånd${activeLineH ? `: ${activeLineH}` : ''}`}>
                  <LineSpacingIcon />
                </RBtn>
                {openMenu === 'linespacing' && (
                  <DropdownPanel minWidth={175}>
                    {LINE_SPACINGS.map(({ label, value }) => (
                      <DropdownItem key={value} active={activeLineH === value} onSelect={() => { editor.chain().focus().setLineHeight(value).run(); close(); }} style={{ fontSize: 13, fontFamily: 'Calibri, Arial, sans-serif' }}>
                        {label}
                      </DropdownItem>
                    ))}
                    <div style={{ height: 1, background: '#d2d0ce', margin: '4px 0' }} />
                    <DropdownItem active={!activeLineH} onSelect={() => { editor.chain().focus().unsetLineHeight().run(); close(); }} style={{ fontSize: 13, color: '#0078d4' }}>
                      Återställ standard
                    </DropdownItem>
                  </DropdownPanel>
                )}
              </div>
            </RibbonGroup>
          </>
        )}

        {/* ══ INFOGA ══════════════════════════════════════════ */}
        {tab === 'infoga' && (
          <>
            <RibbonGroup label="Tabeller">
              <div style={{ position: 'relative' }}>
                <BigBtn icon={<TableIcon big />} label="Tabell" title="Infoga tabell" active={openMenu === 'table'} onClick={() => toggle('table')} />
                {openMenu === 'table' && (
                  <TablePicker onInsert={(rows, cols) => { editor.chain().focus().insertTable({ rows, cols, withHeaderRow: true }).run(); close(); }} />
                )}
              </div>
            </RibbonGroup>
            <GroupSep />
            <RibbonGroup label="Bild">
              <BigBtn icon={<ImageIcon big />} label="Bild" title="Infoga bild från din dator" onClick={() => fileRef.current?.click()} />
              <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }}
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageFile(f); e.target.value = ''; }}
              />
            </RibbonGroup>
            <GroupSep />
            <RibbonGroup label="Länkar">
              <BigBtn icon={<LinkIcon big />} label="Länk" title="Infoga eller redigera hyperlänk" active={editor.isActive('link')}
                onClick={() => {
                  const prev = editor.getAttributes('link').href as string | undefined;
                  const url  = window.prompt('Ange URL:', prev ?? 'https://');
                  if (url === null) return;
                  if (url.trim() === '') editor.chain().focus().unsetLink().run();
                  else editor.chain().focus().setLink({ href: url.trim() }).run();
                }}
              />
            </RibbonGroup>
            <GroupSep />
            <RibbonGroup label="Text">
              <BigBtn icon={<HrIcon big />} label="Avdelare" title="Infoga horisontell avdelare" onClick={() => editor.chain().focus().setHorizontalRule().run()} />
            </RibbonGroup>
          </>
        )}

        {/* ══ LAYOUT ══════════════════════════════════════════ */}
        {tab === 'layout' && (
          <>
            {/* Tabell ─────────────────────────────────────── */}
            <RibbonGroup label="Tabell">
              {/* Cell background colour */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                <div style={{ fontSize: 9, color: isInTable ? '#323130' : '#a19f9d', fontFamily: 'Calibri, sans-serif', marginBottom: 2 }}>Cellbakgrund</div>
                <div style={{ position: 'relative' }}>
                  <button
                    type="button"
                    onMouseDown={(e) => { e.preventDefault(); if (isInTable) toggle('cellbg'); }}
                    title={isInTable ? 'Cellbakgrundsfärg' : 'Placera markören i en tabell'}
                    disabled={!isInTable}
                    style={swatchBtnStyle(openMenu === 'cellbg', !isInTable)}
                  >
                    <FillIcon />
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
              </div>

              <InlineSep />

              {/* Merge / Split */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <RBtn disabled={!isInTable || !editor.can().mergeCells()} onClick={() => editor.chain().focus().mergeCells().run()} title="Sammanfoga markerade celler">
                  <MergeIcon /> <span style={{ fontSize: 10, marginLeft: 2 }}>Samm.</span>
                </RBtn>
                <RBtn disabled={!isInTable || !editor.can().splitCell()} onClick={() => editor.chain().focus().splitCell().run()} title="Dela sammanfogad cell">
                  <SplitIcon /> <span style={{ fontSize: 10, marginLeft: 2 }}>Dela</span>
                </RBtn>
              </div>

              <InlineSep />

              {/* Header row toggle */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <RBtn disabled={!isInTable} active={editor.isActive('tableHeader')} onClick={() => editor.chain().focus().toggleHeaderRow().run()} title="Växla rubrikrad">
                  <HeaderRowIcon /> <span style={{ fontSize: 10, marginLeft: 2 }}>Rubrik</span>
                </RBtn>
              </div>

              <InlineSep />

              {/* Row operations */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <RBtn disabled={!isInTable} onClick={() => editor.chain().focus().addRowBefore().run()} title="Lägg till rad ovanför">
                  <AddRowAboveIcon /> <span style={{ fontSize: 10, marginLeft: 2 }}>+rad ↑</span>
                </RBtn>
                <RBtn disabled={!isInTable} onClick={() => editor.chain().focus().addRowAfter().run()} title="Lägg till rad nedanför">
                  <AddRowBelowIcon /> <span style={{ fontSize: 10, marginLeft: 2 }}>+rad ↓</span>
                </RBtn>
              </div>
              <RBtn disabled={!isInTable} onClick={() => editor.chain().focus().deleteRow().run()} title="Ta bort rad" style={{ color: !isInTable ? undefined : '#c00000' }}>
                <DeleteRowIcon />
              </RBtn>

              <InlineSep />

              {/* Column operations */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <RBtn disabled={!isInTable} onClick={() => editor.chain().focus().addColumnBefore().run()} title="Lägg till kolumn till vänster">
                  <AddColLeftIcon /> <span style={{ fontSize: 10, marginLeft: 2 }}>+kol ←</span>
                </RBtn>
                <RBtn disabled={!isInTable} onClick={() => editor.chain().focus().addColumnAfter().run()} title="Lägg till kolumn till höger">
                  <AddColRightIcon /> <span style={{ fontSize: 10, marginLeft: 2 }}>+kol →</span>
                </RBtn>
              </div>
              <RBtn disabled={!isInTable} onClick={() => editor.chain().focus().deleteColumn().run()} title="Ta bort kolumn" style={{ color: !isInTable ? undefined : '#c00000' }}>
                <DeleteColIcon />
              </RBtn>

              <InlineSep />

              {/* Delete table */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                <div style={{ fontSize: 9, color: isInTable ? '#c00000' : '#a19f9d', fontFamily: 'Calibri, sans-serif', marginBottom: 2 }}>Radera</div>
                <RBtn disabled={!isInTable} onClick={() => editor.chain().focus().deleteTable().run()} title="Radera hela tabellen" style={{ color: !isInTable ? undefined : '#c00000' }}>
                  <DeleteTableIcon />
                </RBtn>
              </div>

            </RibbonGroup>

            <GroupSep />

            {/* Radavstånd ─────────────────────────────────── */}
            <RibbonGroup label="Radavstånd">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <div style={{ display: 'flex', gap: 2 }}>
                  {LINE_SPACINGS.slice(0, 3).map(({ label, value }) => (
                    <RBtn key={value} onClick={() => editor.chain().focus().setLineHeight(value).run()} active={activeLineH === value} title={`Radavstånd: ${label}`} style={{ fontSize: 11, minWidth: 34, padding: '0 4px' }}>
                      {value}×
                    </RBtn>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 2 }}>
                  {LINE_SPACINGS.slice(3).map(({ label, value }) => (
                    <RBtn key={value} onClick={() => editor.chain().focus().setLineHeight(value).run()} active={activeLineH === value} title={`Radavstånd: ${label}`} style={{ fontSize: 11, minWidth: 34, padding: '0 4px' }}>
                      {value}×
                    </RBtn>
                  ))}
                  <RBtn onClick={() => editor.chain().focus().unsetLineHeight().run()} active={!activeLineH} title="Återställ standardradavstånd">
                    <ResetIcon />
                  </RBtn>
                </div>
              </div>
            </RibbonGroup>

            <GroupSep />

            {/* Indrag ─────────────────────────────────────── */}
            <RibbonGroup label="Indrag">
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                <div style={{ display: 'flex', gap: 2 }}>
                  <RBtn onClick={() => editor.chain().focus().decreaseIndent().run()} disabled={activeIndent === 0} title="Minska indrag"><IndentDecIcon /></RBtn>
                  <RBtn onClick={() => editor.chain().focus().increaseIndent().run()} active={activeIndent > 0} title="Öka indrag"><IndentIncIcon /></RBtn>
                </div>
                <span style={{ fontSize: 10, color: activeIndent > 0 ? '#0078d4' : '#a19f9d', fontFamily: 'Calibri, sans-serif' }}>
                  {activeIndent > 0 ? `Nivå ${activeIndent}` : 'Ingen'}
                </span>
              </div>
            </RibbonGroup>
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
    <div style={{
      position: 'absolute', top: '100%', left: 0, marginTop: 2,
      background: '#fff', border: '1px solid #d2d0ce',
      boxShadow: '0 4px 20px rgba(0,0,0,0.18)', zIndex: 400,
      padding: '10px 12px', borderRadius: 3, minWidth: 230,
    }}>
      {/* Theme colours */}
      <p style={{ fontSize: 10, color: '#605e5c', margin: '0 0 5px 0', fontFamily: 'Calibri, sans-serif', fontWeight: 600 }}>Temafärger</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 18px)', gap: 2, marginBottom: 10 }}>
        {THEME_GRID.map((c, i) => swatch(c, i))}
      </div>

      {/* Standard colours */}
      <p style={{ fontSize: 10, color: '#605e5c', margin: '0 0 5px 0', fontFamily: 'Calibri, sans-serif', fontWeight: 600 }}>Standardfärger</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 18px)', gap: 2, marginBottom: 10 }}>
        {STANDARD_COLORS.map((c) => swatch(c, c))}
      </div>

      <div style={{ height: 1, background: '#e8e6e3', margin: '4px 0 8px' }} />

      {/* Hex input */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 8 }}>
        <span style={{ fontSize: 12, color: '#605e5c', fontFamily: 'monospace' }}>#</span>
        <input
          type="text"
          maxLength={6}
          placeholder="RRGGBB"
          value={hexVal}
          onMouseDown={(e) => e.stopPropagation()}
          onChange={(e) => setHexVal(e.target.value.replace(/[^0-9A-Fa-f]/g, '').toUpperCase())}
          onKeyDown={(e) => { e.stopPropagation(); if (e.key === 'Enter') applyHex(); }}
          style={{
            flex: 1, height: 24, padding: '0 6px', fontSize: 12,
            border: '1px solid #d2d0ce', borderRadius: 2,
            fontFamily: 'monospace', background: '#fff', color: '#1e1e1e',
            outline: 'none', letterSpacing: '0.05em',
          }}
          onFocus={(e) => { (e.currentTarget as HTMLElement).style.borderColor = '#0078d4'; }}
          onBlur={(e)  => { (e.currentTarget as HTMLElement).style.borderColor = '#d2d0ce'; }}
        />
        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); applyHex(); }}
          title="Använd hex-färg"
          style={{
            height: 24, padding: '0 10px', fontSize: 11,
            background: hexVal.length === 6 ? '#0078d4' : '#e8e6e3',
            color: hexVal.length === 6 ? '#fff' : '#a19f9d',
            border: 'none', borderRadius: 2, cursor: hexVal.length === 6 ? 'pointer' : 'default',
            fontFamily: 'Calibri, sans-serif', transition: 'background 0.1s',
          }}
        >
          OK
        </button>
      </div>

      {/* Active hex display */}
      {active && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, fontSize: 10, color: '#605e5c', fontFamily: 'monospace' }}>
          <div style={{ width: 14, height: 14, background: active, border: '1px solid #d2d0ce', borderRadius: 1 }} />
          {active.toUpperCase()}
        </div>
      )}

      {/* Clear */}
      <button
        type="button"
        onMouseDown={(e) => { e.preventDefault(); onClear(); }}
        style={{
          display: 'block', width: '100%', textAlign: 'center', padding: '5px 0',
          fontSize: 11, color: '#0078d4', background: 'none', border: 'none',
          cursor: 'pointer', fontFamily: 'Calibri, sans-serif',
          borderTop: '1px solid #e8e6e3',
        }}
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
    <div style={{ position: 'relative', display: 'flex' }}>
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
        onFocus={(e) => { (e.currentTarget as HTMLElement).style.borderColor = '#0078d4'; }}
        style={{ width: 38, height: 26, padding: '0 4px', fontSize: 12, border: open ? '1px solid #0078d4' : '1px solid #d2d0ce', borderRight: 'none', borderRadius: '2px 0 0 2px', fontFamily: 'Calibri, Arial, sans-serif', background: '#fff', color: '#1e1e1e', outline: 'none', textAlign: 'center' }}
      />
      <button type="button" onMouseDown={(e) => { e.preventDefault(); onToggle(); }} title="Vanliga storlekar"
        style={{ width: 18, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', background: open ? '#ddeeff' : '#f3f2f1', border: open ? '1px solid #0078d4' : '1px solid #d2d0ce', borderRadius: '0 2px 2px 0', cursor: 'pointer', padding: 0, flexShrink: 0 }}>
        <ChevronIcon />
      </button>
      {open && (
        <DropdownPanel minWidth={70}>
          {FONT_SIZES.map((s) => (
            <DropdownItem key={s} active={value === String(s)} onSelect={() => onSelect(s)} style={{ fontSize: 13, fontFamily: 'Calibri, Arial, sans-serif', textAlign: 'center' }}>
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
    <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: 2, background: '#fff', border: '1px solid #d2d0ce', boxShadow: '0 4px 16px rgba(0,0,0,0.15)', zIndex: 300, padding: '10px', borderRadius: 2 }}>
      <p style={{ textAlign: 'center', marginBottom: 8, fontSize: 12, fontFamily: 'Calibri, Arial, sans-serif', color: '#323130' }}>
        {hovered.r > 0 ? `${hovered.c} × ${hovered.r}` : 'Markera tabellstorlek'}
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${MAX}, 18px)`, gap: 2 }} onMouseLeave={() => setHovered({ r: 0, c: 0 })}>
        {Array.from({ length: MAX * MAX }, (_, i) => {
          const row = Math.floor(i / MAX) + 1;
          const col = (i % MAX) + 1;
          const on  = row <= hovered.r && col <= hovered.c;
          return (
            <div key={i} onMouseEnter={() => setHovered({ r: row, c: col })} onMouseDown={(e) => { e.preventDefault(); onInsert(row, col); }} title={`${col}×${row}`}
              style={{ width: 18, height: 18, cursor: 'pointer', background: on ? '#ddeeff' : '#fff', border: `1px solid ${on ? '#c0d8f0' : '#d2d0ce'}`, borderRadius: 1 }}
            />
          );
        })}
      </div>
      <p style={{ textAlign: 'center', marginTop: 6, fontSize: 10, color: '#a19f9d', fontFamily: 'Calibri, Arial, sans-serif' }}>Klicka för att infoga</p>
    </div>
  );
}

// ── Building blocks ───────────────────────────────────────────────────────────

function ColorBar({ color, bordered }: { color: string; bordered?: boolean }) {
  return <div style={{ width: 14, height: 3, background: color, borderRadius: 1, border: bordered ? '1px solid #d2d0ce' : 'none' }} />;
}

function swatchBtnStyle(active: boolean, disabled = false): React.CSSProperties {
  return {
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    width: 28, height: 26, padding: '2px 4px', gap: 1,
    background: active ? '#ddeeff' : 'transparent',
    border: active ? '1px solid #c0d8f0' : '1px solid transparent',
    borderRadius: 2, cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.4 : 1,
  };
}

function RibbonGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 2, flex: 1, paddingBottom: 2 }}>
        {children}
      </div>
      <p style={{ fontSize: 9, textAlign: 'center', color: '#a19f9d', fontFamily: 'Calibri, Arial, sans-serif', borderTop: '1px solid #e8e6e3', paddingTop: 2, margin: 0 }}>
        {label}
      </p>
    </div>
  );
}

function GroupSep() {
  return <div style={{ width: 1, alignSelf: 'stretch', background: '#d2d0ce', margin: '0 2px', flexShrink: 0 }} />;
}
function InlineSep() {
  return <div style={{ width: 1, height: 20, background: '#d2d0ce', margin: '0 1px', alignSelf: 'center', flexShrink: 0 }} />;
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
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minWidth: 28, height: 26,
        background: active ? '#ddeeff' : 'transparent',
        border: active ? '1px solid #c0d8f0' : '1px solid transparent',
        color: active ? '#004e8c' : '#1e1e1e',
        borderRadius: 2, cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.4 : 1, flexShrink: 0, padding: '0 4px',
        transition: 'background 0.08s, border-color 0.08s',
        ...style,
      }}
      onMouseEnter={(e) => { if (!active && !disabled) (e.currentTarget as HTMLElement).style.background = '#e8e6e3'; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = active ? '#ddeeff' : 'transparent'; }}
    >
      {children}
    </button>
  );
}

function BigBtn({ icon, label, onClick, active, title }: {
  icon: React.ReactNode; label: string; onClick: () => void; active?: boolean; title?: string;
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      title={title ?? label}
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, padding: '4px 10px', minWidth: 50, height: 50, background: active ? '#ddeeff' : 'transparent', border: active ? '1px solid #c0d8f0' : '1px solid transparent', color: active ? '#004e8c' : '#1e1e1e', borderRadius: 2, cursor: 'pointer', transition: 'background 0.08s' }}
      onMouseEnter={(e) => { if (!active) (e.currentTarget as HTMLElement).style.background = '#e8e6e3'; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = active ? '#ddeeff' : 'transparent'; }}
    >
      {icon}
      <span style={{ fontSize: 10, fontFamily: 'Calibri, Arial, sans-serif', color: 'inherit', marginTop: 1 }}>{label}</span>
    </button>
  );
}

function Dropdown({ open, onToggle, trigger, triggerTitle, children, minWidth }: {
  open: boolean; onToggle: () => void; trigger: React.ReactNode;
  triggerTitle?: string; children: React.ReactNode; minWidth?: number;
}) {
  return (
    <div style={{ position: 'relative' }}>
      <button type="button" onMouseDown={(e) => { e.preventDefault(); onToggle(); }} title={triggerTitle}
        style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 6px', height: 26, background: open ? '#ddeeff' : '#ffffff', border: open ? '1px solid #c0d8f0' : '1px solid #d2d0ce', borderRadius: 2, cursor: 'pointer', transition: 'background 0.08s' }}
        onMouseEnter={(e) => { if (!open) (e.currentTarget as HTMLElement).style.background = '#f3f2f1'; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = open ? '#ddeeff' : '#ffffff'; }}
      >
        {trigger}
        <ChevronIcon />
      </button>
      {open && <DropdownPanel minWidth={minWidth}>{children}</DropdownPanel>}
    </div>
  );
}

function DropdownPanel({ children, minWidth }: { children: React.ReactNode; minWidth?: number }) {
  return (
    <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: 2, background: '#fff', border: '1px solid #d2d0ce', boxShadow: '0 4px 16px rgba(0,0,0,0.15)', zIndex: 300, minWidth: minWidth ?? 160, borderRadius: 2, maxHeight: 280, overflowY: 'auto' }}>
      {children}
    </div>
  );
}

function DropdownItem({ children, active, onSelect, style }: {
  children: React.ReactNode; active: boolean; onSelect: () => void; style?: React.CSSProperties;
}) {
  return (
    <button type="button" onMouseDown={(e) => { e.preventDefault(); onSelect(); }}
      style={{ display: 'block', width: '100%', textAlign: 'left', padding: '6px 14px', background: active ? '#ddeeff' : 'transparent', border: 'none', cursor: 'pointer', ...style }}
      onMouseEnter={(e) => { if (!active) (e.currentTarget as HTMLElement).style.background = '#f3f2f1'; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = active ? '#ddeeff' : 'transparent'; }}
    >
      {children}
    </button>
  );
}

// ── Icons ─────────────────────────────────────────────────────────────────────

const sv  = { fill: 'none', stroke: 'currentColor', strokeWidth: 2,   strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
const sv3 = { ...sv, strokeWidth: 2.5 };

function AlignLeftIcon()    { return <svg width="13" height="13" viewBox="0 0 24 24" {...sv}><line x1="21" y1="6" x2="3" y2="6"/><line x1="15" y1="12" x2="3" y2="12"/><line x1="17" y1="18" x2="3" y2="18"/></svg>; }
function AlignCenterIcon()  { return <svg width="13" height="13" viewBox="0 0 24 24" {...sv}><line x1="21" y1="6" x2="3" y2="6"/><line x1="17" y1="12" x2="7" y2="12"/><line x1="19" y1="18" x2="5" y2="18"/></svg>; }
function AlignRightIcon()   { return <svg width="13" height="13" viewBox="0 0 24 24" {...sv}><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="12" x2="9" y2="12"/><line x1="21" y1="18" x2="7" y2="18"/></svg>; }
function AlignJustifyIcon() { return <svg width="13" height="13" viewBox="0 0 24 24" {...sv}><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="12" x2="3" y2="12"/><line x1="21" y1="18" x2="3" y2="18"/></svg>; }
function BulletListIcon()   { return <svg width="13" height="13" viewBox="0 0 24 24" {...sv}><line x1="9" y1="6" x2="20" y2="6"/><line x1="9" y1="12" x2="20" y2="12"/><line x1="9" y1="18" x2="20" y2="18"/><circle cx="4" cy="6" r="1" fill="currentColor" stroke="none"/><circle cx="4" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="4" cy="18" r="1" fill="currentColor" stroke="none"/></svg>; }
function OrderedListIcon()  { return <svg width="13" height="13" viewBox="0 0 24 24" {...sv}><line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="10" y1="18" x2="21" y2="18"/><path d="M4 6h1v4"/><path d="M4 10H6"/><path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"/></svg>; }
function TableIcon({ big }: { big?: boolean }) { const s = big ? 22 : 13; return <svg width={s} height={s} viewBox="0 0 24 24" {...sv}><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="12" y1="3" x2="12" y2="21"/></svg>; }
function HrIcon({ big }: { big?: boolean })    { const s = big ? 22 : 13; return <svg width={s} height={s} viewBox="0 0 24 24" {...sv}><line x1="3" y1="12" x2="21" y2="12"/><polyline points="7 8 3 12 7 16"/><polyline points="17 8 21 12 17 16"/></svg>; }
function ImageIcon({ big }: { big?: boolean }) { const s = big ? 22 : 13; return <svg width={s} height={s} viewBox="0 0 24 24" {...sv}><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>; }
function LinkIcon({ big }: { big?: boolean })  { const s = big ? 22 : 13; return <svg width={s} height={s} viewBox="0 0 24 24" {...sv}><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>; }
function UndoIcon()         { return <svg width="13" height="13" viewBox="0 0 24 24" {...sv}><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.51"/></svg>; }
function RedoIcon()         { return <svg width="13" height="13" viewBox="0 0 24 24" {...sv}><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-.49-3.51"/></svg>; }
function ChevronIcon()      { return <svg width="9" height="9" viewBox="0 0 24 24" {...sv3}><polyline points="6 9 12 15 18 9"/></svg>; }
function GrowIcon()         { return <svg width="13" height="13" viewBox="0 0 24 24" {...sv}><polyline points="5 3 19 3"/><path d="M12 3v18"/><polyline points="5 21 12 14 19 21"/></svg>; }
function ShrinkIcon()       { return <svg width="13" height="13" viewBox="0 0 24 24" {...sv}><polyline points="5 21 19 21"/><path d="M12 21V3"/><polyline points="5 3 12 10 19 3"/></svg>; }
function ClearIcon()        { return <svg width="13" height="13" viewBox="0 0 24 24" {...sv}><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4z"/><line x1="19" y1="5" x2="21" y2="7" stroke="#c00000"/></svg>; }
function HighlightIcon()    { return <svg width="13" height="12" viewBox="0 0 24 23" {...sv}><path d="M9 11l6 6"/><path d="M19 5l-1 1-8.5 8.5-3 3 2.5 2.5 3-3 8.5-8.5 1-1z"/><path d="M2 22h7"/></svg>; }
function IndentDecIcon()    { return <svg width="13" height="13" viewBox="0 0 24 24" {...sv}><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="12" x2="11" y2="12"/><line x1="21" y1="18" x2="11" y2="18"/><polyline points="7 9 3 12 7 15"/></svg>; }
function IndentIncIcon()    { return <svg width="13" height="13" viewBox="0 0 24 24" {...sv}><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="12" x2="11" y2="12"/><line x1="21" y1="18" x2="11" y2="18"/><polyline points="3 9 7 12 3 15"/></svg>; }
function LineSpacingIcon()  { return <svg width="13" height="13" viewBox="0 0 24 24" {...sv}><line x1="9" y1="6" x2="20" y2="6"/><line x1="9" y1="12" x2="20" y2="12"/><line x1="9" y1="18" x2="20" y2="18"/><polyline points="4 3 2 6 4 9"/><polyline points="4 15 2 18 4 21"/></svg>; }
function ResetIcon()        { return <svg width="13" height="13" viewBox="0 0 24 24" {...sv}><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><polyline points="3 3 3 8 8 8"/></svg>; }
// Table operation icons
function FillIcon()         { return <svg width="13" height="13" viewBox="0 0 24 24" {...sv}><path d="M16.5 10.5c0 0-5 5.5-5 8a5 5 0 0 0 10 0c0-2.5-5-8-5-8z"/><path d="M4 4l7.07 7.07"/><path d="M2 6l4-4 3 3-2 2z"/></svg>; }
function MergeIcon()        { return <svg width="13" height="13" viewBox="0 0 24 24" {...sv}><rect x="2" y="4" width="9" height="16" rx="1"/><rect x="13" y="4" width="9" height="16" rx="1"/><line x1="9" y1="12" x2="15" y2="12"/><polyline points="12 9 15 12 12 15"/></svg>; }
function SplitIcon()        { return <svg width="13" height="13" viewBox="0 0 24 24" {...sv}><rect x="2" y="4" width="20" height="16" rx="1"/><line x1="12" y1="4" x2="12" y2="20"/><polyline points="9 9 6 12 9 15"/><polyline points="15 9 18 12 15 15"/></svg>; }
function HeaderRowIcon()    { return <svg width="13" height="13" viewBox="0 0 24 24" {...sv}><rect x="2" y="4" width="20" height="16" rx="1"/><line x1="2" y1="10" x2="22" y2="10"/><path d="M2 10V5a1 1 0 0 1 1-1h18a1 1 0 0 1 1 1v5" fill="currentColor" fillOpacity="0.2" stroke="none"/></svg>; }
function AddRowAboveIcon()  { return <svg width="13" height="13" viewBox="0 0 24 24" {...sv}><rect x="2" y="11" width="20" height="11" rx="1"/><line x1="12" y1="11" x2="12" y2="22"/><line x1="12" y1="2" x2="12" y2="8"/><line x1="9" y1="5" x2="15" y2="5"/></svg>; }
function AddRowBelowIcon()  { return <svg width="13" height="13" viewBox="0 0 24 24" {...sv}><rect x="2" y="2" width="20" height="11" rx="1"/><line x1="12" y1="2" x2="12" y2="13"/><line x1="12" y1="16" x2="12" y2="22"/><line x1="9" y1="19" x2="15" y2="19"/></svg>; }
function DeleteRowIcon()    { return <svg width="13" height="13" viewBox="0 0 24 24" {...sv}><rect x="2" y="2" width="20" height="11" rx="1"/><rect x="2" y="13" width="20" height="9" rx="1"/><line x1="9" y1="17" x2="15" y2="17"/></svg>; }
function AddColLeftIcon()   { return <svg width="13" height="13" viewBox="0 0 24 24" {...sv}><rect x="11" y="2" width="11" height="20" rx="1"/><line x1="11" y1="12" x2="22" y2="12"/><line x1="2" y1="12" x2="8" y2="12"/><line x1="5" y1="9" x2="5" y2="15"/></svg>; }
function AddColRightIcon()  { return <svg width="13" height="13" viewBox="0 0 24 24" {...sv}><rect x="2" y="2" width="11" height="20" rx="1"/><line x1="2" y1="12" x2="13" y2="12"/><line x1="16" y1="12" x2="22" y2="12"/><line x1="19" y1="9" x2="19" y2="15"/></svg>; }
function DeleteColIcon()    { return <svg width="13" height="13" viewBox="0 0 24 24" {...sv}><rect x="2" y="2" width="9" height="20" rx="1"/><rect x="13" y="2" width="9" height="20" rx="1"/><line x1="16" y1="11" x2="19" y2="14"/><line x1="19" y1="11" x2="16" y2="14"/></svg>; }
function DeleteTableIcon()  { return <svg width="13" height="13" viewBox="0 0 24 24" {...sv}><rect x="2" y="2" width="20" height="20" rx="2"/><line x1="2" y1="8" x2="22" y2="8"/><line x1="2" y1="14" x2="22" y2="14"/><line x1="8" y1="2" x2="8" y2="22"/><line x1="14" y1="2" x2="14" y2="22"/><line x1="9" y1="9" x2="15" y2="15" stroke="#c00000" strokeWidth="2.5"/><line x1="15" y1="9" x2="9" y2="15" stroke="#c00000" strokeWidth="2.5"/></svg>; }
