import type { HFCtxValue } from './header-footer-context';
import type { PageDoc } from './template-doc';

export const PRESENTATION_PAGE_WIDTH = 816;
export const PRESENTATION_PAGE_HEIGHT = 1056;

type ImageAttrSource = Record<string, unknown>;

function asNumber(value: unknown): number {
  return typeof value === 'number' ? value : Number(value ?? 0);
}

export function shouldAutoSizePresentationPageFromImage(attrs: ImageAttrSource): boolean {
  return attrs.position === 'free'
    && (attrs.wrapText ?? 'none') === 'none'
    && asNumber(attrs.posX) === 0
    && asNumber(attrs.posY) === 0
    && asNumber(attrs.width) === PRESENTATION_PAGE_WIDTH;
}

export function getPresentationPageHeightFromImage(attrs: ImageAttrSource): number | null {
  if (!shouldAutoSizePresentationPageFromImage(attrs)) return null;

  const explicitHeight = asNumber(attrs.height);
  if (explicitHeight > 0) return explicitHeight;

  const naturalWidth = asNumber(attrs.naturalWidth);
  const naturalHeight = asNumber(attrs.naturalHeight);
  const width = asNumber(attrs.width);

  if (naturalWidth > 0 && naturalHeight > 0 && width > 0) {
    return Math.round((width / naturalWidth) * naturalHeight);
  }

  return null;
}

export function syncPresentationPageHeightForActivePage(
  hf: HFCtxValue | null,
  bodyOverride?: object | null,
): void {
  if (!hf) return;

  const page = hf.pages[hf.activeIdx];
  if (!page || page.kind !== 'presentation') return;
  const nextBody = {
    ...(((bodyOverride as { attrs?: Record<string, unknown> }) ?? page.body) as { attrs?: Record<string, unknown> }),
    attrs: {
      ...(((((bodyOverride as { attrs?: Record<string, unknown> }) ?? page.body) as { attrs?: Record<string, unknown> }).attrs) ?? {}),
    },
  };

  const nextPageHeight = collectPresentationPageHeight(nextBody as TipTapNodeLike);
  if (nextPageHeight && Number.isFinite(nextPageHeight)) {
    nextBody.attrs.pageHeight = nextPageHeight;
  } else {
    delete nextBody.attrs.pageHeight;
  }

  hf.patchActivePage({ body: nextBody as object });
}

type TipTapNodeLike = {
  type?: string;
  attrs?: Record<string, unknown>;
  content?: TipTapNodeLike[];
};

function collectPresentationPageHeight(node: TipTapNodeLike | null | undefined): number | null {
  if (!node) return null;

  let best: number | null = null;
  const visit = (current: TipTapNodeLike) => {
    if (current.type === 'image') {
      const candidate = getPresentationPageHeightFromImage(current.attrs ?? {});
      if (candidate && Number.isFinite(candidate)) {
        best = Math.max(best ?? 0, candidate);
      }
    }
    for (const child of current.content ?? []) visit(child);
  };

  visit(node);
  return best;
}

export function normalizePresentationPage(page: PageDoc): PageDoc {
  if ((page.kind ?? 'presentation') !== 'presentation') return page;

  const body = (page.body as { attrs?: Record<string, unknown>; content?: TipTapNodeLike[] }) ?? {};
  const nextBody = {
    ...body,
    attrs: { ...(body.attrs ?? {}) },
  };

  const computedHeight = collectPresentationPageHeight(body as TipTapNodeLike);
  if (computedHeight && Number.isFinite(computedHeight)) {
    nextBody.attrs.pageHeight = computedHeight;
  } else {
    delete nextBody.attrs.pageHeight;
  }

  return {
    ...page,
    body: nextBody as object,
  };
}

export function normalizePresentationPages(pages: PageDoc[]): PageDoc[] {
  return pages.map(normalizePresentationPage);
}
