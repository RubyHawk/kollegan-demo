'use client';

/**
 * ImageNodeView — React NodeView for the CustomImage extension.
 *
 * Architecture decisions
 * ──────────────────────
 * 1. Toolbar rendered INSIDE the NodeView when `selected === true`.
 *    Driven by ProseMirror selection state (sync) — no BubbleMenu/Tippy race.
 *
 * 2. All drag operations (resize + free-move) use direct DOM writes during
 *    the drag and a single updateAttributes call on mouseup.
 *
 * 3. Layout modes
 *    ┌─────────────────────────────────────────────────────────┐
 *    │  inline / block  │  normal flow, flex or CSS float      │
 *    │  inline / float  │  CSS float with text wrapping        │
 *    │  free            │  position:absolute on NodeViewWrapper │
 *    │                  │  relative to the A4 page canvas       │
 *    └─────────────────────────────────────────────────────────┘
 *
 * 4. Layer management (free mode only)
 *    Free images form a bounded stack tracked by their `zIndex` attribute.
 *    Values are always ≥ 0.  The rank (1-based position in the sorted stack)
 *    is computed live from the document on every render.
 *
 *    bringForward / sendBackward swap the z-index of THIS image with its
 *    immediate neighbour in the stack via a single ProseMirror transaction
 *    (two setNodeAttribute calls, atomically committed).
 *
 *    Buttons are disabled at the stack boundaries — no element can move
 *    beyond the occupied range.
 *
 * 5. Free-mode drag-to-move
 *    mousedown on the image body starts a move drag.  Delta from the drag
 *    start is added to posX/posY.  The NodeViewWrapper's left/top style is
 *    mutated directly for zero-latency movement; updateAttributes fires once
 *    on mouseup.  The A4 page ancestor is found via `data-a4-page` attribute
 *    for bounds clamping.
 */

import { NodeViewWrapper } from '@tiptap/react';
import type { NodeViewProps } from '@tiptap/react';
import { useRef, useCallback } from 'react';
import type { CSSProperties } from 'react';

const MIN_W = 80;
const MAX_W = 700;

// ── Types ─────────────────────────────────────────────────────────────────────

type ImgPosition = 'inline' | 'free';
type ImgFloat    = 'left' | 'right' | null;
type ImgAlign    = 'left' | 'center' | 'right' | null;

interface StackItem { pos: number; zIndex: number }

// ── Component ─────────────────────────────────────────────────────────────────

export function ImageNodeView({ node, updateAttributes, selected, editor, getPos }: NodeViewProps) {
  const {
    src, alt,
    align,
    width,
    float:    imgFloat,
    position: imgPosition,
    zIndex,
    posX,
    posY,
  } = node.attrs as {
    src:      string;
    alt:      string | null;
    align:    ImgAlign;
    width:    number | null;
    float:    ImgFloat;
    position: ImgPosition;
    zIndex:   number;
    posX:     number;
    posY:     number;
  };

  const isFree     = imgPosition === 'free';
  const isFloating = !isFree && (imgFloat === 'left' || imgFloat === 'right');

  // Refs for direct DOM writes during drags (no React state → no re-renders)
  const containerRef = useRef<HTMLDivElement>(null);
  const resizeRef    = useRef<{ startX: number; startW: number; latestW: number } | null>(null);
  const moveRef      = useRef<{
    startX: number; startY: number;
    origX: number; origY: number;
    latestX: number; latestY: number;
  } | null>(null);

  // ── Layer management helpers ──────────────────────────────────────────────────

  /** Sorted (asc) list of all free images currently in the document. */
  const buildStack = (): StackItem[] => {
    const items: StackItem[] = [];
    editor?.state.doc.descendants((n, pos) => {
      if (n.type.name === 'image' && n.attrs.position === 'free') {
        items.push({ pos, zIndex: Math.max(0, n.attrs.zIndex ?? 0) });
      }
    });
    return items.sort((a, b) => a.zIndex - b.zIndex);
  };

  /** Absolute document position of THIS node. */
  const myDocPos = (): number | null => {
    if (typeof getPos === 'function') {
      const p = getPos();
      return typeof p === 'number' ? p : null;
    }
    // Fallback: scan by reference
    let found: number | null = null;
    editor?.state.doc.descendants((n, pos) => {
      if (found !== null) return false;
      if (n === node) { found = pos; return false; }
    });
    return found;
  };

  // ── Layer rank — computed every render so it's always fresh ──────────────────
  //
  // Both images involved in a swap re-render (their zIndex attrs changed).
  // Uninvolved images don't re-render, but their rank is unchanged anyway.

  let layerRank  = 1;   // 1-based
  let layerTotal = 1;
  let atBottom   = true;
  let atTop      = true;

  if (isFree && editor) {
    const stack = buildStack();
    const mp    = myDocPos();
    const idx   = mp !== null ? stack.findIndex(s => s.pos === mp) : -1;
    layerTotal  = stack.length;
    layerRank   = idx >= 0 ? idx + 1 : layerTotal;
    atBottom    = idx <= 0;
    atTop       = idx >= layerTotal - 1;
  }

  // ── Layer operations ──────────────────────────────────────────────────────────

  const bringForward = useCallback(() => {
    if (!editor || !isFree) return;
    const stack = buildStack();
    const mp    = myDocPos();
    if (mp === null) return;
    const idx = stack.findIndex(s => s.pos === mp);
    if (idx === -1 || idx >= stack.length - 1) return; // already on top
    const me    = stack[idx];
    const above = stack[idx + 1];
    const { tr } = editor.state;
    tr.setNodeAttribute(me.pos,    'zIndex', above.zIndex);
    tr.setNodeAttribute(above.pos, 'zIndex', me.zIndex);
    editor.view.dispatch(tr);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor, isFree, getPos, node]);

  const sendBackward = useCallback(() => {
    if (!editor || !isFree) return;
    const stack = buildStack();
    const mp    = myDocPos();
    if (mp === null) return;
    const idx = stack.findIndex(s => s.pos === mp);
    if (idx <= 0) return; // already at bottom
    const me    = stack[idx];
    const below = stack[idx - 1];
    const { tr } = editor.state;
    tr.setNodeAttribute(me.pos,    'zIndex', below.zIndex);
    tr.setNodeAttribute(below.pos, 'zIndex', me.zIndex);
    editor.view.dispatch(tr);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor, isFree, getPos, node]);

  // ── Resize (bottom-right handle) ────────────────────────────────────────────

  const onResizeStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const startW = width ?? (containerRef.current?.offsetWidth ?? 300);
      resizeRef.current = { startX: e.clientX, startW, latestW: startW };

      const onMove = (ev: MouseEvent) => {
        if (!resizeRef.current || !containerRef.current) return;
        const newW = Math.round(Math.min(MAX_W, Math.max(MIN_W,
          resizeRef.current.startW + (ev.clientX - resizeRef.current.startX),
        )));
        resizeRef.current.latestW = newW;
        containerRef.current.style.width = `${newW}px`;
        if (isFree) {
          const wrapper = containerRef.current.parentElement;
          if (wrapper) wrapper.style.width = `${newW}px`;
        }
      };

      const onUp = () => {
        if (resizeRef.current) updateAttributes({ width: resizeRef.current.latestW });
        resizeRef.current = null;
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
      };

      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    },
    [width, updateAttributes, isFree],
  );

  // ── Free-mode drag to reposition ─────────────────────────────────────────────

  const onMoveStart = useCallback(
    (e: React.MouseEvent) => {
      if (!isFree) return;
      e.preventDefault();
      e.stopPropagation();

      const wrapper = containerRef.current?.parentElement as HTMLElement | null;
      if (!wrapper) return;

      moveRef.current = {
        startX: e.clientX, startY: e.clientY,
        origX: posX, origY: posY,
        latestX: posX, latestY: posY,
      };

      const onMove = (ev: MouseEvent) => {
        if (!moveRef.current) return;
        const newX = moveRef.current.origX + (ev.clientX - moveRef.current.startX);
        const newY = moveRef.current.origY + (ev.clientY - moveRef.current.startY);
        moveRef.current.latestX = newX;
        moveRef.current.latestY = newY;
        wrapper.style.left = `${newX}px`;
        wrapper.style.top  = `${newY}px`;
      };

      const onUp = () => {
        if (moveRef.current) {
          updateAttributes({ posX: moveRef.current.latestX, posY: moveRef.current.latestY });
        }
        moveRef.current = null;
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
      };

      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    },
    [isFree, posX, posY, updateAttributes],
  );

  // ── Command helpers ───────────────────────────────────────────────────────────

  const setFloat = (f: ImgFloat) =>
    editor?.chain().focus().updateAttributes('image', {
      float: f,
      position: 'inline',
      ...(f === null ? { align: 'left' } : {}),
    }).run();

  const setAlign = (a: ImgAlign) =>
    editor?.chain().focus().updateAttributes('image', { align: a }).run();

  /** Switch to free mode — snaps to the image's current visual position and
   *  places it on top of any existing free images. */
  const toFree = () => {
    let px = posX, py = posY;
    if (containerRef.current) {
      const imgRect = containerRef.current.getBoundingClientRect();
      let el: HTMLElement | null = containerRef.current.parentElement;
      while (el && !el.dataset.a4Page) el = el.parentElement;
      if (el) {
        const pageRect = el.getBoundingClientRect();
        px = Math.round(Math.max(0, imgRect.left - pageRect.left));
        py = Math.round(Math.max(0, imgRect.top  - pageRect.top + el.scrollTop));
      }
    }
    // Place on top of existing free-image stack
    let maxZ = -1;
    editor?.state.doc.descendants((n) => {
      if (n.type.name === 'image' && n.attrs.position === 'free') {
        maxZ = Math.max(maxZ, n.attrs.zIndex ?? 0);
      }
    });
    editor?.chain().focus().updateAttributes('image', {
      position: 'free', float: null, posX: px, posY: py,
      zIndex: Math.max(0, maxZ + 1),
    }).run();
  };

  const toInline = () =>
    editor?.chain().focus().updateAttributes('image', {
      position: 'inline', float: null, align: 'left',
    }).run();

  const deleteImage = () => editor?.chain().focus().deleteSelection().run();

  // ── Layout styles ─────────────────────────────────────────────────────────────

  const imgW = width ?? (isFree ? 200 : undefined);

  const wrapperStyle: CSSProperties = isFree
    ? {
        position:   'absolute',
        left:       posX,
        top:        posY,
        zIndex:     Math.max(0, zIndex ?? 0),
        width:      imgW ? `${imgW}px` : '200px',
        display:    'block',
        lineHeight: 0,
      }
    : isFloating
      ? {
          float:      imgFloat as 'left' | 'right',
          margin:     imgFloat === 'left' ? '4px 20px 8px 0' : '4px 0 8px 20px',
          display:    'block',
          lineHeight: 0,
        }
      : {
          display:        'flex',
          justifyContent: align === 'center' ? 'center' : align === 'right' ? 'flex-end' : 'flex-start',
          lineHeight:     0,
          margin:         '4px 0',
        };

  const containerWidth = imgW ? `${imgW}px` : isFloating ? '200px' : undefined;

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <NodeViewWrapper draggable={!isFree} style={wrapperStyle}>
      <div
        ref={containerRef}
        style={{
          position:   'relative',
          display:    'inline-block',
          width:      containerWidth,
          maxWidth:   isFree ? undefined : '100%',
          userSelect: 'none',
          cursor:     isFree && !selected ? 'move' : 'default',
        }}
        onMouseDown={isFree ? onMoveStart : undefined}
      >

        {/* ── Floating toolbar — shown when selected ──────────────────────── */}
        {selected && (
          <div
            contentEditable={false}
            style={{
              position:   'absolute',
              top:        -52,
              left:       '50%',
              transform:  'translateX(-50%)',
              zIndex:     200,
              display:    'flex',
              alignItems: 'center',
              gap:        2,
              background: 'white',
              border:     '1px solid #e2e8f0',
              borderRadius: 8,
              boxShadow:  '0 4px 14px rgba(0,0,0,0.13)',
              padding:    '3px 6px',
              whiteSpace: 'nowrap',
            }}
          >
            <span style={{ fontSize: 10, color: '#94a3b8', paddingRight: 2,
              fontFamily: 'system-ui,sans-serif', userSelect: 'none' }}>
              Layout
            </span>

            <ImgBtn active={!isFree && !imgFloat} tooltip="Infogad i text — tar upp hela raden" onClick={() => setFloat(null)}>
              <BlockIcon />
            </ImgBtn>

            <ImgBtn active={!isFree && imgFloat === 'left'} tooltip="Text flödar till höger om bilden" onClick={() => setFloat('left')}>
              <FloatLeftIcon />
            </ImgBtn>

            <ImgBtn active={!isFree && imgFloat === 'right'} tooltip="Text flödar till vänster om bilden" onClick={() => setFloat('right')}>
              <FloatRightIcon />
            </ImgBtn>

            <ImgBtn active={isFree} tooltip="Fri placering — absolut position, ignorerar textflöde" onClick={isFree ? toInline : toFree}>
              <FreeIcon />
            </ImgBtn>

            {/* Alignment — inline block mode only */}
            {!isFree && !imgFloat && (
              <>
                <div style={{ width: 1, height: 16, background: '#e2e8f0', margin: '0 2px', flexShrink: 0 }} />
                <ImgBtn active={!align || align === 'left'} tooltip="Vänsterjustera" onClick={() => setAlign('left')}>
                  <AlignLeftIcon />
                </ImgBtn>
                <ImgBtn active={align === 'center'} tooltip="Centrera" onClick={() => setAlign('center')}>
                  <AlignCenterIcon />
                </ImgBtn>
                <ImgBtn active={align === 'right'} tooltip="Högerjustera" onClick={() => setAlign('right')}>
                  <AlignRightIcon />
                </ImgBtn>
              </>
            )}

            {/* Layer controls — free mode only */}
            {isFree && layerTotal > 1 && (
              <>
                <div style={{ width: 1, height: 16, background: '#e2e8f0', margin: '0 2px', flexShrink: 0 }} />

                <span style={{ fontSize: 10, color: '#94a3b8', paddingRight: 1,
                  fontFamily: 'system-ui,sans-serif', userSelect: 'none' }}>
                  Lager
                </span>

                <ImgBtn active={false} disabled={atBottom} tooltip="Skicka bakåt" onClick={sendBackward}>
                  <LayerDownIcon />
                </ImgBtn>

                <span style={{
                  fontSize: 10, minWidth: 24, textAlign: 'center',
                  fontFamily: 'system-ui,sans-serif',
                  color: '#475569', fontWeight: 600,
                }}>
                  {layerRank}/{layerTotal}
                </span>

                <ImgBtn active={false} disabled={atTop} tooltip="Flytta framåt" onClick={bringForward}>
                  <LayerUpIcon />
                </ImgBtn>
              </>
            )}

            <div style={{ width: 1, height: 16, background: '#e2e8f0', margin: '0 2px', flexShrink: 0 }} />

            <ImgBtn active={false} danger tooltip="Ta bort bild" onClick={deleteImage}>
              <TrashIcon />
            </ImgBtn>
          </div>
        )}

        {/* Blue selection ring */}
        {selected && (
          <div style={{
            position: 'absolute', inset: -2,
            outline: '2px solid #3b82f6',
            borderRadius: 2,
            pointerEvents: 'none',
            zIndex: 1,
          }} />
        )}

        {/* Free-mode coordinate badge */}
        {selected && isFree && (
          <div
            contentEditable={false}
            style={{
              position: 'absolute', bottom: -22, left: '50%',
              transform: 'translateX(-50%)',
              fontSize: 10, color: '#64748b',
              fontFamily: 'system-ui,sans-serif',
              whiteSpace: 'nowrap', pointerEvents: 'none',
              background: 'rgba(255,255,255,0.85)',
              padding: '1px 6px', borderRadius: 4,
              border: '1px solid #e2e8f0',
            }}
          >
            {Math.round(posX)}, {Math.round(posY)} px
            {layerTotal > 1 && ` · lager ${layerRank}/${layerTotal}`}
          </div>
        )}

        <img
          src={src}
          alt={alt ?? ''}
          draggable={false}
          style={{ display: 'block', width: '100%', height: 'auto', borderRadius: 2 }}
        />

        {/* Bottom-right corner resize handle */}
        {selected && (
          <div
            onMouseDown={onResizeStart}
            style={{
              position: 'absolute', right: -5, bottom: -5,
              width: 10, height: 10,
              borderRadius: '50%',
              background: '#3b82f6',
              cursor: 'nwse-resize',
              zIndex: 2,
              boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
            }}
          />
        )}
      </div>
    </NodeViewWrapper>
  );
}

// ── Toolbar button ─────────────────────────────────────────────────────────────

function ImgBtn({
  active, danger, disabled, tooltip, onClick, children,
}: {
  active: boolean;
  danger?: boolean;
  disabled?: boolean;
  tooltip: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      className="img-tb-btn"
      disabled={disabled}
      data-active={active ? 'true' : undefined}
      data-danger={danger ? 'true' : undefined}
      data-tooltip={tooltip}
      onMouseDown={(e) => { e.preventDefault(); if (!disabled) onClick(); }}
    >
      {children}
    </button>
  );
}

// ── Icons ──────────────────────────────────────────────────────────────────────

function BlockIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
      <rect x="2" y="7" width="16" height="6" rx="1.5"/>
      <rect x="2" y="2" width="16" height="2" rx="1" opacity=".35"/>
      <rect x="2" y="16" width="16" height="2" rx="1" opacity=".35"/>
    </svg>
  );
}

function FloatLeftIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
      <rect x="2" y="3" width="7" height="7" rx="1"/>
      <rect x="11" y="3"  width="7" height="1.5" rx=".75" opacity=".45"/>
      <rect x="11" y="6"  width="7" height="1.5" rx=".75" opacity=".45"/>
      <rect x="11" y="9"  width="5" height="1.5" rx=".75" opacity=".45"/>
      <rect x="2"  y="13" width="16" height="1.5" rx=".75" opacity=".45"/>
      <rect x="2"  y="16" width="12" height="1.5" rx=".75" opacity=".45"/>
    </svg>
  );
}

function FloatRightIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
      <rect x="11" y="3" width="7" height="7" rx="1"/>
      <rect x="2"  y="3"  width="7" height="1.5" rx=".75" opacity=".45"/>
      <rect x="2"  y="6"  width="7" height="1.5" rx=".75" opacity=".45"/>
      <rect x="2"  y="9"  width="5" height="1.5" rx=".75" opacity=".45"/>
      <rect x="2"  y="13" width="16" height="1.5" rx=".75" opacity=".45"/>
      <rect x="2"  y="16" width="12" height="1.5" rx=".75" opacity=".45"/>
    </svg>
  );
}

function FreeIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
      <rect x="2" y="2" width="16" height="16" rx="1.5" fill="none"
        stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 2"/>
      <path d="M10 5.5 7.5 8h5L10 5.5zm0 9 2.5-2.5h-5L10 14.5zm-4.5-4.5L8 12.5v-5L5.5 10zm9 0L12 7.5v5l2.5-2.5z"
        fillRule="evenodd"/>
    </svg>
  );
}

function AlignLeftIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="3" y1="6"  x2="21" y2="6"/>
      <line x1="3" y1="12" x2="15" y2="12"/>
      <line x1="3" y1="18" x2="18" y2="18"/>
    </svg>
  );
}

function AlignCenterIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="3"  y1="6"  x2="21" y2="6"/>
      <line x1="6"  y1="12" x2="18" y2="12"/>
      <line x1="4"  y1="18" x2="20" y2="18"/>
    </svg>
  );
}

function AlignRightIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="3"  y1="6"  x2="21" y2="6"/>
      <line x1="9"  y1="12" x2="21" y2="12"/>
      <line x1="6"  y1="18" x2="21" y2="18"/>
    </svg>
  );
}

function LayerUpIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="17 11 12 6 7 11"/>
      <line x1="12" y1="6" x2="12" y2="18"/>
      <line x1="4" y1="20" x2="20" y2="20"/>
    </svg>
  );
}

function LayerDownIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="7 13 12 18 17 13"/>
      <line x1="12" y1="18" x2="12" y2="6"/>
      <line x1="4" y1="4" x2="20" y2="4"/>
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"/>
      <path d="M19 6l-1 14H6L5 6"/>
      <path d="M10 11v6"/><path d="M14 11v6"/>
      <path d="M9 6V4h6v2"/>
    </svg>
  );
}
