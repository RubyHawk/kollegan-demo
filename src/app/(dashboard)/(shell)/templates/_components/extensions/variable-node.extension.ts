/**
 * VariableNode — inline atom node for template variables.
 *
 * Variables are rendered as colored chips and cannot be partially edited.
 * Stored as { type: 'variable', attrs: { key, label } } in TipTap JSON.
 */

import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';
import React from 'react';
import type { NodeViewProps } from '@tiptap/react';

// ── NodeView component ────────────────────────────────────────────────────────

function VariableChip({ node }: NodeViewProps) {
  return React.createElement(
    NodeViewWrapper,
    { as: 'span', style: { display: 'inline' } },
    React.createElement(
      'span',
      {
        contentEditable: false,
        className:
          'inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-violet-100 text-violet-700 text-xs font-mono cursor-default select-none border border-violet-200',
        title: `{{${node.attrs.key as string}}}`,
      },
      React.createElement(
        'svg',
        {
          width: 10,
          height: 10,
          viewBox: '0 0 24 24',
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: 2,
          strokeLinecap: 'round' as const,
          strokeLinejoin: 'round' as const,
        },
        React.createElement('path', { d: 'M8 3H7a2 2 0 0 0-2 2v5a2 2 0 0 1-2 2 2 2 0 0 1 2 2v5c0 1.1.9 2 2 2h1' }),
        React.createElement('path', { d: 'M16 21h1a2 2 0 0 0 2-2v-5c0-1.1.9-2 2-2a2 2 0 0 1-2-2V5a2 2 0 0 0-2-2h-1' }),
      ),
      node.attrs.label as string,
    ),
  );
}

// ── Extension ─────────────────────────────────────────────────────────────────

export const VariableNode = Node.create({
  name: 'variable',
  group: 'inline',
  inline: true,
  atom: true,
  selectable: true,

  addAttributes() {
    return {
      key:   { default: '' },
      label: { default: '' },
    };
  },

  renderHTML({ node, HTMLAttributes }) {
    return ['span', mergeAttributes(HTMLAttributes, {
      'data-variable': node.attrs.key,
      'data-label':    node.attrs.label,
      class:           'variable-chip',
    })];
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-variable]',
        getAttrs: (el) => {
          const dom = el as HTMLElement;
          return {
            key:   dom.getAttribute('data-variable') ?? '',
            label: dom.getAttribute('data-label') ?? dom.textContent ?? '',
          };
        },
      },
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(VariableChip);
  },
});
