/**
 * CustomImage — extends the default Tiptap Image extension with
 * `align` and `width` attributes so BlockSettingsSidebar can control them.
 *
 * Alignment is stored as `data-align` and applied via CSS in DocumentCanvas.
 * Width is stored as `data-width` and applied as an inline style on the <img>.
 */

import Image from '@tiptap/extension-image';

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
});
