'use client';

/**
 * React NodeView for CustomImage.
 *
 * Resize and free-move drags use direct DOM writes during the drag, then a
 * single attribute update on mouseup. Free images use zIndex for layer order.
 */

import { NodeViewWrapper } from '@tiptap/react';
import type { NodeViewProps } from '@tiptap/react';
import { useRef, useCallback, useState, useLayoutEffect } from 'react';
import type { CSSProperties } from 'react';
import { useHeaderFooter } from '../header-footer-context';
import {
  PRESENTATION_PAGE_HEIGHT,
  PRESENTATION_PAGE_WIDTH,
  syncPresentationPageHeightForActivePage,
} from '../presentation-page-height';
import { ImageNodeToolbar } from './image-node-toolbar';
import type { ImgAlign, ImgFloat, ImgPosition, ImgWrapText, StackItem } from './image-node-types';

const MIN_W = 80;
const MAX_W = PRESENTATION_PAGE_WIDTH;

export function ImageNodeView({ node, updateAttributes, selected, editor, getPos }: NodeViewProps) {
  const hf = useHeaderFooter();
  const {
    src, alt,
    align,
    width,
    height:   imgHeight,
    naturalWidth,
    naturalHeight,
    float:    imgFloat,
    position: imgPosition,
    zIndex,
    posX,
    posY,
    wrapText,
    background,
  } = node.attrs as {
    src:      string;
    alt:      string | null;
    align:    ImgAlign;
    width:    number | null;
    height:   number | null;
    naturalWidth: number | null;
    naturalHeight: number | null;
    float:    ImgFloat;
    position: ImgPosition;
    zIndex:   number;
    posX:     number;
    posY:     number;
    wrapText: ImgWrapText;
    background?: boolean;
  };

  const isFree        = imgPosition === 'free';
  const isFreeWrapped = isFree && (wrapText === 'left' || wrapText === 'right');
  const isFloating    = !isFree && (imgFloat === 'left' || imgFloat === 'right');
  const isBackground  = Boolean(background) || (zIndex ?? 0) < 0;
  const applyImagePatch = useCallback((patch: Record<string, unknown>) => {
    updateAttributes(patch);
    syncPresentationPageHeightForActivePage(hf, editor?.getJSON() as object | undefined);
  }, [editor, hf, updateAttributes]);
  //
  // That makes .ProseMirror the containing block for position:absolute children,
  // of data-a4-page).  Coordinates are stored relative to data-a4-page (so that
  // when applying left/top in the editor.
  const [pmOffset, setPmOffset] = useState({ x: 0, y: 0 });
  useLayoutEffect(() => {
    if (!isFree) return;
    const container = containerRef.current;
    if (!container) return;
    let pm: HTMLElement | null = container;
    while (pm && !pm.classList.contains('ProseMirror')) pm = pm.parentElement;
    let page: HTMLElement | null = container;
    while (page && !page.dataset.a4Page) page = page.parentElement;
    if (!pm || !page) return;
    const pmRect   = pm.getBoundingClientRect();
    const pageRect = page.getBoundingClientRect();
    const x = Math.round(pmRect.left - pageRect.left);
    const y = Math.round(pmRect.top  - pageRect.top);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPmOffset(prev => (prev.x === x && prev.y === y ? prev : { x, y }));
  }); // intentionally no deps — re-runs on every render to track header-zone changes
  const containerRef = useRef<HTMLDivElement>(null);
  const resizeRef    = useRef<{ startX: number; startW: number; latestW: number } | null>(null);

  /** Sorted (asc) list of all free images currently in the document. */
  const buildStack = (): StackItem[] => {
    const items: StackItem[] = [];
    editor?.state.doc.descendants((n, pos) => {
      if (n.type.name === 'image' && n.attrs.position === 'free' && n.attrs.background !== true && (n.attrs.zIndex ?? 0) >= 0) {
        items.push({ pos, zIndex: n.attrs.zIndex ?? 0 });
      }
    });
    return items.sort((a, b) => a.zIndex - b.zIndex);
  };

  const getMaxForegroundZ = (): number => {
    let maxZ = -1;
    editor?.state.doc.descendants((n) => {
      if (n.type.name === 'image' && n.attrs.position === 'free' && n.attrs.background !== true && (n.attrs.zIndex ?? 0) >= 0) {
        maxZ = Math.max(maxZ, n.attrs.zIndex ?? 0);
      }
    });
    return Math.max(0, maxZ);
  };

  /** Absolute document position of THIS node. */
  const myDocPos = (): number | null => {
    if (typeof getPos === 'function') {
      const p = getPos();
      return typeof p === 'number' ? p : null;
    }
    let found: number | null = null;
    editor?.state.doc.descendants((n, pos) => {
      if (found !== null) return false;
      if (n === node) { found = pos; return false; }
    });
    return found;
  };
  //
  // Uninvolved images don't re-render, but their rank is unchanged anyway.

  let layerRank  = 1;   // 1-based
  let layerTotal = 1;
  let atBottom   = true;
  let atTop      = true;

  if (isFree && editor && !isBackground) {
    const stack = buildStack();
    const mp    = myDocPos();
    const idx   = mp !== null ? stack.findIndex(s => s.pos === mp) : -1;
    layerTotal  = stack.length;
    layerRank   = idx >= 0 ? idx + 1 : layerTotal;
    atBottom    = idx <= 0;
    atTop       = idx >= layerTotal - 1;
  }

  const bringForward = () => {
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
  };

  const sendBackward = () => {
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
  };

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
        if (resizeRef.current) applyImagePatch({ width: resizeRef.current.latestW });
        resizeRef.current = null;
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
      };

      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    },
    [applyImagePatch, width, isFree],
  );
  //
  // a NodeSelection on simple clicks.  The drag only activates after the pointer

  const onMoveStart = useCallback(
    (e: React.MouseEvent) => {
      if (!isFree) return;
      // synchronously and the right sidebar updates immediately.
      // in its own native mousedown handler and will skip selection if it is set.
      const p = typeof getPos === 'function' ? getPos() : null;
      if (typeof p === 'number') editor?.chain().focus().setNodeSelection(p).run();

      const wrapper = containerRef.current?.parentElement as HTMLElement | null;
      if (!wrapper) return;

      const startX = e.clientX, startY = e.clientY;
      const origX  = posX,      origY  = posY;
      let latestX  = posX,      latestY = posY;
      let dragging = false;
      const offX = pmOffset.x, offY = pmOffset.y;

      const onMove = (ev: MouseEvent) => {
        const dx = ev.clientX - startX;
        const dy = ev.clientY - startY;
        if (!dragging && Math.hypot(dx, dy) > 4) dragging = true;
        if (!dragging) return;
        latestX = origX + dx;
        latestY = origY + dy;
        if (isFreeWrapped) {
          if (wrapText === 'left')  wrapper.style.marginLeft = `${latestX}px`;
          if (wrapText === 'right') wrapper.style.marginRight = `${Math.max(0, 816 - latestX - (width ?? 200))}px`;
          wrapper.style.marginTop = `${latestY}px`;
        } else {
          wrapper.style.left = `${latestX - offX}px`;
          wrapper.style.top  = `${latestY - offY}px`;
        }
      };

      const onUp = () => {
        if (dragging) {
          applyImagePatch({ posX: latestX, posY: latestY });
        }
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
      };

      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    },
    [applyImagePatch, isFree, isFreeWrapped, wrapText, posX, posY, width, getPos, editor, pmOffset],
  );

  const setFloat = (f: ImgFloat) =>
    applyImagePatch({
      float: f,
      position: 'inline',
      ...(f === null ? { align: 'left' } : {}),
    });

  const setAlign = (a: ImgAlign) =>
    applyImagePatch({ align: a });

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
    applyImagePatch({
      position: 'free', float: null, posX: px, posY: py,
      background: false,
      zIndex: getMaxForegroundZ() + 1,
    });
  };

  const toInline = () =>
    applyImagePatch({
      position: 'inline', float: null, align: 'left', wrapText: 'none', background: false,
    });

  const setWrapText = (w: ImgWrapText) =>
    applyImagePatch({ wrapText: w });

  /** Explicit selection — safety net for free-mode images after drag or deselect. */
  const selectSelf = () => {
    if (!isFree) return;
    const p = typeof getPos === 'function' ? getPos() : null;
    if (typeof p === 'number') editor?.commands.setNodeSelection(p);
  };

  const deleteImage = () => editor?.chain().focus().deleteSelection().run();

  // when attrs are missing (e.g. legacy inserts before default-width was added).
  const imgW = width ?? (isFree ? 360 : 360);

  const wrapperStyle: CSSProperties = isFreeWrapped
    ? {
        float:       wrapText as 'left' | 'right',
        marginLeft:  wrapText === 'left'  ? posX                                          : undefined,
        marginRight: wrapText === 'right' ? Math.max(0, 816 - posX - (imgW ?? 200))      : undefined,
        marginTop:   posY,
        marginBottom: 8,
        display:     'block',
        lineHeight:  0,
        width:       imgW ? `${imgW}px` : '200px',
        zIndex:      selected ? 25 : isBackground ? 0 : (zIndex ?? 0),
      }
    : isFree
      ? {
          position:   'absolute',
          // See pmOffset comment above.
          left:       posX - pmOffset.x,
          top:        posY - pmOffset.y,
          zIndex:     selected ? 25 : isBackground ? 0 : (zIndex ?? 0),
          width:      imgW ? `${imgW}px` : '200px',
          display:    'block',
          lineHeight: 0,
        }
      : isFloating
        ? {
            float:        imgFloat as 'left' | 'right',
            marginTop:    4,
            marginRight:  imgFloat === 'left' ? 20 : 0,
            marginBottom: 8,
            marginLeft:   imgFloat === 'left' ? 0 : 20,
            display:      'block',
            lineHeight:   0,
          }
        : {
            display:        'flex',
            justifyContent: align === 'center' ? 'center' : align === 'right' ? 'flex-end' : 'flex-start',
            lineHeight:     0,
            marginTop:      4,
            marginRight:    0,
            marginBottom:   4,
            marginLeft:     0,
          };

  const containerWidth = `${imgW}px`;

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
          cursor:     isFree ? 'move' : 'default',
        }}
        onMouseDown={isFree ? onMoveStart : undefined}
        onClick={isFree ? selectSelf : undefined}
      >

        {selected && (
          <ImageNodeToolbar
            align={align}
            atBottom={atBottom}
            atTop={atTop}
            imgFloat={imgFloat}
            isBackground={isBackground}
            isFree={isFree}
            layerRank={layerRank}
            layerTotal={layerTotal}
            posY={posY}
            wrapText={wrapText}
            onBringForward={bringForward}
            onDelete={deleteImage}
            onFillPage={() => applyImagePatch({
              posX: 0,
              posY: 0,
              width: PRESENTATION_PAGE_WIDTH,
              height: PRESENTATION_PAGE_HEIGHT,
              wrapText: 'none',
              background: false,
            })}
            onSendBackward={sendBackward}
            onSetAlign={setAlign}
            onSetFloat={setFloat}
            onSetWrapText={setWrapText}
            onToggleBackground={() => applyImagePatch(
              isBackground
                ? { background: false, zIndex: getMaxForegroundZ() + 1 }
                : { position: 'free', wrapText: 'none', background: true, zIndex: 0 },
            )}
            onToggleFreeMode={isFree ? toInline : toFree}
          />
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

        {/* Coordinate/position hint lives in the right sidebar now — no on-canvas badge. */}

        <img
          src={src}
          alt={alt ?? ''}
          draggable={false}
          onLoad={(event) => {
            const target = event.currentTarget;
            if (!target.naturalWidth || !target.naturalHeight) return;
            if (naturalWidth === target.naturalWidth && naturalHeight === target.naturalHeight) return;
            applyImagePatch({
              naturalWidth: target.naturalWidth,
              naturalHeight: target.naturalHeight,
            });
          }}
          style={{
            display:    'block',
            width:      '100%',
            height:     imgHeight ? `${imgHeight}px` : 'auto',
            objectFit:  imgHeight ? 'cover' : undefined,
            borderRadius: 2,
          }}
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
