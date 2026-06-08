'use client';

import { useEffect, useState, type KeyboardEvent } from 'react';
import type { Editor } from '@tiptap/core';
import { useHeaderFooter } from './header-footer-context';
import { ChoiceButton, Field, InspectorCard, SegmentedControl, inputClass, secondaryButtonClass } from './block-settings-controls';
import { PRESENTATION_PAGE_HEIGHT, PRESENTATION_PAGE_WIDTH, syncPresentationPageHeightForActivePage } from './presentation-page-height';
import { cn } from '@shared/lib/utils';
import { buildForegroundImageStack, getMaxForegroundImageLayer, getSelectedImagePosition, swapImageLayers } from './image-layer-utils';

export function ImageInspector({ editor }: { editor: Editor }) {
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
    event: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>,
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
      subtitle="Välj ett tydligt bildläge och finjustera storlek och placering utan tröga sliders."
    >
      <div className="space-y-4">
        <Field label="Bildläge">
          <SegmentedControl>
            {[
              { value: 'auto', label: 'Auto' },
              { value: 'inline', label: 'Infogad' },
              { value: 'float-left', label: 'Flyt vänster' },
              { value: 'float-right', label: 'Flyt höger' },
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
          </SegmentedControl>
        </Field>

        {(mode === 'auto' || mode === 'inline') && (
          <Field label="Justering">
            <SegmentedControl columns={3}>
              {[
                { value: 'left', label: 'Vänster' },
                { value: 'center', label: 'Center' },
                { value: 'right', label: 'Höger' },
              ].map((option) => (
                <ChoiceButton
                  key={option.value}
                  active={align === option.value}
                  onClick={() => setImageAttrs({ position: 'inline', float: null, align: option.value, background: false })}
                >
                  {option.label}
                </ChoiceButton>
              ))}
            </SegmentedControl>
          </Field>
        )}

        <Field label="Storlek">
          <SegmentedControl>
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
          </SegmentedControl>
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
              placeholder="Höjd i px"
              className={inputClass}
            />
          </div>
          <p className="mt-2 text-xs text-[var(--ui-text-muted)]">
            Lämna höjden tom för automatisk proportion. Nuvarande original: {naturalWidth ?? 'okänd'} × {naturalHeight ?? 'okänd'} px.
          </p>
        </Field>

        {(mode === 'free' || mode === 'background') && (
          <Field label="Placering på sidan">
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
            <div className="mt-3">
              <SegmentedControl>
              <ChoiceButton active={posX === 0 && posY === 0} onClick={() => setImageAttrs({ posX: 0, posY: 0 })}>
                Övre vänster
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
              </SegmentedControl>
            </div>
          </Field>
        )}

        {mode === 'free' && (
          <Field label="Textflöde">
            <SegmentedControl columns={3}>
              <ChoiceButton active={wrapText === 'none'} onClick={() => setImageAttrs({ wrapText: 'none' })}>
                Ovanpå
              </ChoiceButton>
              <ChoiceButton active={wrapText === 'left'} onClick={() => setImageAttrs({ wrapText: 'left' })}>
                Text höger
              </ChoiceButton>
              <ChoiceButton active={wrapText === 'right'} onClick={() => setImageAttrs({ wrapText: 'right' })}>
                Text vänster
              </ChoiceButton>
            </SegmentedControl>
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
                Bakåt
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
                Framåt
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
            placeholder="Beskriv bilden för tillgänglighet"
            className={inputClass}
          />
        </Field>

        <button
          type="button"
          onClick={() => editor.chain().focus().deleteSelection().run()}
          className="w-full rounded-lg border border-[var(--ui-danger-border)] bg-[var(--ui-danger-bg)] px-3 py-2.5 text-sm font-semibold text-[var(--ui-danger-text)] transition-colors hover:border-[var(--ui-danger-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ui-focus)]"
        >
          Ta bort bild
        </button>
      </div>
    </InspectorCard>
  );
}
