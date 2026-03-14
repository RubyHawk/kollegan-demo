/**
 * DragHandle ProseMirror plugin.
 *
 * Shows a ⠿ grip handle in the left margin when hovering over any block node.
 * Dragging the handle triggers a native ProseMirror NodeSelection drag.
 */

import { Extension } from '@tiptap/core';
import { Plugin } from '@tiptap/pm/state';
import { NodeSelection } from '@tiptap/pm/state';
import type { EditorView } from '@tiptap/pm/view';

function createHandle(): HTMLElement {
  const el = document.createElement('div');
  el.className    = 'tiptap-drag-handle';
  el.draggable    = true;
  el.setAttribute('data-drag-handle', '');
  el.innerHTML    = `
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="9"  cy="5"  r="1.5"/>
      <circle cx="15" cy="5"  r="1.5"/>
      <circle cx="9"  cy="12" r="1.5"/>
      <circle cx="15" cy="12" r="1.5"/>
      <circle cx="9"  cy="19" r="1.5"/>
      <circle cx="15" cy="19" r="1.5"/>
    </svg>`;
  el.style.cssText = `
    position: fixed;
    opacity: 0;
    z-index: 100;
    cursor: grab;
    color: #94a3b8;
    padding: 3px 4px;
    border-radius: 4px;
    transition: opacity 0.12s, background 0.12s;
    pointer-events: auto;
    user-select: none;
    -webkit-user-select: none;
  `;
  return el;
}

function dragHandlePlugin(): Plugin {
  return new Plugin({
    view(view: EditorView) {
      const handle   = createHandle();
      let currentPos = -1;
      let hideTimer: ReturnType<typeof setTimeout> | null = null;

      document.body.appendChild(handle);

      function showAt(dom: HTMLElement, pos: number) {
        if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; }
        currentPos = pos;
        const rect = dom.getBoundingClientRect();
        handle.style.left    = `${rect.left - 30}px`;
        handle.style.top     = `${rect.top + 2}px`;
        handle.style.opacity = '1';
        handle.style.pointerEvents = 'auto';
      }

      function scheduleHide() {
        hideTimer = setTimeout(() => {
          handle.style.opacity = '0';
          handle.style.pointerEvents = 'none';
          currentPos = -1;
        }, 200);
      }

      // ── Mouse move on editor ──────────────────────────────────────────────
      function onMouseMove(e: MouseEvent) {
        // Don't interfere during active drag
        if ((e.buttons & 1) !== 0) return;

        const pos = view.posAtCoords({ left: e.clientX, top: e.clientY });
        if (!pos || pos.inside < 0) { scheduleHide(); return; }

        try {
          let $pos = view.state.doc.resolve(pos.pos);
          // Walk up to depth 1 (top-level block)
          while ($pos.depth > 1) {
            $pos = view.state.doc.resolve($pos.before($pos.depth));
          }
          const nodePos  = $pos.depth === 0 ? 0 : $pos.before($pos.depth);
          const nodeDom  = view.nodeDOM(nodePos) as HTMLElement | null;
          if (!nodeDom) { scheduleHide(); return; }
          showAt(nodeDom, nodePos);
        } catch {
          scheduleHide();
        }
      }

      function onEditorMouseLeave() { scheduleHide(); }

      // ── Handle hover ─────────────────────────────────────────────────────
      handle.addEventListener('mouseenter', () => {
        if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; }
        handle.style.background = 'var(--surface-hover, #f1f5f9)';
        handle.style.color      = 'var(--text-primary, #334155)';
      });
      handle.addEventListener('mouseleave', () => {
        handle.style.background = 'transparent';
        handle.style.color      = '#94a3b8';
        scheduleHide();
      });

      // ── Drag start ────────────────────────────────────────────────────────
      handle.addEventListener('dragstart', (e: DragEvent) => {
        if (currentPos < 0) return;
        try {
          const tr = view.state.tr.setSelection(
            NodeSelection.create(view.state.doc, currentPos),
          );
          view.dispatch(tr);
          e.dataTransfer!.effectAllowed = 'move';
          e.dataTransfer!.setData('text/html', '');
        } catch {
          // ignore if node position is invalid
        }
        handle.style.cursor = 'grabbing';
      });

      handle.addEventListener('dragend', () => {
        handle.style.cursor = 'grab';
      });

      view.dom.addEventListener('mousemove', onMouseMove);
      view.dom.addEventListener('mouseleave', onEditorMouseLeave);

      return {
        destroy() {
          view.dom.removeEventListener('mousemove', onMouseMove);
          view.dom.removeEventListener('mouseleave', onEditorMouseLeave);
          if (hideTimer) clearTimeout(hideTimer);
          handle.remove();
        },
      };
    },
  });
}

export const DragHandleExtension = Extension.create({
  name: 'dragHandle',

  addProseMirrorPlugins() {
    return [dragHandlePlugin()];
  },
});
