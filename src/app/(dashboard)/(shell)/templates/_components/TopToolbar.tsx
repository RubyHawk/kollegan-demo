'use client';

/**
 * TopToolbar — Word/Office 365-style tabbed ribbon.
 *
 * Tabs: Hem (Home) | Infoga (Insert) | Layout
 */

import { useRef, useState, useCallback } from 'react';
import { useTemplateEditor } from './editor-context';

// ── Constants ───────────────────────────────────────────────────────────────────

const FONTS = [
  'Calibri', 'Arial', 'Arial Black', 'Comic Sans MS',
  'Courier New', 'Georgia', 'Impact', 'Palatino Linotype',
  'Times New Roman', 'Trebuchet MS', 'Verdana',
];

const FONT_SIZES = [8, 9, 10, 11, 12, 14, 16, 18, 20, 22, 24, 26, 28, 36, 48, 72];

const TEXT_COLORS = [
  '#000000', '#404040', '#7f7f7f', '#bfbfbf', '#ffffff',
  '#c00000', '#e74c3c', '#e67e22', '#f1c40f', '#2ecc71',
  '#1abc9c', '#3498db', '#2980b9', '#1f3864', '#2e74b5',
  '#8e44ad', '#9b59b6', '#c0392b', '#16a085', '#27ae60',
];

// Word's 15 highlight colours
const HIGHLIGHT_COLORS = [
  '#ffff00', '#00ff00', '#00ffff', '#ff00ff', '#0000ff',
  '#ff0000', '#00008b', '#008080', '#006400', '#800080',
  '#8b0000', '#808000', '#ffa500', '#d3d3d3', '#696969',
];

const LINE_SPACINGS = [
  { label: 'Enkel (1.0)',   value: '1' },
  { label: '1,15',          value: '1.15' },
  { label: '1,5 rad',       value: '1.5' },
  { label: 'Dubbel (2.0)',  value: '2' },
  { label: '2,5',           value: '2.5' },
  { label: 'Trippel (3.0)', value: '3' },
];

// ── Main component ──────────────────────────────────────────────────────────────

export default function TopToolbar() {
  const editor = useTemplateEditor();
  const fileRef = useRef<HTMLInputElement>(null);

  const [tab, setTab] = useState<'hem' | 'infoga' | 'layout'>('hem');
  // One open dropdown at a time — string key identifies it
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const toggle = useCallback((name: string) => {
    setOpenMenu((prev) => (prev === name ? null : name));
  }, []);
  const close = useCallback(() => setOpenMenu(null), []);

  if (!editor) return null;

  // ── Derived state ─────────────────────────────────────────────────────────

  const activeStyle = editor.isActive('heading', { level: 1 }) ? 'Rubrik 1'
    : editor.isActive('heading', { level: 2 }) ? 'Rubrik 2'
    : editor.isActive('heading', { level: 3 }) ? 'Rubrik 3'
    : 'Normal';

  const activeFontFamily = (editor.getAttributes('textStyle').fontFamily as string | undefined) ?? 'Calibri';
  const activeFontSize   = String((editor.getAttributes('textStyle').fontSize as string | undefined) ?? '13');
  const activeColor      = (editor.getAttributes('textStyle').color          as string | undefined) ?? '#000000';
  const activeHighlight  = editor.getAttributes('highlight').color            as string | undefined;

  // ── Helpers ───────────────────────────────────────────────────────────────

  function handleImageFile(file: File) {
    const reader = new FileReader();
    reader.onload = (e) => {
      editor!.chain().focus().setImage({ src: e.target?.result as string }).run();
    };
    reader.readAsDataURL(file);
  }

  function growFont() {
    const cur = Number(activeFontSize);
    const next = FONT_SIZES.find((s) => s > cur) ?? cur + 2;
    editor!.chain().focus().setFontSize(String(next)).run();
  }
  function shrinkFont() {
    const cur = Number(activeFontSize);
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
      style={{ background: '#f3f2f1', borderBottom: '1px solid #d2d0ce', userSelect: 'none' }}
      onMouseDown={(e) => {
        // Prevent editor blur for most elements, but NOT for real inputs
        const tag = (e.target as HTMLElement).tagName;
        if (tag !== 'INPUT') e.preventDefault();
      }}
    >
      {/* ── Tab strip ──────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', borderBottom: '1px solid #d2d0ce', padding: '0 4px', background: '#f3f2f1' }}>
        {(['hem', 'infoga', 'layout'] as const).map((t) => {
          const labels: Record<string, string> = { hem: 'Hem', infoga: 'Infoga', layout: 'Layout' };
          const isActive = tab === t;
          return (
            <button
              key={t}
              type="button"
              onMouseDown={(e) => { e.preventDefault(); setTab(t); close(); }}
              title={labels[t]}
              style={{
                padding: '5px 14px', fontSize: 12,
                fontFamily: 'Calibri, Arial, sans-serif',
                background: isActive ? '#f3f2f1' : 'transparent',
                border: 'none',
                borderBottom: isActive ? '2px solid #0078d4' : '2px solid transparent',
                color: isActive ? '#0078d4' : '#323130',
                fontWeight: isActive ? 600 : 400,
                cursor: 'pointer',
              }}
            >
              {labels[t]}
            </button>
          );
        })}
      </div>

      {/* ── Ribbon content ─────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'stretch',
        padding: '4px 6px', gap: 6,
        flexWrap: 'wrap', minHeight: 58,
      }}>

        {/* ══ HEM ══════════════════════════════════════════════════════ */}
        {tab === 'hem' && (
          <>
            {/* Urklipp */}
            <RibbonGroup label="Urklipp">
              <RBtn onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Ångra (Ctrl+Z)">
                <UndoIcon />
              </RBtn>
              <RBtn onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Gör om (Ctrl+Y)">
                <RedoIcon />
              </RBtn>
            </RibbonGroup>

            <GroupSep />

            {/* Format */}
            <RibbonGroup label="Format">
              <Dropdown
                open={openMenu === 'style'}
                onToggle={() => toggle('style')}
                trigger={<span style={{ fontSize: 12, fontFamily: 'Calibri, Arial, sans-serif', minWidth: 96, textAlign: 'left', color: '#1e1e1e' }}>{activeStyle}</span>}
                triggerTitle="Styckeformat — välj rubriknivå eller normaltext"
                minWidth={200}
              >
                {styleEntries.map(({ label, ps, action }) => (
                  <DropdownItem
                    key={label}
                    active={activeStyle === label}
                    onSelect={() => { action(); close(); }}
                    style={{ ...ps, fontFamily: 'Calibri, Arial, sans-serif', lineHeight: 1.4 }}
                  >
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
                trigger={<span style={{ fontSize: 12, fontFamily: activeFontFamily + ', sans-serif', minWidth: 110, textAlign: 'left', color: '#1e1e1e', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{activeFontFamily}</span>}
                triggerTitle="Välj teckensnitt"
                minWidth={180}
              >
                {FONTS.map((f) => (
                  <DropdownItem
                    key={f}
                    active={activeFontFamily === f}
                    onSelect={() => { editor.chain().focus().setFontFamily(f).run(); close(); }}
                    style={{ fontFamily: f + ', sans-serif', fontSize: 13 }}
                  >
                    {f}
                  </DropdownItem>
                ))}
              </Dropdown>

              {/* Font size — single editable input + dropdown */}
              <FontSizeControl
                value={activeFontSize}
                open={openMenu === 'size'}
                onToggle={() => toggle('size')}
                onSelect={(s) => { editor.chain().focus().setFontSize(String(s)).run(); close(); }}
                onApply={(v) => { editor.chain().setFontSize(v).run(); }}
                onFocusEditor={() => setTimeout(() => editor.commands.focus(), 0)}
              />

              {/* Grow / shrink */}
              <RBtn onClick={growFont}   title="Öka teckenstorlek (Ctrl+Skift+>)"><GrowIcon /></RBtn>
              <RBtn onClick={shrinkFont} title="Minska teckenstorlek (Ctrl+Skift+<)"><ShrinkIcon /></RBtn>

              <InlineSep />

              {/* B I U S */}
              <RBtn onClick={() => editor.chain().focus().toggleBold().run()}      active={editor.isActive('bold')}      title="Fet (Ctrl+B)">
                <span style={{ fontWeight: 700, fontFamily: 'Georgia, serif', fontSize: 13, lineHeight: 1 }}>B</span>
              </RBtn>
              <RBtn onClick={() => editor.chain().focus().toggleItalic().run()}    active={editor.isActive('italic')}    title="Kursiv (Ctrl+I)">
                <span style={{ fontStyle: 'italic', fontFamily: 'Georgia, serif', fontSize: 13, lineHeight: 1 }}>I</span>
              </RBtn>
              <RBtn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="Understruken (Ctrl+U)">
                <span style={{ textDecoration: 'underline', fontFamily: 'Calibri, Arial, sans-serif', fontSize: 13, lineHeight: 1 }}>U</span>
              </RBtn>
              <RBtn onClick={() => editor.chain().focus().toggleStrike().run()}    active={editor.isActive('strike')}    title="Genomstruken">
                <span style={{ textDecoration: 'line-through', fontFamily: 'Calibri, Arial, sans-serif', fontSize: 13, lineHeight: 1 }}>S</span>
              </RBtn>

              <InlineSep />

              {/* Subscript / Superscript */}
              <RBtn onClick={() => editor.chain().focus().toggleSubscript().run()}   active={editor.isActive('subscript')}   title="Nedsänkt skrift (Ctrl+=)">
                <span style={{ fontSize: 11, fontFamily: 'Calibri, Arial, sans-serif', lineHeight: 1 }}>x<sub style={{ fontSize: 8 }}>2</sub></span>
              </RBtn>
              <RBtn onClick={() => editor.chain().focus().toggleSuperscript().run()} active={editor.isActive('superscript')} title="Upphöjd skrift (Ctrl+Skift+=)">
                <span style={{ fontSize: 11, fontFamily: 'Calibri, Arial, sans-serif', lineHeight: 1 }}>x<sup style={{ fontSize: 8 }}>2</sup></span>
              </RBtn>

              <InlineSep />

              {/* Highlight colour */}
              <ColorSwatchBtn
                icon={<HighlightIcon />}
                color={activeHighlight ?? '#ffff00'}
                title="Markera text — klicka för att välja färg"
                open={openMenu === 'highlight'}
                onToggle={() => toggle('highlight')}
              />
              {openMenu === 'highlight' && (
                <ColorPalette
                  colors={HIGHLIGHT_COLORS}
                  active={activeHighlight}
                  onSelect={(c) => { editor.chain().focus().toggleHighlight({ color: c }).run(); close(); }}
                  onClear={() => { editor.chain().focus().unsetHighlight().run(); close(); }}
                  clearLabel="Ingen markering"
                />
              )}

              {/* Text colour */}
              <ColorSwatchBtn
                icon={<span style={{ fontWeight: 700, fontFamily: 'Calibri, Arial, sans-serif', fontSize: 13, lineHeight: 1, color: '#1e1e1e' }}>A</span>}
                color={activeColor}
                title="Teckenfärg — klicka för att välja färg"
                open={openMenu === 'color'}
                onToggle={() => toggle('color')}
              />
              {openMenu === 'color' && (
                <ColorPalette
                  colors={TEXT_COLORS}
                  active={activeColor}
                  onSelect={(c) => { editor.chain().focus().setColor(c).run(); close(); }}
                  onClear={() => { editor.chain().focus().unsetColor().run(); close(); }}
                  clearLabel="Automatisk färg"
                />
              )}

              {/* Clear formatting */}
              <RBtn
                onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}
                title="Rensa all formatering"
              >
                <ClearIcon />
              </RBtn>
            </RibbonGroup>

            <GroupSep />

            {/* Stycke */}
            <RibbonGroup label="Stycke">
              {/* Indent */}
              <RBtn onClick={() => editor.chain().focus().decreaseIndent().run()} title="Minska indrag (Skift+Tabb)"><IndentDecIcon /></RBtn>
              <RBtn onClick={() => editor.chain().focus().increaseIndent().run()} title="Öka indrag (Tabb)"><IndentIncIcon /></RBtn>

              <InlineSep />

              {/* Alignment */}
              <RBtn onClick={() => editor.chain().focus().setTextAlign('left').run()}    active={editor.isActive({ textAlign: 'left' })}    title="Vänsterjustera (Ctrl+L)"><AlignLeftIcon /></RBtn>
              <RBtn onClick={() => editor.chain().focus().setTextAlign('center').run()}  active={editor.isActive({ textAlign: 'center' })}  title="Centrera (Ctrl+E)"><AlignCenterIcon /></RBtn>
              <RBtn onClick={() => editor.chain().focus().setTextAlign('right').run()}   active={editor.isActive({ textAlign: 'right' })}   title="Högerjustera (Ctrl+R)"><AlignRightIcon /></RBtn>
              <RBtn onClick={() => editor.chain().focus().setTextAlign('justify').run()} active={editor.isActive({ textAlign: 'justify' })} title="Marginaljustera (Ctrl+J)"><AlignJustifyIcon /></RBtn>

              <InlineSep />

              {/* Lists */}
              <RBtn onClick={() => editor.chain().focus().toggleBulletList().run()}  active={editor.isActive('bulletList')}  title="Punktlista (Ctrl+Skift+8)"><BulletListIcon /></RBtn>
              <RBtn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Numrerad lista (Ctrl+Skift+7)"><OrderedListIcon /></RBtn>

              <InlineSep />

              {/* Line spacing */}
              <div style={{ position: 'relative' }}>
                <RBtn onClick={() => toggle('linespacing')} active={openMenu === 'linespacing'} title="Radavstånd — ändra mellanrum mellan rader">
                  <LineSpacingIcon />
                </RBtn>
                {openMenu === 'linespacing' && (
                  <DropdownPanel minWidth={170}>
                    {LINE_SPACINGS.map(({ label, value }) => (
                      <DropdownItem
                        key={value}
                        active={false}
                        onSelect={() => { editor.chain().focus().setLineHeight(value).run(); close(); }}
                        style={{ fontSize: 13, fontFamily: 'Calibri, Arial, sans-serif' }}
                      >
                        {label}
                      </DropdownItem>
                    ))}
                    <div style={{ height: 1, background: '#d2d0ce', margin: '4px 0' }} />
                    <DropdownItem
                      active={false}
                      onSelect={() => { editor.chain().focus().unsetLineHeight().run(); close(); }}
                      style={{ fontSize: 13, fontFamily: 'Calibri, Arial, sans-serif', color: '#0078d4' }}
                    >
                      Återställ standard
                    </DropdownItem>
                  </DropdownPanel>
                )}
              </div>
            </RibbonGroup>
          </>
        )}

        {/* ══ INFOGA ══════════════════════════════════════════════════ */}
        {tab === 'infoga' && (
          <>
            {/* Tabell — hover grid picker */}
            <RibbonGroup label="Tabeller">
              <div style={{ position: 'relative' }}>
                <BigBtn
                  icon={<TableIcon big />}
                  label="Tabell"
                  title="Infoga tabell — håll musen för att välja storlek"
                  active={openMenu === 'table'}
                  onClick={() => toggle('table')}
                />
                {openMenu === 'table' && (
                  <TablePicker
                    onInsert={(rows, cols) => {
                      editor.chain().focus().insertTable({ rows, cols, withHeaderRow: true }).run();
                      close();
                    }}
                  />
                )}
              </div>
            </RibbonGroup>

            <GroupSep />

            <RibbonGroup label="Bild">
              <BigBtn
                icon={<ImageIcon big />}
                label="Bild"
                title="Infoga bild från din dator"
                onClick={() => fileRef.current?.click()}
              />
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
            </RibbonGroup>

            <GroupSep />

            <RibbonGroup label="Länkar">
              <BigBtn
                icon={<LinkIcon big />}
                label="Länk"
                title="Infoga eller redigera hyperlänk"
                active={editor.isActive('link')}
                onClick={() => {
                  const prev = editor.getAttributes('link').href as string | undefined;
                  const url = window.prompt('Ange URL:', prev ?? 'https://');
                  if (url === null) return;
                  if (url.trim() === '') editor.chain().focus().unsetLink().run();
                  else editor.chain().focus().setLink({ href: url.trim() }).run();
                }}
              />
            </RibbonGroup>

            <GroupSep />

            <RibbonGroup label="Text">
              <BigBtn
                icon={<HrIcon big />}
                label="Avdelare"
                title="Infoga horisontell avdelare"
                onClick={() => editor.chain().focus().setHorizontalRule().run()}
              />
            </RibbonGroup>
          </>
        )}

        {/* ══ LAYOUT ══════════════════════════════════════════════════ */}
        {tab === 'layout' && (
          <>
            <RibbonGroup label="Radavstånd">
              {LINE_SPACINGS.map(({ label, value }) => (
                <RBtn
                  key={value}
                  onClick={() => editor.chain().focus().setLineHeight(value).run()}
                  title={`Radavstånd: ${label}`}
                  style={{ fontSize: 11, minWidth: 36, padding: '0 6px' }}
                >
                  {value}×
                </RBtn>
              ))}
              <RBtn onClick={() => editor.chain().focus().unsetLineHeight().run()} title="Återställ standardradavstånd">
                <ResetIcon />
              </RBtn>
            </RibbonGroup>

            <GroupSep />

            <RibbonGroup label="Teckenfärg">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 22px)', gap: 3, padding: '2px 0' }}>
                {TEXT_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().setColor(c).run(); }}
                    title={`Sätt teckenfärg: ${c}`}
                    style={{
                      width: 22, height: 22, background: c,
                      border: c === activeColor ? '2px solid #0078d4' : '1px solid #d2d0ce',
                      borderRadius: 2, cursor: 'pointer', padding: 0,
                    }}
                  />
                ))}
              </div>
            </RibbonGroup>

            <GroupSep />

            <RibbonGroup label="Indrag">
              <RBtn onClick={() => editor.chain().focus().decreaseIndent().run()} title="Minska indrag"><IndentDecIcon /></RBtn>
              <RBtn onClick={() => editor.chain().focus().increaseIndent().run()} title="Öka indrag"><IndentIncIcon /></RBtn>
            </RibbonGroup>
          </>
        )}
      </div>
    </div>
  );
}

// ── Font size control ───────────────────────────────────────────────────────────
// Single control: editable input that also opens a size list.
// Does NOT call .focus() on change — avoids stealing focus from the input.

function FontSizeControl({
  value, open, onToggle, onSelect, onApply, onFocusEditor,
}: {
  value: string;
  open: boolean;
  onToggle: () => void;
  onSelect: (s: number) => void;
  onApply: (v: string) => void;
  onFocusEditor: () => void;
}) {
  return (
    <div style={{ position: 'relative', display: 'flex' }}>
      {/* Editable size input — uncontrolled, keyed by value so it resets on external change */}
      <input
        key={value}
        type="text"
        defaultValue={value}
        title="Teckenstorlek — skriv ett värde och tryck Enter"
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          e.stopPropagation();
          if (e.key === 'Enter') {
            const v = (e.currentTarget as HTMLInputElement).value;
            if (v && Number(v) >= 1) {
              onApply(v);
              onFocusEditor();
            }
            e.preventDefault();
          } else if (e.key === 'Escape') {
            onFocusEditor();
          }
        }}
        onBlur={(e) => {
          const v = e.currentTarget.value;
          if (v && Number(v) >= 1) onApply(v);
        }}
        style={{
          width: 38, height: 26, padding: '0 4px', fontSize: 12,
          border: open ? '1px solid #0078d4' : '1px solid #d2d0ce',
          borderRight: 'none',
          borderRadius: '2px 0 0 2px',
          fontFamily: 'Calibri, Arial, sans-serif',
          background: '#fff', color: '#1e1e1e',
          outline: 'none', textAlign: 'center',
        }}
        onFocus={(e) => { (e.currentTarget as HTMLElement).style.borderColor = '#0078d4'; }}
      />
      {/* Dropdown arrow */}
      <button
        type="button"
        onMouseDown={(e) => { e.preventDefault(); onToggle(); }}
        title="Visa vanliga teckenstorlekar"
        style={{
          width: 18, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: open ? '#ddeeff' : '#f3f2f1',
          border: open ? '1px solid #0078d4' : '1px solid #d2d0ce',
          borderRadius: '0 2px 2px 0',
          cursor: 'pointer', padding: 0, flexShrink: 0,
        }}
      >
        <ChevronIcon />
      </button>
      {/* Size dropdown */}
      {open && (
        <DropdownPanel minWidth={64}>
          {FONT_SIZES.map((s) => (
            <DropdownItem
              key={s}
              active={value === String(s)}
              onSelect={() => onSelect(s)}
              style={{ fontSize: 13, fontFamily: 'Calibri, Arial, sans-serif', textAlign: 'center' }}
            >
              {s}
            </DropdownItem>
          ))}
        </DropdownPanel>
      )}
    </div>
  );
}

// ── Table hover-grid picker ─────────────────────────────────────────────────────

const TABLE_MAX = 8;

function TablePicker({ onInsert }: { onInsert: (rows: number, cols: number) => void }) {
  const [hovered, setHovered] = useState({ r: 0, c: 0 });

  return (
    <div style={{
      position: 'absolute', top: '100%', left: 0, marginTop: 2,
      background: '#fff', border: '1px solid #d2d0ce',
      boxShadow: '0 4px 16px rgba(0,0,0,0.15)', zIndex: 300,
      padding: '10px', borderRadius: 2,
    }}>
      <p style={{
        textAlign: 'center', marginBottom: 8,
        fontSize: 12, fontFamily: 'Calibri, Arial, sans-serif', color: '#323130',
      }}>
        {hovered.r > 0 ? `${hovered.c} × ${hovered.r}` : 'Markera tabellstorlek'}
      </p>
      <div
        style={{ display: 'grid', gridTemplateColumns: `repeat(${TABLE_MAX}, 18px)`, gap: 2 }}
        onMouseLeave={() => setHovered({ r: 0, c: 0 })}
      >
        {Array.from({ length: TABLE_MAX * TABLE_MAX }, (_, i) => {
          const row = Math.floor(i / TABLE_MAX) + 1;
          const col = (i % TABLE_MAX) + 1;
          const on = row <= hovered.r && col <= hovered.c;
          return (
            <div
              key={i}
              onMouseEnter={() => setHovered({ r: row, c: col })}
              onMouseDown={(e) => { e.preventDefault(); onInsert(row, col); }}
              title={`${col}×${row} tabell`}
              style={{
                width: 18, height: 18, cursor: 'pointer',
                background: on ? '#ddeeff' : '#fff',
                border: `1px solid ${on ? '#c0d8f0' : '#d2d0ce'}`,
                borderRadius: 1,
              }}
            />
          );
        })}
      </div>
      <p style={{ textAlign: 'center', marginTop: 8, fontSize: 10, color: '#a19f9d', fontFamily: 'Calibri, Arial, sans-serif' }}>
        Klicka för att infoga
      </p>
    </div>
  );
}

// ── Colour swatch button ────────────────────────────────────────────────────────

function ColorSwatchBtn({ icon, color, title, open, onToggle }: {
  icon: React.ReactNode;
  color: string;
  title: string;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <div style={{ position: 'relative' }}>
      <button
        type="button"
        onMouseDown={(e) => { e.preventDefault(); onToggle(); }}
        title={title}
        style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          width: 28, height: 26, padding: '2px 4px', gap: 1,
          background: open ? '#ddeeff' : 'transparent',
          border: open ? '1px solid #c0d8f0' : '1px solid transparent',
          borderRadius: 2, cursor: 'pointer',
        }}
      >
        {icon}
        <div style={{ width: 14, height: 3, background: color, borderRadius: 1 }} />
      </button>
    </div>
  );
}

// ── Colour palette dropdown ─────────────────────────────────────────────────────

function ColorPalette({ colors, active, onSelect, onClear, clearLabel }: {
  colors: string[];
  active?: string;
  onSelect: (c: string) => void;
  onClear: () => void;
  clearLabel: string;
}) {
  const cols = colors.length > 10 ? 5 : colors.length;
  return (
    <div style={{
      position: 'absolute', top: '100%', left: 0, marginTop: 2,
      background: '#fff', border: '1px solid #d2d0ce',
      boxShadow: '0 4px 16px rgba(0,0,0,0.15)', zIndex: 300,
      padding: '8px 10px', borderRadius: 2,
    }}>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 22px)`, gap: 3, marginBottom: 6 }}>
        {colors.map((c) => (
          <button
            key={c}
            type="button"
            onMouseDown={(e) => { e.preventDefault(); onSelect(c); }}
            title={c}
            style={{
              width: 22, height: 22, background: c,
              border: c === active ? '2px solid #0078d4' : '1px solid #d2d0ce',
              borderRadius: 2, cursor: 'pointer', padding: 0,
            }}
          />
        ))}
      </div>
      <button
        type="button"
        onMouseDown={(e) => { e.preventDefault(); onClear(); }}
        title={clearLabel}
        style={{
          display: 'block', width: '100%', textAlign: 'center',
          fontSize: 11, color: '#0078d4', background: 'none', border: 'none',
          cursor: 'pointer', padding: '2px 0',
          fontFamily: 'Calibri, Arial, sans-serif',
        }}
      >
        {clearLabel}
      </button>
    </div>
  );
}

// ── Ribbon building blocks ──────────────────────────────────────────────────────

function RibbonGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 2, flex: 1, paddingBottom: 2 }}>
        {children}
      </div>
      <p style={{
        fontSize: 9, textAlign: 'center', color: '#a19f9d',
        fontFamily: 'Calibri, Arial, sans-serif',
        borderTop: '1px solid #e8e6e3', paddingTop: 2, margin: 0,
      }}>
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

function RBtn({
  onClick, active, disabled, title, children, style,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title?: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
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
        transition: 'background 0.08s',
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
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: 2, padding: '4px 10px', minWidth: 50, height: 50,
        background: active ? '#ddeeff' : 'transparent',
        border: active ? '1px solid #c0d8f0' : '1px solid transparent',
        color: active ? '#004e8c' : '#1e1e1e',
        borderRadius: 2, cursor: 'pointer', transition: 'background 0.08s',
      }}
      onMouseEnter={(e) => { if (!active) (e.currentTarget as HTMLElement).style.background = '#e8e6e3'; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = active ? '#ddeeff' : 'transparent'; }}
    >
      {icon}
      <span style={{ fontSize: 10, fontFamily: 'Calibri, Arial, sans-serif', color: 'inherit', marginTop: 1 }}>{label}</span>
    </button>
  );
}

function Dropdown({
  open, onToggle, trigger, triggerTitle, children, minWidth,
}: {
  open: boolean; onToggle: () => void; trigger: React.ReactNode;
  triggerTitle?: string; children: React.ReactNode; minWidth?: number;
}) {
  return (
    <div style={{ position: 'relative' }}>
      <button
        type="button"
        onMouseDown={(e) => { e.preventDefault(); onToggle(); }}
        title={triggerTitle}
        style={{
          display: 'flex', alignItems: 'center', gap: 4, padding: '3px 6px', height: 26,
          background: open ? '#ddeeff' : '#ffffff',
          border: open ? '1px solid #c0d8f0' : '1px solid #d2d0ce',
          borderRadius: 2, cursor: 'pointer', transition: 'background 0.08s',
        }}
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
    <div style={{
      position: 'absolute', top: '100%', left: 0, marginTop: 2,
      background: '#fff', border: '1px solid #d2d0ce',
      boxShadow: '0 4px 16px rgba(0,0,0,0.15)', zIndex: 300,
      minWidth: minWidth ?? 160, borderRadius: 2,
      maxHeight: 280, overflowY: 'auto',
    }}>
      {children}
    </div>
  );
}

function DropdownItem({
  children, active, onSelect, style,
}: {
  children: React.ReactNode; active: boolean; onSelect: () => void; style?: React.CSSProperties;
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => { e.preventDefault(); onSelect(); }}
      style={{
        display: 'block', width: '100%', textAlign: 'left',
        padding: '6px 14px', background: active ? '#ddeeff' : 'transparent',
        border: 'none', cursor: 'pointer', ...style,
      }}
      onMouseEnter={(e) => { if (!active) (e.currentTarget as HTMLElement).style.background = '#f3f2f1'; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = active ? '#ddeeff' : 'transparent'; }}
    >
      {children}
    </button>
  );
}

// ── Icons ───────────────────────────────────────────────────────────────────────

const sv  = { fill: 'none', stroke: 'currentColor', strokeWidth: 2,   strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
const sv3 = { ...sv, strokeWidth: 2.5 };

function AlignLeftIcon()    { return <svg width="13" height="13" viewBox="0 0 24 24" {...sv}><line x1="21" y1="6" x2="3" y2="6"/><line x1="15" y1="12" x2="3" y2="12"/><line x1="17" y1="18" x2="3" y2="18"/></svg>; }
function AlignCenterIcon()  { return <svg width="13" height="13" viewBox="0 0 24 24" {...sv}><line x1="21" y1="6" x2="3" y2="6"/><line x1="17" y1="12" x2="7" y2="12"/><line x1="19" y1="18" x2="5" y2="18"/></svg>; }
function AlignRightIcon()   { return <svg width="13" height="13" viewBox="0 0 24 24" {...sv}><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="12" x2="9" y2="12"/><line x1="21" y1="18" x2="7" y2="18"/></svg>; }
function AlignJustifyIcon() { return <svg width="13" height="13" viewBox="0 0 24 24" {...sv}><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="12" x2="3" y2="12"/><line x1="21" y1="18" x2="3" y2="18"/></svg>; }
function BulletListIcon()   { return <svg width="13" height="13" viewBox="0 0 24 24" {...sv}><line x1="9" y1="6" x2="20" y2="6"/><line x1="9" y1="12" x2="20" y2="12"/><line x1="9" y1="18" x2="20" y2="18"/><circle cx="4" cy="6" r="1" fill="currentColor" stroke="none"/><circle cx="4" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="4" cy="18" r="1" fill="currentColor" stroke="none"/></svg>; }
function OrderedListIcon()  { return <svg width="13" height="13" viewBox="0 0 24 24" {...sv}><line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="10" y1="18" x2="21" y2="18"/><path d="M4 6h1v4"/><path d="M4 10H6"/><path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"/></svg>; }
function TableIcon({ big }: { big?: boolean })  { const s = big ? 22 : 13; return <svg width={s} height={s} viewBox="0 0 24 24" {...sv}><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="12" y1="3" x2="12" y2="21"/></svg>; }
function HrIcon({ big }: { big?: boolean })     { const s = big ? 22 : 13; return <svg width={s} height={s} viewBox="0 0 24 24" {...sv}><line x1="3" y1="12" x2="21" y2="12"/><polyline points="7 8 3 12 7 16"/><polyline points="17 8 21 12 17 16"/></svg>; }
function ImageIcon({ big }: { big?: boolean })  { const s = big ? 22 : 13; return <svg width={s} height={s} viewBox="0 0 24 24" {...sv}><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>; }
function LinkIcon({ big }: { big?: boolean })   { const s = big ? 22 : 13; return <svg width={s} height={s} viewBox="0 0 24 24" {...sv}><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>; }
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
