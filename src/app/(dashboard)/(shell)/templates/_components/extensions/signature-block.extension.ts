/**
 * SignatureBlockNode — block-level atom for e-signature fields.
 *
 * Renders as a visual sign-here box in the editor.
 * Stored as { type: 'signatureBlock', attrs: { fieldType, label } } in TipTap JSON.
 *
 * fieldType: 'signature' | 'name' | 'date'
 */

import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';
import React from 'react';
import type { NodeViewProps } from '@tiptap/react';

type FieldType = 'signature' | 'name' | 'date';

// ── Icons ─────────────────────────────────────────────────────────────────────

function PenIcon() {
  return React.createElement('svg', { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const },
    React.createElement('path', { d: 'M12 20h9' }),
    React.createElement('path', { d: 'M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z' }),
  );
}

function UserIcon() {
  return React.createElement('svg', { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const },
    React.createElement('path', { d: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2' }),
    React.createElement('circle', { cx: 12, cy: 7, r: 4 }),
  );
}

function CalendarIcon() {
  return React.createElement('svg', { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const },
    React.createElement('rect', { x: 3, y: 4, width: 18, height: 18, rx: 2, ry: 2 }),
    React.createElement('line', { x1: 16, y1: 2, x2: 16, y2: 6 }),
    React.createElement('line', { x1: 8, y1: 2, x2: 8, y2: 6 }),
    React.createElement('line', { x1: 3, y1: 10, x2: 21, y2: 10 }),
  );
}

// ── NodeView component ────────────────────────────────────────────────────────

function SignatureBlockView({ node }: NodeViewProps) {
  const fieldType = (node.attrs.fieldType as FieldType) ?? 'signature';
  const label     = (node.attrs.label as string) ?? 'Signatur';

  const subtext: Record<FieldType, string> = {
    signature: 'Underteckna med e-signatur via länken',
    name:      'Fullständigt namn',
    date:      'Signeringsdatum fylls i automatiskt',
  };

  const icon = fieldType === 'name'
    ? React.createElement(UserIcon)
    : fieldType === 'date'
      ? React.createElement(CalendarIcon)
      : React.createElement(PenIcon);

  return React.createElement(
    NodeViewWrapper,
    { className: 'my-3' },
    React.createElement(
      'div',
      {
        contentEditable: false,
        className:
          'flex items-center gap-3 border-2 border-dashed border-slate-300 rounded-xl px-6 py-4 bg-slate-50 select-none cursor-default',
      },
      React.createElement(
        'div',
        { className: 'w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 shrink-0' },
        icon,
      ),
      React.createElement(
        'div',
        { className: 'flex-1 min-w-0' },
        React.createElement('p', { className: 'text-sm font-medium text-slate-700 mb-0.5' }, label),
        React.createElement('p', { className: 'text-xs text-slate-400' }, subtext[fieldType]),
      ),
      React.createElement(
        'span',
        { className: 'shrink-0 text-xs text-slate-400 bg-slate-200 px-2 py-0.5 rounded font-medium' },
        'Signaturfält',
      ),
    ),
  );
}

// ── Extension ─────────────────────────────────────────────────────────────────

export const SignatureBlockNode = Node.create({
  name: 'signatureBlock',
  group: 'block',
  atom: true,
  draggable: true,
  selectable: true,

  addAttributes() {
    return {
      fieldType: { default: 'signature' },
      label:     { default: 'Signatur' },
    };
  },

  renderHTML({ node, HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, {
      'data-signature-field': node.attrs.fieldType,
      'data-label':           node.attrs.label,
      class:                  'signature-block',
    })];
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-signature-field]',
        getAttrs: (el) => {
          const dom = el as HTMLElement;
          return {
            fieldType: dom.getAttribute('data-signature-field') ?? 'signature',
            label:     dom.getAttribute('data-label') ?? 'Signatur',
          };
        },
      },
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(SignatureBlockView);
  },
});
