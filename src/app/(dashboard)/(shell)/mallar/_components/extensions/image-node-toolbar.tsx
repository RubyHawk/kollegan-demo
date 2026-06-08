'use client';

import type { ReactNode } from 'react';
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Ban,
  BringToFront,
  Image as ImageIcon,
  Layers,
  Maximize2,
  Move,
  PanelLeft,
  PanelRight,
  SendToBack,
  Trash2,
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@shared/ui/tooltip';
import { cn } from '@shared/lib/utils';
import {
  PRESENTATION_PAGE_HEIGHT,
  PRESENTATION_PAGE_WIDTH,
} from '../presentation-page-height';
import type { ImgAlign, ImgFloat, ImgWrapText } from './image-node-types';

interface ImageNodeToolbarProps {
  align: ImgAlign;
  atBottom: boolean;
  atTop: boolean;
  imgFloat: ImgFloat;
  isBackground: boolean;
  isFree: boolean;
  layerRank: number;
  layerTotal: number;
  posY: number;
  wrapText: ImgWrapText;
  onBringForward: () => void;
  onDelete: () => void;
  onFillPage: () => void;
  onSendBackward: () => void;
  onSetAlign: (align: ImgAlign) => void;
  onSetFloat: (float: ImgFloat) => void;
  onSetWrapText: (wrapText: ImgWrapText) => void;
  onToggleBackground: () => void;
  onToggleFreeMode: () => void;
}

export function ImageNodeToolbar({
  align,
  atBottom,
  atTop,
  imgFloat,
  isBackground,
  isFree,
  layerRank,
  layerTotal,
  posY,
  wrapText,
  onBringForward,
  onDelete,
  onFillPage,
  onSendBackward,
  onSetAlign,
  onSetFloat,
  onSetWrapText,
  onToggleBackground,
  onToggleFreeMode,
}: ImageNodeToolbarProps) {
  return (
    <TooltipProvider delayDuration={120}>
      <div
        contentEditable={false}
        style={{
          position: 'absolute',
          top: posY < 60 ? 8 : -52,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 200,
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          background: 'var(--ui-surface)',
          border: '1px solid var(--ui-border)',
          borderRadius: 8,
          boxShadow: 'var(--ui-shadow-raised)',
          padding: '3px 6px',
          whiteSpace: 'nowrap',
        }}
      >
        <ToolbarLabel>Layout</ToolbarLabel>

        <ImgBtn active={!isFree && !imgFloat} tooltip="Infogad i text - tar upp hela raden" onClick={() => onSetFloat(null)}>
          <ImageIcon size={14} strokeWidth={1.75} />
        </ImgBtn>

        <ImgBtn active={!isFree && imgFloat === 'left'} tooltip="Text flödar till höger om bilden" onClick={() => onSetFloat('left')}>
          <PanelLeft size={14} strokeWidth={1.75} />
        </ImgBtn>

        <ImgBtn active={!isFree && imgFloat === 'right'} tooltip="Text flödar till vänster om bilden" onClick={() => onSetFloat('right')}>
          <PanelRight size={14} strokeWidth={1.75} />
        </ImgBtn>

        <ImgBtn active={isFree} tooltip="Fri placering - absolut position, ignorerar textflöde" onClick={onToggleFreeMode}>
          <Move size={14} strokeWidth={1.75} />
        </ImgBtn>

        {!isFree && !imgFloat && (
          <>
            <ToolbarDivider />
            <ImgBtn active={!align || align === 'left'} tooltip="Vänsterjustera" onClick={() => onSetAlign('left')}>
              <AlignLeft size={14} strokeWidth={1.75} />
            </ImgBtn>
            <ImgBtn active={align === 'center'} tooltip="Centrera" onClick={() => onSetAlign('center')}>
              <AlignCenter size={14} strokeWidth={1.75} />
            </ImgBtn>
            <ImgBtn active={align === 'right'} tooltip="Högerjustera" onClick={() => onSetAlign('right')}>
              <AlignRight size={14} strokeWidth={1.75} />
            </ImgBtn>
          </>
        )}

        {isFree && !isBackground && (
          <>
            <ToolbarDivider />
            <ToolbarLabel>Flöde</ToolbarLabel>
            <ImgBtn active={wrapText === 'none' || !wrapText} tooltip="Ingen textomflödning - lägger sig ovanpå text" onClick={() => onSetWrapText('none')}>
              <Ban size={14} strokeWidth={1.75} />
            </ImgBtn>
            <ImgBtn active={wrapText === 'left'} tooltip="Text flödar till höger om bilden" onClick={() => onSetWrapText('left')}>
              <PanelLeft size={14} strokeWidth={1.75} />
            </ImgBtn>
            <ImgBtn active={wrapText === 'right'} tooltip="Text flödar till vänster om bilden" onClick={() => onSetWrapText('right')}>
              <PanelRight size={14} strokeWidth={1.75} />
            </ImgBtn>
          </>
        )}

        {isFree && (
          <>
            <ToolbarDivider />
            <ImgBtn active={false} tooltip={`Fyll hela sidan (${PRESENTATION_PAGE_WIDTH}x${PRESENTATION_PAGE_HEIGHT} px)`} onClick={onFillPage}>
              <Maximize2 size={14} strokeWidth={1.75} />
            </ImgBtn>
          </>
        )}

        {isFree && !isBackground && layerTotal > 1 && (
          <>
            <ToolbarDivider />
            <ToolbarLabel>Lager</ToolbarLabel>
            <ImgBtn active={false} disabled={atBottom} tooltip="Skicka bakåt" onClick={onSendBackward}>
              <SendToBack size={14} strokeWidth={1.75} />
            </ImgBtn>
            <span
              style={{
                fontSize: 10,
                minWidth: 24,
                textAlign: 'center',
                fontFamily: 'system-ui,sans-serif',
                color: 'var(--ui-text-secondary)',
                fontWeight: 600,
              }}
            >
              {layerRank}/{layerTotal}
            </span>
            <ImgBtn active={false} disabled={atTop} tooltip="Flytta framåt" onClick={onBringForward}>
              <BringToFront size={14} strokeWidth={1.75} />
            </ImgBtn>
          </>
        )}

        {isFree && (
          <>
            <ToolbarDivider />
            <ImgBtn
              active={isBackground}
              tooltip={isBackground ? 'Bakgrundsbild - klicka igen för att göra den vanlig' : 'Använd som bakgrundsbild bakom texten'}
              onClick={onToggleBackground}
            >
              <Layers size={14} strokeWidth={1.75} />
            </ImgBtn>
          </>
        )}

        <ToolbarDivider />

        <ImgBtn active={false} danger tooltip="Ta bort bild" onClick={onDelete}>
          <Trash2 size={14} strokeWidth={1.75} />
        </ImgBtn>
      </div>
    </TooltipProvider>
  );
}

function ToolbarDivider() {
  return <div style={{ width: 1, height: 16, background: 'var(--ui-border)', margin: '0 2px', flexShrink: 0 }} />;
}

function ToolbarLabel({ children }: { children: ReactNode }) {
  return (
    <span style={{ fontSize: 10, color: 'var(--ui-text-muted)', paddingRight: 2, fontFamily: 'system-ui,sans-serif', userSelect: 'none' }}>
      {children}
    </span>
  );
}

function ImgBtn({
  active,
  danger,
  disabled,
  tooltip,
  onClick,
  children,
}: {
  active: boolean;
  danger?: boolean;
  disabled?: boolean;
  tooltip: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          onMouseDown={(event) => {
            event.preventDefault();
            if (!disabled) onClick();
          }}
          className={cn(
            'inline-flex h-8 w-8 items-center justify-center rounded-md border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ui-focus)]',
            disabled && 'cursor-not-allowed border-[var(--ui-disabled-border)] bg-[var(--ui-disabled-bg)] text-[var(--ui-text-disabled)] opacity-80',
            !disabled && active && 'border-[var(--ui-accent-border)] bg-[var(--ui-surface-selected)] text-[var(--ui-accent)]',
            !disabled && !active && danger && 'border-[var(--ui-danger-border)] bg-[var(--ui-danger-bg)] text-[var(--ui-danger-text)] hover:border-[var(--ui-danger-text)]',
            !disabled && !active && !danger && 'border-transparent bg-[var(--ui-surface)] text-[var(--ui-text-secondary)] hover:border-[var(--ui-border)] hover:bg-[var(--ui-surface-hover)] hover:text-[var(--ui-text)]',
          )}
        >
          {children}
        </button>
      </TooltipTrigger>
      {!disabled && (
        <TooltipContent side="bottom" align="center">
          {tooltip}
        </TooltipContent>
      )}
    </Tooltip>
  );
}
