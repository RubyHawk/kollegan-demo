'use client';

/**
 * /templates/new
 *
 * New template editor. Uses TipTap to author WYSIWYG content with placeholders.
 * On save, POSTs to /api/templates and redirects to the edit page for the new template.
 */

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { cn } from '@shared/lib/utils';
import { OFFER_PLACEHOLDERS } from '@modules/supporting/offers/domain/template.entity';

interface OfferTemplate { id: string; name: string; content: string; }

function ToolbarBtn({ active, disabled, onClick, title, children }: {
  active?: boolean; disabled?: boolean; onClick: () => void; title: string; children: React.ReactNode;
}) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} title={title}
      className={cn('p-1.5 rounded-lg text-sm transition-colors disabled:opacity-30',
        active ? 'bg-[var(--accent)] text-white' : 'text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]')}
    >{children}</button>
  );
}

export default function NewTemplatePage() {
  const router = useRouter();
  const [name,   setName]   = useState('');
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState<string | null>(null);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: 'Börja skriva din offertmall här… Använd platshållare som {{recipientName}} för dynamisk data.' }),
    ],
    editorProps: { attributes: { class: 'prose prose-sm max-w-none min-h-[400px] focus:outline-none text-[var(--text-primary)]' } },
  });

  const insertPlaceholder = useCallback((key: string) => {
    editor?.chain().focus().insertContent(key).run();
  }, [editor]);

  const save = useCallback(async () => {
    if (!editor) return;
    if (!name.trim()) { setError('Ange ett namn för mallen.'); return; }
    setSaving(true); setError(null);
    const content = JSON.stringify(editor.getJSON());
    try {
      const res = await fetch('/api/templates', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), content }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({})) as { detail?: string };
        throw new Error(j.detail ?? `Fel ${res.status}`);
      }
      const j = await res.json() as { data: OfferTemplate };
      router.replace(`/templates/${j.data.id}`);
    } catch (e) { setError((e as Error).message); } finally { setSaving(false); }
  }, [editor, name, router]);

  return (
    <div className="px-8 py-10 max-w-4xl mx-auto">
      <div className="mb-6 flex items-center gap-3">
        <button onClick={() => router.push('/templates')} className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <h1 className="font-heading text-2xl font-semibold text-[var(--text-primary)]">Ny offertmall</h1>
      </div>

      {error && (
        <div className="mb-5 rounded-xl border border-red-200 dark:border-red-800/40 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-400 flex items-center justify-between gap-3">
          <span>{error}</span><button onClick={() => setError(null)} className="shrink-0 opacity-60 hover:opacity-100">✕</button>
        </div>
      )}

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden shadow-sm">
        {/* Name */}
        <div className="px-5 pt-5 pb-4 border-b border-[var(--border)]">
          <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">Mallnamn *</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="t.ex. Standard offertmall"
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-alt)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] transition-colors"/>
        </div>

        {/* Toolbar */}
        <div className="px-4 py-2 border-b border-[var(--border)] bg-[var(--surface-alt)] flex items-center gap-1 flex-wrap">
          <ToolbarBtn active={editor?.isActive('bold')} onClick={() => editor?.chain().focus().toggleBold().run()} title="Fet"><strong className="text-xs">B</strong></ToolbarBtn>
          <ToolbarBtn active={editor?.isActive('italic')} onClick={() => editor?.chain().focus().toggleItalic().run()} title="Kursiv"><em className="text-xs">I</em></ToolbarBtn>
          <div className="w-px h-4 bg-[var(--border)] mx-1"/>
          <ToolbarBtn active={editor?.isActive('heading', { level: 1 })} onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()} title="Rubrik 1"><span className="text-xs font-bold">H1</span></ToolbarBtn>
          <ToolbarBtn active={editor?.isActive('heading', { level: 2 })} onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()} title="Rubrik 2"><span className="text-xs font-bold">H2</span></ToolbarBtn>
          <ToolbarBtn active={editor?.isActive('heading', { level: 3 })} onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()} title="Rubrik 3"><span className="text-xs font-bold">H3</span></ToolbarBtn>
          <div className="w-px h-4 bg-[var(--border)] mx-1"/>
          <ToolbarBtn active={editor?.isActive('bulletList')} onClick={() => editor?.chain().focus().toggleBulletList().run()} title="Punktlista">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="9" y1="6" x2="20" y2="6"/><line x1="9" y1="12" x2="20" y2="12"/><line x1="9" y1="18" x2="20" y2="18"/><circle cx="4" cy="6" r="1" fill="currentColor"/><circle cx="4" cy="12" r="1" fill="currentColor"/><circle cx="4" cy="18" r="1" fill="currentColor"/></svg>
          </ToolbarBtn>
          <ToolbarBtn active={editor?.isActive('orderedList')} onClick={() => editor?.chain().focus().toggleOrderedList().run()} title="Numrerad lista">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="10" y1="18" x2="21" y2="18"/><path d="M4 6h1v4"/><path d="M4 10h2"/><path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"/></svg>
          </ToolbarBtn>
          <div className="w-px h-4 bg-[var(--border)] mx-1"/>
          <select onChange={(e) => { if (e.target.value) { insertPlaceholder(e.target.value); e.target.value = ''; } }} defaultValue=""
            className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 py-1 text-xs text-[var(--accent)] font-medium focus:outline-none focus:border-[var(--accent)] transition-colors cursor-pointer">
            <option value="" disabled>+ Platshållare</option>
            {OFFER_PLACEHOLDERS.map((p) => (<option key={p.key} value={p.key}>{p.label} — {p.key}</option>))}
          </select>
        </div>

        {/* Editor */}
        <div className="px-6 py-4 min-h-[420px] prose-editor"><EditorContent editor={editor}/></div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-[var(--border)] bg-[var(--surface-alt)] flex items-center gap-2">
          <button onClick={() => void save()} disabled={saving} className="rounded-xl bg-[var(--accent)] px-5 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50 transition-opacity">
            {saving ? 'Sparar…' : 'Skapa mall'}
          </button>
          <button onClick={() => router.push('/templates')} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] transition-colors">
            Avbryt
          </button>
        </div>
      </div>

      <style jsx global>{`
        .prose-editor .ProseMirror { outline: none; min-height: 400px; }
        .prose-editor .ProseMirror p { margin-bottom: 0.75em; }
        .prose-editor .ProseMirror h1 { font-size: 1.6em; font-weight: 700; margin: 0.5em 0; }
        .prose-editor .ProseMirror h2 { font-size: 1.3em; font-weight: 700; margin: 0.5em 0; }
        .prose-editor .ProseMirror h3 { font-size: 1.1em; font-weight: 600; margin: 0.5em 0; }
        .prose-editor .ProseMirror ul { list-style: disc; padding-left: 1.5em; margin-bottom: 0.75em; }
        .prose-editor .ProseMirror ol { list-style: decimal; padding-left: 1.5em; margin-bottom: 0.75em; }
        .prose-editor .ProseMirror li { margin-bottom: 0.25em; }
        .prose-editor .ProseMirror p.is-editor-empty:first-child::before { color: var(--text-muted); content: attr(data-placeholder); float: left; height: 0; pointer-events: none; }
      `}</style>
    </div>
  );
}
