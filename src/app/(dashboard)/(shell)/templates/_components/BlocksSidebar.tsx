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

import { useRef } from 'react';
import { useTemplateEditor } from './editor-context';
import { useHeaderFooter } from './header-footer-context';
import { OFFER_PLACEHOLDERS } from '@modules/supporting/offers/domain/template.entity';

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
    icon:    <LayoutIcon />,
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
    icon:    <PriceTagIcon />,
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
    icon:    <ClipboardIcon />,
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
    icon:    <SignatureIcon />,
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
    icon:    <MessageIcon />,
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
    icon:    <CoverIcon />,
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
    icon:    <SummaryIcon />,
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
    icon:    <ScopeIcon />,
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
    icon:    <PriceTagIcon />,
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
    icon:    <TeamIcon />,
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
    icon:    <CompanyIcon />,
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
    icon:    <ClipboardIcon />,
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
        <Section label="SIDOR">
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
    <div className="w-52 shrink-0 border-r hidden md:flex flex-col overflow-y-auto" style={{ background: '#f3f2f1', borderColor: '#d2d0ce' }}>
      <div style={{ padding: '8px 0 4px', borderBottom: '1px solid #d2d0ce', background: '#f3f2f1' }}>
        <p style={{ fontSize: 11, fontWeight: 600, color: '#605e5c', padding: '0 12px 4px', fontFamily: 'Calibri, Arial, sans-serif', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
          Infoga
        </p>
      </div>
      {children}
    </div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ paddingBottom: 4 }}>
      <p style={{
        padding: '10px 12px 3px',
        fontSize: 10, fontWeight: 600,
        color: '#a19f9d',
        fontFamily: 'Calibri, Arial, sans-serif',
        letterSpacing: '0.06em', textTransform: 'uppercase',
      }}>{label}</p>
      {children}
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
    chipColorProp === 'blue'   ? { color: '#1e40af', background: '#dbeafe', border: '1px solid #bfdbfe' }
    : chipColorProp === 'green' || chipLabel
      ? { color: '#065f46', background: '#d1fae5', border: '1px solid #a7f3d0' }
      : { color: '#7b5ea7', background: '#f4f0fa', border: '1px solid #d6c8f0' };
  // Use renamed var to avoid shadowing — the original code used `chipColor` for the
  // object literal. Keep the identifier the same so the JSX below still works.
  const chipColor = chipColorStyles;

  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 8,
        width: '100%', padding: '5px 12px',
        background: 'transparent', border: 'none',
        cursor: 'pointer', textAlign: 'left',
        fontFamily: 'Calibri, Arial, sans-serif',
        fontSize: 13, color: '#323130',
        transition: 'background 0.08s',
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#e8e6e3'; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
    >
      <span style={{ color: '#605e5c', flexShrink: 0 }}>{icon}</span>
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{label}</span>
      {resolvedChipLabel && (
        <span style={{
          fontSize: 9, fontFamily: 'monospace',
          padding: '1px 4px', borderRadius: 2, flexShrink: 0,
          ...chipColor,
        }}>
          {resolvedChipLabel}
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
// Preset section icons
function LayoutIcon()    { return <svg width="14" height="14" viewBox="0 0 24 24" {...s}><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/></svg>; }
function PriceTagIcon()  { return <svg width="14" height="14" viewBox="0 0 24 24" {...s}><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>; }
function ClipboardIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" {...s}><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/></svg>; }
function SignatureIcon()  { return <svg width="14" height="14" viewBox="0 0 24 24" {...s}><path d="M3 17c3.333-5.333 5.333-8 6-8 1 0 1 1 2 1s1-1 2-1 1 1 2 1"/><path d="M17 10c.667 0 1.5.667 2.5 2"/><line x1="3" y1="21" x2="21" y2="21"/></svg>; }
function MessageIcon()   { return <svg width="14" height="14" viewBox="0 0 24 24" {...s}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>; }
// Page preset icons
function CoverIcon()    { return <svg width="14" height="14" viewBox="0 0 24 24" {...s}><rect x="3" y="2" width="18" height="20" rx="2"/><line x1="7" y1="9" x2="17" y2="9"/><line x1="7" y1="13" x2="13" y2="13"/></svg>; }
function SummaryIcon()  { return <svg width="14" height="14" viewBox="0 0 24 24" {...s}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>; }
function ScopeIcon()    { return <svg width="14" height="14" viewBox="0 0 24 24" {...s}><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>; }
function TeamIcon()     { return <svg width="14" height="14" viewBox="0 0 24 24" {...s}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>; }
function CompanyIcon()  { return <svg width="14" height="14" viewBox="0 0 24 24" {...s}><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>; }
