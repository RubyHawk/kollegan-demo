'use client';

/**
 * TemplateEditor — 3-panel document builder.
 *
 * Layout:
 *   [BlocksSidebar 208px] | [TopToolbar + DocumentCanvas flex-1] | [BlockSettingsSidebar 256px]
 *
 * Exposes TemplateEditorHandle via editorRef for parent pages to call getJSON/setContent.
 */

import dynamic from 'next/dynamic';
import BlocksSidebar from './BlocksSidebar';
import BlockSettingsSidebar from './BlockSettingsSidebar';
import TopToolbar from './TopToolbar';

const DocumentCanvas = dynamic(() => import('./DocumentCanvas'), { ssr: false });

export interface TemplateEditorHandle {
  getJSON:    () => object;
  setContent: (json: object | string) => void;
}

interface Props {
  initialContent?: string;
  editorRef?:      React.MutableRefObject<TemplateEditorHandle | null>;
}

export default function TemplateEditor({ initialContent, editorRef }: Props) {
  return (
    <div className="flex h-full overflow-hidden">
      {/* Left panel */}
      <BlocksSidebar />

      {/* Center column */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopToolbar />
        <DocumentCanvas initialContent={initialContent} editorRef={editorRef} />
      </div>

      {/* Right panel */}
      <BlockSettingsSidebar />
    </div>
  );
}
