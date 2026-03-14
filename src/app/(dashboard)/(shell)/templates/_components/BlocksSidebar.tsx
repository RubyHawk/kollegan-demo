'use client';

/**
 * BlocksSidebar — left insert panel.
 *
 * Three sections:
 *   1. Block types (headings, paragraph, image, table, divider)
 *   2. Variables (inserts VariableNode chips)
 *   3. Signature fields (inserts SignatureBlockNode)
 */

import { useRef } from 'react';
import { useTemplateEditor } from './editor-context';
import { OFFER_PLACEHOLDERS } from '@modules/supporting/offers/domain/template.entity';

// Strip {{ }} to get the key used by VariableNode
function toKey(placeholder: string) {
  return placeholder.replace(/[{}]/g, '');
}

export default function BlocksSidebar() {
  const editor = useTemplateEditor();
  const fileRef = useRef<HTMLInputElement>(null);

  if (!editor) return <SidebarShell />;

  function insertImage(file: File) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const src = e.target?.result as string;
      editor!.chain().focus().setImage({ src }).run();
    };
    reader.readAsDataURL(file);
  }

  return (
    <SidebarShell>
      {/* ── Blocks ── */}
      <Section label="BLOCK">
        <InsertItem
          label="Rubrik 1"
          icon={<H1Icon />}
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        />
        <InsertItem
          label="Rubrik 2"
          icon={<H2Icon />}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        />
        <InsertItem
          label="Brödtext"
          icon={<ParagraphIcon />}
          onClick={() => editor.chain().focus().setParagraph().run()}
        />
        <InsertItem
          label="Punktlista"
          icon={<BulletIcon />}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        />
        <InsertItem
          label="Tabell"
          icon={<TableIcon />}
          onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
        />
        <InsertItem
          label="Avdelare"
          icon={<HrIcon />}
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
        />
        <InsertItem
          label="Bild"
          icon={<ImageIcon />}
          onClick={() => fileRef.current?.click()}
        />
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) insertImage(file);
            e.target.value = '';
          }}
        />
      </Section>

      {/* ── Variables ── */}
      <Section label="VARIABLER">
        {OFFER_PLACEHOLDERS
          .filter((p) => p.key !== '{{lineItems}}' && p.key !== '{{signature}}')
          .map((p) => (
            <InsertItem
              key={p.key}
              label={p.label}
              icon={<VarIcon />}
              chip
              onClick={() =>
                editor
                  .chain()
                  .focus()
                  .insertContent({
                    type: 'variable',
                    attrs: { key: toKey(p.key), label: p.label },
                  })
                  .run()
              }
            />
          ))}
        {/* lineItems is a special placeholder — insert as text since it's a full table */}
        <InsertItem
          label="Radartiklar (tabell)"
          icon={<VarIcon />}
          chip
          onClick={() =>
            editor
              .chain()
              .focus()
              .insertContent({
                type: 'variable',
                attrs: { key: 'lineItems', label: 'Radartiklar' },
              })
              .run()
          }
        />
      </Section>

      {/* ── Signature fields ── */}
      <Section label="SIGNATURFÄLT">
        <InsertItem
          label="Signaturfält"
          icon={<PenIcon />}
          onClick={() =>
            editor
              .chain()
              .focus()
              .insertContent({ type: 'signatureBlock', attrs: { fieldType: 'signature', label: 'Signatur' } })
              .run()
          }
        />
        <InsertItem
          label="Namnfält"
          icon={<UserIcon />}
          onClick={() =>
            editor
              .chain()
              .focus()
              .insertContent({ type: 'signatureBlock', attrs: { fieldType: 'name', label: 'Fullständigt namn' } })
              .run()
          }
        />
        <InsertItem
          label="Datumfält"
          icon={<CalendarIcon />}
          onClick={() =>
            editor
              .chain()
              .focus()
              .insertContent({ type: 'signatureBlock', attrs: { fieldType: 'date', label: 'Signeringsdatum' } })
              .run()
          }
        />
      </Section>
    </SidebarShell>
  );
}

// ── Layout helpers ─────────────────────────────────────────────────────────────

function SidebarShell({ children }: { children?: React.ReactNode }) {
  return (
    <div className="w-52 shrink-0 border-r border-[var(--border)] bg-[var(--surface)] flex-col overflow-y-auto hidden md:flex">
      {children}
    </div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="py-2">
      <p className="px-3 pt-2 pb-1 text-[10px] font-semibold text-[var(--text-muted)] tracking-wider uppercase">{label}</p>
      {children}
    </div>
  );
}

function InsertItem({
  label, icon, chip, onClick,
}: {
  label: string;
  icon: React.ReactNode;
  chip?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center gap-2.5 px-3 py-1.5 text-sm text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)] transition-colors text-left"
    >
      <span className="shrink-0 text-[var(--text-muted)]">{icon}</span>
      <span className="truncate">{label}</span>
      {chip && (
        <span className="ml-auto shrink-0 text-[9px] font-mono text-violet-500 bg-violet-50 border border-violet-200 px-1 py-0.5 rounded">
          var
        </span>
      )}
    </button>
  );
}

// ── Icons ──────────────────────────────────────────────────────────────────────

const s = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

function H1Icon()        { return <svg width="14" height="14" viewBox="0 0 24 24" {...s}><path d="M4 12h8"/><path d="M4 6v12"/><path d="M12 6v12"/><path d="M17 10l3 2-3 2"/></svg>; }
function H2Icon()        { return <svg width="14" height="14" viewBox="0 0 24 24" {...s}><path d="M4 12h8"/><path d="M4 6v12"/><path d="M12 6v12"/><path d="M21 18h-4c0-4 4-3 4-6 0-1.5-2-2.5-4-1"/></svg>; }
function ParagraphIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" {...s}><path d="M13 4H6a4 4 0 0 0 0 8h1v8"/><path d="M13 4v16"/></svg>; }
function BulletIcon()    { return <svg width="14" height="14" viewBox="0 0 24 24" {...s}><line x1="9" y1="6" x2="20" y2="6"/><line x1="9" y1="12" x2="20" y2="12"/><line x1="9" y1="18" x2="20" y2="18"/><circle cx="4" cy="6" r="1" fill="currentColor" stroke="none"/><circle cx="4" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="4" cy="18" r="1" fill="currentColor" stroke="none"/></svg>; }
function TableIcon()     { return <svg width="14" height="14" viewBox="0 0 24 24" {...s}><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="12" y1="3" x2="12" y2="21"/></svg>; }
function HrIcon()        { return <svg width="14" height="14" viewBox="0 0 24 24" {...s}><line x1="3" y1="12" x2="21" y2="12"/></svg>; }
function ImageIcon()     { return <svg width="14" height="14" viewBox="0 0 24 24" {...s}><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>; }
function VarIcon()       { return <svg width="13" height="13" viewBox="0 0 24 24" {...s}><path d="M8 3H7a2 2 0 0 0-2 2v5a2 2 0 0 1-2 2 2 2 0 0 1 2 2v5c0 1.1.9 2 2 2h1"/><path d="M16 21h1a2 2 0 0 0 2-2v-5c0-1.1.9-2 2-2a2 2 0 0 1-2-2V5a2 2 0 0 0-2-2h-1"/></svg>; }
function PenIcon()       { return <svg width="14" height="14" viewBox="0 0 24 24" {...s}><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>; }
function UserIcon()      { return <svg width="14" height="14" viewBox="0 0 24 24" {...s}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>; }
function CalendarIcon()  { return <svg width="14" height="14" viewBox="0 0 24 24" {...s}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>; }
