import type { Editor } from '@tiptap/core';
import type { EditorView } from '@tiptap/pm/view';
import { NodeSelection } from '@tiptap/pm/state';

function createImageNode(state: Editor['state'] | EditorView['state'], src: string) {
  return state.schema.nodes.image?.create({ src }) ?? null;
}

export function insertTemplateImageIntoEditor(editor: Editor, src: string): void {
  const { state, view } = editor;
  const node = createImageNode(state, src);
  if (!node) return;

  const { selection } = state;
  if (selection instanceof NodeSelection && selection.node.type.name === 'image') {
    const insertPos = selection.from + selection.node.nodeSize;
    const tr = state.tr.insert(insertPos, node);
    tr.setSelection(NodeSelection.create(tr.doc, insertPos));
    view.dispatch(tr.scrollIntoView());
    return;
  }

  editor.chain().focus().setImage({ src }).run();
}

export function insertTemplateImageIntoView(view: EditorView, src: string): void {
  const { state } = view;
  const node = createImageNode(state, src);
  if (!node) return;

  const { selection } = state;
  if (selection instanceof NodeSelection && selection.node.type.name === 'image') {
    const insertPos = selection.from + selection.node.nodeSize;
    const tr = state.tr.insert(insertPos, node);
    tr.setSelection(NodeSelection.create(tr.doc, insertPos));
    view.dispatch(tr.scrollIntoView());
    return;
  }

  view.dispatch(state.tr.replaceSelectionWith(node).scrollIntoView());
}
