'use client';

/**
 * Header/Footer context — shared between TemplateEditor (provider),
 * DocumentCanvas (renders the HF zones), and TopToolbar (controls).
 *
 * v3 multi-page format: per-page header/footer with optional override editors.
 */

import { createContext, useContext } from 'react';
import type { Editor } from '@tiptap/core';
import type { PageDoc } from './template-doc';

/** @legacy kept for backward compat with any code that imported HFSettings */
export interface HFSettings {
  headerEnabled:      boolean;
  footerEnabled:      boolean;
  differentFirstPage: boolean;
}

export interface HFCtxValue {
  /** Mini-editor for the shared default header (all pages that use default). */
  headerDefault:       Editor | null;
  /** Mini-editor for the shared default footer (all pages that use default). */
  footerDefault:       Editor | null;
  /** Mini-editor for the active page's unique header override. */
  headerPageOverride:  Editor | null;
  /** Mini-editor for the active page's unique footer override. */
  footerPageOverride:  Editor | null;

  // ── Page management ────────────────────────────────────────────────────────
  pages:      PageDoc[];
  activeIdx:  number;
  switchPage: (idx: number) => void;
  addPage:    (preset?: Partial<Pick<PageDoc, 'label' | 'body'>>) => void;
  removePage: (idx: number) => void;
  renamePage: (idx: number, label: string) => void;
  movePage:   (from: number, to: number) => void;

  // ── Active page H/F state ──────────────────────────────────────────────────
  activeHeader: { enabled: boolean; useDefault: boolean };
  activeFooter: { enabled: boolean; useDefault: boolean };
  patchActiveHeader: (p: { enabled?: boolean; useDefault?: boolean }) => void;
  patchActiveFooter: (p: { enabled?: boolean; useDefault?: boolean }) => void;
}

export const HFCtx = createContext<HFCtxValue | null>(null);

export function useHeaderFooter() {
  return useContext(HFCtx);
}
