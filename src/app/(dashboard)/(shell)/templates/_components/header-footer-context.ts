'use client';

/**
 * Header/Footer context — shared between TemplateEditor (provider),
 * DocumentCanvas (renders the HF zones), and TopToolbar (controls).
 */

import { createContext, useContext } from 'react';
import type { Editor } from '@tiptap/core';

export interface HFSettings {
  headerEnabled:      boolean;
  footerEnabled:      boolean;
  differentFirstPage: boolean;
}

export interface HFCtxValue {
  /** Mini-editor for the header shown on page 2+ (or all pages when differentFirstPage is false). */
  headerDefault:   Editor | null;
  /** Mini-editor for the header shown on the first page only. */
  headerFirstPage: Editor | null;
  /** Mini-editor for the footer shown on page 2+ (or all pages when differentFirstPage is false). */
  footerDefault:   Editor | null;
  /** Mini-editor for the footer shown on the first page only. */
  footerFirstPage: Editor | null;

  settings:      HFSettings;
  patchSettings: (patch: Partial<HFSettings>) => void;
}

export const HFCtx = createContext<HFCtxValue | null>(null);

export function useHeaderFooter() {
  return useContext(HFCtx);
}
