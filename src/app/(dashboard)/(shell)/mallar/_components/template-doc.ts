/**
 * TemplateDoc — versioned content format for templates.
 *
 * v1 (legacy): a plain TipTap JSON `doc` node stored directly as a string.
 * v2 (legacy):  a wrapper object containing body + header + footer zones
 *               plus display settings.
 * v3 (current): multi-page format with per-page header/footer control.
 *
 * All save/load paths go through parseTemplateDoc / serializeTemplateDoc.
 * document-generator.ts also reads this format server-side.
 */

// ─── Types ─────────────────────────────────────────────────────────────────────

/** @legacy kept for backward compat — used internally during v2 migration */
export interface HFSettings {
  headerEnabled:      boolean;
  footerEnabled:      boolean;
  differentFirstPage: boolean;
}

export interface PageDoc {
  id:     string;
  label:  string;
  kind?:  'presentation' | 'document';
  body:   object;  // TipTap JSON doc node
  header: { enabled: boolean; useDefault: boolean; content: object };
  footer: { enabled: boolean; useDefault: boolean; content: object };
  document?: {
    layout?: 'classic-offer';
    backgroundImageSrc?: string;
    backgroundOpacity?: number;
    watermarkMode?: 'none' | 'top' | 'bottom' | 'full';
    showLogo?: boolean;
    showSenderDetails?: boolean;
    showCustomerBlock?: boolean;
    showIntro?: boolean;
    showLineItems?: boolean;
    showSummary?: boolean;
    showNotes?: boolean;
    showTerms?: boolean;
    showFooter?: boolean;
    summaryPlacement?: 'right' | 'below';
  };
}

export interface TemplateDoc {
  _v:            3;
  pages:         PageDoc[];
  defaultHeader: object;   // TipTap JSON for shared header
  defaultFooter: object;   // TipTap JSON for shared footer
}

// ─── Defaults ──────────────────────────────────────────────────────────────────

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

/** @legacy kept for backward compat — no longer used in the v3 doc format */
export const DEFAULT_HF_SETTINGS: HFSettings = {
  headerEnabled:      false,
  footerEnabled:      false,
  differentFirstPage: false,
};

// ─── Simple ID generator (no nanoid dependency) ───────────────────────────────

export function genId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

export function makeEmptyPage(label = 'Sida 1'): PageDoc {
  return {
    id:     genId(),
    label,
    kind:   'presentation',
    body:   EMPTY_DOC,
    header: { enabled: false, useDefault: true,  content: EMPTY_DOC },
    footer: { enabled: false, useDefault: true,  content: EMPTY_DOC },
  };
}

export function makeDocumentPage(label = 'Offertsida'): PageDoc {
  return {
    id: genId(),
    label,
    kind: 'document',
    body: EMPTY_DOCUMENT_BODY,
    header: { enabled: false, useDefault: true, content: EMPTY_DOC },
    footer: { enabled: false, useDefault: true, content: EMPTY_DOC },
    document: {
      layout: 'classic-offer',
      backgroundOpacity: 0.08,
      watermarkMode: 'bottom',
      showLogo: true,
      showSenderDetails: true,
      showCustomerBlock: true,
      showIntro: true,
      showLineItems: true,
      showSummary: true,
      showNotes: true,
      showTerms: true,
      showFooter: true,
      summaryPlacement: 'right',
    },
  };
}

export function makeNewDoc(): TemplateDoc {
  return {
    _v:            3,
    pages:         [makeEmptyPage('Sida 1')],
    defaultHeader: EMPTY_DOC,
    defaultFooter: EMPTY_DOC,
  };
}

// ─── Parse ─────────────────────────────────────────────────────────────────────

/**
 * Parses a raw template content string into a TemplateDoc (v3).
 * Handles four cases:
 *  - `_v: 3` wrapper object  → parsed directly
 *  - `_v: 2` wrapper object  → promoted to v3 single-page doc
 *  - Plain TipTap JSON doc   → promoted to v3 single-page doc
 *  - Unparseable string      → wrapped in a paragraph node
 */
export function parseTemplateDoc(raw: string | undefined | null): TemplateDoc {
  if (!raw) {
    return makeNewDoc();
  }

  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;

    if (parsed._v === 3) {
      // v3 format — parse directly
      const pages = (parsed.pages as PageDoc[] | undefined) ?? [makeEmptyPage()];
      return {
        _v:            3,
        pages:         (pages.length > 0 ? pages : [makeEmptyPage()]).map((page, idx) => ({
          ...page,
          kind: page.kind ?? 'presentation',
          label: page.label ?? `Sida ${idx + 1}`,
          document: page.kind === 'document'
            ? {
                ...makeDocumentPage(page.label ?? `Sida ${idx + 1}`).document,
                ...(page.document ?? {}),
              }
            : page.document,
        })),
        defaultHeader: (parsed.defaultHeader as object) ?? EMPTY_DOC,
        defaultFooter: (parsed.defaultFooter as object) ?? EMPTY_DOC,
      };
    }

    if (parsed._v === 2) {
      // v2 → convert to v3 single-page
      const v2Settings = (parsed.settings ?? {}) as Partial<HFSettings>;
      const v2Header   = (parsed.header as { default?: object; firstPage?: object } | undefined);
      const v2Footer   = (parsed.footer as { default?: object; firstPage?: object } | undefined);
      const defaultHeader = v2Header?.default ?? EMPTY_DOC;
      const defaultFooter = v2Footer?.default ?? EMPTY_DOC;

      return {
        _v:            3,
        defaultHeader,
        defaultFooter,
        pages: [{
          id:    genId(),
          label: 'Sida 1',
          kind: 'presentation',
          body:  (parsed.body as object) ?? EMPTY_DOC,
          header: {
            enabled:    v2Settings.headerEnabled ?? false,
            useDefault: true,
            content:    EMPTY_DOC,
          },
          footer: {
            enabled:    v2Settings.footerEnabled ?? false,
            useDefault: true,
            content:    EMPTY_DOC,
          },
        }],
      };
    }

    // Legacy v1: the entire JSON is the body TipTap doc
    return {
      _v:            3,
      defaultHeader: EMPTY_DOC,
      defaultFooter: EMPTY_DOC,
      pages: [{
        id:    genId(),
        label: 'Sida 1',
        kind: 'presentation',
        body:  parsed as object,
        header: { enabled: false, useDefault: true, content: EMPTY_DOC },
        footer: { enabled: false, useDefault: true, content: EMPTY_DOC },
      }],
    };
  } catch {
    // Unparseable — treat as plain text in a paragraph
    return {
      _v:            3,
      defaultHeader: EMPTY_DOC,
      defaultFooter: EMPTY_DOC,
      pages: [{
        id:    genId(),
        label: 'Sida 1',
        kind: 'presentation',
        body:  { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: raw }] }] },
        header: { enabled: false, useDefault: true, content: EMPTY_DOC },
        footer: { enabled: false, useDefault: true, content: EMPTY_DOC },
      }],
    };
  }
}
