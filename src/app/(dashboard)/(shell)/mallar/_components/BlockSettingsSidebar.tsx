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

import { useEffect, useRef, useState } from 'react';
import { useTemplateEditor } from './editor-context';
import { useHeaderFooter } from './header-footer-context';
import type { HFCtxValue } from './header-footer-context';
import { uploadTemplateImage } from './template-image-upload';

type ActiveBlock = 'image' | 'table' | 'signatureBlock' | 'variable' | null;

export default function BlockSettingsSidebar() {
  const editor = useTemplateEditor();
  const hf     = useHeaderFooter();
  const [active, setActive] = useState<ActiveBlock>(null);
  const [bgImages, setBgImages] = useState<Array<{ pos: number; src: string }>>([]);

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

  // Track all background images (free + zIndex < 0) for the selection panel
  useEffect(() => {
    if (!editor) return;
    function scanBg() {
      const imgs: Array<{ pos: number; src: string }> = [];
      editor!.state.doc.descendants((n, pos) => {
        if (n.type.name === 'image' && n.attrs.position === 'free' && (n.attrs.zIndex ?? 0) < 0)
          imgs.push({ pos, src: n.attrs.src as string });
      });
      setBgImages(imgs);
    }
    scanBg();
    editor.on('transaction', scanBg);
    return () => { editor.off('transaction', scanBg); };
  }, [editor]);

  return (
    <div className="w-56 shrink-0 hidden 2xl:flex flex-col overflow-y-auto border-l border-[var(--border)] bg-[var(--surface-1)]">
      {/* Background images panel — always visible when background images exist */}
      {editor && bgImages.length > 0 && (
        <div className="border-b border-[var(--border)] p-3 shrink-0">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-2">
            Bakgrundsbilder
          </p>
          {bgImages.map((img) => (
            <div key={img.pos} className="flex items-center gap-2 mb-1.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.src} alt="" className="w-10 h-7 object-cover rounded border border-[var(--border)] shrink-0" />
              <span className="text-[11px] text-[var(--text-secondary)] flex-1 truncate">Bakgrundslager</span>
              <button
                onClick={() => editor.commands.setNodeSelection(img.pos)}
                className="text-[10px] text-[var(--accent)] hover:underline shrink-0"
              >
                Välj
              </button>
            </div>
          ))}
        </div>
      )}

      {active === 'image'          && editor && <ImageSettings editor={editor} hf={hf} />}
      {active === 'table'          && editor && <TableSettings editor={editor} />}
      {active === 'signatureBlock' && editor && <SignatureSettings editor={editor} />}
      {active === 'variable'       && editor && <VariableInfo editor={editor} />}
      {active === null             && hf        && <DocumentSettings hf={hf} />}
      {active === null             && !hf       && <PlaceholderReference />}
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
      items.push({ pos, zIndex: n.attrs.zIndex ?? 0 });
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

function ImageSettings({ editor, hf }: { editor: Editor; hf: HFCtxValue | null }) {
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

  const syncPresentationPageHeight = (patch: Record<string, unknown>) => {
    if (!hf) return;
    const page = hf.pages[hf.activeIdx];
    if (!page || page.kind !== 'presentation') return;

    const merged = { ...attrs, ...patch };
    const shouldSizePageToImage =
      merged.position === 'free'
      && (merged.wrapText ?? 'none') === 'none'
      && Number(merged.posX ?? 0) === 0
      && Number(merged.posY ?? 0) === 0
      && Number(merged.width ?? 0) === 816;

    const nextBody = {
      ...(page.body as { attrs?: Record<string, unknown> }),
      attrs: { ...(((page.body as { attrs?: Record<string, unknown> }).attrs) ?? {}) },
    };

    let nextPageHeight: number | null = null;
    if (shouldSizePageToImage) {
      if (merged.height != null && Number(merged.height) > 0) {
        nextPageHeight = Number(merged.height);
      } else if (Number(merged.naturalWidth ?? 0) > 0 && Number(merged.naturalHeight ?? 0) > 0) {
        nextPageHeight = Math.round((Number(merged.width) / Number(merged.naturalWidth)) * Number(merged.naturalHeight));
      }
    }

    if (nextPageHeight && Number.isFinite(nextPageHeight)) {
      nextBody.attrs.pageHeight = nextPageHeight;
    } else {
      delete nextBody.attrs.pageHeight;
    }

    hf.patchActivePage({ body: nextBody as object });
  };

  const set = (patch: Record<string, unknown>) => {
    editor.chain().focus().updateAttributes('image', patch).run();
    syncPresentationPageHeight(patch);
  };

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
    flex: 1, padding: '4px 0', fontSize: 11, borderRadius: 6, cursor: 'pointer',
    background: active ? 'var(--accent-subtle)' : 'var(--surface-0)',
    border:     active ? '1px solid var(--accent-border)' : '1px solid var(--border)',
    color:      active ? 'var(--accent)' : 'var(--text-primary)',
    transition: 'background 0.1s, border-color 0.1s',
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
        className="w-full accent-[var(--accent)] mb-1"
      />
      <p className="text-[11px] text-[var(--text-muted)] text-right mb-4">
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
              <p style={{ fontSize: 11, color: '#475569', fontFamily: 'system-ui,sans-serif', marginBottom: 3, fontWeight: 600 }}>X — horisontellt</p>
              <input type="number" value={posX} min={0} step={10}
                onChange={(e) => set({ posX: Number(e.target.value) })}
                style={coordInputStyle} />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 11, color: '#475569', fontFamily: 'system-ui,sans-serif', marginBottom: 3, fontWeight: 600 }}>Y — vertikalt</p>
              <input type="number" value={posY} min={0} step={10}
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
              onClick={() => set({ posX: 0, posY: 0, width: 816, height: 1056, wrapText: 'none' })}
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
  flex: 1, padding: '4px 0', fontSize: 11, borderRadius: 6,
  border: '1px solid var(--border)', background: 'var(--surface-0)',
  color: 'var(--text-primary)', cursor: 'pointer',
};

const coordInputStyle: React.CSSProperties = {
  width: '100%', padding: '6px 10px', fontSize: 13, fontWeight: 600,
  border: '1.5px solid #cbd5e1', borderRadius: 6,
  color: '#1e293b', background: '#ffffff',
  outline: 'none', fontFamily: 'ui-monospace,monospace',
};

const quickBtnStyle: React.CSSProperties = {
  flex: 1, padding: '3px 4px', fontSize: 10, borderRadius: 6, cursor: 'pointer',
  border: '1px solid var(--border)', background: 'var(--surface-0)',
  color: 'var(--text-primary)',
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

import { cn } from '@shared/lib/utils';

function TableBtn({ label, onClick, disabled, danger }: { label: string; onClick: () => void; disabled?: boolean; danger?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'w-full px-3 py-1.5 text-left text-xs rounded-md border transition-colors',
        disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer',
        danger
          ? 'border-red-200 text-red-600 hover:bg-red-50 bg-transparent'
          : 'border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--surface-active)] bg-transparent'
      )}
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
              className={cn(
                'w-full px-3 py-1.5 text-xs text-left rounded-md border cursor-pointer transition-colors',
                fieldType === ft
                  ? 'bg-[var(--accent-subtle)] text-[var(--accent)] border-[var(--accent-border)]'
                  : 'bg-[var(--surface-0)] text-[var(--text-primary)] border-[var(--border)] hover:bg-[var(--surface-active)]'
              )}
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
        className="w-full px-2.5 py-1.5 text-sm bg-[var(--surface-0)] border border-[var(--border)] rounded-md text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent-border)]"
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
      <code className="block break-all text-[11px] font-mono text-violet-600 bg-violet-50 border border-violet-200 px-2 py-1 rounded-md mb-3">
        {`{{${key}}}`}
      </code>
      <Label>Etikett</Label>
      <p className="text-sm text-[var(--text-primary)] mb-3">{label}</p>
      <p className="text-[11px] text-[var(--text-muted)] italic">
        Tryck Backspace för att ta bort variabeln.
      </p>
    </PanelWrap>
  );
}

// ── Document settings (shown when nothing is selected) ────────────────────────

function DocumentSettings({ hf }: { hf: HFCtxValue }) {
  const { docSettings, patchDocSettings } = hf;
  const FONTS = ['Calibri', 'Arial', 'Georgia', 'Times New Roman', 'Helvetica Neue'];
  const MARGINS = [
    { key: 'tight',  label: 'Smal',   px: '64 px' },
    { key: 'normal', label: 'Normal', px: '96 px' },
    { key: 'wide',   label: 'Bred',   px: '128 px' },
  ] as const;

  return (
    <PanelWrap title="Dokumentinställningar">
      <Label>Standardteckensnitt</Label>
      <select
        value={docSettings.defaultFont}
        onChange={(e) => patchDocSettings({ defaultFont: e.target.value })}
        className="w-full mb-4 px-2.5 py-1.5 text-sm bg-[var(--surface-0)] border border-[var(--border)] rounded-md text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent-border)]"
        style={{ fontFamily: docSettings.defaultFont }}
      >
        {FONTS.map((f) => (
          <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>
        ))}
      </select>

      <Label>Sidmarginal</Label>
      <div className="flex gap-1 mb-4">
        {MARGINS.map(({ key, label, px }) => (
          <button
            key={key}
            type="button"
            onClick={() => patchDocSettings({ pageMargin: key })}
            title={px}
            className={`flex-1 rounded-md border px-1.5 py-1.5 text-[11px] font-medium transition-colors ${
              docSettings.pageMargin === key
                ? 'border-[var(--accent)] bg-[var(--accent)] text-white'
                : 'border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--accent)]'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <p className="text-[10px] text-[var(--text-muted)] leading-relaxed">
        Klicka på ett block i dokumentet för att se dess inställningar här.
      </p>
    </PanelWrap>
  );
}

// ── Fallback (no HF context) ───────────────────────────────────────────────────

function PlaceholderReference() {
  return (
    <div className="px-4 py-2 border-b border-[var(--border)]">
      <p className="text-xs text-[var(--text-muted)] leading-tight">
        Inget markerat · Klicka på ett block för inställningar
      </p>
    </div>
  );
}

// ── Page settings panel ────────────────────────────────────────────────────────

function PageSettings({ hf }: { hf: HFCtxValue }) {
  const bgUploadRef = useRef<HTMLInputElement>(null);
  const page = hf.pages[hf.activeIdx];
  if (!page) return null;

  const { activeHeader, activeFooter, patchActiveHeader, patchActiveFooter, patchActivePage } = hf;
  const document = page.document ?? {};

  return (
    <div className="border-t-2 border-[var(--border)]">
      <div className="px-4 py-3 border-b border-[var(--border)]">
        <h3 className="text-[var(--text-muted)] text-[10px] font-semibold uppercase tracking-wider">
          Sida
        </h3>
      </div>
      <div className="px-4 py-3 space-y-3">

        {/* Page label */}
        <div>
          <Label>Sidnamn</Label>
          <input
            type="text"
            value={page.label}
            onChange={(e) => hf.renamePage(hf.activeIdx, e.target.value)}
            className="w-full px-2.5 py-1.5 text-sm bg-[var(--surface-0)] border border-[var(--border)] rounded-md text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent-border)]"
          />
        </div>

        <div>
          <Label>Sidtyp</Label>
          <div className="grid grid-cols-2 gap-1">
            {[
              { key: 'presentation', label: 'Presentation' },
              { key: 'document', label: 'Offertsida' },
            ].map((type) => (
              <button
                key={type.key}
                type="button"
                onClick={() => patchActivePage({
                  kind: type.key as 'presentation' | 'document',
                  document: type.key === 'document'
                    ? {
                        backgroundOpacity: 0.08,
                        watermarkMode: 'bottom',
                        showLogo: true,
                        showSenderDetails: true,
                        showCustomerBlock: true,
                        showIntro: true,
                        showLineItems: true,
                        showSummary: true,
                        showNotes: true,
                        showTerms: true,
                        showFooter: true,
                        summaryPlacement: 'right',
                        ...document,
                      }
                    : undefined,
                })}
                className={`rounded-md border px-2 py-1.5 text-[11px] font-medium transition-colors ${
                  (page.kind ?? 'presentation') === type.key
                    ? 'border-[var(--accent)] bg-[var(--accent)] text-white'
                    : 'border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--accent)]'
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>

        {/* PDF visibility toggle — shown for all page types */}
        <div className="h-px bg-[var(--border)]" />
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-[11px] font-semibold text-[var(--text-secondary)]">Inkludera i kund-PDF</p>
            <p className="text-[10px] text-[var(--text-muted)] mt-0.5">Av = sidan syns ej i kundens nedladdning</p>
          </div>
          <button
            type="button"
            onClick={() => patchActivePage({ includeInCustomerPdf: page.includeInCustomerPdf === false ? true : false })}
            className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors focus:outline-none ${
              page.includeInCustomerPdf !== false ? 'bg-[var(--accent)]' : 'bg-[var(--border)]'
            }`}
            role="switch"
            aria-checked={page.includeInCustomerPdf !== false}
          >
            <span className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
              page.includeInCustomerPdf !== false ? 'translate-x-4' : 'translate-x-0'
            }`} />
          </button>
        </div>

        {page.kind === 'document' && (
          <>
            <div className="h-px bg-[var(--border)]" />

            <div className="space-y-3">
              <div>
                <Label>Bakgrund / watermark</Label>
                <div className="space-y-2">
                  <input
                    type="text"
                    value={document.backgroundImageSrc ?? ''}
                    placeholder="Klistra in bild-URL eller ladda upp en bakgrund"
                    onChange={(e) => patchActivePage({ document: { ...document, backgroundImageSrc: e.target.value } })}
                    className="w-full px-2.5 py-1.5 text-sm bg-[var(--surface-0)] border border-[var(--border)] rounded-md text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent-border)]"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => bgUploadRef.current?.click()}
                      className="flex-1 rounded-md border border-[var(--border)] px-2.5 py-1.5 text-[11px] font-medium text-[var(--text-secondary)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
                    >
                      Ladda upp bild
                    </button>
                    {document.backgroundImageSrc && (
                      <button
                        type="button"
                        onClick={() => patchActivePage({ document: { ...document, backgroundImageSrc: '' } })}
                        className="rounded-md border border-[var(--border)] px-2.5 py-1.5 text-[11px] font-medium text-[var(--text-secondary)] transition-colors hover:border-red-300 hover:text-red-500"
                      >
                        Rensa
                      </button>
                    )}
                  </div>
                  <input
                    ref={bgUploadRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      e.target.value = '';
                      if (!file) return;
                      try {
                        const src = await uploadTemplateImage(file);
                        patchActivePage({ document: { ...document, backgroundImageSrc: src } });
                      } catch (error) {
                        window.alert(error instanceof Error ? error.message : 'Kunde inte ladda upp bakgrunden.');
                      }
                    }}
                  />
                </div>
              </div>

              <div>
                <Label>Bakgrundsstyrka</Label>
                <input
                  type="range"
                  min={0}
                  max={0.2}
                  step={0.01}
                  value={document.backgroundOpacity ?? 0.08}
                  onChange={(e) => patchActivePage({ document: { ...document, backgroundOpacity: Number(e.target.value) } })}
                  className="w-full accent-[var(--accent)]"
                />
              </div>

              <div>
                <Label>Placering av watermark</Label>
                <div className="grid grid-cols-3 gap-1">
                  {[
                    { key: 'top', label: 'Topp' },
                    { key: 'bottom', label: 'Botten' },
                    { key: 'full', label: 'Hel sida' },
                  ].map((option) => (
                    <button
                      key={option.key}
                      type="button"
                      onClick={() => patchActivePage({ document: { ...document, watermarkMode: option.key as 'top' | 'bottom' | 'full' } })}
                      className={`rounded-md border px-2 py-1.5 text-[11px] font-medium transition-colors ${
                        (document.watermarkMode ?? 'bottom') === option.key
                          ? 'border-[var(--accent)] bg-[var(--accent-subtle)] text-[var(--accent)]'
                          : 'border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--accent)]'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {[
                  ['showLogo', 'Logo'],
                  ['showCustomerBlock', 'Kundblock'],
                  ['showSummary', 'Summering'],
                  ['showFooter', 'Footer'],
                ].map(([key, label]) => (
                  <label key={key} className="flex items-center gap-2 text-sm text-[var(--text-primary)] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(document[key as keyof typeof document] ?? true)}
                      onChange={(e) => patchActivePage({ document: { ...document, [key]: e.target.checked } })}
                      className="accent-[var(--accent)]"
                    />
                    <span className="text-xs">{label}</span>
                  </label>
                ))}
              </div>
            </div>
          </>
        )}

        <div className="h-px bg-[var(--border)]" />

        {/* Header section */}
        <label className="flex items-center gap-2 text-sm text-[var(--text-primary)] cursor-pointer">
          <input
            type="checkbox"
            checked={activeHeader.enabled}
            onChange={(e) => patchActiveHeader({ enabled: e.target.checked })}
            className="accent-[var(--accent)]"
          />
          <span className="text-sm font-medium">Aktivera sidhuvud</span>
        </label>

        {activeHeader.enabled && (
          <div className="pl-5 space-y-1">
            <label className="flex items-center gap-2 text-sm text-[var(--text-primary)] cursor-pointer">
              <input
                type="radio"
                name={`hdr-${page.id}`}
                checked={activeHeader.useDefault}
                onChange={() => patchActiveHeader({ useDefault: true })}
                className="accent-[var(--accent)]"
              />
              Standard
            </label>
            <label className="flex items-center gap-2 text-sm text-[var(--text-primary)] cursor-pointer">
              <input
                type="radio"
                name={`hdr-${page.id}`}
                checked={!activeHeader.useDefault}
                onChange={() => patchActiveHeader({ useDefault: false })}
                className="accent-[var(--accent)]"
              />
              Unik för denna sida
            </label>
            {!activeHeader.useDefault && (
              <p className="text-[11px] text-[var(--text-muted)] italic mt-1">
                Redigera i dokumentet ovan.
              </p>
            )}
          </div>
        )}

        <div className="h-px bg-[var(--border)]" />

        {/* Footer section */}
        <label className="flex items-center gap-2 text-sm text-[var(--text-primary)] cursor-pointer">
          <input
            type="checkbox"
            checked={activeFooter.enabled}
            onChange={(e) => patchActiveFooter({ enabled: e.target.checked })}
            className="accent-[var(--accent)]"
          />
          <span className="text-sm font-medium">Aktivera sidfot</span>
        </label>

        {activeFooter.enabled && (
          <div className="pl-5 space-y-1">
            <label className="flex items-center gap-2 text-sm text-[var(--text-primary)] cursor-pointer">
              <input
                type="radio"
                name={`ftr-${page.id}`}
                checked={activeFooter.useDefault}
                onChange={() => patchActiveFooter({ useDefault: true })}
                className="accent-[var(--accent)]"
              />
              Standard
            </label>
            <label className="flex items-center gap-2 text-sm text-[var(--text-primary)] cursor-pointer">
              <input
                type="radio"
                name={`ftr-${page.id}`}
                checked={!activeFooter.useDefault}
                onChange={() => patchActiveFooter({ useDefault: false })}
                className="accent-[var(--accent)]"
              />
              Unik för denna sida
            </label>
            {!activeFooter.useDefault && (
              <p className="text-[11px] text-[var(--text-muted)] italic mt-1">
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
    <div className="border-b border-[var(--border)]">
      <div className="px-4 py-3">
        <h3 className="text-[var(--text-muted)] text-[10px] font-semibold uppercase tracking-wider">{title}</h3>
      </div>
      <div className="px-4 pb-4">{children}</div>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <p className="text-[var(--text-muted)] text-[11px] mb-1.5">{children}</p>;
}
