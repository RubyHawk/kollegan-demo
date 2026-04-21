import { sanitizeUrl } from '@platform/security/sanitize';
import { escapeHtml, resolveFreeImageRenderZIndex } from './document-formatting';

/** TipTap JSON node shape used by persisted offer document templates. */
export interface TipTapNode {
  type:    string;
  attrs?:  Record<string, unknown>;
  content?: TipTapNode[];
  text?:   string;
  marks?:  Array<{ type: string; attrs?: Record<string, unknown> }>;
}

export function getNodeTextContent(node: TipTapNode): string {
  if (node.type === 'text') return String(node.text ?? '');
  return (node.content ?? []).map(getNodeTextContent).join('');
}

export function normalizeNodeText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLocaleLowerCase('sv-SE');
}

export function nodeToHtml(node: TipTapNode, replacements?: Record<string, string>): string {
  // Curry replacements into recursive calls
  const r = (n: TipTapNode) => nodeToHtml(n, replacements);

  switch (node.type) {
    case 'doc':
      return (node.content ?? []).map(r).join('');

    case 'paragraph': {
      const inner      = (node.content ?? []).map(r).join('');
      const align      = (node.attrs?.textAlign as string | undefined) ?? '';
      const alignStyle = align ? `text-align:${align};` : '';
      return `<p style="margin:0 0 0.75em 0;${alignStyle}">${inner || '&nbsp;'}</p>`;
    }

    case 'heading': {
      const level      = (node.attrs?.level as number) ?? 1;
      const tag        = `h${Math.min(level, 6)}`;
      const sizes: Record<number, string> = { 1: '1.8em', 2: '1.4em', 3: '1.2em' };
      const size       = sizes[level] ?? '1em';
      const align      = (node.attrs?.textAlign as string | undefined) ?? '';
      const alignStyle = align ? `text-align:${align};` : '';
      const inner      = (node.content ?? []).map(r).join('');
      return `<${tag} style="margin:0.5em 0;font-size:${size};font-weight:700;${alignStyle}">${inner}</${tag}>`;
    }

    case 'image': {
      const a        = node.attrs ?? {};
      const src      = sanitizeUrl(String(a.src ?? ''));
      const alt      = escapeHtml(String(a.alt ?? ''));
      const title    = escapeHtml(String(a.title ?? ''));
      const imgPos   = String(a.position ?? 'inline');
      const wrapText = String(a.wrapText ?? 'none');
      const posX     = Number(a.posX ?? 0);
      const posY     = Number(a.posY ?? 0);
      const zIdx     = Number(a.zIndex ?? 0);
      const isBackground = a.background === true || a.background === 'true';
      const imgW     = a.width  ? Number(a.width)  : null;
      const imgH     = a.height ? Number(a.height) : null;
      const fit      = String(a.fit ?? (imgH ? 'cover' : 'contain'));
      const widthStyle  = imgW ? `width:${imgW}px;max-width:100%;` : 'max-width:100%;';
      const heightStyle = imgH ? `height:${imgH}px;object-fit:${fit};` : 'height:auto;';
      const imgStyle = `display:block;${widthStyle}${heightStyle}border-radius:4px;`;

      if (imgPos === 'free') {
        if (wrapText === 'left' || wrapText === 'right') {
          // Float-based: participates in text flow
          const ml = wrapText === 'left'  ? `margin-left:${posX}px;`                                              : '';
          const mr = wrapText === 'right' ? `margin-right:${Math.max(0, 816 - posX - (imgW ?? 200))}px;`          : '';
          const mt = posY > 0 ? `margin-top:${posY}px;` : '';
          return `<div style="float:${wrapText};${ml}${mr}${mt}margin-bottom:8px;line-height:0;position:relative;z-index:${resolveFreeImageRenderZIndex(zIdx, isBackground)};"><img src="${src}" alt="${alt}" title="${title}" style="${imgStyle}" /></div>`;
        }
        // Pure overlay (absolute)
        const w = imgW ? `${imgW}px` : '200px';
        return `<div style="position:absolute;left:${posX}px;top:${posY}px;width:${w};z-index:${resolveFreeImageRenderZIndex(zIdx, isBackground)};line-height:0;"><img src="${src}" alt="${alt}" title="${title}" style="${imgStyle}" /></div>`;
      }

      // Inline/float modes
      if (a.float === 'left' || a.float === 'right') {
        const margin = a.float === 'left' ? '4px 20px 8px 0' : '4px 0 8px 20px';
        return `<div style="float:${a.float};margin:${margin};line-height:0;"><img src="${src}" alt="${alt}" title="${title}" style="${imgStyle}" /></div>`;
      }

      const align = String(a.align ?? 'left');
      const justifyMap: Record<string, string> = { center: 'center', right: 'flex-end', left: 'flex-start' };
      const justify = justifyMap[align] ?? 'flex-start';
      return `<div style="display:flex;justify-content:${justify};margin:12px 0;"><img src="${src}" alt="${alt}" title="${title}" style="${imgStyle}" /></div>`;
    }

    case 'bulletList':
      return `<ul style="margin:0 0 0.75em 1.5em;padding:0;">${(node.content ?? []).map(r).join('')}</ul>`;

    case 'orderedList':
      return `<ol style="margin:0 0 0.75em 1.5em;padding:0;">${(node.content ?? []).map(r).join('')}</ol>`;

    case 'listItem':
      return `<li style="margin-bottom:0.25em;">${(node.content ?? []).map(r).join('')}</li>`;

    case 'hardBreak':
      return '<br/>';

    case 'horizontalRule':
      return '<hr style="border:none;border-top:1px solid #e2e8f0;margin:1em 0;"/>';

    case 'text': {
      let text = escapeHtml(node.text ?? '');
      for (const mark of (node.marks ?? [])) {
        if (mark.type === 'bold')      text = `<strong>${text}</strong>`;
        if (mark.type === 'italic')    text = `<em>${text}</em>`;
        if (mark.type === 'underline') text = `<u>${text}</u>`;
        if (mark.type === 'code')      text = `<code style="background:#f1f5f9;padding:0.1em 0.3em;border-radius:3px;font-family:monospace;">${text}</code>`;
        if (mark.type === 'textStyle' && mark.attrs?.color) {
          text = `<span style="color:${String(mark.attrs.color)};">${text}</span>`;
        }
      }
      return text;
    }

    // ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ New node types ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬

    case 'variable': {
      // Resolve variable value from replacements map; fall back to chip label
      const key   = String(node.attrs?.key ?? '');
      const label = String(node.attrs?.label ?? key);
      const value = replacements?.[`{{${key}}}`];
      const content = value ?? escapeHtml(label);
      // Wrap in a span so the live preview can highlight/scroll to this variable
      return `<span data-var="${escapeHtml(key)}">${content}</span>`;
    }

    case 'signatureBlock': {
      const fieldType = String(node.attrs?.fieldType ?? 'signature');
      const label     = escapeHtml(String(node.attrs?.label ?? 'Signatur'));
      const icons: Record<string, string> = { signature: '&#9997;', name: '&#128100;', date: '&#128197;' };
      const subtext: Record<string, string> = {
        signature: 'Underteckna med e-signatur via l&auml;nken',
        name:      'Fullst&auml;ndigt namn',
        date:      'Signeringsdatum fylls i automatiskt',
      };
      return `
        <div data-sig-field="${fieldType}" style="display:flex;align-items:center;gap:12px;border:2px dashed #cbd5e1;border-radius:10px;padding:20px 24px;margin:16px 0;background:#f8fafc;">
          <span style="font-size:20px;">${icons[fieldType] ?? 'ÃƒÂ¢Ã…â€œÃ‚Â'}</span>
          <div style="flex:1;">
            <p style="font-weight:600;color:#334155;margin:0 0 2px;">${label}</p>
            <p style="font-size:11px;color:#94a3b8;margin:0;">${escapeHtml(subtext[fieldType] ?? '')}</p>
          </div>
        </div>`;
    }

    case 'table':
      return `<table style="width:100%;border-collapse:collapse;margin-bottom:1em;">${(node.content ?? []).map(r).join('')}</table>`;

    case 'tableRow':
      return `<tr>${(node.content ?? []).map(r).join('')}</tr>`;

    case 'tableHeader': {
      const inner = (node.content ?? []).map(r).join('');
      return `<th style="padding:8px 12px;background:#f8fafc;border:1px solid #e2e8f0;font-size:12px;font-weight:600;text-align:left;">${inner}</th>`;
    }

    case 'tableCell': {
      const inner = (node.content ?? []).map(r).join('');
      return `<td style="padding:8px 12px;border:1px solid #e2e8f0;font-size:13px;vertical-align:top;">${inner}</td>`;
    }

    default:
      // Unknown node type ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â render children if any
      return (node.content ?? []).map(r).join('');
  }
}
