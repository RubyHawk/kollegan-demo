/**
 * VariableNode — inline atom node for template variables.
 *
 * Variables are rendered as colored chips and cannot be partially edited.
 * Stored as { type: 'variable', attrs: { key, label } } in TipTap JSON.
 */

import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';
import { Braces } from 'lucide-react';
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
          'inline-flex cursor-default select-none items-center gap-1 rounded border border-[var(--ui-accent-border)] bg-[var(--ui-surface-selected)] px-1.5 py-0.5 font-mono text-xs text-[var(--ui-accent)]',
        title: `{{${node.attrs.key as string}}}`,
      },
      React.createElement(Braces, { size: 10, strokeWidth: 1.75 }),
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
    // Include {{key}} as text content so that email interpolation can find and
    // replace it. The ReactNodeView overrides the visual appearance in the editor.
    return ['span', mergeAttributes(HTMLAttributes, {
      'data-variable': node.attrs.key,
      'data-label':    node.attrs.label,
      class:           'variable-chip',
    }), `{{${node.attrs.key as string}}}`];
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
