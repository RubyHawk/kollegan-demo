/**
 * TemplateDoc - versioned content format for templates.
 *
 * v1 (legacy): plain TipTap JSON doc stored directly as a string.
 * v2 (legacy): wrapper object with body + header/footer zones.
 * v3 (legacy): multi-page format with per-page header/footer control.
 * v4 (current): explicit page roles plus a structured offer-page config.
 *
 * All save/load paths go through parseTemplateDoc / serializeTemplateDoc.
 * document-generator.ts also reads this format server-side.
 */

import { normalizePresentationPages } from './presentation-page-height';

export interface HFSettings {
  headerEnabled: boolean;
  footerEnabled: boolean;
  differentFirstPage: boolean;
}

export type PageKind = 'presentation' | 'document';
export type PageRole =
  | 'cover'
  | 'introduction'
  | 'offer'
  | 'scope'
  | 'references'
  | 'terms'
  | 'appendix'
  | 'custom';

export interface OfferPageSettings {
  layout?: 'classic-offer';
  backgroundImageSrc?: string;
  backgroundOpacity?: number;
  watermarkMode?: 'none' | 'top' | 'bottom' | 'full';
  showLogo?: boolean;
  showSenderDetails?: boolean;
  showCustomerBlock?: boolean;
  showIntro?: boolean;
  introLayout?: 'compact' | 'roomy';
  showLineItems?: boolean;
  showSummary?: boolean;
  showNotes?: boolean;
  showTerms?: boolean;
  showFooter?: boolean;
  termsHeading?: string;
  termsBody?: string;
  notesHeading?: string;
  summaryPlacement?: 'right' | 'below';
}

export interface PageDoc {
  id: string;
  label: string;
  kind?: PageKind;
  role?: PageRole;
  includeInCustomerPdf?: boolean;
  body: object;
  header: { enabled: boolean; useDefault: boolean; content: object };
  footer: { enabled: boolean; useDefault: boolean; content: object };
  document?: OfferPageSettings;
}

export interface TemplateDoc {
  _v: 4;
  pages: PageDoc[];
  defaultHeader: object;
  defaultFooter: object;
  migrationNotice?: string | null;
}

export const PAGE_ROLE_LABELS: Record<PageRole, string> = {
  cover: 'Omslag',
  introduction: 'Introduktion',
  offer: 'Offertsida',
  scope: 'Scope',
  references: 'Referenser',
  terms: 'Villkor',
  appendix: 'Bilaga',
  custom: 'Anpassad',
};

export const EMPTY_DOC: object = { type: 'doc', content: [{ type: 'paragraph' }] };
export const EMPTY_DOCUMENT_BODY: object = {
  type: 'doc',
  content: [
    {
      type: 'paragraph',
      content: [{ type: 'text', text: 'Kort introduktion eller tilläggsinformation till kunden.' }],
    },
    {
      type: 'paragraph',
      content: [{ type: 'text', text: 'Lägg gärna juridiska villkor eller kompletterande anteckningar längre ned på sidan.' }],
    },
  ],
};

export const DEFAULT_DOCUMENT_TERMS_HEADING = 'Juridiska villkor';
export const DEFAULT_DOCUMENT_TERMS_BODY = 'Offerten gäller till angivet datum. Arbetet utförs enligt överenskommen omfattning och faktureras enligt summeringen ovan. Eventuella ändringar eller tillägg hanteras som separat tilläggsbeställning.';
export const DEFAULT_DOCUMENT_NOTES_HEADING = 'Anteckningar';

export const DEFAULT_HF_SETTINGS: HFSettings = {
  headerEnabled: false,
  footerEnabled: false,
  differentFirstPage: false,
};

export function genId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLocaleLowerCase('sv-SE');
}

interface TipTapNode {
  type?: string;
  attrs?: Record<string, unknown>;
  text?: string;
  content?: TipTapNode[];
}

function getNodeText(node: TipTapNode): string {
  if (node.type === 'text') return String(node.text ?? '');
  return (node.content ?? []).map(getNodeText).join('');
}

function bodyContainsType(node: TipTapNode | undefined, type: string): boolean {
  if (!node) return false;
  if (node.type === type) return true;
  return (node.content ?? []).some((child) => bodyContainsType(child, type));
}

function inferRoleFromLabel(label: string): PageRole {
  const normalized = normalizeText(label);
  if (normalized.includes('offert')) return 'offer';
  if (normalized.includes('omslag') || normalized.includes('cover')) return 'cover';
  if (normalized.includes('introduktion') || normalized.includes('intro')) return 'introduction';
  if (normalized.includes('scope') || normalized.includes('leverans')) return 'scope';
  if (normalized.includes('referens')) return 'references';
  if (normalized.includes('villkor') || normalized.includes('juridik')) return 'terms';
  if (normalized.includes('bilaga') || normalized.includes('appendix')) return 'appendix';
  return 'custom';
}

function inferDocumentIntent(body: object | undefined): boolean {
  const root = (body ?? {}) as TipTapNode;
  if (bodyContainsType(root, 'signatureBlock')) return true;

  const headings = (root.content ?? []).filter((node) => node.type === 'heading');
  return headings.some((node) => {
    const heading = normalizeText(getNodeText(node));
    return [
      'prissattning',
      'sammanstallning',
      'betalnings- och leveransvillkor',
      'juridiska villkor',
      'godkannande och underskrift',
    ].includes(heading);
  });
}

function inferKind(role: PageRole, rawKind: unknown, body: object | undefined): PageKind {
  if (rawKind === 'document' || role === 'offer') return 'document';
  if (rawKind === 'presentation') return 'presentation';
  return inferDocumentIntent(body) ? 'document' : 'presentation';
}

function buildDefaultOfferSettings(): OfferPageSettings {
  return {
    layout: 'classic-offer',
    backgroundOpacity: 0.08,
    watermarkMode: 'bottom',
    showLogo: true,
    showSenderDetails: true,
    showCustomerBlock: true,
    showIntro: true,
    introLayout: 'compact',
    showLineItems: true,
    showSummary: true,
    showNotes: true,
    showTerms: true,
    showFooter: true,
    termsHeading: DEFAULT_DOCUMENT_TERMS_HEADING,
    termsBody: DEFAULT_DOCUMENT_TERMS_BODY,
    notesHeading: DEFAULT_DOCUMENT_NOTES_HEADING,
    summaryPlacement: 'right',
  };
}

function normalizePage(
  page: Partial<PageDoc> | undefined,
  index: number,
  notices: Set<string>,
): PageDoc {
  const label = page?.label ?? `Sida ${index + 1}`;
  const inferredRole = page?.role ?? inferRoleFromLabel(label);
  const inferredKind = inferKind(inferredRole, page?.kind, page?.body);

  if (!page?.role) notices.add('Sidroller har tolkats om automatiskt. Granska gärna mallflödet en gång.');
  if (!page?.kind && inferredKind === 'document') {
    notices.add('Minst en äldre sida tolkades som strukturerad offertsida för att passa nya editorn.');
  }

  return {
    id: page?.id ?? genId(),
    label,
    role: inferredRole,
    kind: inferredKind,
    includeInCustomerPdf:
      page?.includeInCustomerPdf ?? (inferredKind === 'document' || inferredRole === 'cover' || inferredRole === 'appendix'),
    body: page?.body ?? EMPTY_DOC,
    header: page?.header ?? { enabled: false, useDefault: true, content: EMPTY_DOC },
    footer: page?.footer ?? { enabled: false, useDefault: true, content: EMPTY_DOC },
    document: inferredKind === 'document'
      ? { ...buildDefaultOfferSettings(), ...(page?.document ?? {}) }
      : page?.document,
  };
}

export function makeEmptyPage(label = 'Sida 1', role: PageRole = 'custom'): PageDoc {
  return {
    id: genId(),
    label,
    role,
    kind: role === 'offer' ? 'document' : 'presentation',
    includeInCustomerPdf: role === 'cover' || role === 'appendix',
    body: EMPTY_DOC,
    header: { enabled: false, useDefault: true, content: EMPTY_DOC },
    footer: { enabled: false, useDefault: true, content: EMPTY_DOC },
  };
}

export function makeDocumentPage(label = 'Offertsida', role: PageRole = 'offer'): PageDoc {
  return {
    id: genId(),
    label,
    role,
    kind: 'document',
    includeInCustomerPdf: true,
    body: EMPTY_DOCUMENT_BODY,
    header: { enabled: false, useDefault: true, content: EMPTY_DOC },
    footer: { enabled: false, useDefault: true, content: EMPTY_DOC },
    document: buildDefaultOfferSettings(),
  };
}

export function makeNewDoc(): TemplateDoc {
  return {
    _v: 4,
    pages: [makeEmptyPage('Omslag', 'cover'), makeDocumentPage('Offertsida', 'offer')],
    defaultHeader: EMPTY_DOC,
    defaultFooter: EMPTY_DOC,
    migrationNotice: null,
  };
}

export function parseTemplateDoc(raw: string | undefined | null): TemplateDoc {
  if (!raw) {
    return makeNewDoc();
  }

  const notices = new Set<string>();

  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;

    if (parsed._v === 4 || parsed._v === 3) {
      const pages = ((parsed.pages as PageDoc[] | undefined) ?? []).map((page, index) =>
        normalizePage(page, index, notices),
      );

      if (parsed._v === 3) {
        notices.add('Mallen har uppgraderats till den nya editorstrukturen.');
      }

      return {
        _v: 4,
        pages: normalizePresentationPages(pages.length > 0 ? pages : [makeEmptyPage()]),
        defaultHeader: (parsed.defaultHeader as object) ?? EMPTY_DOC,
        defaultFooter: (parsed.defaultFooter as object) ?? EMPTY_DOC,
        migrationNotice: notices.size > 0 ? Array.from(notices).join(' ') : null,
      };
    }

    if (parsed._v === 2) {
      const v2Settings = (parsed.settings ?? {}) as Partial<HFSettings>;
      const v2Header = (parsed.header as { default?: object } | undefined);
      const v2Footer = (parsed.footer as { default?: object } | undefined);

      notices.add('En äldre mallversion har migrerats till det nya mallflödet.');

      return {
        _v: 4,
        defaultHeader: v2Header?.default ?? EMPTY_DOC,
        defaultFooter: v2Footer?.default ?? EMPTY_DOC,
        pages: [
          normalizePage({
            label: 'Sida 1',
            role: inferDocumentIntent(parsed.body as object | undefined) ? 'offer' : 'custom',
            kind: inferDocumentIntent(parsed.body as object | undefined) ? 'document' : 'presentation',
            includeInCustomerPdf: inferDocumentIntent(parsed.body as object | undefined),
            body: (parsed.body as object) ?? EMPTY_DOC,
            header: { enabled: v2Settings.headerEnabled ?? false, useDefault: true, content: EMPTY_DOC },
            footer: { enabled: v2Settings.footerEnabled ?? false, useDefault: true, content: EMPTY_DOC },
          }, 0, notices),
        ],
        migrationNotice: Array.from(notices).join(' '),
      };
    }

    notices.add('En äldre mall har migrerats till det nya formatet.');
    return {
      _v: 4,
      defaultHeader: EMPTY_DOC,
      defaultFooter: EMPTY_DOC,
      pages: [
        normalizePage({
          label: inferDocumentIntent(parsed as object) ? 'Offertsida' : 'Sida 1',
          role: inferDocumentIntent(parsed as object) ? 'offer' : 'custom',
          kind: inferDocumentIntent(parsed as object) ? 'document' : 'presentation',
          includeInCustomerPdf: inferDocumentIntent(parsed as object),
          body: parsed as object,
          header: { enabled: false, useDefault: true, content: EMPTY_DOC },
          footer: { enabled: false, useDefault: true, content: EMPTY_DOC },
        }, 0, notices),
      ],
      migrationNotice: Array.from(notices).join(' '),
    };
  } catch {
    return {
      _v: 4,
      defaultHeader: EMPTY_DOC,
      defaultFooter: EMPTY_DOC,
      pages: [
        normalizePage({
          label: 'Sida 1',
          role: 'custom',
          kind: 'presentation',
          includeInCustomerPdf: false,
          body: {
            type: 'doc',
            content: [{ type: 'paragraph', content: [{ type: 'text', text: raw }] }],
          },
          header: { enabled: false, useDefault: true, content: EMPTY_DOC },
          footer: { enabled: false, useDefault: true, content: EMPTY_DOC },
        }, 0, notices),
      ],
      migrationNotice: 'En äldre malltext kunde inte tolkas fullt ut och har lagts in som enkel sidtext.',
    };
  }
}
