import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import { Table } from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import FontFamily from '@tiptap/extension-font-family';
import Highlight from '@tiptap/extension-highlight';
import Placeholder from '@tiptap/extension-placeholder';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import { CustomImage } from './extensions/custom-image.extension';
import { DragHandleExtension } from './extensions/drag-handle.extension';
import { FontSize } from './extensions/font-size.extension';
import { LineHeight } from './extensions/line-height.extension';
import { SignatureBlockNode } from './extensions/signature-block.extension';
import { TableCellWithBg, TableHeaderWithBg } from './extensions/table-cell-background.extension';
import { TextIndent } from './extensions/indent.extension';
import { VariableNode } from './extensions/variable-node.extension';

export function createBodyExtensions() {
  return [
    StarterKit.configure({
      dropcursor: { color: 'var(--accent)', width: 2 },
      link: false,
      underline: false,
    }),
    CustomImage.configure({ allowBase64: true }),
    TextAlign.configure({ types: ['heading', 'paragraph'] }),
    TextStyle,
    Color,
    Underline,
    Link.configure({ openOnClick: false }),
    Table.configure({ resizable: true }),
    TableRow,
    TableHeaderWithBg,
    TableCellWithBg,
    FontFamily,
    FontSize,
    Highlight.configure({ multicolor: true }),
    Subscript,
    Superscript,
    LineHeight,
    TextIndent,
    VariableNode,
    SignatureBlockNode,
    DragHandleExtension,
    Placeholder.configure({
      placeholder: 'Skriv här eller välj en byggsten från panelen till vänster…',
      emptyEditorClass: 'is-editor-empty',
    }),
  ];
}

export const MINI_EXTENSIONS = [
  StarterKit.configure({ dropcursor: false, underline: false }),
  TextAlign.configure({ types: ['heading', 'paragraph'] }),
  TextStyle,
  Color,
  Underline,
  FontFamily,
  FontSize,
  Highlight.configure({ multicolor: true }),
  VariableNode,
];
