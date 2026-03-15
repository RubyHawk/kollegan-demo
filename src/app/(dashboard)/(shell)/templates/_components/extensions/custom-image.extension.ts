/**
 * CustomImage — extends the default Tiptap Image extension with:
 *
 *   align    — block-mode text alignment (left / center / right)
 *   width    — explicit pixel width (null = auto)
 *   float    — text-wrap mode (null = block, 'left', 'right')
 *   position — layout mode: 'inline' (normal flow) | 'free' (absolute)
 *   zIndex   — CSS z-index for layering (meaningful in free mode; works in
 *              inline mode too for floated images overlapping other elements)
 *   posX     — left offset in px relative to the A4 page div (free mode)
 *   posY     — top  offset in px relative to the A4 page div (free mode)
 *
 * All attributes are round-tripped through data-* HTML attributes so they
 * survive save/load and document-generator rendering.
 */

import Image from '@tiptap/extension-image';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { ImageNodeView } from './ImageNodeView';

export const CustomImage = Image.extend({
  addAttributes() {
    return {
      // ── Parent attributes (src, alt, title) ──────────────────────────────
      ...this.parent?.(),

      // ── Block alignment ───────────────────────────────────────────────────
      align: {
        default: 'left',
        parseHTML:  (el) => (el as HTMLElement).getAttribute('data-align') ?? 'left',
        renderHTML: (attrs) => ({ 'data-align': attrs.align ?? 'left' }),
      },

      // ── Explicit pixel width ──────────────────────────────────────────────
      width: {
        default: null,
        parseHTML: (el) => {
          const v = (el as HTMLElement).getAttribute('data-width');
          return v ? Number(v) : null;
        },
        renderHTML: (attrs) =>
          attrs.width
            ? { 'data-width': String(attrs.width), style: `width:${attrs.width}px;max-width:100%;height:auto;` }
            : { style: 'max-width:100%;height:auto;' },
      },

      // ── Text-wrap mode ────────────────────────────────────────────────────
      float: {
        default: null,
        parseHTML:  (el) => (el as HTMLElement).getAttribute('data-float') ?? null,
        renderHTML: (attrs) => (attrs.float ? { 'data-float': attrs.float } : {}),
      },

      // ── Layout mode ───────────────────────────────────────────────────────
      // 'inline' — participates in normal document flow (default)
      // 'free'   — absolutely positioned relative to the A4 page canvas;
      //            removed from flow so other content ignores it entirely
      position: {
        default: 'inline',
        parseHTML:  (el) => (el as HTMLElement).getAttribute('data-position') ?? 'inline',
        renderHTML: (attrs) => ({ 'data-position': attrs.position ?? 'inline' }),
      },

      // ── Stacking order (z-index) ──────────────────────────────────────────
      // Values are always ≥ 0.  The bounded stack is managed by the layer
      // system: the bottom image is 0, each image above increments by 1.
      zIndex: {
        default: 0,
        parseHTML: (el) => {
          const v = (el as HTMLElement).getAttribute('data-zindex');
          return v !== null && v !== '' ? Number(v) : 1;
        },
        renderHTML: (attrs) => ({ 'data-zindex': String(attrs.zIndex ?? 1) }),
      },

      // ── Free-position coordinates ─────────────────────────────────────────
      // Pixel offsets from the top-left corner of the A4 page div.
      // (0, 0) = very top-left corner of the white page, including margins.
      posX: {
        default: 100,
        parseHTML: (el) => {
          const v = (el as HTMLElement).getAttribute('data-posx');
          return v !== null && v !== '' ? Number(v) : 100;
        },
        renderHTML: (attrs) => ({ 'data-posx': String(attrs.posX ?? 100) }),
      },

      posY: {
        default: 100,
        parseHTML: (el) => {
          const v = (el as HTMLElement).getAttribute('data-posy');
          return v !== null && v !== '' ? Number(v) : 100;
        },
        renderHTML: (attrs) => ({ 'data-posy': String(attrs.posY ?? 100) }),
      },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(ImageNodeView);
  },
});
