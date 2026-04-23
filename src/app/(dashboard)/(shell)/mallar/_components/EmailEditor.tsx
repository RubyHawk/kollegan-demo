'use client';

/**
 * EmailEditor — visual WYSIWYG email builder.
 *
 * Renders a simulated email canvas (600 px, white card on gray bg) with an
 * editable TipTap body area. Header, CTA button and footer are rendered as
 * live previews controlled by the design settings panel on the right.
 *
 * getBodyHtml() returns TipTap HTML. Variable chips emit {{key}} text so that
 * interpolateEmailText() in document-generator can substitute them at send time.
 */

import { useState, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import { VariableNode } from './extensions/variable-node.extension';
import { OFFER_PLACEHOLDERS } from '@modules/supporting/offers/domain/template.entity';
import {
  AlignCIcon,
  AlignLIcon,
  AlignRIcon,
  BulletIcon,
  ColorRow,
  DesignSection,
  Field,
  HrIcon,
  OListIcon,
  Sep,
  SettingsIcon,
  TBtn,
  ToggleRow,
  inputStyle,
} from './email-editor-controls';

// ── Design config (mirrors EmailDesignConfig in offer-email.jobs.ts) ──────────

interface DesignConfig {
  header: {
    companyName?: string;
    logoUrl?:     string;
    tagline?:     string;
    bgColor:      string;
    textColor:    string;
    accentColor:  string;
    alignment:    'left' | 'center';
    showDivider:  boolean;
  };
  cta: {
    bgColor:      string;
    textColor:    string;
    borderRadius: number;
    label:        string;
  };
  footer: {
    companyInfo?: string;
    legalText?:   string;
    bgColor:      string;
    textColor:    string;
    showSocial:   boolean;
  };
}

const DEFAULT_DESIGN: DesignConfig = {
  header: { bgColor: '#0f172a', textColor: '#ffffff', accentColor: '#94a3b8', alignment: 'center', showDivider: true },
  cta:    { bgColor: '#0f172a', textColor: '#ffffff', borderRadius: 8, label: 'Visa & signera offert' },
  footer: { bgColor: '#0f172a', textColor: '#94a3b8', showSocial: false },
};

const DEFAULT_BODY =
  '<p>Hej <span data-variable="recipientName" data-label="Mottagarens namn" class="variable-chip">{{recipientName}}</span>,</p>' +
  '<p>Vi har nöjet att presentera en offert för <strong><span data-variable="offerTitle" data-label="Offertrubrik" class="variable-chip">{{offerTitle}}</span></strong>.</p>' +
  '<p>Totalbelopp: <strong><span data-variable="totalIncVat" data-label="Summa inkl. moms" class="variable-chip">{{totalIncVat}}</span></strong> &nbsp;|&nbsp; ' +
  'Giltig till: <span data-variable="validUntil" data-label="Giltig till" class="variable-chip">{{validUntil}}</span></p>';

// ── Public handle ─────────────────────────────────────────────────────────────

export interface EmailEditorHandle {
  getSubject():      string;
  getBodyHtml():     string;   // TipTap HTML — variables as {{key}} text
  getHeaderConfig(): string;   // JSON string matching EmailDesignConfig shape
  setContent(subject: string, bodyHtml: string, headerConfig: string): void;
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  initialSubject?:      string;
  initialHtml?:         string;
  initialHeaderConfig?: string;
  editorRef?: React.MutableRefObject<EmailEditorHandle | null>;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function EmailEditor({ initialSubject, initialHtml, initialHeaderConfig, editorRef }: Props) {
  const [subject,    setSubject]    = useState(initialSubject ?? '');
  const [showDesign, setShowDesign] = useState(false);
  const [design,     setDesign]     = useState<DesignConfig>(() => parseDesign(initialHeaderConfig));

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ dropcursor: false }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      TextStyle,
      Color,
      Underline,
      Link.configure({ openOnClick: false }),
      VariableNode,
    ],
    content: initialHtml || DEFAULT_BODY,
    editorProps: { attributes: { class: 'email-prose', spellcheck: 'true' } },
  });

  // ── Expose handle ──────────────────────────────────────────────────────────

  useEffect(() => {
    if (!editorRef || !editor) return;
    editorRef.current = {
      getSubject:      () => subject,
      getBodyHtml:     () => editor.getHTML(),
      getHeaderConfig: () => JSON.stringify(design),
      setContent(s, html, configJson) {
        setSubject(s);
        editor.commands.setContent(html || DEFAULT_BODY);
        setDesign(parseDesign(configJson));
      },
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor, subject, design]);

  // ── Design helpers ─────────────────────────────────────────────────────────

  const ph = (patch: Partial<DesignConfig['header']>) =>
    setDesign((d) => ({ ...d, header: { ...d.header, ...patch } }));
  const pc = (patch: Partial<DesignConfig['cta']>) =>
    setDesign((d) => ({ ...d, cta: { ...d.cta, ...patch } }));
  const pf = (patch: Partial<DesignConfig['footer']>) =>
    setDesign((d) => ({ ...d, footer: { ...d.footer, ...patch } }));

  const insertVar = (key: string, label: string) =>
    editor?.chain().focus().insertContent({ type: 'variable', attrs: { key, label } }).run();

  const { header: h, cta, footer: f } = design;
  const hasHeader = !!(h.companyName || h.logoUrl);
  const hasFooter = !!(f.companyInfo || f.legalText);

  // Variables shown in toolbar
  const EMAIL_VARS = OFFER_PLACEHOLDERS.filter((p) =>
    ['recipientName', 'offerTitle', 'totalIncVat', 'validUntil', 'recipientCompany'].includes(
      p.key.replace(/[{}]/g, ''),
    ),
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', background: 'var(--surface-1)' }}>

      {/* ── Toolbar ─────────────────────────────────────────────────────────── */}
      <div style={{
        background: 'var(--surface-2)', borderBottom: '1px solid var(--border)',
        padding: '4px 10px', display: 'flex', alignItems: 'center',
        gap: 3, flexWrap: 'wrap', flexShrink: 0, userSelect: 'none',
      }}>
        <TBtn bold active={!!editor?.isActive('bold')}      onClick={() => editor?.chain().focus().toggleBold().run()}>B</TBtn>
        <TBtn italic active={!!editor?.isActive('italic')}  onClick={() => editor?.chain().focus().toggleItalic().run()}>I</TBtn>
        <TBtn underline active={!!editor?.isActive('underline')} onClick={() => editor?.chain().focus().toggleUnderline().run()}>U</TBtn>

        <Sep />

        <TBtn active={!!editor?.isActive({ textAlign: 'left' })}   onClick={() => editor?.chain().focus().setTextAlign('left').run()}   title="Vänster"><AlignLIcon /></TBtn>
        <TBtn active={!!editor?.isActive({ textAlign: 'center' })} onClick={() => editor?.chain().focus().setTextAlign('center').run()} title="Centrera"><AlignCIcon /></TBtn>
        <TBtn active={!!editor?.isActive({ textAlign: 'right' })}  onClick={() => editor?.chain().focus().setTextAlign('right').run()}  title="Höger"><AlignRIcon /></TBtn>

        <Sep />

        <TBtn active={!!editor?.isActive('bulletList')}  onClick={() => editor?.chain().focus().toggleBulletList().run()}  title="Punktlista"><BulletIcon /></TBtn>
        <TBtn active={!!editor?.isActive('orderedList')} onClick={() => editor?.chain().focus().toggleOrderedList().run()} title="Numrerad lista"><OListIcon /></TBtn>
        <TBtn onClick={() => editor?.chain().focus().setHorizontalRule().run()} title="Avdelare"><HrIcon /></TBtn>

        <Sep />

        {/* Heading style */}
        {(['paragraph', 'h1', 'h2'] as const).map((style) => {
          const isActive = style === 'paragraph' ? editor?.isActive('paragraph') : editor?.isActive('heading', { level: style === 'h1' ? 1 : 2 });
          const label    = style === 'paragraph' ? 'P' : style.toUpperCase();
          return (
            <TBtn key={style} active={!!isActive} onClick={() => {
              if (style === 'paragraph') editor?.chain().focus().setParagraph().run();
              else editor?.chain().focus().toggleHeading({ level: style === 'h1' ? 1 : 2 }).run();
            }} title={style === 'paragraph' ? 'Normal text' : `Rubrik ${style.slice(1)}`}>
              <span style={{ fontSize: 11, fontWeight: 600 }}>{label}</span>
            </TBtn>
          );
        })}

        <Sep />

        {/* Variable chips */}
        <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'system-ui,sans-serif', marginLeft: 2 }}>Infoga:</span>
        {EMAIL_VARS.map((p) => {
          const key = p.key.replace(/[{}]/g, '');
          return (
            <button
              key={key}
              type="button"
              onMouseDown={(e) => { e.preventDefault(); insertVar(key, p.label); }}
              title={`Infoga ${p.label}`}
              style={{
                fontSize: 10, padding: '2px 7px',
                border: '1px solid #c4b5fd', borderRadius: 4,
                background: '#ede9fe', color: '#5b21b6',
                cursor: 'pointer', fontFamily: 'system-ui,sans-serif',
                fontWeight: 500, whiteSpace: 'nowrap',
              }}
            >
              {p.label}
            </button>
          );
        })}

        {/* Design settings toggle */}
        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); setShowDesign((v) => !v); }}
          style={{
            marginLeft: 'auto', fontSize: 11, padding: '3px 10px',
            border: `1px solid ${showDesign ? 'var(--accent-border)' : 'var(--border)'}`,
            borderRadius: 4, background: showDesign ? 'var(--accent-subtle)' : 'var(--surface)',
            color: showDesign ? 'var(--accent)' : 'var(--text-primary)',
            cursor: 'pointer', fontFamily: 'system-ui,sans-serif',
            display: 'flex', alignItems: 'center', gap: 5,
          }}
        >
          <SettingsIcon />
          Design
        </button>
      </div>

      {/* ── Subject line ─────────────────────────────────────────────────────── */}
      <div style={{
        borderBottom: '1px solid var(--border)', background: 'var(--surface)',
        padding: '8px 20px', display: 'flex', alignItems: 'center',
        gap: 10, flexShrink: 0,
      }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', fontFamily: 'system-ui,sans-serif', minWidth: 56, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Ämne</span>
        <input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="t.ex. Offert: {{offerTitle}}"
          style={{
            flex: 1, fontSize: 13, border: 'none', outline: 'none',
            color: 'var(--text-primary)', fontFamily: 'system-ui,sans-serif',
            background: 'transparent',
          }}
        />
      </div>

      {/* ── Main area ─────────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex' }}>

        {/* ── Email canvas ─────────────────────────────────────────────────── */}
        <div style={{ flex: 1, overflow: 'auto', background: '#dde1e7', padding: '32px 16px' }}>
          <div style={{ maxWidth: 600, margin: '0 auto', borderRadius: 8, overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.13)' }}>

            {/* Header preview */}
            {hasHeader && (
              <div style={{
                background: h.bgColor,
                padding: '24px 28px 20px',
                textAlign: h.alignment,
                fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',
              }}>
                {h.logoUrl && (
                  <img src={h.logoUrl} alt="" style={{ maxHeight: 48, maxWidth: 200, marginBottom: 10, display: h.alignment === 'center' ? 'block' : 'inline', margin: h.alignment === 'center' ? '0 auto 10px' : '0 0 10px 0' }} />
                )}
                {h.companyName && (
                  <div style={{ fontSize: 20, fontWeight: 700, color: h.textColor }}>{h.companyName}</div>
                )}
                {h.tagline && (
                  <div style={{ fontSize: 12, color: h.accentColor, marginTop: 4 }}>{h.tagline}</div>
                )}
                {h.showDivider && (
                  <div style={{ height: 2, background: h.accentColor, opacity: 0.3, marginTop: 14, borderRadius: 1 }} />
                )}
              </div>
            )}

            {/* Editable email body */}
            {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
            <div
              style={{ background: '#ffffff', padding: '28px 28px 8px', cursor: 'text' }}
              onClick={() => editor?.commands.focus()}
            >
              <EditorContent editor={editor} />
            </div>

            {/* CTA preview */}
            <div style={{ background: '#ffffff', padding: '8px 28px 28px', textAlign: 'center' }}>
              <div style={{
                display: 'inline-block',
                background: cta.bgColor, color: cta.textColor,
                padding: '13px 32px',
                borderRadius: cta.borderRadius,
                fontWeight: 600, fontSize: 15,
                fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',
                opacity: 0.85,
                cursor: 'default',
              }}>
                {cta.label} →
              </div>
              <div style={{ marginTop: 10, fontSize: 11, color: '#94a3b8', fontFamily: '-apple-system,sans-serif' }}>
                Länk till offerten (läggs till automatiskt)
              </div>
            </div>

            {/* Footer preview */}
            {hasFooter && (
              <div style={{
                background: f.bgColor,
                padding: '16px 28px',
                textAlign: 'center',
                fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',
              }}>
                {f.companyInfo && (
                  <div style={{ fontSize: 12, color: f.textColor, marginBottom: 4 }}>{f.companyInfo}</div>
                )}
                {f.legalText && (
                  <div style={{ fontSize: 10, color: f.textColor, opacity: 0.7 }}>{f.legalText}</div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Design settings panel ─────────────────────────────────────────── */}
        {showDesign && (
          <div style={{
            width: 280, borderLeft: '1px solid var(--border)', background: 'var(--surface-1)',
            overflow: 'auto', flexShrink: 0, padding: '16px',
          }}>

            <DesignSection title="Sidhuvud">
              <Field label="Företagsnamn">
                <input value={h.companyName ?? ''} onChange={(e) => ph({ companyName: e.target.value })} style={inputStyle} placeholder="Ditt företag" />
              </Field>
              <Field label="Tagline">
                <input value={h.tagline ?? ''} onChange={(e) => ph({ tagline: e.target.value })} style={inputStyle} placeholder="Din slogan" />
              </Field>
              <Field label="Logo-URL">
                <input value={h.logoUrl ?? ''} onChange={(e) => ph({ logoUrl: e.target.value })} style={inputStyle} placeholder="https://…" />
              </Field>
              <Field label="Bakgrundsfärg">
                <ColorRow value={h.bgColor} onChange={(v) => ph({ bgColor: v })} />
              </Field>
              <Field label="Textfärg">
                <ColorRow value={h.textColor} onChange={(v) => ph({ textColor: v })} />
              </Field>
              <Field label="Accentfärg">
                <ColorRow value={h.accentColor} onChange={(v) => ph({ accentColor: v })} />
              </Field>
              <Field label="Justering">
                <select value={h.alignment} onChange={(e) => ph({ alignment: e.target.value as 'left' | 'center' })} style={inputStyle}>
                  <option value="left">Vänster</option>
                  <option value="center">Centrerad</option>
                </select>
              </Field>
              <ToggleRow label="Visa avdelare" value={h.showDivider} onChange={(v) => ph({ showDivider: v })} />
            </DesignSection>

            <DesignSection title="Knapp (CTA)">
              <Field label="Text">
                <input value={cta.label} onChange={(e) => pc({ label: e.target.value })} style={inputStyle} />
              </Field>
              <Field label="Bakgrundsfärg">
                <ColorRow value={cta.bgColor} onChange={(v) => pc({ bgColor: v })} />
              </Field>
              <Field label="Textfärg">
                <ColorRow value={cta.textColor} onChange={(v) => pc({ textColor: v })} />
              </Field>
              <Field label="Avrundning (px)">
                <input type="number" min={0} max={24} value={cta.borderRadius} onChange={(e) => pc({ borderRadius: Number(e.target.value) })} style={{ ...inputStyle, width: 80 }} />
              </Field>
            </DesignSection>

            <DesignSection title="Sidfot">
              <Field label="Företagsinfo">
                <textarea value={f.companyInfo ?? ''} onChange={(e) => pf({ companyInfo: e.target.value })} rows={2} style={{ ...inputStyle, resize: 'vertical' }} placeholder="t.ex. Företag AB · Org.nr 556000-0000" />
              </Field>
              <Field label="Juridisk text">
                <textarea value={f.legalText ?? ''} onChange={(e) => pf({ legalText: e.target.value })} rows={2} style={{ ...inputStyle, resize: 'vertical' }} placeholder="t.ex. © 2025 Företag AB" />
              </Field>
              <Field label="Bakgrundsfärg">
                <ColorRow value={f.bgColor} onChange={(v) => pf({ bgColor: v })} />
              </Field>
              <Field label="Textfärg">
                <ColorRow value={f.textColor} onChange={(v) => pf({ textColor: v })} />
              </Field>
            </DesignSection>

          </div>
        )}
      </div>

      {/* ── Editor styles ────────────────────────────────────────────────────── */}
      <style>{`
        .email-prose { outline: none; }
        .email-prose p         { margin: 0 0 14px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 15px; line-height: 1.65; color: #1e293b; }
        .email-prose h1        { font-size: 24px; font-weight: 700; margin: 0 0 14px 0; color: #0f172a; }
        .email-prose h2        { font-size: 18px; font-weight: 600; margin: 0 0 10px 0; color: #0f172a; }
        .email-prose strong    { font-weight: 700; }
        .email-prose em        { font-style: italic; }
        .email-prose a         { color: #2563eb; text-decoration: underline; }
        .email-prose hr        { border: none; border-top: 1px solid #e2e8f0; margin: 16px 0; }
        .email-prose ul        { list-style: disc;    padding-left: 24px; margin: 0 0 12px 0; }
        .email-prose ol        { list-style: decimal; padding-left: 24px; margin: 0 0 12px 0; }
        .email-prose li        { margin-bottom: 4px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 15px; }
        .email-prose li > p    { margin: 0; }
        .email-prose .variable-chip {
          display: inline-flex; align-items: center; gap: 3px;
          background: #ede9fe; color: #5b21b6;
          border: 1px solid #c4b5fd; border-radius: 4px;
          padding: 1px 6px; font-size: 12px; font-family: system-ui, sans-serif;
          font-weight: 500; white-space: nowrap; user-select: none; cursor: default;
        }
      `}</style>
    </div>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function parseDesign(configJson?: string): DesignConfig {
  if (!configJson) return DEFAULT_DESIGN;
  try {
    const parsed = JSON.parse(configJson) as Partial<DesignConfig>;
    // Backward compat: old flat header-only config
    if (parsed && 'bgColor' in parsed && !('header' in parsed)) {
      return { ...DEFAULT_DESIGN, header: { ...DEFAULT_DESIGN.header, ...(parsed as unknown as Partial<DesignConfig['header']>) } };
    }
    return {
      header: { ...DEFAULT_DESIGN.header, ...parsed.header },
      cta:    { ...DEFAULT_DESIGN.cta,    ...parsed.cta },
      footer: { ...DEFAULT_DESIGN.footer, ...parsed.footer },
    };
  } catch {
    return DEFAULT_DESIGN;
  }
}

// ── Small UI components ────────────────────────────────────────────────────────
