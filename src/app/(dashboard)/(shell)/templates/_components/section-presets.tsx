/**
 * section-presets.tsx
 *
 * Shared SECTION_PRESETS definition — used by both BlocksSidebar (left panel
 * insert buttons) and DocumentCanvas (empty-state onboarding overlay).
 */

import { FileText, CurrencyDollar, Clipboard, Signature, ChatText } from '@phosphor-icons/react';

type TipTapNode = Record<string, unknown>;

export const SECTION_PRESETS: Array<{
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
    icon:    <FileText size={18} />,
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
    icon:    <CurrencyDollar size={18} />,
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
    icon:    <Clipboard size={18} />,
    nodes: [
      {
        type: 'heading', attrs: { level: 2 },
        content: [{ type: 'text', text: 'Betalnings- och leveransvillkor' }],
      },
      {
        type: 'bulletList',
        content: [
          { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Betalningsvillkor: 30 dagar netto från fakturadatum.' }] }] },
          { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Dröjsmålsränta: 8 % per år vid sen betalning.' }] }] },
          { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Leverans: Enligt separat överenskommelse.' }] }] },
          { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Priser anges i SEK exklusive moms (25 %).' }] }] },
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
    icon:    <Signature size={18} />,
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
    icon:    <ChatText size={18} />,
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
