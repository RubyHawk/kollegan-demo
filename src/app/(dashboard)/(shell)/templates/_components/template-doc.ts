/**
 * TemplateDoc — versioned content format for templates.
 *
 * v1 (legacy): a plain TipTap JSON `doc` node stored directly as a string.
 * v2 (current): a wrapper object containing body + header + footer zones
 *               plus display settings.
 *
 * All save/load paths go through parseTemplateDoc / serializeTemplateDoc.
 * document-generator.ts also reads this format server-side.
 */

import type { HFSettings } from './header-footer-context';

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface TemplateDoc {
  _v:      2;
  body:    object;
  header:  { default: object; firstPage: object };
  footer:  { default: object; firstPage: object };
  settings: HFSettings;
}

// ─── Defaults ──────────────────────────────────────────────────────────────────

export const EMPTY_DOC: object = { type: 'doc', content: [{ type: 'paragraph' }] };

export const DEFAULT_HF_SETTINGS: HFSettings = {
  headerEnabled:      false,
  footerEnabled:      false,
  differentFirstPage: false,
};

// ─── Parse ─────────────────────────────────────────────────────────────────────

/**
 * Parses a raw template content string into a TemplateDoc.
 * Handles three cases:
 *  - `_v: 2` wrapper object  → parsed directly
 *  - Plain TipTap JSON doc   → promoted to body-only TemplateDoc
 *  - Unparseable string      → wrapped in a paragraph node
 */
export function parseTemplateDoc(raw: string | undefined | null): TemplateDoc {
  if (!raw) {
    return makeEmptyDoc();
  }

  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;

    if (parsed._v === 2) {
      // v2 format
      return {
        _v:      2,
        body:    (parsed.body     as object)  ?? EMPTY_DOC,
        header:  (parsed.header   as { default: object; firstPage: object }) ?? { default: EMPTY_DOC, firstPage: EMPTY_DOC },
        footer:  (parsed.footer   as { default: object; firstPage: object }) ?? { default: EMPTY_DOC, firstPage: EMPTY_DOC },
        settings: { ...DEFAULT_HF_SETTINGS, ...((parsed.settings as Partial<HFSettings>) ?? {}) },
      };
    }

    // Legacy v1: the entire JSON is the body TipTap doc
    return {
      _v:      2,
      body:    parsed,
      header:  { default: EMPTY_DOC, firstPage: EMPTY_DOC },
      footer:  { default: EMPTY_DOC, firstPage: EMPTY_DOC },
      settings: { ...DEFAULT_HF_SETTINGS },
    };
  } catch {
    // Unparseable — treat as plain text in a paragraph
    return {
      _v:      2,
      body:    { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: raw }] }] },
      header:  { default: EMPTY_DOC, firstPage: EMPTY_DOC },
      footer:  { default: EMPTY_DOC, firstPage: EMPTY_DOC },
      settings: { ...DEFAULT_HF_SETTINGS },
    };
  }
}

function makeEmptyDoc(): TemplateDoc {
  return {
    _v:      2,
    body:    EMPTY_DOC,
    header:  { default: EMPTY_DOC, firstPage: EMPTY_DOC },
    footer:  { default: EMPTY_DOC, firstPage: EMPTY_DOC },
    settings: { ...DEFAULT_HF_SETTINGS },
  };
}
