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
    <div className="w-64 shrink-0 hidden lg:flex flex-col overflow-y-auto" style={{ background: '#f3f2f1', borderLeft: '1px solid #d2d0ce' }}>
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
      <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
        {(['left', 'center', 'right'] as const).map((a) => (
          <button
            key={a}
            type="button"
            onClick={() => editor.chain().focus().updateAttributes('image', { align: a }).run()}
            style={{
              flex: 1, padding: '4px 0', fontSize: 12, borderRadius: 2, cursor: 'pointer',
              fontFamily: 'Calibri, Arial, sans-serif',
              background: align === a ? '#ddeeff' : '#ffffff',
              border: align === a ? '1px solid #c0d8f0' : '1px solid #d2d0ce',
              color: align === a ? '#004e8c' : '#323130',
            }}
          >
            {a === 'left' ? 'Vänster' : a === 'center' ? 'Center' : 'Höger'}
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
        style={{ width: '100%', accentColor: '#0078d4', marginBottom: 4 }}
      />
      <p style={{ fontSize: 11, color: '#605e5c', textAlign: 'right', fontFamily: 'Calibri, Arial, sans-serif' }}>{width || 400}px</p>
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
      style={{
        width: '100%', padding: '5px 10px', textAlign: 'left', cursor: disabled ? 'not-allowed' : 'pointer',
        fontSize: 12, borderRadius: 2, fontFamily: 'Calibri, Arial, sans-serif',
        opacity: disabled ? 0.4 : 1,
        background: 'transparent',
        border: danger ? '1px solid #f1bbbc' : '1px solid #d2d0ce',
        color: danger ? '#a4262c' : '#323130',
        transition: 'background 0.08s',
      }}
      onMouseEnter={(e) => { if (!disabled) (e.currentTarget as HTMLElement).style.background = danger ? '#fdf3f4' : '#e8e6e3'; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
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
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 16 }}>
        {(['signature', 'name', 'date'] as const).map((ft) => {
          const labels: Record<string, string> = { signature: 'Signatur', name: 'Namnfält', date: 'Datumfält' };
          return (
            <button
              key={ft}
              type="button"
              onClick={() => editor.chain().focus().updateAttributes('signatureBlock', { fieldType: ft }).run()}
              style={{
                padding: '5px 10px', fontSize: 12, textAlign: 'left', cursor: 'pointer',
                borderRadius: 2, fontFamily: 'Calibri, Arial, sans-serif',
                background: fieldType === ft ? '#ddeeff' : 'transparent',
                border: fieldType === ft ? '1px solid #c0d8f0' : '1px solid #d2d0ce',
                color: fieldType === ft ? '#004e8c' : '#323130',
              }}
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
        style={{
          width: '100%', padding: '5px 8px', fontSize: 13, borderRadius: 2,
          border: '1px solid #d2d0ce', background: '#ffffff', color: '#1e1e1e',
          fontFamily: 'Calibri, Arial, sans-serif', boxSizing: 'border-box',
          outline: 'none',
        }}
        onFocus={(e) => { (e.currentTarget as HTMLElement).style.border = '1px solid #0078d4'; }}
        onBlur={(e) => { (e.currentTarget as HTMLElement).style.border = '1px solid #d2d0ce'; }}
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
      <Label>Variabelnamn</Label>
      <code style={{ display: 'block', wordBreak: 'break-all', fontSize: 11, fontFamily: 'monospace', color: '#7b5ea7', background: '#f4f0fa', border: '1px solid #d6c8f0', padding: '4px 8px', borderRadius: 2, marginBottom: 12 }}>
        {`{{${key}}}`}
      </code>
      <Label>Etikett</Label>
      <p style={{ fontSize: 13, color: '#1e1e1e', fontFamily: 'Calibri, Arial, sans-serif', marginBottom: 12 }}>{label}</p>
      <p style={{ fontSize: 11, color: '#a19f9d', fontFamily: 'Calibri, Arial, sans-serif', fontStyle: 'italic' }}>
        Tryck Backspace för att ta bort variabeln.
      </p>
    </PanelWrap>
  );
}

// ── Placeholder reference ──────────────────────────────────────────────────────

function PlaceholderReference() {
  return (
    <PanelWrap title="Platshållare">
      <p style={{ fontSize: 12, color: '#605e5c', marginBottom: 10, fontFamily: 'Calibri, Arial, sans-serif' }}>
        Tillgängliga variabler att infoga:
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {OFFER_PLACEHOLDERS.map((p) => (
          <div key={p.key} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
            <code style={{ flexShrink: 0, fontSize: 9, fontFamily: 'monospace', color: '#7b5ea7', background: '#f4f0fa', border: '1px solid #d6c8f0', padding: '1px 4px', borderRadius: 2, marginTop: 2 }}>
              {p.key}
            </code>
            <span style={{ fontSize: 12, color: '#605e5c', fontFamily: 'Calibri, Arial, sans-serif' }}>{p.label}</span>
          </div>
        ))}
      </div>
    </PanelWrap>
  );
}

// ── Layout helpers ─────────────────────────────────────────────────────────────

function PanelWrap({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ padding: '8px 16px 4px', borderBottom: '1px solid #d2d0ce', background: '#f3f2f1' }}>
        <h3 style={{ fontSize: 11, fontWeight: 600, color: '#605e5c', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: 'Calibri, Arial, sans-serif', margin: 0 }}>{title}</h3>
      </div>
      <div style={{ padding: '12px 16px', fontFamily: 'Calibri, Arial, sans-serif' }}>
        {children}
      </div>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <p style={{ fontSize: 11, color: '#605e5c', marginBottom: 6, fontFamily: 'Calibri, Arial, sans-serif' }}>{children}</p>;
}
