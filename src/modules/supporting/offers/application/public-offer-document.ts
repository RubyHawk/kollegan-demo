import { parseDocument } from 'htmlparser2';
import render from 'dom-serializer';
import { removeElement } from 'domutils';
import { isTag, isText, type AnyNode, type ChildNode, type Element } from 'domhandler';
import type { Offer } from '../domain/offer.entity';
import type { OfferBrandingProfile } from './company-branding';
import { sanitizeGeneratedOfferDocument } from './document-generator';

const PARSE_OPTIONS = {
  decodeEntities: false,
  recognizeSelfClosing: true,
} as const;

function hasClass(node: AnyNode | null, className: string): boolean {
  if (!node || !isTag(node)) return false;
  return (node.attribs.class ?? '')
    .split(/\s+/)
    .filter(Boolean)
    .includes(className);
}

function isPdfExcludedPage(node: AnyNode | null): node is ChildNode {
  return Boolean(
    node
    && isTag(node)
    && hasClass(node, 'page-block')
    && node.attribs['data-customer-pdf'] === 'false',
  );
}

type NodeWithChildren = AnyNode & { children: ChildNode[] };

function getNodeChildren(node: AnyNode): ChildNode[] | null {
  return 'children' in node ? (node as NodeWithChildren).children : null;
}

function getElementChildren(node: AnyNode): Element[] {
  return (getNodeChildren(node) ?? []).filter((child): child is Element => isTag(child));
}

function getAdjacentElement(node: ChildNode, direction: 'prev' | 'next'): AnyNode | null {
  let cursor = node[direction];
  while (cursor) {
    if (isText(cursor) && cursor.data.trim().length === 0) {
      cursor = cursor[direction];
      continue;
    }
    return cursor;
  }
  return null;
}

function removeAdjacentSeparator(node: ChildNode): void {
  const previous = getAdjacentElement(node, 'prev');
  if (previous && hasClass(previous, 'page-separator')) {
    removeElement(previous);
    return;
  }

  const next = getAdjacentElement(node, 'next');
  if (next && hasClass(next, 'page-separator')) {
    removeElement(next);
  }
}

function collectText(node: AnyNode | null): string {
  if (!node) return '';
  if (isText(node)) return node.data;
  return (getNodeChildren(node) ?? []).map((child) => collectText(child)).join('');
}

function findDescendant(node: AnyNode, predicate: (candidate: AnyNode) => boolean): AnyNode | null {
  for (const child of getNodeChildren(node) ?? []) {
    if (predicate(child)) return child;
    const nested = findDescendant(child, predicate);
    if (nested) return nested;
  }
  return null;
}

function visitNodes(node: AnyNode, visitor: (candidate: AnyNode) => void): void {
  for (const child of getNodeChildren(node) ?? []) {
    visitor(child);
    visitNodes(child, visitor);
  }
}

function hasAbsoluteInlineStyle(node: Element): boolean {
  const style = (node.attribs.style ?? '').replace(/\s+/g, '').toLowerCase();
  return style.includes('position:absolute');
}

function hasStructuredOfferContent(node: AnyNode): boolean {
  let found = false;
  visitNodes(node, (candidate) => {
    if (found || !isTag(candidate)) return;
    if (
      hasClass(candidate, 'offer-shell')
      || hasClass(candidate, 'offer-items')
      || hasClass(candidate, 'offer-summary')
      || candidate.attribs['data-var'] === 'lineItems'
      || candidate.name === 'table'
    ) {
      found = true;
    }
  });
  return found;
}

function isPromoPageBlock(node: AnyNode | null): node is ChildNode {
  if (!node || !isTag(node) || !hasClass(node, 'page-block')) return false;

  const pageContent = findDescendant(node, (candidate) => isTag(candidate) && hasClass(candidate, 'page-content'));
  const pageRoot = (pageContent && isTag(pageContent)) ? pageContent : node;
  const topLevelChildren = getElementChildren(pageRoot);
  const text = collectText(pageRoot).replace(/\s+/g, ' ').trim();
  const hasEdgeToEdgeAbsoluteImage = topLevelChildren.some((child) => hasAbsoluteInlineStyle(child));
  const hasMeaningfulInlineContent = topLevelChildren.some((child) => {
    if (hasAbsoluteInlineStyle(child)) return false;
    const childText = collectText(child).replace(/\s+/g, ' ').trim();
    return childText.length >= 40 || /^(h[1-6]|ul|ol|table)$/i.test(child.name);
  });

  return hasEdgeToEdgeAbsoluteImage && !hasMeaningfulInlineContent && !hasStructuredOfferContent(pageRoot) && text.length < 40;
}

function stripExcludedPages(nodes: ChildNode[]): void {
  for (const node of [...nodes]) {
    if (isPdfExcludedPage(node)) {
      removeAdjacentSeparator(node);
      removeElement(node);
      continue;
    }

    const children = getNodeChildren(node);
    if (children && children.length > 0) {
      stripExcludedPages(children);
    }
  }
}

function stripPublicOnlyPages(nodes: ChildNode[]): void {
  for (const node of [...nodes]) {
    if (isPdfExcludedPage(node) || isPromoPageBlock(node)) {
      removeAdjacentSeparator(node);
      removeElement(node);
      continue;
    }

    const children = getNodeChildren(node);
    if (children && children.length > 0) {
      stripPublicOnlyPages(children);
    }
  }
}

function upsertStyleDeclaration(style: string | undefined, property: string, value: string): string {
  const declarations = (style ?? '')
    .split(';')
    .map((entry) => entry.trim())
    .filter(Boolean)
    .filter((entry) => !entry.toLowerCase().startsWith(`${property.toLowerCase()}:`));

  declarations.push(`${property}:${value}`);
  return declarations.join(';');
}

function resolveCompactGridTemplate(columnCount: number): string | null {
  if (columnCount >= 6) {
    return 'minmax(0,1.9fr) 44px 86px 56px 56px 92px';
  }
  if (columnCount === 5) {
    return 'minmax(0,1.95fr) 44px 86px 56px 92px';
  }
  if (columnCount === 4) {
    return 'minmax(0,2.1fr) 44px 88px 96px';
  }
  return null;
}

function compactStructuredLineItemTables(root: AnyNode): void {
  visitNodes(root, (candidate) => {
    if (!isTag(candidate)) return;
    if (!hasClass(candidate, 'offer-items__head') && !hasClass(candidate, 'offer-item-row')) return;

    const template = resolveCompactGridTemplate(getElementChildren(candidate).length);
    if (!template) return;
    candidate.attribs.style = upsertStyleDeclaration(candidate.attribs.style, '--offer-columns', template);
  });
}

function removeLeadBlurb(root: AnyNode): void {
  visitNodes(root, (candidate) => {
    if (isTag(candidate) && hasClass(candidate, 'offer-shell__lead')) {
      removeElement(candidate);
    }
  });
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function normalizeWebsiteDisplay(value: string): string {
  return value
    .trim()
    .replace(/^https?:\/\//i, '')
    .replace(/\/+$/, '');
}

function normalizeWebsiteHref(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return '';
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

function findFooterWebsite(companyBlockHtml: string, branding?: OfferBrandingProfile): string {
  const fromBranding = branding?.website?.trim();
  if (fromBranding) return fromBranding;

  const match = companyBlockHtml.match(/(?:https?:\/\/)?(?:www\.)?[a-z0-9-]+\.[a-z]{2,}(?:\/[^\s<]*)?/i);
  return match?.[0]?.trim() ?? '';
}

function simplifyCompanyFooterBlock(html: string, branding?: OfferBrandingProfile): string {
  return html.replace(
    /(<footer class="offer-shell__footer">\s*<div>)([\s\S]*?)(<\/div>)/i,
    (match, prefix: string, inner: string, suffix: string) => {
      const website = findFooterWebsite(inner, branding);
      if (!website) return match;

      const headingMatch = inner.match(/<strong>([\s\S]*?)<\/strong>/i);
      const heading = headingMatch?.[1]?.trim() || 'Företag';
      const href = normalizeWebsiteHref(website);
      const display = normalizeWebsiteDisplay(website);

      return `${prefix}<strong>${heading}</strong><a href="${escapeHtml(href)}" target="_blank" rel="noreferrer noopener">${escapeHtml(display)}</a>${suffix}`;
    },
  );
}

function injectPublicCleanupStyles(html: string): string {
  const styleTag = `
<style data-public-offer-cleanup>
  .page-block--document::before {
    content: none !important;
    display: none !important;
    background: none !important;
    background-image: none !important;
    opacity: 0 !important;
  }
  .page-content--document,
  .offer-shell,
  .offer-shell__header,
  .offer-shell__topline,
  .offer-items__table,
  .offer-summary,
  .offer-summary__row,
  .offer-summary__row--total {
    background: #ffffff !important;
    background-image: none !important;
  }
  .offer-shell__lead {
    display: none !important;
  }
  .offer-shell__footer a {
    color: inherit !important;
    text-decoration: none !important;
    font-weight: 500 !important;
  }
</style>`;

  return html.includes('</head>')
    ? html.replace('</head>', `${styleTag}\n</head>`)
    : `${styleTag}${html}`;
}

function cleanupPublicOfferHtml(html: string, branding?: OfferBrandingProfile): string {
  return injectPublicCleanupStyles(
    simplifyCompanyFooterBlock(
      html.replace(/(\b\d{1,2}\s*%)\s*moms\b/giu, '$1'),
      branding,
    ),
  );
}

export function stripPdfExcludedPageBlocks(documentHtml: string): string {
  if (!documentHtml.includes('data-customer-pdf="false"')) {
    return documentHtml;
  }

  const document = parseDocument(documentHtml, PARSE_OPTIONS);
  stripExcludedPages(document.children);
  return render(document.children, { encodeEntities: false });
}

export function sanitizePublicOfferDocument(
  documentHtml: string,
  offer: Offer,
  branding?: OfferBrandingProfile,
): string {
  const sanitizedHtml = sanitizeGeneratedOfferDocument(documentHtml, offer, branding);
  const document = parseDocument(sanitizedHtml, PARSE_OPTIONS);
  stripPublicOnlyPages(document.children);
  compactStructuredLineItemTables(document);
  removeLeadBlurb(document);
  return cleanupPublicOfferHtml(
    render(document.children, { encodeEntities: false }),
    branding,
  );
}

export function sanitizePublicPdfOfferDocument(
  documentHtml: string,
  offer: Offer,
  branding?: OfferBrandingProfile,
): string {
  return sanitizePublicOfferDocument(documentHtml, offer, branding);
}
