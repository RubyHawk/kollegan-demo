'use client';

/**
 * ImageNodeView — React NodeView for the CustomImage extension.
 *
 * Architecture decisions
 * ──────────────────────
 * 1. Toolbar is rendered INSIDE the NodeView when `selected === true`.
 *    `selected` is driven directly by ProseMirror selection state (synchronous).
 *    This eliminates the BubbleMenu / Tippy.js timing issues entirely.
 *
 * 2. Resize uses direct DOM writes (containerRef.style.width) during drag.
 *    updateAttributes is called ONCE on mouseup — drops from ~60 tx/s to 1.
 *
 * 3. NodeViewWrapper has `draggable` so ProseMirror can initiate native
 *    HTML5 drag-and-drop for block repositioning.
 */

import { NodeViewWrapper } from '@tiptap/react';
import type { NodeViewProps } from '@tiptap/react';
import { useRef, useCallback } from 'react';
import type { CSSProperties } from 'react';

const MIN_W = 80;
const MAX_W = 700;

export function ImageNodeView({ node, updateAttributes, selected, editor }: NodeViewProps) {
  const { src, alt, align, width, float: imgFloat } = node.attrs as {
    src: string;
    alt: string | null;
    align: 'left' | 'center' | 'right' | null;
    width: number | null;
    float: 'left' | 'right' | null;
  };

  // DOM ref for direct style mutations during resize — no React state, no transactions
  const containerRef = useRef<HTMLDivElement>(null);
  const resizeRef    = useRef<{ startX: number; startW: number; latestW: number } | null>(null);

  const onResizeStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const startW = width ?? (containerRef.current?.offsetWidth ?? 400);
      resizeRef.current = { startX: e.clientX, startW, latestW: startW };

      const onMove = (ev: MouseEvent) => {
        if (!resizeRef.current || !containerRef.current) return;
        const newW = Math.round(
          Math.min(MAX_W, Math.max(MIN_W, resizeRef.current.startW + (ev.clientX - resizeRef.current.startX))),
        );
        resizeRef.current.latestW = newW;
        // Direct DOM write — ZERO Tiptap transactions while dragging
        containerRef.current.style.width = `${newW}px`;
      };

      const onUp = () => {
        if (resizeRef.current) {
          // Single transaction on release
          updateAttributes({ width: resizeRef.current.latestW });
        }
        resizeRef.current = null;
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
      };

      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    },
    [width, updateAttributes],
  );

  // ── Command helpers ──────────────────────────────────────────────────────────

  const setFloat = (f: 'left' | 'right' | null) =>
    editor?.chain().focus().updateAttributes('image', {
      float: f,
      ...(f === null ? { align: 'left' } : {}),
    }).run();

  const setAlign = (a: 'left' | 'center' | 'right') =>
    editor?.chain().focus().updateAttributes('image', { align: a }).run();

  const deleteImage = () => editor?.chain().focus().deleteSelection().run();

  // ── Layout styles ────────────────────────────────────────────────────────────

  const isFloating = imgFloat === 'left' || imgFloat === 'right';

  const wrapperStyle: CSSProperties = isFloating
    ? {
        float: imgFloat as 'left' | 'right',
        margin: imgFloat === 'left' ? '4px 20px 8px 0' : '4px 0 8px 20px',
        display: 'block',
        lineHeight: 0,
      }
    : {
        display: 'flex',
        justifyContent:
          align === 'center' ? 'center' : align === 'right' ? 'flex-end' : 'flex-start',
        lineHeight: 0,
        margin: '4px 0',
      };

  const containerWidth = width ? `${width}px` : isFloating ? '200px' : undefined;

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    // draggable enables ProseMirror's native block drag-and-drop
    <NodeViewWrapper draggable style={wrapperStyle}>
      <div
        ref={containerRef}
        style={{
          position: 'relative',
          display: 'inline-block',
          width: containerWidth,
          maxWidth: '100%',
          userSelect: 'none',
        }}
      >

        {/* ── Inline toolbar — driven by ProseMirror selected prop ── */}
        {selected && (
          <div
            contentEditable={false}
            style={{
              position: 'absolute',
              top: -48,
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 100,
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              background: 'white',
              border: '1px solid #e2e8f0',
              borderRadius: 8,
              boxShadow: '0 4px 14px rgba(0,0,0,0.13)',
              padding: '3px 6px',
              whiteSpace: 'nowrap',
            }}
          >
            {/* Section label */}
            <span style={{ fontSize: 10, color: '#94a3b8', paddingRight: 2, fontFamily: 'system-ui,sans-serif', userSelect: 'none' }}>
              Layout
            </span>

            {/* Block (no float) */}
            <ImgBtn
              active={!imgFloat}
              tooltip="Block — text ovanför och under bilden"
              onClick={() => setFloat(null)}
            >
              <BlockIcon />
            </ImgBtn>

            {/* Float left */}
            <ImgBtn
              active={imgFloat === 'left'}
              tooltip="Text flödar till höger om bilden"
              onClick={() => setFloat('left')}
            >
              <FloatLeftIcon />
            </ImgBtn>

            {/* Float right */}
            <ImgBtn
              active={imgFloat === 'right'}
              tooltip="Text flödar till vänster om bilden"
              onClick={() => setFloat('right')}
            >
              <FloatRightIcon />
            </ImgBtn>

            {/* Alignment — block mode only */}
            {!imgFloat && (
              <>
                <div style={{ width: 1, height: 16, background: '#e2e8f0', margin: '0 2px', flexShrink: 0 }} />

                <ImgBtn
                  active={!align || align === 'left'}
                  tooltip="Vänsterjustera"
                  onClick={() => setAlign('left')}
                >
                  <AlignLeftIcon />
                </ImgBtn>

                <ImgBtn
                  active={align === 'center'}
                  tooltip="Centrera"
                  onClick={() => setAlign('center')}
                >
                  <AlignCenterIcon />
                </ImgBtn>

                <ImgBtn
                  active={align === 'right'}
                  tooltip="Högerjustera"
                  onClick={() => setAlign('right')}
                >
                  <AlignRightIcon />
                </ImgBtn>
              </>
            )}

            <div style={{ width: 1, height: 16, background: '#e2e8f0', margin: '0 2px', flexShrink: 0 }} />

            {/* Delete */}
            <ImgBtn
              active={false}
              danger
              tooltip="Ta bort bild"
              onClick={deleteImage}
            >
              <TrashIcon />
            </ImgBtn>
          </div>
        )}

        {/* Blue selection ring */}
        {selected && (
          <div
            style={{
              position: 'absolute',
              inset: -2,
              outline: '2px solid #3b82f6',
              borderRadius: 2,
              pointerEvents: 'none',
              zIndex: 1,
            }}
          />
        )}

        <img
          src={src}
          alt={alt ?? ''}
          draggable={false}
          style={{ display: 'block', width: '100%', height: 'auto', borderRadius: 2 }}
        />

        {/* Right mid-edge resize handle */}
        {selected && (
          <div
            onMouseDown={onResizeStart}
            style={{
              position: 'absolute',
              right: -4,
              top: '50%',
              transform: 'translateY(-50%)',
              width: 8,
              height: 28,
              borderRadius: 4,
              background: '#3b82f6',
              cursor: 'ew-resize',
              zIndex: 2,
              boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
            }}
          />
        )}

        {/* Bottom-right corner resize handle */}
        {selected && (
          <div
            onMouseDown={onResizeStart}
            style={{
              position: 'absolute',
              right: -5,
              bottom: -5,
              width: 10,
              height: 10,
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
// Styling is handled via CSS class in DocumentCanvas's <style> block.
// data-active / data-danger attributes drive state variants via CSS attribute selectors.

function ImgBtn({
  active, danger, tooltip, onClick, children,
}: {
  active: boolean;
  danger?: boolean;
  tooltip: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      className="img-tb-btn"
      data-active={active ? 'true' : undefined}
      data-danger={danger ? 'true' : undefined}
      data-tooltip={tooltip}
      onMouseDown={(e) => { e.preventDefault(); onClick(); }}
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

function AlignLeftIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="3" y1="6"  x2="21" y2="6"/>
      <line x1="3" y1="12" x2="15" y2="12"/>
      <line x1="3" y1="18" x2="18" y2="18"/>
    </svg>
  );
}

function AlignCenterIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="3"  y1="6"  x2="21" y2="6"/>
      <line x1="6"  y1="12" x2="18" y2="12"/>
      <line x1="4"  y1="18" x2="20" y2="18"/>
    </svg>
  );
}

function AlignRightIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="3"  y1="6"  x2="21" y2="6"/>
      <line x1="9"  y1="12" x2="21" y2="12"/>
      <line x1="6"  y1="18" x2="21" y2="18"/>
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"/>
      <path d="M19 6l-1 14H6L5 6"/>
      <path d="M10 11v6"/><path d="M14 11v6"/>
      <path d="M9 6V4h6v2"/>
    </svg>
  );
}
