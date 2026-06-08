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
import { Calendar, PenLine, User } from 'lucide-react';
import React from 'react';
import type { NodeViewProps } from '@tiptap/react';

type FieldType = 'signature' | 'name' | 'date';

// ── Icons ─────────────────────────────────────────────────────────────────────

function PenIcon() {
  return React.createElement(PenLine, { size: 16, strokeWidth: 1.75 });
}

function UserIcon() {
  return React.createElement(User, { size: 16, strokeWidth: 1.75 });
}

function CalendarIcon() {
  return React.createElement(Calendar, { size: 16, strokeWidth: 1.75 });
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
            fontSize: 11, color: 'var(--ui-text-muted)', marginBottom: 5,
            fontFamily: 'system-ui,sans-serif', fontWeight: 600,
            textTransform: 'uppercase', letterSpacing: 0,
          },
        }, label),
        React.createElement(
          'div',
          {
            style: {
              display: 'flex', alignItems: 'center', gap: 10,
              background: 'var(--ui-surface-raised)',
              border: '1.5px solid var(--ui-border)',
              borderRadius: 8,
              padding: '10px 14px',
              boxShadow: 'inset 0 1px 3px oklch(0.185 0.018 255 / 0.05)',
            },
          },
          React.createElement(
            'div',
            { style: { color: 'var(--ui-text-muted)', display: 'flex', alignItems: 'center', flexShrink: 0 } },
            React.createElement(UserIcon),
          ),
          React.createElement('span', {
            style: {
              flex: 1, color: 'var(--ui-text-muted)', fontSize: 14,
              fontFamily: 'system-ui,sans-serif', fontStyle: 'italic',
            },
          }, 'Ange fullständigt namn'),
          React.createElement('span', {
            style: {
              fontSize: 10, color: 'var(--ui-text-muted)', background: 'var(--ui-surface-hover)',
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
          border: '2px dashed var(--ui-border)', borderRadius: 12,
          padding: '16px 24px', background: 'var(--ui-surface-subtle)',
          userSelect: 'none', cursor: 'default',
        },
      },
      React.createElement(
        'div',
        {
          style: {
            width: 36, height: 36, borderRadius: '50%',
            background: 'var(--ui-surface-hover)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', color: 'var(--ui-text-muted)', flexShrink: 0,
          },
        },
        icon,
      ),
      React.createElement(
        'div',
        { style: { flex: 1, minWidth: 0 } },
        React.createElement('p', {
          style: {
            fontSize: 14, fontWeight: 500, color: 'var(--ui-text)',
            marginBottom: 2, fontFamily: 'system-ui,sans-serif',
          },
        }, label),
        React.createElement('p', {
          style: { fontSize: 12, color: 'var(--ui-text-muted)', fontFamily: 'system-ui,sans-serif' },
        }, subtext),
      ),
      React.createElement('span', {
        style: {
          flexShrink: 0, fontSize: 11, color: 'var(--ui-text-muted)',
          background: 'var(--ui-surface-hover)', padding: '2px 8px', borderRadius: 4,
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
