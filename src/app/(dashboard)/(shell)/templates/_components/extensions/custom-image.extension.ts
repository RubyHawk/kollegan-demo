/**
 * CustomImage — extends the default Tiptap Image extension with
 * `align` and `width` attributes and a React NodeView.
 *
 * Alignment and width are stored as `data-align` / `data-width` in the HTML
 * output (used by renderHTML / PDF generation).  The editor uses the
 * ImageNodeView React component for live rendering instead of the raw <img>.
 */

import Image from '@tiptap/extension-image';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { ImageNodeView } from './ImageNodeView';

export const CustomImage = Image.extend({
  addAttributes() {
    return {
      // Keep all parent attributes (src, alt, title)
      ...this.parent?.(),

      align: {
        default: 'left',
        parseHTML: (el) => (el as HTMLElement).getAttribute('data-align') ?? 'left',
        renderHTML: (attrs) => ({ 'data-align': attrs.align ?? 'left' }),
      },

      width: {
        default: null,
        parseHTML: (el) => {
          const v = (el as HTMLElement).getAttribute('data-width');
          return v ? Number(v) : null;
        },
        renderHTML: (attrs) =>
          attrs.width
            ? { 'data-width': String(attrs.width), style: `width: ${attrs.width}px; max-width: 100%; height: auto;` }
            : { style: 'max-width: 100%; height: auto;' },
      },

      // float: how the image interacts with surrounding text.
      // null / 'none' = block (takes full line, text above/below)
      // 'left'        = floated left, text wraps to the right
      // 'right'       = floated right, text wraps to the left
      float: {
        default: null,
        parseHTML: (el) => (el as HTMLElement).getAttribute('data-float') ?? null,
        renderHTML: (attrs) => (attrs.float ? { 'data-float': attrs.float } : {}),
      },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(ImageNodeView);
  },
});
