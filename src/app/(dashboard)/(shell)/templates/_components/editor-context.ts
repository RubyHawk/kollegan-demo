'use client';

import { createContext, useContext } from 'react';
import type { Editor } from '@tiptap/core';

export const EditorCtx = createContext<Editor | null>(null);
export function useTemplateEditor() { return useContext(EditorCtx); }
