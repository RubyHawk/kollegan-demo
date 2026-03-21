'use client';

/**
 * BlocksSidebar — left insert panel.
 *
 * Four sections:
 *   1. Section presets (one-click enterprise content templates)
 *   2. Block types (headings, paragraph, image, table, divider)
 *   3. Variables (inserts VariableNode chips)
 *   4. Signature fields (inserts SignatureBlockNode)
 */

import { useRef, useState } from 'react';
import { useTemplateEditor } from './editor-context';
import { useHeaderFooter } from './header-footer-context';
import { OFFER_PLACEHOLDERS } from '@modules/supporting/offers/domain/template.entity';
import {
  FileText, CurrencyDollar, Clipboard, Signature, ChatText,
  File, Star, CheckSquare, Tag, Buildings, Scales,
  TextHOne, TextHTwo, Paragraph, ListBullets, Table, Minus as PhMinus, Image as PhImage,
  BracketsCurly, PenNib, User, CalendarBlank,
} from '@phosphor-icons/react';

// ── Section presets ────────────────────────────────────────────────────────────
// Each preset is an array of TipTap JSON nodes inserted at the cursor position.

type TipTapNode = Record<string, unknown>;

const SECTION_PRESETS: Array<{
  key:     string;
  label:   string;
  icon:    React.ReactNode;
  tooltip: string;
  nodes:   TipTapNode[];
}> = [
  {
    key:     'offerHeader',
    label:   'Offerthuvud',
    tooltip: 'Titel, mottagare, offert nr och datum',
    icon:    <FileText size={14} />,
    nodes: [
      {
        type: 'heading', attrs: { level: 1 },
        content: [{ type: 'variable', attrs: { key: 'offerTitle', label: 'Offertrubrik' } }],
      },
      {
        type: 'paragraph',
        content: [
          { type: 'text', text: 'Till: ', marks: [{ type: 'bold' }] },
          { type: 'variable', attrs: { key: 'recipientName',    label: 'Mottagarens namn' } },
          { type: 'text', text: ' · ' },
          { type: 'variable', attrs: { key: 'recipientCompany', label: 'Mottagarens företag' } },
        ],
      },
      {
        type: 'paragraph',
        content: [
          { type: 'text', text: 'Offert nr: ', marks: [{ type: 'bold' }] },
          { type: 'variable', attrs: { key: 'quoteNumber',  label: 'Offertnummer' } },
          { type: 'text', text: '   |   Datum: ', marks: [{ type: 'bold' }] },
          { type: 'variable', attrs: { key: 'createdDate',  label: 'Skapad datum' } },
          { type: 'text', text: '   |   Giltig till: ', marks: [{ type: 'bold' }] },
          { type: 'variable', attrs: { key: 'validUntil',   label: 'Giltig till' } },
        ],
      },
      { type: 'horizontalRule' },
    ],
  },
  {
    key:     'pricingSection',
    label:   'Prissättning',
    tooltip: 'Radartiklar, moms och totalsumma',
    icon:    <CurrencyDollar size={14} />,
    nodes: [
      {
        type: 'heading', attrs: { level: 2 },
        content: [{ type: 'text', text: 'Prissättning' }],
      },
      {
        type: 'paragraph',
        content: [{ type: 'variable', attrs: { key: 'lineItems', label: 'Radartiklar' } }],
      },
      {
        type: 'paragraph',
        content: [
          { type: 'text', text: 'Summa ex. moms: ', marks: [{ type: 'bold' }] },
          { type: 'variable', attrs: { key: 'totalExVat', label: 'Summa ex. moms' } },
        ],
      },
      {
        type: 'paragraph',
        content: [
          { type: 'text', text: 'Moms: ', marks: [{ type: 'bold' }] },
          { type: 'variable', attrs: { key: 'vatAmount', label: 'Momsbelopp' } },
        ],
      },
      {
        type: 'paragraph',
        content: [
          { type: 'text', text: 'Totalt inkl. moms: ', marks: [{ type: 'bold' }] },
          { type: 'variable', attrs: { key: 'totalIncVat', label: 'Summa inkl. moms' } },
        ],
      },
      { type: 'horizontalRule' },
    ],
  },
  {
    key:     'termsSection',
    label:   'Betalningsvillkor',
    tooltip: 'Standard betalnings- och leveransvillkor',
    icon:    <Clipboard size={14} />,
    nodes: [
      {
        type: 'heading', attrs: { level: 2 },
        content: [{ type: 'text', text: 'Betalnings- och leveransvillkor' }],
      },
      {
        type: 'bulletList',
        content: [
          {
            type: 'listItem',
            content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Betalningsvillkor: 30 dagar netto från fakturadatum.' }] }],
          },
          {
            type: 'listItem',
            content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Dröjsmålsränta: 8 % per år vid sen betalning.' }] }],
          },
          {
            type: 'listItem',
            content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Leverans: Enligt separat överenskommelse.' }] }],
          },
          {
            type: 'listItem',
            content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Priser anges i SEK exklusive moms (25 %).' }] }],
          },
        ],
      },
      {
        type: 'paragraph',
        content: [
          { type: 'text', text: 'Offerten är giltig till och med ' },
          { type: 'variable', attrs: { key: 'validUntil', label: 'Giltig till' } },
          { type: 'text', text: '. Godkännande efter detta datum kräver ny offert.' },
        ],
      },
      { type: 'horizontalRule' },
    ],
  },
  {
    key:     'signatureSection',
    label:   'Underskrift',
    tooltip: 'Godkännande och e-signatur',
    icon:    <Signature size={14} />,
    nodes: [
      {
        type: 'heading', attrs: { level: 2 },
        content: [{ type: 'text', text: 'Godkännande och underskrift' }],
      },
      {
        type: 'paragraph',
        content: [{ type: 'text', text: 'Genom att underteckna bekräftar mottagaren att offerten godkänts och att ovanstående villkor accepteras.' }],
      },
      { type: 'signatureBlock', attrs: { fieldType: 'signature', label: 'Signatur' } },
      { type: 'signatureBlock', attrs: { fieldType: 'name',      label: 'Fullständigt namn' } },
      { type: 'signatureBlock', attrs: { fieldType: 'date',      label: 'Signeringsdatum' } },
    ],
  },
  {
    key:     'introSection',
    label:   'Introduktion',
    tooltip: 'Personligt introduktionsstycke',
    icon:    <ChatText size={14} />,
    nodes: [
      {
        type: 'paragraph',
        content: [
          { type: 'text', text: 'Hej ' },
          { type: 'variable', attrs: { key: 'recipientName', label: 'Mottagarens namn' } },
          { type: 'text', text: ',' },
        ],
      },
      {
        type: 'paragraph',
        content: [{ type: 'text', text: 'Tack för ditt intresse. Vi är glada att presentera följande offert och ser fram emot ett gott samarbete.' }],
      },
      { type: 'paragraph', content: [{ type: 'text', text: '' }] },
    ],
  },
];

// ── Enterprise page presets ────────────────────────────────────────────────────
// Each preset adds a new page with pre-filled TipTap body content.

type PagePreset = {
  key:     string;
  label:   string;
  icon:    React.ReactNode;
  tooltip: string;
  body:    { type: 'doc'; content: TipTapNode[] };
};

const PAGE_PRESETS: PagePreset[] = [
  {
    key:     'omslag',
    label:   'Omslag',
    tooltip: 'Försättsblad med titel, företag och offertinfo',
    icon:    <File size={14} />,
    body: {
      type: 'doc',
      content: [
        { type: 'paragraph', content: [{ type: 'text', text: '' }] },
        {
          type: 'heading', attrs: { level: 1, textAlign: 'center' },
          content: [{ type: 'variable', attrs: { key: 'offerTitle', label: 'Offertrubrik' } }],
        },
        {
          type: 'paragraph', attrs: { textAlign: 'center' },
          content: [
            { type: 'variable', attrs: { key: 'recipientCompany', label: 'Mottagarens företag' } },
          ],
        },
        { type: 'horizontalRule' },
        {
          type: 'paragraph', attrs: { textAlign: 'center' },
          content: [
            { type: 'text', text: 'Offert nr: ', marks: [{ type: 'bold' }] },
            { type: 'variable', attrs: { key: 'quoteNumber', label: 'Offertnummer' } },
            { type: 'text', text: '   ·   Datum: ' },
            { type: 'variable', attrs: { key: 'createdDate', label: 'Skapad datum' } },
            { type: 'text', text: '   ·   Giltig till: ' },
            { type: 'variable', attrs: { key: 'validUntil', label: 'Giltig till' } },
          ],
        },
        {
          type: 'paragraph', attrs: { textAlign: 'center' },
          content: [
            { type: 'text', text: 'Till: ' },
            { type: 'variable', attrs: { key: 'recipientName', label: 'Mottagarens namn' } },
          ],
        },
      ],
    },
  },
  {
    key:     'sammanfattning',
    label:   'Sammanfattning',
    tooltip: 'Ledningssummering / executive summary',
    icon:    <Star size={14} />,
    body: {
      type: 'doc',
      content: [
        {
          type: 'heading', attrs: { level: 1 },
          content: [{ type: 'text', text: 'Sammanfattning' }],
        },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Beskriv kortfattat syftet med denna offert och det affärsproblem ni löser för kunden.' }],
        },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Lyft fram det mest relevanta värdet ni erbjuder och varför er lösning är rätt val.' }],
        },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Avsluta med en tydlig uppmaning till handling och nästa steg.' }],
        },
      ],
    },
  },
  {
    key:     'leveranser',
    label:   'Leveranser & Scope',
    tooltip: 'Scope of work — vad som ingår och vad som levereras',
    icon:    <CheckSquare size={14} />,
    body: {
      type: 'doc',
      content: [
        {
          type: 'heading', attrs: { level: 1 },
          content: [{ type: 'text', text: 'Leveranser & Scope' }],
        },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Följande leverabler ingår i uppdraget:' }],
        },
        {
          type: 'bulletList',
          content: [
            { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Leverabel 1 — beskriv vad som ingår' }] }] },
            { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Leverabel 2 — beskriv vad som ingår' }] }] },
            { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Leverabel 3 — beskriv vad som ingår' }] }] },
          ],
        },
        {
          type: 'heading', attrs: { level: 2 },
          content: [{ type: 'text', text: 'Avgränsningar' }],
        },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Följande ingår INTE i uppdraget om inget annat avtalats skriftligt:' }],
        },
        {
          type: 'bulletList',
          content: [
            { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Avgränsning 1' }] }] },
            { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Avgränsning 2' }] }] },
          ],
        },
      ],
    },
  },
  {
    key:     'prissida',
    label:   'Prissida',
    tooltip: 'Radartiklar, moms och totalsumma',
    icon:    <Tag size={14} />,
    body: {
      type: 'doc',
      content: [
        {
          type: 'heading', attrs: { level: 1 },
          content: [{ type: 'text', text: 'Prissättning' }],
        },
        {
          type: 'paragraph',
          content: [{ type: 'variable', attrs: { key: 'lineItems', label: 'Radartiklar' } }],
        },
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'Summa ex. moms: ', marks: [{ type: 'bold' }] },
            { type: 'variable', attrs: { key: 'totalExVat', label: 'Summa ex. moms' } },
          ],
        },
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'Moms (25 %): ', marks: [{ type: 'bold' }] },
            { type: 'variable', attrs: { key: 'vatAmount', label: 'Momsbelopp' } },
          ],
        },
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'Totalt inkl. moms: ', marks: [{ type: 'bold' }] },
            { type: 'variable', attrs: { key: 'totalIncVat', label: 'Summa inkl. moms' } },
          ],
        },
        { type: 'horizontalRule' },
      ],
    },
  },
  {
    key:     'omoss',
    label:   'Om oss',
    tooltip: 'Om företaget, team och kontaktinfo',
    icon:    <Buildings size={14} />,
    body: {
      type: 'doc',
      content: [
        {
          type: 'heading', attrs: { level: 1 },
          content: [{ type: 'text', text: 'Om oss' }],
        },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Beskriv ert företag, er historia och vad som gör er unika. Lyft fram er expertis och era viktigaste kunder eller projekt.' }],
        },
        {
          type: 'heading', attrs: { level: 2 },
          content: [{ type: 'text', text: 'Varför välja oss?' }],
        },
        {
          type: 'bulletList',
          content: [
            { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Styrka 1 — er viktigaste differentieringspunkt' }] }] },
            { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Styrka 2 — erfarenhet eller certifiering' }] }] },
            { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Styrka 3 — referenskunder eller branschkunskap' }] }] },
          ],
        },
      ],
    },
  },
  {
    key:     'foretagsinfo',
    label:   'Företagsinformation',
    tooltip: 'Org.nr, adress och kontaktuppgifter',
    icon:    <FileText size={14} />,
    body: {
      type: 'doc',
      content: [
        {
          type: 'heading', attrs: { level: 1 },
          content: [{ type: 'text', text: 'Företagsinformation' }],
        },
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'Företagsnamn:', marks: [{ type: 'bold' }] },
            { type: 'text', text: ' [Ditt företagsnamn AB]' },
          ],
        },
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'Organisationsnummer:', marks: [{ type: 'bold' }] },
            { type: 'text', text: ' 556XXX-XXXX' },
          ],
        },
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'Adress:', marks: [{ type: 'bold' }] },
            { type: 'text', text: ' Gatuadress, Postnummer Stad' },
          ],
        },
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'E-post:', marks: [{ type: 'bold' }] },
            { type: 'text', text: ' info@foretagsnamn.se' },
          ],
        },
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'Telefon:', marks: [{ type: 'bold' }] },
            { type: 'text', text: ' +46 XX XXX XX XX' },
          ],
        },
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'Webb:', marks: [{ type: 'bold' }] },
            { type: 'text', text: ' www.foretagsnamn.se' },
          ],
        },
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'Godkänd för F-skatt:', marks: [{ type: 'bold' }] },
            { type: 'text', text: ' Ja' },
          ],
        },
      ],
    },
  },
  {
    key:     'villkor',
    label:   'Allmänna villkor',
    tooltip: 'Standardvillkor för leverans och betalning',
    icon:    <Scales size={14} />,
    body: {
      type: 'doc',
      content: [
        {
          type: 'heading', attrs: { level: 1 },
          content: [{ type: 'text', text: 'Allmänna villkor' }],
        },
        {
          type: 'heading', attrs: { level: 2 },
          content: [{ type: 'text', text: '1. Betalningsvillkor' }],
        },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Betalning ska erläggas inom 30 dagar från fakturadatum. Vid försenad betalning debiteras dröjsmålsränta om 8 % per år.' }],
        },
        {
          type: 'heading', attrs: { level: 2 },
          content: [{ type: 'text', text: '2. Leverans' }],
        },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Leverans sker enligt separat överenskommelse och specificeras i projektplanen. Tidplan förutsätter att kunden tillhandahåller nödvändigt material och beslut i tid.' }],
        },
        {
          type: 'heading', attrs: { level: 2 },
          content: [{ type: 'text', text: '3. Priser och moms' }],
        },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Alla priser anges i SEK exklusive moms (25 %) om inget annat anges. Offerten är giltig till och med ' },
            { type: 'variable', attrs: { key: 'validUntil', label: 'Giltig till' } },
            { type: 'text', text: '.' },
          ],
        },
        {
          type: 'heading', attrs: { level: 2 },
          content: [{ type: 'text', text: '4. Ansvarsbegränsning' }],
        },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Leverantörens ansvar är begränsat till direkt skada och kan aldrig överstiga det kontrakterade beloppet. Leverantören ansvarar inte för indirekt skada, utebliven vinst eller följdskada.' }],
        },
        {
          type: 'heading', attrs: { level: 2 },
          content: [{ type: 'text', text: '5. Tvistelösning' }],
        },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Tvister ska i första hand lösas genom förhandling. Om enighet inte kan nås ska tvisten avgöras av svensk domstol med tillämpning av svensk rätt.' }],
        },
      ],
    },
  },
];

// Strip {{ }} to get the key used by VariableNode
function toKey(placeholder: string) {
  return placeholder.replace(/[{}]/g, '');
}

export default function BlocksSidebar() {
  const editor = useTemplateEditor();
  const hf     = useHeaderFooter();
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
      {/* ── Page presets (enterprise) ── */}
      {hf && (
        <Section label="SIDOR" collapsible defaultCollapsed>
          {PAGE_PRESETS.map((preset) => (
            <InsertItem
              key={preset.key}
              label={preset.label}
              icon={preset.icon}
              chipLabel="sida"
              chipColor="blue"
              onClick={() => hf.addPage({ label: preset.label, body: preset.body })}
            />
          ))}
        </Section>
      )}

      {/* ── Section presets ── */}
      <Section label="SEKTIONER">
        {SECTION_PRESETS.map((preset) => (
          <InsertItem
            key={preset.key}
            label={preset.label}
            icon={preset.icon}
            chipLabel="mall"
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            onClick={() => editor.chain().focus().insertContent(preset.nodes as any).run()}
          />
        ))}
      </Section>

      {/* ── Blocks ── */}
      <Section label="BLOCK">
        <InsertItem
          label="Rubrik 1"
          icon={<TextHOne size={14} />}
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        />
        <InsertItem
          label="Rubrik 2"
          icon={<TextHTwo size={14} />}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        />
        <InsertItem
          label="Brödtext"
          icon={<Paragraph size={14} />}
          onClick={() => editor.chain().focus().setParagraph().run()}
        />
        <InsertItem
          label="Punktlista"
          icon={<ListBullets size={14} />}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        />
        <InsertItem
          label="Tabell"
          icon={<Table size={14} />}
          onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
        />
        <InsertItem
          label="Avdelare"
          icon={<PhMinus size={14} />}
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
        />
        <InsertItem
          label="Bild"
          icon={<PhImage size={14} />}
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
      <Section label="VARIABLER" collapsible defaultCollapsed>
        {OFFER_PLACEHOLDERS
          .filter((p) => p.key !== '{{lineItems}}' && p.key !== '{{signature}}')
          .map((p) => (
            <InsertItem
              key={p.key}
              label={p.label}
              icon={<BracketsCurly size={14} />}
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
          icon={<BracketsCurly size={14} />}
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
      <Section label="SIGNATURFÄLT" collapsible defaultCollapsed>
        <InsertItem
          label="Signaturfält"
          icon={<PenNib size={14} />}
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
          icon={<User size={14} />}
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
          icon={<CalendarBlank size={14} />}
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
    <div className="w-52 shrink-0 flex-col overflow-y-auto border-r border-[var(--border)] bg-[var(--surface-2)] hidden md:flex">
      <div className="px-3 pt-3 pb-2 border-b border-[var(--border)]">
        <p className="text-sm font-semibold text-[var(--text-primary)]">
          Infoga
        </p>
      </div>
      {children}
    </div>
  );
}

function Section({ label, children, collapsible, defaultCollapsed }: { label: string; children: React.ReactNode; collapsible?: boolean; defaultCollapsed?: boolean }) {
  const [open, setOpen] = useState(!defaultCollapsed);
  if (!collapsible) {
    return (
      <div className="pb-1">
        <p className="px-3 pt-4 pb-1 text-[var(--text-muted)] text-[10px] font-semibold uppercase tracking-wider">
          {label}
        </p>
        {children}
      </div>
    );
  }
  return (
    <div className="pb-1">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full px-3 pt-4 pb-1 flex items-center justify-between text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
      >
        <span className="text-[10px] font-semibold uppercase tracking-wider">{label}</span>
        <svg
          width="10" height="10" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          className={`transition-transform ${open ? '' : '-rotate-90'}`}
        >
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>
      {open && children}
    </div>
  );
}

function InsertItem({
  label, icon, chip, chipLabel, chipColor: chipColorProp, onClick,
}: {
  label: string;
  icon: React.ReactNode;
  chip?: boolean;
  chipLabel?: string;
  chipColor?: 'green' | 'purple' | 'blue';
  onClick: () => void;
}) {
  const resolvedChipLabel = chipLabel ?? (chip ? 'var' : undefined);
  const chipColorStyles =
    chipColorProp === 'blue'   ? 'text-blue-700 bg-blue-50 border border-blue-200'
    : chipColorProp === 'green' || chipLabel
      ? 'text-emerald-700 bg-emerald-50 border border-emerald-200'
      : 'text-violet-700 bg-violet-50 border border-violet-200';

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center gap-2.5 px-3 py-2 text-left rounded-md hover:bg-[var(--surface-active)] text-[var(--text-primary)] text-xs font-medium transition-colors group"
    >
      <span className="w-6 h-6 rounded flex items-center justify-center bg-[var(--surface-3)] text-[var(--accent)] group-hover:bg-[var(--accent-subtle)] shrink-0 transition-colors">
        {icon}
      </span>
      <span className="flex-1 min-w-0 truncate">{label}</span>
      {resolvedChipLabel && (
        <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded shrink-0 ${chipColorStyles}`}>
          {resolvedChipLabel}
        </span>
      )}
    </button>
  );
}


