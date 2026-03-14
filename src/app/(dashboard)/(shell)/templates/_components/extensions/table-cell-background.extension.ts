/**
 * TableCellWithBg / TableHeaderWithBg
 *
 * Extends the built-in TableCell and TableHeader extensions with a
 * `backgroundColor` attribute that is persisted in the document JSON and
 * rendered as an inline `style="background-color: ..."` on the <td>/<th>.
 *
 * Usage (editor command):
 *   editor.chain().focus().setCellAttribute('backgroundColor', '#ffc000').run()
 *   editor.chain().focus().setCellAttribute('backgroundColor', null).run()  // clear
 */

import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';

const bgAttribute = {
  backgroundColor: {
    default: null as string | null,
    /**
     * Prefer the data-bg attribute (original hex) over the computed
     * style.backgroundColor (which browsers may convert to rgb(…)).
     */
    parseHTML: (element: HTMLElement): string | null =>
      element.getAttribute('data-bg') ||
      element.style.backgroundColor ||
      null,
    renderHTML: (attrs: Record<string, unknown>) =>
      attrs.backgroundColor
        ? {
            'data-bg': attrs.backgroundColor as string,
            style: `background-color: ${attrs.backgroundColor}`,
          }
        : {},
  },
};

export const TableCellWithBg = TableCell.extend({
  addAttributes() {
    return { ...this.parent?.(), ...bgAttribute };
  },
});

export const TableHeaderWithBg = TableHeader.extend({
  addAttributes() {
    return { ...this.parent?.(), ...bgAttribute };
  },
});
