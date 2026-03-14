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
        // Emit both a data attribute (for round-trip storage) and an inline
        // style (so the image actually renders at the right size immediately).
        renderHTML: (attrs) =>
          attrs.width
            ? { 'data-width': String(attrs.width), style: `width: ${attrs.width}px; max-width: 100%; height: auto;` }
            : { style: 'max-width: 100%; height: auto;' },
      },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(ImageNodeView);
  },
});
