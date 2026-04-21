'use client';

import { useEffect, useState } from 'react';
import type { Editor } from '@tiptap/core';
import { useTemplateEditor } from './editor-context';
import { useHeaderFooter } from './header-footer-context';
import { DocumentDefaultsInspector, PresentationPageInspector } from './presentation-page-inspectors';
import { StructuredOfferInspector } from './structured-offer-inspector';
import {
  ChoiceButton,
  Field,
  InspectorCard,
  inputClass,
  secondaryButtonClass,
} from './block-settings-controls';
import {
  PRESENTATION_PAGE_HEIGHT,
  PRESENTATION_PAGE_WIDTH,
  syncPresentationPageHeightForActivePage,
} from './presentation-page-height';
import { cn } from '@shared/lib/utils';

type ActiveBlock = 'image' | 'table' | 'signatureBlock' | 'variable' | null;

export default function BlockSettingsSidebar() {
  const editor = useTemplateEditor();
  const hf = useHeaderFooter();
  const [active, setActive] = useState<ActiveBlock>(null);

  const activePage = hf?.pages[hf.activeIdx] ?? null;
  const isDocumentPage = activePage?.kind === 'document';

  useEffect(() => {
    if (!editor) return;
    const activeEditor = editor;
    function update() {
      if (activeEditor.isActive('image')) setActive('image');
      else if (activeEditor.isActive('table')) setActive('table');
      else if (activeEditor.isActive('signatureBlock')) setActive('signatureBlock');
      else if (activeEditor.isActive('variable')) setActive('variable');
      else setActive(null);
    }
    update();
    activeEditor.on('selectionUpdate', update);
    activeEditor.on('transaction', update);
    return () => {
      activeEditor.off('selectionUpdate', update);
      activeEditor.off('transaction', update);
    };
  }, [editor]);

  if (!hf) return null;

  return (
    <aside className="hidden w-[288px] shrink-0 xl:flex flex-col overflow-y-auto border-l border-[var(--border)] bg-[var(--surface-1)]">
      {isDocumentPage ? (
        <StructuredOfferInspector key={activePage?.id ?? 'document-page'} hf={hf} />
      ) : (
        <div className="space-y-2 p-2">
          {active === 'image' && editor && <ImageInspector editor={editor} />}
          {active === 'table' && <TableInspector />}
          {active === 'signatureBlock' && editor && <SignatureInspector editor={editor} />}
          {active === 'variable' && editor && <VariableInspector editor={editor} />}
          {active === null && (
            <>
              <PresentationPageInspector hf={hf} />
              <DocumentDefaultsInspector hf={hf} />
            </>
          )}
        </div>
      )}
    </aside>
  );
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function LegacyImageInspector({ editor }: { editor: Editor }) {
  const attrs = editor.getAttributes('image');
  const width = Number(attrs.width ?? 360);
  const heightAttr = attrs.height as number | null | undefined;
  const align = (attrs.align as string | undefined) ?? 'left';
  const position = (attrs.position as string | undefined) ?? 'inline';
  const imgFloat = (attrs.float as string | null | undefined) ?? null;
  const wrapText = (attrs.wrapText as string | undefined) ?? 'none';
  const posX = Number(attrs.posX ?? 0);
  const posY = Number(attrs.posY ?? 0);
  const zIndex = Number(attrs.zIndex ?? 0);
  const altText = (attrs.alt as string | undefined) ?? '';
  const naturalWidth = attrs.naturalWidth as number | null | undefined;
  const naturalHeight = attrs.naturalHeight as number | null | undefined;

  const isFree = position === 'free';
  const isFloating = !isFree && (imgFloat === 'left' || imgFloat === 'right');
  const isBehind = isFree && zIndex < 0;

  const patch = (values: Record<string, unknown>) =>
    editor.chain().focus().updateAttributes('image', values).run();

  function setLayout(mode: 'inline' | 'floatLeft' | 'floatRight' | 'free') {
    if (mode === 'inline') {
      patch({ position: 'inline', float: null, align: 'left', wrapText: 'none' });
    } else if (mode === 'floatLeft') {
      patch({ position: 'inline', float: 'left', align: null });
    } else if (mode === 'floatRight') {
      patch({ position: 'inline', float: 'right', align: null });
    } else {
      patch({ position: 'free', float: null });
    }
  }

  function fillPage() {
    patch({
      position: 'free',
      float: null,
      posX: 0,
      posY: 0,
      width: PRESENTATION_PAGE_WIDTH,
      height: PRESENTATION_PAGE_HEIGHT,
      wrapText: 'none',
      zIndex: -1,
    });
  }

  function resetSize() {
    if (naturalWidth && naturalHeight) {
      const cap = Math.min(naturalWidth, PRESENTATION_PAGE_WIDTH);
      patch({ width: cap, height: null });
    } else {
      patch({ width: 360, height: null });
    }
  }

  function deleteImage() {
    editor.chain().focus().deleteSelection().run();
  }

  return (
    <InspectorCard title="Bild" subtitle="InstÃ¤llningar fÃ¶r markerad bild.">
      <div className="space-y-2.5">
        <Field label="Layout">
          <div className="grid grid-cols-2 gap-1">
            <ChoiceButton
              active={!isFree && !isFloating}
              onClick={() => setLayout('inline')}
            >
              Infogad
            </ChoiceButton>
            <ChoiceButton
              active={isFree}
              onClick={() => setLayout('free')}
            >
              Fri placering
            </ChoiceButton>
            <ChoiceButton
              active={!isFree && imgFloat === 'left'}
              onClick={() => setLayout('floatLeft')}
            >
              Flytande vÃ¤
            </ChoiceButton>
            <ChoiceButton
              active={!isFree && imgFloat === 'right'}
              onClick={() => setLayout('floatRight')}
            >
              Flytande hÃ¶
            </ChoiceButton>
          </div>
        </Field>

        {!isFree && !isFloating && (
          <Field label="Justering">
            <div className="grid grid-cols-3 gap-1">
              {[
                { value: 'left', label: 'VÃ¤nster' },
                { value: 'center', label: 'Center' },
                { value: 'right', label: 'HÃ¶ger' },
              ].map((option) => (
                <ChoiceButton
                  key={option.value}
                  active={align === option.value}
                  onClick={() => patch({ align: option.value })}
                >
                  {option.label}
                </ChoiceButton>
              ))}
            </div>
          </Field>
        )}

        <Field label={`Bredd  Â·  ${width}px`}>
          <input
            type="range"
            min={80}
            max={PRESENTATION_PAGE_WIDTH}
            step={4}
            value={width}
            onChange={(event) => patch({ width: Number(event.target.value) })}
            className="w-full accent-[var(--accent)]"
          />
          <div className="mt-1 flex items-center gap-1">
            <input
              type="number"
              min={80}
              max={PRESENTATION_PAGE_WIDTH}
              step={4}
              value={width}
              onChange={(event) => {
                const next = Math.max(80, Math.min(PRESENTATION_PAGE_WIDTH, Number(event.target.value) || 0));
                patch({ width: next });
              }}
              className={inputClass}
            />
            <button
              type="button"
              onClick={resetSize}
              className="shrink-0 rounded-md border border-[var(--border)] bg-[var(--surface-0)] px-2 py-1 text-[10px] font-medium text-[var(--text-secondary)] hover:border-[var(--accent-border)] hover:text-[var(--text-primary)]"
              title={naturalWidth ? `Ã…terstÃ¤ll till originalstorlek (${naturalWidth}Ã—${naturalHeight}px)` : 'Ã…terstÃ¤ll'}
            >
              Ã…terstÃ¤ll
            </button>
          </div>
        </Field>

        <Field label={`HÃ¶jd  Â·  ${heightAttr ? `${heightAttr}px` : 'auto'}`}>
          <input
            type="range"
            min={40}
            max={PRESENTATION_PAGE_HEIGHT}
            step={4}
            value={heightAttr ?? 0}
            onChange={(event) => {
              const next = Number(event.target.value);
              patch({ height: next === 0 ? null : next });
            }}
            className="w-full accent-[var(--accent)]"
          />
          <p className="mt-0.5 text-[10px] leading-4 text-[var(--text-muted)]">
            0 = automatisk hÃ¶jd (proportionell)
          </p>
        </Field>

        {isFree && (
          <>
            <Field label="Position pÃ¥ sidan">
              <div className="grid grid-cols-2 gap-1">
                <label className="flex items-center gap-1 rounded-md border border-[var(--border)] bg-[var(--surface-0)] px-1.5 py-1">
                  <span className="text-[10px] font-semibold text-[var(--text-muted)]">X</span>
                  <input
                    type="number"
                    value={Math.round(posX)}
                    onChange={(event) => patch({ posX: Number(event.target.value) || 0 })}
                    className="w-full bg-transparent text-[11px] text-[var(--text-primary)] focus:outline-none"
                  />
                </label>
                <label className="flex items-center gap-1 rounded-md border border-[var(--border)] bg-[var(--surface-0)] px-1.5 py-1">
                  <span className="text-[10px] font-semibold text-[var(--text-muted)]">Y</span>
                  <input
                    type="number"
                    value={Math.round(posY)}
                    onChange={(event) => patch({ posY: Number(event.target.value) || 0 })}
                    className="w-full bg-transparent text-[11px] text-[var(--text-primary)] focus:outline-none"
                  />
                </label>
              </div>
            </Field>

            <Field label="TextflÃ¶de">
              <div className="grid grid-cols-3 gap-1">
                <ChoiceButton active={wrapText === 'none'} onClick={() => patch({ wrapText: 'none' })}>
                  OvanpÃ¥
                </ChoiceButton>
                <ChoiceButton active={wrapText === 'left'} onClick={() => patch({ wrapText: 'left' })}>
                  VÃ¤nster
                </ChoiceButton>
                <ChoiceButton active={wrapText === 'right'} onClick={() => patch({ wrapText: 'right' })}>
                  HÃ¶ger
                </ChoiceButton>
              </div>
            </Field>

            <div className="grid grid-cols-2 gap-1">
              <button
                type="button"
                onClick={fillPage}
                className="rounded-md border border-[var(--border)] bg-[var(--surface-0)] px-2 py-1.5 text-[11px] font-medium text-[var(--text-secondary)] hover:border-[var(--accent-border)] hover:text-[var(--text-primary)]"
                title="Fyll hela sidan med bilden som bakgrund"
              >
                Fyll sida
              </button>
              <button
                type="button"
                onClick={() => patch({ zIndex: isBehind ? 1 : -1 })}
                className={cn(
                  'rounded-md border px-2 py-1.5 text-[11px] font-medium transition-colors',
                  isBehind
                    ? 'border-[var(--accent-border)] bg-[var(--accent-subtle)] text-[var(--accent)]'
                    : 'border-[var(--border)] bg-[var(--surface-0)] text-[var(--text-secondary)] hover:border-[var(--accent-border)] hover:text-[var(--text-primary)]'
                )}
                title={isBehind ? 'Bilden ligger bakom texten â€” klicka fÃ¶r att flytta fram' : 'LÃ¤gg bilden bakom texten'}
              >
                {isBehind ? 'Bakom text' : 'Bakom text'}
              </button>
            </div>
          </>
        )}

        <Field label="Alternativtext (alt)">
          <input
            type="text"
            value={altText}
            placeholder="Beskriv bilden fÃ¶r tillgÃ¤nglighet"
            onChange={(event) => patch({ alt: event.target.value })}
            className={inputClass}
          />
        </Field>

        <button
          type="button"
          onClick={deleteImage}
          className="w-full rounded-md border border-red-200 bg-red-50 px-2 py-1.5 text-[11px] font-semibold text-red-600 transition-colors hover:bg-red-100"
        >
          Ta bort bild
        </button>
      </div>
    </InspectorCard>
  );
}

interface ImageStackItem {
  pos: number;
  zIndex: number;
}

function buildForegroundImageStack(editor: Editor): ImageStackItem[] {
  const items: ImageStackItem[] = [];
  editor.state.doc.descendants((node, pos) => {
    if (
      node.type.name === 'image'
      && node.attrs.position === 'free'
      && node.attrs.background !== true
      && (node.attrs.zIndex ?? 0) >= 0
    ) {
      items.push({ pos, zIndex: Number(node.attrs.zIndex ?? 0) });
    }
  });
  return items.sort((a, b) => a.zIndex - b.zIndex);
}

function getSelectedImagePosition(editor: Editor): number | null {
  const selection = editor.state.selection as { from?: number; node?: { type?: { name?: string } } };
  return selection.node?.type?.name === 'image' ? (selection.from ?? null) : null;
}

function swapImageLayers(editor: Editor, firstPos: number, secondPos: number) {
  const firstNode = editor.state.doc.nodeAt(firstPos);
  const secondNode = editor.state.doc.nodeAt(secondPos);
  if (!firstNode || !secondNode) return;
  const transaction = editor.state.tr;
  transaction.setNodeAttribute(firstPos, 'zIndex', secondNode.attrs.zIndex ?? 0);
  transaction.setNodeAttribute(secondPos, 'zIndex', firstNode.attrs.zIndex ?? 0);
  editor.view.dispatch(transaction);
}

function getMaxForegroundImageLayer(editor: Editor): number {
  let maxLayer = 0;
  editor.state.doc.descendants((node) => {
    if (
      node.type.name === 'image'
      && node.attrs.position === 'free'
      && node.attrs.background !== true
      && (node.attrs.zIndex ?? 0) >= 0
    ) {
      maxLayer = Math.max(maxLayer, Number(node.attrs.zIndex ?? 0));
    }
  });
  return maxLayer;
}

function ImageInspector({ editor }: { editor: Editor }) {
  const hf = useHeaderFooter();
  const attrs = editor.getAttributes('image') as Record<string, unknown>;
  const position = attrs.position === 'free' ? 'free' : 'inline';
  const floatMode = attrs.float === 'left' || attrs.float === 'right' ? attrs.float : null;
  const align = attrs.align === 'center' || attrs.align === 'right' ? attrs.align : 'left';
  const wrapText = attrs.wrapText === 'left' || attrs.wrapText === 'right' ? attrs.wrapText : 'none';
  const width = typeof attrs.width === 'number' ? attrs.width : null;
  const height = typeof attrs.height === 'number' ? attrs.height : null;
  const naturalWidth = typeof attrs.naturalWidth === 'number' ? attrs.naturalWidth : null;
  const naturalHeight = typeof attrs.naturalHeight === 'number' ? attrs.naturalHeight : null;
  const posX = typeof attrs.posX === 'number' ? attrs.posX : 100;
  const posY = typeof attrs.posY === 'number' ? attrs.posY : 100;
  const alt = typeof attrs.alt === 'string' ? attrs.alt : '';
  const isBackground = attrs.background === true || (position === 'free' && Number(attrs.zIndex ?? 0) < 0);
  const mode: 'auto' | 'inline' | 'float-left' | 'float-right' | 'free' | 'background' =
    isBackground
      ? 'background'
      : position === 'free'
        ? 'free'
        : floatMode === 'left'
          ? 'float-left'
          : floatMode === 'right'
            ? 'float-right'
            : width == null && height == null
              ? 'auto'
              : 'inline';

  const [widthDraft, setWidthDraft] = useState(width == null ? '' : String(width));
  const [heightDraft, setHeightDraft] = useState(height == null ? '' : String(height));
  const [posXDraft, setPosXDraft] = useState(String(posX));
  const [posYDraft, setPosYDraft] = useState(String(posY));
  const [altDraft, setAltDraft] = useState(alt);

  useEffect(() => {
    setWidthDraft(width == null ? '' : String(width));
  }, [width]);

  useEffect(() => {
    setHeightDraft(height == null ? '' : String(height));
  }, [height]);

  useEffect(() => {
    setPosXDraft(String(posX));
  }, [posX]);

  useEffect(() => {
    setPosYDraft(String(posY));
  }, [posY]);

  useEffect(() => {
    setAltDraft(alt);
  }, [alt]);

  const syncPageHeight = () => {
    if (!hf) return;
    queueMicrotask(() => {
      syncPresentationPageHeightForActivePage(hf, editor.getJSON() as object | undefined);
    });
  };

  const setImageAttrs = (patch: Record<string, unknown>) => {
    editor.chain().focus().updateAttributes('image', patch).run();
    syncPageHeight();
  };

  const commitPixelField = (
    rawValue: string,
    options: {
      min?: number;
      max?: number;
      allowAuto?: boolean;
      onAuto?: () => void;
      onCommit: (value: number) => void;
    }
  ) => {
    const trimmed = rawValue.trim();
    if (!trimmed) {
      if (options.allowAuto) options.onAuto?.();
      return;
    }
    const parsed = Number(trimmed.replace(',', '.'));
    if (!Number.isFinite(parsed)) return;
    const bounded = Math.round(Math.min(options.max ?? parsed, Math.max(options.min ?? 0, parsed)));
    options.onCommit(bounded);
  };

  const onDraftKeyDown = (
    event: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>,
    commit: () => void
  ) => {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    commit();
  };

  const selectMode = (nextMode: 'auto' | 'inline' | 'float-left' | 'float-right' | 'free' | 'background') => {
    if (nextMode === 'auto') {
      setImageAttrs({
        position: 'inline',
        float: null,
        align: 'left',
        width: null,
        height: null,
        wrapText: 'none',
        background: false,
      });
      return;
    }

    if (nextMode === 'inline') {
      setImageAttrs({
        position: 'inline',
        float: null,
        align,
        background: false,
        wrapText: 'none',
      });
      return;
    }

    if (nextMode === 'float-left' || nextMode === 'float-right') {
      setImageAttrs({
        position: 'inline',
        float: nextMode === 'float-left' ? 'left' : 'right',
        align: nextMode === 'float-left' ? 'left' : 'right',
        background: false,
        wrapText: 'none',
      });
      return;
    }

    if (nextMode === 'free') {
      setImageAttrs({
        position: 'free',
        float: null,
        background: false,
        wrapText,
        posX,
        posY,
        zIndex: Math.max(1, Number(attrs.zIndex ?? 0), getMaxForegroundImageLayer(editor) + 1),
      });
      return;
    }

    setImageAttrs({
      position: 'free',
      float: null,
      background: true,
      wrapText: 'none',
      posX: 0,
      posY: 0,
      zIndex: 0,
      width: width ?? PRESENTATION_PAGE_WIDTH,
    });
  };

  const layerStack = position === 'free' && !isBackground ? buildForegroundImageStack(editor) : [];
  const selectedLayerPos = getSelectedImagePosition(editor);
  const layerIndex = selectedLayerPos == null ? -1 : layerStack.findIndex((item) => item.pos === selectedLayerPos);
  const canMoveBackward = layerIndex > 0;
  const canMoveForward = layerIndex >= 0 && layerIndex < layerStack.length - 1;

  const applyAutoSize = () => {
    setImageAttrs({ width: null, height: null });
  };

  const fillPage = () => {
    setImageAttrs({
      position: 'free',
      float: null,
      background: false,
      wrapText: 'none',
      posX: 0,
      posY: 0,
      width: PRESENTATION_PAGE_WIDTH,
      height: PRESENTATION_PAGE_HEIGHT,
      zIndex: Math.max(1, getMaxForegroundImageLayer(editor) + 1),
    });
  };

  return (
    <InspectorCard
      title="Bild"
      subtitle="VÃ¤lj ett tydligt bildlÃ¤ge och finjustera storlek och placering utan trÃ¶ga sliders."
    >
      <div className="space-y-4">
        <Field label="BildlÃ¤ge">
          <div className="grid grid-cols-2 gap-2">
            {[
              { value: 'auto', label: 'Auto' },
              { value: 'inline', label: 'Infogad' },
              { value: 'float-left', label: 'Flyt vÃ¤nster' },
              { value: 'float-right', label: 'Flyt hÃ¶ger' },
              { value: 'free', label: 'Fri placering' },
              { value: 'background', label: 'Bakgrund' },
            ].map((option) => (
              <ChoiceButton
                key={option.value}
                active={mode === option.value}
                onClick={() => selectMode(option.value as 'auto' | 'inline' | 'float-left' | 'float-right' | 'free' | 'background')}
              >
                {option.label}
              </ChoiceButton>
            ))}
          </div>
        </Field>

        {(mode === 'auto' || mode === 'inline') && (
          <Field label="Justering">
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'left', label: 'VÃ¤nster' },
                { value: 'center', label: 'Center' },
                { value: 'right', label: 'HÃ¶ger' },
              ].map((option) => (
                <ChoiceButton
                  key={option.value}
                  active={align === option.value}
                  onClick={() => setImageAttrs({ position: 'inline', float: null, align: option.value, background: false })}
                >
                  {option.label}
                </ChoiceButton>
              ))}
            </div>
          </Field>
        )}

        <Field label="Storlek">
          <div className="grid grid-cols-2 gap-2">
            <ChoiceButton active={width == null && height == null} onClick={applyAutoSize}>
              Auto
            </ChoiceButton>
            <ChoiceButton active={width === 320} onClick={() => setImageAttrs({ width: 320, height: null })}>
              320 px
            </ChoiceButton>
            <ChoiceButton active={width === 520} onClick={() => setImageAttrs({ width: 520, height: null })}>
              520 px
            </ChoiceButton>
            <ChoiceButton active={width === PRESENTATION_PAGE_WIDTH && height == null} onClick={() => setImageAttrs({ width: PRESENTATION_PAGE_WIDTH, height: null })}>
              Full bredd
            </ChoiceButton>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <input
              type="number"
              inputMode="numeric"
              min={80}
              max={PRESENTATION_PAGE_WIDTH}
              step={8}
              value={widthDraft}
              onChange={(event) => setWidthDraft(event.target.value)}
              onBlur={() =>
                commitPixelField(widthDraft, {
                  min: 80,
                  max: PRESENTATION_PAGE_WIDTH,
                  allowAuto: true,
                  onAuto: () => setImageAttrs({ width: null }),
                  onCommit: (value) => setImageAttrs({ width: value }),
                })
              }
              onKeyDown={(event) =>
                onDraftKeyDown(event, () =>
                  commitPixelField(widthDraft, {
                    min: 80,
                    max: PRESENTATION_PAGE_WIDTH,
                    allowAuto: true,
                    onAuto: () => setImageAttrs({ width: null }),
                    onCommit: (value) => setImageAttrs({ width: value }),
                  })
                )
              }
              placeholder="Bredd i px"
              className={inputClass}
            />
            <input
              type="number"
              inputMode="numeric"
              min={0}
              max={4000}
              step={8}
              value={heightDraft}
              onChange={(event) => setHeightDraft(event.target.value)}
              onBlur={() =>
                commitPixelField(heightDraft, {
                  min: 0,
                  max: 4000,
                  allowAuto: true,
                  onAuto: () => setImageAttrs({ height: null }),
                  onCommit: (value) => setImageAttrs({ height: value === 0 ? null : value }),
                })
              }
              onKeyDown={(event) =>
                onDraftKeyDown(event, () =>
                  commitPixelField(heightDraft, {
                    min: 0,
                    max: 4000,
                    allowAuto: true,
                    onAuto: () => setImageAttrs({ height: null }),
                    onCommit: (value) => setImageAttrs({ height: value === 0 ? null : value }),
                  })
                )
              }
              placeholder="HÃ¶jd i px"
              className={inputClass}
            />
          </div>
          <p className="mt-2 text-xs text-[var(--text-muted)]">
            LÃ¤mna hÃ¶jden tom fÃ¶r automatisk proportion. Nuvarande original: {naturalWidth ?? 'okÃ¤nd'} Ã— {naturalHeight ?? 'okÃ¤nd'} px.
          </p>
        </Field>

        {(mode === 'free' || mode === 'background') && (
          <Field label="Placering pÃ¥ sidan">
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                inputMode="numeric"
                step={8}
                value={posXDraft}
                onChange={(event) => setPosXDraft(event.target.value)}
                onBlur={() =>
                  commitPixelField(posXDraft, {
                    min: 0,
                    max: PRESENTATION_PAGE_WIDTH,
                    onCommit: (value) => setImageAttrs({ posX: value }),
                  })
                }
                onKeyDown={(event) =>
                  onDraftKeyDown(event, () =>
                    commitPixelField(posXDraft, {
                      min: 0,
                      max: PRESENTATION_PAGE_WIDTH,
                      onCommit: (value) => setImageAttrs({ posX: value }),
                    })
                  )
                }
                placeholder="X"
                className={inputClass}
              />
              <input
                type="number"
                inputMode="numeric"
                step={8}
                value={posYDraft}
                onChange={(event) => setPosYDraft(event.target.value)}
                onBlur={() =>
                  commitPixelField(posYDraft, {
                    min: 0,
                    max: Math.max(PRESENTATION_PAGE_HEIGHT * 3, posY),
                    onCommit: (value) => setImageAttrs({ posY: value }),
                  })
                }
                onKeyDown={(event) =>
                  onDraftKeyDown(event, () =>
                    commitPixelField(posYDraft, {
                      min: 0,
                      max: Math.max(PRESENTATION_PAGE_HEIGHT * 3, posY),
                      onCommit: (value) => setImageAttrs({ posY: value }),
                    })
                  )
                }
                placeholder="Y"
                className={inputClass}
              />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <ChoiceButton active={posX === 0 && posY === 0} onClick={() => setImageAttrs({ posX: 0, posY: 0 })}>
                Ã–vre vÃ¤nster
              </ChoiceButton>
              <ChoiceButton active={posX === 96 && posY === 96} onClick={() => setImageAttrs({ posX: 96, posY: 96 })}>
                Textyta
              </ChoiceButton>
              <ChoiceButton active={false} onClick={fillPage}>
                Fyll sida
              </ChoiceButton>
              <ChoiceButton active={false} onClick={applyAutoSize}>
                Auto storlek
              </ChoiceButton>
            </div>
          </Field>
        )}

        {mode === 'free' && (
          <Field label="TextflÃ¶de">
            <div className="grid grid-cols-3 gap-2">
              <ChoiceButton active={wrapText === 'none'} onClick={() => setImageAttrs({ wrapText: 'none' })}>
                OvanpÃ¥
              </ChoiceButton>
              <ChoiceButton active={wrapText === 'left'} onClick={() => setImageAttrs({ wrapText: 'left' })}>
                Text hÃ¶ger
              </ChoiceButton>
              <ChoiceButton active={wrapText === 'right'} onClick={() => setImageAttrs({ wrapText: 'right' })}>
                Text vÃ¤nster
              </ChoiceButton>
            </div>
          </Field>
        )}

        {mode === 'free' && layerStack.length > 1 && (
          <Field label={`Lager (${layerIndex + 1} av ${layerStack.length})`}>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={!canMoveBackward}
                onClick={() => {
                  if (!canMoveBackward || layerIndex <= 0) return;
                  swapImageLayers(editor, layerStack[layerIndex].pos, layerStack[layerIndex - 1].pos);
                }}
                className={cn(
                  secondaryButtonClass,
                  !canMoveBackward && 'cursor-not-allowed opacity-40'
                )}
              >
                BakÃ¥t
              </button>
              <button
                type="button"
                disabled={!canMoveForward}
                onClick={() => {
                  if (!canMoveForward || layerIndex < 0) return;
                  swapImageLayers(editor, layerStack[layerIndex].pos, layerStack[layerIndex + 1].pos);
                }}
                className={cn(
                  secondaryButtonClass,
                  !canMoveForward && 'cursor-not-allowed opacity-40'
                )}
              >
                FramÃ¥t
              </button>
            </div>
          </Field>
        )}

        <Field label="Alternativtext">
          <input
            type="text"
            value={altDraft}
            onChange={(event) => setAltDraft(event.target.value)}
            onBlur={() => setImageAttrs({ alt: altDraft.trim() || null })}
            onKeyDown={(event) => onDraftKeyDown(event, () => setImageAttrs({ alt: altDraft.trim() || null }))}
            placeholder="Beskriv bilden fÃ¶r tillgÃ¤nglighet"
            className={inputClass}
          />
        </Field>

        <button
          type="button"
          onClick={() => editor.chain().focus().deleteSelection().run()}
          className="w-full rounded-2xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm font-semibold text-red-600 transition-colors hover:border-red-300 hover:bg-red-100"
        >
          Ta bort bild
        </button>
      </div>
    </InspectorCard>
  );
}

function TableInspector() {
  return (
    <InspectorCard
      title="Tabell"
      subtitle="Tabeller justeras direkt i dokumentytan. Markera celler och anvÃ¤nd den fria layouten pÃ¥ sidan."
    >
      <div className="rounded-md border border-dashed border-[var(--border)] bg-[var(--surface-0)] px-2 py-2 text-[11px] leading-5 text-[var(--text-secondary)]">
        Ã„ndra tabellinnehÃ¥ll direkt i canvasen â€” markera celler fÃ¶r att redigera.
      </div>
    </InspectorCard>
  );
}

function SignatureInspector({ editor }: { editor: Editor }) {
  const attrs = editor.getAttributes('signatureBlock');
  const fieldType = (attrs.fieldType as string) ?? 'signature';
  const label = (attrs.label as string) ?? 'Signatur';

  return (
    <InspectorCard title="SignaturfÃ¤lt" subtitle="Avancerat block fÃ¶r presentationssidor.">
      <div className="space-y-2">
        <Field label="FÃ¤lttyp">
          <div className="grid grid-cols-3 gap-2">
            {[
              { value: 'signature', label: 'Signatur' },
              { value: 'name', label: 'Namn' },
              { value: 'date', label: 'Datum' },
            ].map((option) => (
              <ChoiceButton
                key={option.value}
                active={fieldType === option.value}
                onClick={() => editor.chain().focus().updateAttributes('signatureBlock', { fieldType: option.value }).run()}
              >
                {option.label}
              </ChoiceButton>
            ))}
          </div>
        </Field>

        <Field label="Etikett">
          <input
            type="text"
            value={label}
            onChange={(event) => editor.chain().focus().updateAttributes('signatureBlock', { label: event.target.value }).run()}
            className={inputClass}
          />
        </Field>
      </div>
    </InspectorCard>
  );
}

function VariableInspector({ editor }: { editor: Editor }) {
  const attrs = editor.getAttributes('variable');
  const key = (attrs.key as string) ?? '';
  const label = (attrs.label as string) ?? '';

  return (
    <InspectorCard title="Variabel" subtitle="FÃ¤lt som fylls med offertdata automatiskt.">
      <div className="space-y-2">
        <Field label="Variabelnamn">
          <code className="block break-all rounded-md border border-violet-200 bg-violet-50 px-2 py-1 text-[11px] text-violet-700">
            {`{{${key}}}`}
          </code>
        </Field>
        <Field label="Etikett">
          <div className="rounded-md border border-[var(--border)] bg-[var(--surface-0)] px-2 py-1.5 text-[12px] text-[var(--text-primary)]">
            {label}
          </div>
        </Field>
      </div>
    </InspectorCard>
  );
}
