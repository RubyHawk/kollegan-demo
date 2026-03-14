'use client';

/**
 * BlockSettingsSidebar — right contextual panel.
 *
 * Shows settings for the currently selected block type:
 *   - Image: alignment, width
 *   - Table: add/remove row & column, merge/split cells
 *   - SignatureBlock: field type, label
 *   - Variable: which variable is selected
 *   - Nothing: placeholder reference card
 */

import { useEffect, useState } from 'react';
import { useTemplateEditor } from './editor-context';
import { OFFER_PLACEHOLDERS } from '@modules/supporting/offers/domain/template.entity';

type ActiveBlock = 'image' | 'table' | 'signatureBlock' | 'variable' | null;

export default function BlockSettingsSidebar() {
  const editor = useTemplateEditor();
  const [active, setActive] = useState<ActiveBlock>(null);

  useEffect(() => {
    if (!editor) return;
    function update() {
      if (editor!.isActive('image'))          setActive('image');
      else if (editor!.isActive('table'))     setActive('table');
      else if (editor!.isActive('signatureBlock')) setActive('signatureBlock');
      else if (editor!.isActive('variable'))  setActive('variable');
      else                                    setActive(null);
    }
    editor.on('selectionUpdate', update);
    editor.on('transaction',     update);
    return () => {
      editor.off('selectionUpdate', update);
      editor.off('transaction',     update);
    };
  }, [editor]);

  return (
    <div className="w-64 shrink-0 border-l border-[var(--border)] bg-[var(--surface)] flex-col overflow-y-auto hidden lg:flex">
      {active === 'image'          && editor && <ImageSettings editor={editor} />}
      {active === 'table'          && editor && <TableSettings editor={editor} />}
      {active === 'signatureBlock' && editor && <SignatureSettings editor={editor} />}
      {active === 'variable'       && editor && <VariableInfo editor={editor} />}
      {active === null             &&           <PlaceholderReference />}
    </div>
  );
}

// ── Image settings ──────────────────────────────────────────────────────────────

import type { Editor } from '@tiptap/core';

function ImageSettings({ editor }: { editor: Editor }) {
  const attrs  = editor.getAttributes('image');
  const width  = (attrs.width as number | undefined) ?? 0;
  const align  = (attrs.align as string | undefined) ?? 'left';

  return (
    <PanelWrap title="Bild">
      <Label>Justering</Label>
      <div className="flex gap-1 mb-4">
        {(['left', 'center', 'right'] as const).map((a) => (
          <button
            key={a}
            type="button"
            onClick={() => editor.chain().focus().updateAttributes('image', { align: a }).run()}
            className={`flex-1 py-1 text-xs rounded-lg border transition-colors ${
              align === a
                ? 'bg-[var(--accent)] text-white border-[var(--accent)]'
                : 'border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]'
            }`}
          >
            {a === 'left' ? 'Vänster' : a === 'center' ? 'Centrera' : 'Höger'}
          </button>
        ))}
      </div>
      <Label>Bredd (px)</Label>
      <input
        type="range"
        min={80}
        max={700}
        step={10}
        value={width || 400}
        onChange={(e) => editor.chain().focus().updateAttributes('image', { width: Number(e.target.value) }).run()}
        className="w-full accent-[var(--accent)] mb-1"
      />
      <p className="text-xs text-[var(--text-muted)] text-right">{width || 400}px</p>
    </PanelWrap>
  );
}

// ── Table settings ──────────────────────────────────────────────────────────────

function TableSettings({ editor }: { editor: Editor }) {
  return (
    <PanelWrap title="Tabell">
      <div className="flex flex-col gap-1.5">
        <TableBtn label="Lägg till rad" onClick={() => editor.chain().focus().addRowAfter().run()} disabled={!editor.can().addRowAfter()} />
        <TableBtn label="Ta bort rad"   onClick={() => editor.chain().focus().deleteRow().run()} disabled={!editor.can().deleteRow()} />
        <TableBtn label="Lägg till kolumn" onClick={() => editor.chain().focus().addColumnAfter().run()} disabled={!editor.can().addColumnAfter()} />
        <TableBtn label="Ta bort kolumn"   onClick={() => editor.chain().focus().deleteColumn().run()} disabled={!editor.can().deleteColumn()} />
        <div className="h-px bg-[var(--border)] my-1" />
        <TableBtn label="Slå ihop celler"  onClick={() => editor.chain().focus().mergeCells().run()} disabled={!editor.can().mergeCells()} />
        <TableBtn label="Dela cell"        onClick={() => editor.chain().focus().splitCell().run()} disabled={!editor.can().splitCell()} />
        <div className="h-px bg-[var(--border)] my-1" />
        <TableBtn label="Ta bort tabell" danger onClick={() => editor.chain().focus().deleteTable().run()} disabled={!editor.can().deleteTable()} />
      </div>
    </PanelWrap>
  );
}

function TableBtn({ label, onClick, disabled, danger }: { label: string; onClick: () => void; disabled?: boolean; danger?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`w-full py-1.5 px-3 text-xs rounded-lg border transition-colors text-left ${
        danger
          ? 'border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-40'
          : 'border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] disabled:opacity-40'
      } disabled:cursor-not-allowed`}
    >
      {label}
    </button>
  );
}

// ── Signature settings ──────────────────────────────────────────────────────────

function SignatureSettings({ editor }: { editor: Editor }) {
  const attrs    = editor.getAttributes('signatureBlock');
  const fieldType = (attrs.fieldType as string) ?? 'signature';
  const label     = (attrs.label as string) ?? 'Signatur';

  return (
    <PanelWrap title="Signaturfält">
      <Label>Fälttyp</Label>
      <div className="flex flex-col gap-1 mb-4">
        {(['signature', 'name', 'date'] as const).map((ft) => {
          const labels: Record<string, string> = { signature: 'Signatur', name: 'Namnfält', date: 'Datumfält' };
          return (
            <button
              key={ft}
              type="button"
              onClick={() => editor.chain().focus().updateAttributes('signatureBlock', { fieldType: ft }).run()}
              className={`py-1.5 px-3 text-xs rounded-lg border text-left transition-colors ${
                fieldType === ft
                  ? 'bg-[var(--accent)] text-white border-[var(--accent)]'
                  : 'border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]'
              }`}
            >
              {labels[ft]}
            </button>
          );
        })}
      </div>
      <Label>Etikett</Label>
      <input
        type="text"
        value={label}
        onChange={(e) => editor.chain().focus().updateAttributes('signatureBlock', { label: e.target.value }).run()}
        className="w-full px-2 py-1.5 text-sm rounded-lg border border-[var(--border)] bg-[var(--surface-alt,#f8fafc)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
      />
    </PanelWrap>
  );
}

// ── Variable info ──────────────────────────────────────────────────────────────

function VariableInfo({ editor }: { editor: Editor }) {
  const attrs = editor.getAttributes('variable');
  const key   = (attrs.key as string) ?? '';
  const label = (attrs.label as string) ?? '';
  return (
    <PanelWrap title="Variabel">
      <p className="text-xs text-[var(--text-muted)] mb-1">Variabelnamn</p>
      <code className="text-xs font-mono bg-violet-50 text-violet-700 px-2 py-1 rounded border border-violet-200 block break-all">
        {`{{${key}}}`}
      </code>
      <p className="text-xs text-[var(--text-muted)] mt-3 mb-1">Etikett</p>
      <p className="text-sm text-[var(--text-primary)]">{label}</p>
      <p className="text-xs text-[var(--text-muted)] mt-4">
        Tryck Backspace för att ta bort variabeln.
      </p>
    </PanelWrap>
  );
}

// ── Placeholder reference ──────────────────────────────────────────────────────

function PlaceholderReference() {
  return (
    <PanelWrap title="Platshållare">
      <p className="text-xs text-[var(--text-muted)] mb-3">
        Tillgängliga variabler du kan infoga från panelen till vänster:
      </p>
      <div className="flex flex-col gap-1">
        {OFFER_PLACEHOLDERS.map((p) => (
          <div key={p.key} className="flex items-start gap-2">
            <code className="shrink-0 text-[9px] font-mono text-violet-600 bg-violet-50 px-1 py-0.5 rounded border border-violet-100 mt-0.5">
              {p.key}
            </code>
            <span className="text-xs text-[var(--text-muted)]">{p.label}</span>
          </div>
        ))}
      </div>
    </PanelWrap>
  );
}

// ── Layout helpers ─────────────────────────────────────────────────────────────

function PanelWrap({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="p-4">
      <h3 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3">{title}</h3>
      {children}
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <p className="text-xs text-[var(--text-muted)] mb-1.5">{children}</p>;
}
