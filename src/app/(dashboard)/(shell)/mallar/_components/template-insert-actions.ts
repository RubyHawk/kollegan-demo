import type { Editor } from '@tiptap/core';

export type InsertItemKind =
  | 'heading1'
  | 'heading2'
  | 'paragraph'
  | 'bulletList'
  | 'image'
  | 'table'
  | 'divider'
  | 'signature'
  | 'signatureName'
  | 'signatureDate'
  | 'variable';

export interface InsertPayload {
  kind: InsertItemKind;
  key?: string;
  label?: string;
}

export const TEMPLATE_BLOCK_MIME = 'application/x-kollegan-template-block';

export function encodeInsertPayload(payload: InsertPayload): string {
  return JSON.stringify(payload);
}

export function decodeInsertPayload(raw: string | null | undefined): InsertPayload | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<InsertPayload>;
    if (!parsed.kind) return null;
    return parsed as InsertPayload;
  } catch {
    return null;
  }
}

export function insertTemplatePayload(editor: Editor, payload: InsertPayload): boolean {
  const chain = editor.chain().focus();

  switch (payload.kind) {
    case 'heading1':
      return chain.toggleHeading({ level: 1 }).run();
    case 'heading2':
      return chain.toggleHeading({ level: 2 }).run();
    case 'paragraph':
      return chain.setParagraph().run();
    case 'bulletList':
      return chain.toggleBulletList().run();
    case 'table':
      return chain.insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
    case 'divider':
      return chain.setHorizontalRule().run();
    case 'signature':
      return chain.insertContent({ type: 'signatureBlock', attrs: { fieldType: 'signature', label: payload.label ?? 'Signatur' } }).run();
    case 'signatureName':
      return chain.insertContent({ type: 'signatureBlock', attrs: { fieldType: 'name', label: payload.label ?? 'Fullständigt namn' } }).run();
    case 'signatureDate':
      return chain.insertContent({ type: 'signatureBlock', attrs: { fieldType: 'date', label: payload.label ?? 'Signeringsdatum' } }).run();
    case 'variable':
      if (!payload.key) return false;
      return chain
        .insertContent({
          type: 'variable',
          attrs: { key: payload.key.replace(/[{}]/g, ''), label: payload.label ?? payload.key },
        })
        .run();
    case 'image':
      return false;
    default:
      return false;
  }
}

export function isTipTapDocEmpty(doc: unknown): boolean {
  const root = doc as { content?: Array<{ type?: string; content?: unknown[]; text?: string }> } | null | undefined;
  const content = root?.content ?? [];
  if (content.length === 0) return true;
  return content.every((node) => {
    if (node.type === 'paragraph') {
      return !node.content || node.content.length === 0;
    }
    return false;
  });
}
