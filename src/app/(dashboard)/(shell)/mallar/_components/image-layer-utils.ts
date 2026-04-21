import type { Editor } from '@tiptap/core';

interface ImageStackItem {
  pos: number;
  zIndex: number;
}

export function buildForegroundImageStack(editor: Editor): ImageStackItem[] {
  const items: ImageStackItem[] = [];
  editor.state.doc.descendants((node, pos) => {
    if (
      node.type.name === 'image'
      && node.attrs.position === 'free'
      && node.attrs.background !== true
      && (node.attrs.zIndex ?? 0) >= 0
    ) {
      items.push({ pos, zIndex: Number(node.attrs.zIndex ?? 0) });
    }
  });
  return items.sort((a, b) => a.zIndex - b.zIndex);
}

export function getSelectedImagePosition(editor: Editor): number | null {
  const selection = editor.state.selection as { from?: number; node?: { type?: { name?: string } } };
  return selection.node?.type?.name === 'image' ? (selection.from ?? null) : null;
}

export function swapImageLayers(editor: Editor, firstPos: number, secondPos: number) {
  const firstNode = editor.state.doc.nodeAt(firstPos);
  const secondNode = editor.state.doc.nodeAt(secondPos);
  if (!firstNode || !secondNode) return;
  const transaction = editor.state.tr;
  transaction.setNodeAttribute(firstPos, 'zIndex', secondNode.attrs.zIndex ?? 0);
  transaction.setNodeAttribute(secondPos, 'zIndex', firstNode.attrs.zIndex ?? 0);
  editor.view.dispatch(transaction);
}

export function getMaxForegroundImageLayer(editor: Editor): number {
  let maxLayer = 0;
  editor.state.doc.descendants((node) => {
    if (
      node.type.name === 'image'
      && node.attrs.position === 'free'
      && node.attrs.background !== true
      && (node.attrs.zIndex ?? 0) >= 0
    ) {
      maxLayer = Math.max(maxLayer, Number(node.attrs.zIndex ?? 0));
    }
  });
  return maxLayer;
}
