'use client';

/**
 * ImageNodeView — React NodeView for the CustomImage extension.
 *
 * Provides:
 *  - Blue selection ring when the image node is selected
 *  - Right-edge and bottom-right resize handles (drag to resize width)
 *  - Alignment via NodeViewWrapper's justify-content (replaces CSS data-align approach)
 */

import { NodeViewWrapper } from '@tiptap/react';
import type { NodeViewProps } from '@tiptap/react';
import { useRef, useCallback } from 'react';

const MIN_WIDTH = 80;
const MAX_WIDTH = 700;

export function ImageNodeView({ node, updateAttributes, selected }: NodeViewProps) {
  const { src, alt, align, width } = node.attrs as {
    src: string;
    alt: string | null;
    align: 'left' | 'center' | 'right' | null;
    width: number | null;
  };

  const startRef = useRef<{ x: number; w: number } | null>(null);

  const onResizeStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const currentWidth = width ?? 400;
      startRef.current = { x: e.clientX, w: currentWidth };

      const onMove = (ev: MouseEvent) => {
        if (!startRef.current) return;
        const delta = ev.clientX - startRef.current.x;
        const newW = Math.round(
          Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, startRef.current.w + delta)),
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

  const justifyContent =
    align === 'center' ? 'center' : align === 'right' ? 'flex-end' : 'flex-start';

  const imgWidth = width ? `${width}px` : undefined;

  return (
    <NodeViewWrapper
      style={{ display: 'flex', justifyContent, lineHeight: 0, margin: '4px 0' }}
    >
      <div
        style={{
          position: 'relative',
          display: 'inline-block',
          width: imgWidth,
          maxWidth: '100%',
          // Prevent browser native image drag from conflicting with resize
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
