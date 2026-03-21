'use client';

/**
 * BlockSettingsSidebar — right contextual panel.
 *
 * Shows settings for the currently selected block type:
 *   - Image: alignment, width
 *   - Table: add/remove row & column, merge/split cells
 *   - SignatureBlock: field type, label
 *   - Variable: which variable is selected
 *   - Nothing: placeholder reference card
 */

import { useEffect, useState } from 'react';
import { useTemplateEditor } from './editor-context';
import { useHeaderFooter } from './header-footer-context';
import { OFFER_PLACEHOLDERS } from '@modules/supporting/offers/domain/template.entity';

type ActiveBlock = 'image' | 'table' | 'signatureBlock' | 'variable' | null;

export default function BlockSettingsSidebar() {
  const editor = useTemplateEditor();
  const hf     = useHeaderFooter();
  const [active, setActive] = useState<ActiveBlock>(null);

  useEffect(() => {
    if (!editor) return;
    function update() {
      if (editor!.isActive('image'))          setActive('image');
      else if (editor!.isActive('table'))     setActive('table');
      else if (editor!.isActive('signatureBlock')) setActive('signatureBlock');
      else if (editor!.isActive('variable'))  setActive('variable');
      else                                    setActive(null);
    }
    editor.on('selectionUpdate', update);
    editor.on('transaction',     update);
    return () => {
      editor.off('selectionUpdate', update);
      editor.off('transaction',     update);
    };
  }, [editor]);

  return (
    <div className="w-64 shrink-0 hidden lg:flex flex-col overflow-y-auto" style={{ background: '#f3f2f1', borderLeft: '1px solid #d2d0ce' }}>
      {active === 'image'          && editor && <ImageSettings editor={editor} />}
      {active === 'table'          && editor && <TableSettings editor={editor} />}
      {active === 'signatureBlock' && editor && <SignatureSettings editor={editor} />}
      {active === 'variable'       && editor && <VariableInfo editor={editor} />}
      {active === null             &&           <PlaceholderReference />}
      {/* Page settings panel — always visible at the bottom */}
      {hf && <PageSettings hf={hf} />}
    </div>
  );
}

// ── Image settings ──────────────────────────────────────────────────────────────

import type { Editor } from '@tiptap/core';

// ── Layer helpers (mirrors ImageNodeView logic, operating from the sidebar) ───

interface StackItem { pos: number; zIndex: number }

function buildFreeImageStack(editor: Editor): StackItem[] {
  const items: StackItem[] = [];
  editor.state.doc.descendants((n, pos) => {
    if (n.type.name === 'image' && n.attrs.position === 'free') {
      items.push({ pos, zIndex: Math.max(0, n.attrs.zIndex ?? 0) });
    }
  });
  return items.sort((a, b) => a.zIndex - b.zIndex);
}

/** Position of the currently selected image node, or null. */
function getSelectedImagePos(editor: Editor): number | null {
  const sel = editor.state.selection as { from: number; node?: { type: { name: string } } };
  return sel.node?.type.name === 'image' ? sel.from : null;
}

function dispatchLayerSwap(editor: Editor, posA: number, posB: number): void {
  const { doc, tr } = editor.state;
  const nodeA = doc.nodeAt(posA);
  const nodeB = doc.nodeAt(posB);
  if (!nodeA || !nodeB) return;
  tr.setNodeAttribute(posA, 'zIndex', nodeB.attrs.zIndex);
  tr.setNodeAttribute(posB, 'zIndex', nodeA.attrs.zIndex);
  editor.view.dispatch(tr);
}

// ─────────────────────────────────────────────────────────────────────────────

function ImageSettings({ editor }: { editor: Editor }) {
  const attrs    = editor.getAttributes('image');
  const width    = (attrs.width    as number | undefined) ?? 0;
  const height   = (attrs.height   as number | null | undefined) ?? null;
  const align    = (attrs.align    as string | undefined) ?? 'left';
  const isFree   = (attrs.position as string | undefined) === 'free';
  const wrapText = (attrs.wrapText as string | undefined) ?? 'none';
  const posX     = Math.round((attrs.posX as number | undefined) ?? 100);
  const posY     = Math.round((attrs.posY as number | undefined) ?? 100);

  // Layer rank info — computed from the live document state
  let layerRank  = 1;
  let layerTotal = 1;
  let atBottom   = true;
  let atTop      = true;

  if (isFree) {
    const stack   = buildFreeImageStack(editor);
    const myPos   = getSelectedImagePos(editor);
    const myIdx   = myPos !== null ? stack.findIndex(s => s.pos === myPos) : -1;
    layerTotal    = stack.length;
    layerRank     = myIdx >= 0 ? myIdx + 1 : layerTotal;
    atBottom      = myIdx <= 0;
    atTop         = myIdx >= layerTotal - 1;
  }

  const set = (patch: Record<string, unknown>) =>
    editor.chain().focus().updateAttributes('image', patch).run();

  const bringForward = () => {
    const stack = buildFreeImageStack(editor);
    const myPos = getSelectedImagePos(editor);
    if (myPos === null) return;
    const idx = stack.findIndex(s => s.pos === myPos);
    if (idx === -1 || idx >= stack.length - 1) return;
    dispatchLayerSwap(editor, stack[idx].pos, stack[idx + 1].pos);
  };

  const sendBackward = () => {
    const stack = buildFreeImageStack(editor);
    const myPos = getSelectedImagePos(editor);
    if (myPos === null) return;
    const idx = stack.findIndex(s => s.pos === myPos);
    if (idx <= 0) return;
    dispatchLayerSwap(editor, stack[idx].pos, stack[idx - 1].pos);
  };

  const btnStyle = (active: boolean): React.CSSProperties => ({
    flex: 1, padding: '4px 0', fontSize: 11, borderRadius: 2, cursor: 'pointer',
    fontFamily: 'Calibri, Arial, sans-serif',
    background: active ? '#ddeeff' : '#ffffff',
    border:     active ? '1px solid #c0d8f0' : '1px solid #d2d0ce',
    color:      active ? '#004e8c' : '#323130',
  });

  return (
    <PanelWrap title="Bild">

      {/* ── Position mode ────────────────────────────────────────────────── */}
      <Label>Placering</Label>
      <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
        <button type="button" style={btnStyle(!isFree)}
          onClick={() => set({ position: 'inline', float: null, align: 'left' })}>
          Infogad
        </button>
        <button type="button" style={btnStyle(isFree)}
          onClick={() => set({ position: 'free', float: null })}>
          Fri
        </button>
      </div>

      {/* ── Alignment (inline / block mode only) ─────────────────────────── */}
      {!isFree && (
        <>
          <Label>Justering</Label>
          <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
            {(['left', 'center', 'right'] as const).map((a) => (
              <button key={a} type="button" style={btnStyle(align === a)}
                onClick={() => set({ align: a, float: null })}>
                {a === 'left' ? 'Vänster' : a === 'center' ? 'Center' : 'Höger'}
              </button>
            ))}
          </div>
        </>
      )}

      {/* ── Width ────────────────────────────────────────────────────────── */}
      <Label>Bredd (px)</Label>
      <input
        type="range" min={80} max={816} step={10}
        value={width || 400}
        onChange={(e) => set({ width: Number(e.target.value) })}
        style={{ width: '100%', accentColor: '#0078d4', marginBottom: 4 }}
      />
      <p style={{ fontSize: 11, color: '#605e5c', textAlign: 'right',
        fontFamily: 'Calibri, Arial, sans-serif', marginBottom: 16 }}>
        {width || 400} px
      </p>

      {/* ── Layer order (free mode only, only when > 1 free image) ──────── */}
      {isFree && layerTotal > 1 && (
        <>
          <Label>Lagerordning</Label>

          {/* Rank display */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: 8, marginBottom: 8,
          }}>
            <span style={{
              fontSize: 11, fontFamily: 'Calibri, Arial, sans-serif',
              color: '#323130',
            }}>
              Lager {layerRank} av {layerTotal}
            </span>
          </div>

          {/* Forward / backward buttons */}
          <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
            <button
              type="button"
              disabled={atBottom}
              onClick={sendBackward}
              style={{ ...layerBtnStyle, opacity: atBottom ? 0.35 : 1, cursor: atBottom ? 'default' : 'pointer' }}
            >
              ↓ Bakåt
            </button>
            <button
              type="button"
              disabled={atTop}
              onClick={bringForward}
              style={{ ...layerBtnStyle, opacity: atTop ? 0.35 : 1, cursor: atTop ? 'default' : 'pointer' }}
            >
              ↑ Framåt
            </button>
          </div>
        </>
      )}

      {/* ── Text wrap (free mode only) ───────────────────────────────────── */}
      {isFree && (
        <>
          <Label>Textflöde</Label>
          <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
            {(['none', 'left', 'right'] as const).map((w) => (
              <button key={w} type="button" style={btnStyle(wrapText === w)}
                onClick={() => set({ wrapText: w })}>
                {w === 'none' ? 'Inget' : w === 'left' ? 'Vänster' : 'Höger'}
              </button>
            ))}
          </div>
        </>
      )}

      {/* ── Free position coordinates ─────────────────────────────────────── */}
      {isFree && (
        <>
          <Label>Position (px från sidkant)</Label>
          <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 10, color: '#605e5c', fontFamily: 'Calibri, Arial, sans-serif', marginBottom: 2 }}>X (vänster)</p>
              <input type="number" value={posX} min={0} step={1}
                onChange={(e) => set({ posX: Number(e.target.value) })}
                style={coordInputStyle} />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 10, color: '#605e5c', fontFamily: 'Calibri, Arial, sans-serif', marginBottom: 2 }}>Y (topp)</p>
              <input type="number" value={posY} min={0} step={1}
                onChange={(e) => set({ posY: Number(e.target.value) })}
                style={coordInputStyle} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
            <button type="button" style={{ ...quickBtnStyle }}
              onClick={() => set({ posX: 0, posY: 0 })} title="Placera i sidans övre vänstra hörn">
              Övre vänster
            </button>
            <button type="button" style={{ ...quickBtnStyle }}
              onClick={() => set({ posX: 96, posY: 96 })} title="Placera i textområdets övre vänstra hörn (96px marginal)">
              Textyta
            </button>
            <button type="button" style={{ ...quickBtnStyle, color: '#0078d4', borderColor: '#c0d8f0' }}
              onClick={() => set({ posX: 0, posY: 0, width: 816, height: 1056 })}
              title="Sträck bilden till hela sidan (816×1056 px)">
              Fyll sida
            </button>
          </div>

          {/* ── Height ────────────────────────────────────────────────────── */}
          <Label>Höjd (px, tomt = auto)</Label>
          <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
            <input
              type="number"
              min={0}
              step={10}
              value={height ?? ''}
              placeholder="auto"
              onChange={(e) => set({ height: e.target.value ? Number(e.target.value) : null })}
              style={{ ...coordInputStyle, flex: 1 }}
            />
            {height !== null && (
              <button type="button" style={{ ...quickBtnStyle, flexShrink: 0, padding: '3px 8px' }}
                onClick={() => set({ height: null })} title="Återställ till automatisk höjd">
                ×
              </button>
            )}
          </div>
        </>
      )}

    </PanelWrap>
  );
}

const layerBtnStyle: React.CSSProperties = {
  flex: 1, padding: '4px 0', fontSize: 11, borderRadius: 2,
  border: '1px solid #d2d0ce', background: '#fff',
  fontFamily: 'Calibri, Arial, sans-serif', color: '#323130',
};

const coordInputStyle: React.CSSProperties = {
  width: '100%', padding: '3px 6px', fontSize: 12,
  border: '1px solid #d2d0ce', borderRadius: 2,
  fontFamily: 'Calibri, Arial, sans-serif',
  color: '#1e1e1e', background: '#fff',
};

const quickBtnStyle: React.CSSProperties = {
  flex: 1, padding: '3px 4px', fontSize: 10, borderRadius: 2, cursor: 'pointer',
  border: '1px solid #d2d0ce', background: '#fff',
  fontFamily: 'Calibri, Arial, sans-serif', color: '#323130',
};

// ── Table settings ──────────────────────────────────────────────────────────────

function TableSettings({ editor }: { editor: Editor }) {
  return (
    <PanelWrap title="Tabell">
      <div className="flex flex-col gap-1.5">
        <TableBtn label="Lägg till rad" onClick={() => editor.chain().focus().addRowAfter().run()} disabled={!editor.can().addRowAfter()} />
        <TableBtn label="Ta bort rad"   onClick={() => editor.chain().focus().deleteRow().run()} disabled={!editor.can().deleteRow()} />
        <TableBtn label="Lägg till kolumn" onClick={() => editor.chain().focus().addColumnAfter().run()} disabled={!editor.can().addColumnAfter()} />
        <TableBtn label="Ta bort kolumn"   onClick={() => editor.chain().focus().deleteColumn().run()} disabled={!editor.can().deleteColumn()} />
        <div className="h-px bg-[var(--border)] my-1" />
        <TableBtn label="Slå ihop celler"  onClick={() => editor.chain().focus().mergeCells().run()} disabled={!editor.can().mergeCells()} />
        <TableBtn label="Dela cell"        onClick={() => editor.chain().focus().splitCell().run()} disabled={!editor.can().splitCell()} />
        <div className="h-px bg-[var(--border)] my-1" />
        <TableBtn label="Ta bort tabell" danger onClick={() => editor.chain().focus().deleteTable().run()} disabled={!editor.can().deleteTable()} />
      </div>
    </PanelWrap>
  );
}

function TableBtn({ label, onClick, disabled, danger }: { label: string; onClick: () => void; disabled?: boolean; danger?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        width: '100%', padding: '5px 10px', textAlign: 'left', cursor: disabled ? 'not-allowed' : 'pointer',
        fontSize: 12, borderRadius: 2, fontFamily: 'Calibri, Arial, sans-serif',
        opacity: disabled ? 0.4 : 1,
        background: 'transparent',
        border: danger ? '1px solid #f1bbbc' : '1px solid #d2d0ce',
        color: danger ? '#a4262c' : '#323130',
        transition: 'background 0.08s',
      }}
      onMouseEnter={(e) => { if (!disabled) (e.currentTarget as HTMLElement).style.background = danger ? '#fdf3f4' : '#e8e6e3'; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
    >
      {label}
    </button>
  );
}

// ── Signature settings ──────────────────────────────────────────────────────────

function SignatureSettings({ editor }: { editor: Editor }) {
  const attrs    = editor.getAttributes('signatureBlock');
  const fieldType = (attrs.fieldType as string) ?? 'signature';
  const label     = (attrs.label as string) ?? 'Signatur';

  return (
    <PanelWrap title="Signaturfält">
      <Label>Fälttyp</Label>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 16 }}>
        {(['signature', 'name', 'date'] as const).map((ft) => {
          const labels: Record<string, string> = { signature: 'Signatur', name: 'Namnfält', date: 'Datumfält' };
          return (
            <button
              key={ft}
              type="button"
              onClick={() => editor.chain().focus().updateAttributes('signatureBlock', { fieldType: ft }).run()}
              style={{
                padding: '5px 10px', fontSize: 12, textAlign: 'left', cursor: 'pointer',
                borderRadius: 2, fontFamily: 'Calibri, Arial, sans-serif',
                background: fieldType === ft ? '#ddeeff' : 'transparent',
                border: fieldType === ft ? '1px solid #c0d8f0' : '1px solid #d2d0ce',
                color: fieldType === ft ? '#004e8c' : '#323130',
              }}
            >
              {labels[ft]}
            </button>
          );
        })}
      </div>
      <Label>Etikett</Label>
      <input
        type="text"
        value={label}
        onChange={(e) => editor.chain().focus().updateAttributes('signatureBlock', { label: e.target.value }).run()}
        style={{
          width: '100%', padding: '5px 8px', fontSize: 13, borderRadius: 2,
          border: '1px solid #d2d0ce', background: '#ffffff', color: '#1e1e1e',
          fontFamily: 'Calibri, Arial, sans-serif', boxSizing: 'border-box',
          outline: 'none',
        }}
        onFocus={(e) => { (e.currentTarget as HTMLElement).style.border = '1px solid #0078d4'; }}
        onBlur={(e) => { (e.currentTarget as HTMLElement).style.border = '1px solid #d2d0ce'; }}
      />
    </PanelWrap>
  );
}

// ── Variable info ──────────────────────────────────────────────────────────────

function VariableInfo({ editor }: { editor: Editor }) {
  const attrs = editor.getAttributes('variable');
  const key   = (attrs.key as string) ?? '';
  const label = (attrs.label as string) ?? '';
  return (
    <PanelWrap title="Variabel">
      <Label>Variabelnamn</Label>
      <code style={{ display: 'block', wordBreak: 'break-all', fontSize: 11, fontFamily: 'monospace', color: '#7b5ea7', background: '#f4f0fa', border: '1px solid #d6c8f0', padding: '4px 8px', borderRadius: 2, marginBottom: 12 }}>
        {`{{${key}}}`}
      </code>
      <Label>Etikett</Label>
      <p style={{ fontSize: 13, color: '#1e1e1e', fontFamily: 'Calibri, Arial, sans-serif', marginBottom: 12 }}>{label}</p>
      <p style={{ fontSize: 11, color: '#a19f9d', fontFamily: 'Calibri, Arial, sans-serif', fontStyle: 'italic' }}>
        Tryck Backspace för att ta bort variabeln.
      </p>
    </PanelWrap>
  );
}

// ── Placeholder reference ──────────────────────────────────────────────────────

function PlaceholderReference() {
  return (
    <PanelWrap title="Platshållare">
      <p style={{ fontSize: 12, color: '#605e5c', marginBottom: 10, fontFamily: 'Calibri, Arial, sans-serif' }}>
        Tillgängliga variabler att infoga:
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {OFFER_PLACEHOLDERS.map((p) => (
          <div key={p.key} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
            <code style={{ flexShrink: 0, fontSize: 9, fontFamily: 'monospace', color: '#7b5ea7', background: '#f4f0fa', border: '1px solid #d6c8f0', padding: '1px 4px', borderRadius: 2, marginTop: 2 }}>
              {p.key}
            </code>
            <span style={{ fontSize: 12, color: '#605e5c', fontFamily: 'Calibri, Arial, sans-serif' }}>{p.label}</span>
          </div>
        ))}
      </div>
    </PanelWrap>
  );
}

// ── Page settings panel ────────────────────────────────────────────────────────

import type { HFCtxValue } from './header-footer-context';

function PageSettings({ hf }: { hf: HFCtxValue }) {
  const page = hf.pages[hf.activeIdx];
  if (!page) return null;

  const { activeHeader, activeFooter, patchActiveHeader, patchActiveFooter } = hf;

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '5px 8px', fontSize: 13, borderRadius: 2,
    border: '1px solid #d2d0ce', background: '#ffffff', color: '#1e1e1e',
    fontFamily: 'Calibri, Arial, sans-serif', boxSizing: 'border-box',
    outline: 'none',
  };

  const radioRowStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4,
    fontSize: 12, fontFamily: 'Calibri, Arial, sans-serif', color: '#323130',
    cursor: 'pointer',
  };

  const dividerStyle: React.CSSProperties = {
    height: 1, background: '#d2d0ce', margin: '10px 0',
  };

  return (
    <div style={{ borderTop: '2px solid #c8c6c4' }}>
      <div style={{ padding: '8px 16px 4px', background: '#f3f2f1' }}>
        <h3 style={{ fontSize: 11, fontWeight: 600, color: '#605e5c', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: 'Calibri, Arial, sans-serif', margin: 0 }}>
          Sida
        </h3>
      </div>
      <div style={{ padding: '10px 16px', fontFamily: 'Calibri, Arial, sans-serif' }}>

        {/* Page label */}
        <Label>Sidnamn</Label>
        <input
          type="text"
          value={page.label}
          onChange={(e) => hf.renamePage(hf.activeIdx, e.target.value)}
          style={inputStyle}
          onFocus={(e) => { (e.currentTarget as HTMLInputElement).style.border = '1px solid #0078d4'; }}
          onBlur={(e) => { (e.currentTarget as HTMLInputElement).style.border = '1px solid #d2d0ce'; }}
        />

        <div style={dividerStyle} />

        {/* Header section */}
        <label style={{ ...radioRowStyle, marginBottom: 6 }}>
          <input
            type="checkbox"
            checked={activeHeader.enabled}
            onChange={(e) => patchActiveHeader({ enabled: e.target.checked })}
            style={{ accentColor: '#0078d4' }}
          />
          <span style={{ fontSize: 12, fontWeight: 500 }}>Aktivera sidhuvud</span>
        </label>

        {activeHeader.enabled && (
          <div style={{ paddingLeft: 20, marginBottom: 6 }}>
            <label style={radioRowStyle}>
              <input
                type="radio"
                name={`hdr-${page.id}`}
                checked={activeHeader.useDefault}
                onChange={() => patchActiveHeader({ useDefault: true })}
                style={{ accentColor: '#0078d4' }}
              />
              Standard
            </label>
            <label style={radioRowStyle}>
              <input
                type="radio"
                name={`hdr-${page.id}`}
                checked={!activeHeader.useDefault}
                onChange={() => patchActiveHeader({ useDefault: false })}
                style={{ accentColor: '#0078d4' }}
              />
              Unik för denna sida
            </label>
            {!activeHeader.useDefault && (
              <p style={{ fontSize: 11, color: '#a19f9d', fontStyle: 'italic', margin: '2px 0 0', fontFamily: 'Calibri, Arial, sans-serif' }}>
                Redigera i dokumentet ovan.
              </p>
            )}
          </div>
        )}

        <div style={dividerStyle} />

        {/* Footer section */}
        <label style={{ ...radioRowStyle, marginBottom: 6 }}>
          <input
            type="checkbox"
            checked={activeFooter.enabled}
            onChange={(e) => patchActiveFooter({ enabled: e.target.checked })}
            style={{ accentColor: '#0078d4' }}
          />
          <span style={{ fontSize: 12, fontWeight: 500 }}>Aktivera sidfot</span>
        </label>

        {activeFooter.enabled && (
          <div style={{ paddingLeft: 20, marginBottom: 6 }}>
            <label style={radioRowStyle}>
              <input
                type="radio"
                name={`ftr-${page.id}`}
                checked={activeFooter.useDefault}
                onChange={() => patchActiveFooter({ useDefault: true })}
                style={{ accentColor: '#0078d4' }}
              />
              Standard
            </label>
            <label style={radioRowStyle}>
              <input
                type="radio"
                name={`ftr-${page.id}`}
                checked={!activeFooter.useDefault}
                onChange={() => patchActiveFooter({ useDefault: false })}
                style={{ accentColor: '#0078d4' }}
              />
              Unik för denna sida
            </label>
            {!activeFooter.useDefault && (
              <p style={{ fontSize: 11, color: '#a19f9d', fontStyle: 'italic', margin: '2px 0 0', fontFamily: 'Calibri, Arial, sans-serif' }}>
                Redigera i dokumentet ovan.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Layout helpers ─────────────────────────────────────────────────────────────

function PanelWrap({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ padding: '8px 16px 4px', borderBottom: '1px solid #d2d0ce', background: '#f3f2f1' }}>
        <h3 style={{ fontSize: 11, fontWeight: 600, color: '#605e5c', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: 'Calibri, Arial, sans-serif', margin: 0 }}>{title}</h3>
      </div>
      <div style={{ padding: '12px 16px', fontFamily: 'Calibri, Arial, sans-serif' }}>
        {children}
      </div>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <p style={{ fontSize: 11, color: '#605e5c', marginBottom: 6, fontFamily: 'Calibri, Arial, sans-serif' }}>{children}</p>;
}
