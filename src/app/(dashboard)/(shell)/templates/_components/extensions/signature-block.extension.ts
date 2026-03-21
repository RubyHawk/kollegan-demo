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

  // Name field: render like a real text input so it's visually obvious
  if (fieldType === 'name') {
    return React.createElement(
      NodeViewWrapper,
      { className: 'my-3' },
      React.createElement(
        'div',
        { contentEditable: false, style: { userSelect: 'none', cursor: 'default' } },
        React.createElement('p', {
          style: {
            fontSize: 11, color: '#64748b', marginBottom: 5,
            fontFamily: 'system-ui,sans-serif', fontWeight: 600,
            textTransform: 'uppercase', letterSpacing: '0.04em',
          },
        }, label),
        React.createElement(
          'div',
          {
            style: {
              display: 'flex', alignItems: 'center', gap: 10,
              background: '#ffffff',
              border: '1.5px solid #cbd5e1',
              borderRadius: 8,
              padding: '10px 14px',
              boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.05)',
            },
          },
          React.createElement(
            'div',
            { style: { color: '#94a3b8', display: 'flex', alignItems: 'center', flexShrink: 0 } },
            React.createElement(UserIcon),
          ),
          React.createElement('span', {
            style: {
              flex: 1, color: '#94a3b8', fontSize: 14,
              fontFamily: 'system-ui,sans-serif', fontStyle: 'italic',
            },
          }, 'Ange fullständigt namn'),
          React.createElement('span', {
            style: {
              fontSize: 10, color: '#94a3b8', background: '#f1f5f9',
              padding: '2px 8px', borderRadius: 4,
              fontFamily: 'system-ui,sans-serif', fontWeight: 500,
              flexShrink: 0, whiteSpace: 'nowrap',
            },
          }, 'Namnfält'),
        ),
      ),
    );
  }

  // Signature / date fields: keep the dashed-box style (clearly "sign here")
  const isDate   = fieldType === 'date';
  const icon     = isDate ? React.createElement(CalendarIcon) : React.createElement(PenIcon);
  const subtext  = isDate ? 'Signeringsdatum fylls i automatiskt' : 'Underteckna med e-signatur via länken';
  const tagLabel = isDate ? 'Datumfält' : 'Signaturfält';

  return React.createElement(
    NodeViewWrapper,
    { className: 'my-3' },
    React.createElement(
      'div',
      {
        contentEditable: false,
        style: {
          display: 'flex', alignItems: 'center', gap: 12,
          border: '2px dashed #cbd5e1', borderRadius: 12,
          padding: '16px 24px', background: '#f8fafc',
          userSelect: 'none', cursor: 'default',
        },
      },
      React.createElement(
        'div',
        {
          style: {
            width: 36, height: 36, borderRadius: '50%',
            background: '#e2e8f0', display: 'flex', alignItems: 'center',
            justifyContent: 'center', color: '#64748b', flexShrink: 0,
          },
        },
        icon,
      ),
      React.createElement(
        'div',
        { style: { flex: 1, minWidth: 0 } },
        React.createElement('p', {
          style: {
            fontSize: 14, fontWeight: 500, color: '#334155',
            marginBottom: 2, fontFamily: 'system-ui,sans-serif',
          },
        }, label),
        React.createElement('p', {
          style: { fontSize: 12, color: '#94a3b8', fontFamily: 'system-ui,sans-serif' },
        }, subtext),
      ),
      React.createElement('span', {
        style: {
          flexShrink: 0, fontSize: 11, color: '#64748b',
          background: '#e2e8f0', padding: '2px 8px', borderRadius: 4,
          fontFamily: 'system-ui,sans-serif', fontWeight: 500,
        },
      }, tagLabel),
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
