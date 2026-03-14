'use client';

/**
 * ImageNodeView — React NodeView for the CustomImage extension.
 *
 * Layout modes
 * ────────────
 *  float='left'  → image floats left,  text wraps to the right
 *  float='right' → image floats right, text wraps to the left
 *  float=null    → block: full-width row, aligned left/center/right
 *
 * In both modes:
 *  • Blue selection ring when the node is selected
 *  • Right-edge resize handle (drag to adjust width, 80–700 px)
 */

import { NodeViewWrapper } from '@tiptap/react';
import type { NodeViewProps } from '@tiptap/react';
import { useRef, useCallback } from 'react';
import type { CSSProperties } from 'react';

const MIN_WIDTH = 80;
const MAX_WIDTH = 700;

export function ImageNodeView({ node, updateAttributes, selected }: NodeViewProps) {
  const { src, alt, align, width, float: imgFloat } = node.attrs as {
    src: string;
    alt: string | null;
    align: 'left' | 'center' | 'right' | null;
    width: number | null;
    float: 'left' | 'right' | null;
  };

  const startRef = useRef<{ x: number; w: number } | null>(null);

  const onResizeStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      startRef.current = { x: e.clientX, w: width ?? 400 };

      const onMove = (ev: MouseEvent) => {
        if (!startRef.current) return;
        const newW = Math.round(
          Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, startRef.current.w + (ev.clientX - startRef.current.x))),
        );
        updateAttributes({ width: newW });
      };

      const onUp = () => {
        startRef.current = null;
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
      };

      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    },
    [width, updateAttributes],
  );

  // ── Outer wrapper style ──────────────────────────────────────────────────────
  let wrapperStyle: CSSProperties;

  if (imgFloat === 'left' || imgFloat === 'right') {
    // Float mode: image sits beside text
    wrapperStyle = {
      float: imgFloat,
      margin: imgFloat === 'left' ? '4px 20px 8px 0' : '4px 0 8px 20px',
      // width is controlled by the inner div; wrapper just needs display:block for float
      display: 'block',
      lineHeight: 0,
    };
  } else {
    // Block mode: image is on its own line, aligned left/center/right
    wrapperStyle = {
      display: 'flex',
      justifyContent: align === 'center' ? 'center' : align === 'right' ? 'flex-end' : 'flex-start',
      lineHeight: 0,
      margin: '4px 0',
    };
  }

  const innerWidth = width ? `${width}px` : imgFloat ? '200px' : undefined;

  return (
    <NodeViewWrapper style={wrapperStyle}>
      <div
        style={{
          position: 'relative',
          display: 'inline-block',
          width: innerWidth,
          maxWidth: '100%',
          userSelect: 'none',
        }}
      >
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
            title="Ändra storlek"
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
            title="Ändra storlek"
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
