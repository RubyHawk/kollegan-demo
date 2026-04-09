import { parseDocument } from 'htmlparser2';
import render from 'dom-serializer';
import { removeElement } from 'domutils';
import { isTag, isText, type AnyNode, type ChildNode } from 'domhandler';
import type { Offer } from '../domain/offer.entity';
import type { OfferBrandingProfile } from './company-branding';
import { sanitizeGeneratedOfferDocument } from './document-generator';

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

export function stripPdfExcludedPageBlocks(documentHtml: string): string {
  if (!documentHtml.includes('data-customer-pdf="false"')) {
    return documentHtml;
  }

  const document = parseDocument(documentHtml, {
    decodeEntities: false,
    recognizeSelfClosing: true,
  });
  stripExcludedPages(document.children);
  return render(document.children, { encodeEntities: false });
}

export function sanitizePublicPdfOfferDocument(
  documentHtml: string,
  offer: Offer,
  branding?: OfferBrandingProfile,
): string {
  return stripPdfExcludedPageBlocks(
    sanitizeGeneratedOfferDocument(documentHtml, offer, branding),
  );
}
