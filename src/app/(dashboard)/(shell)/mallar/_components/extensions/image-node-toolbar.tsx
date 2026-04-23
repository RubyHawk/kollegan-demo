'use client';

import type { ReactNode } from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@shared/ui/tooltip';
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
          background: 'white',
          border: '1px solid #e2e8f0',
          borderRadius: 8,
          boxShadow: '0 4px 14px rgba(0,0,0,0.13)',
          padding: '3px 6px',
          whiteSpace: 'nowrap',
        }}
      >
        <ToolbarLabel>Layout</ToolbarLabel>

        <ImgBtn active={!isFree && !imgFloat} tooltip="Infogad i text - tar upp hela raden" onClick={() => onSetFloat(null)}>
          <BlockIcon />
        </ImgBtn>

        <ImgBtn active={!isFree && imgFloat === 'left'} tooltip="Text flödar till höger om bilden" onClick={() => onSetFloat('left')}>
          <FloatLeftIcon />
        </ImgBtn>

        <ImgBtn active={!isFree && imgFloat === 'right'} tooltip="Text flödar till vänster om bilden" onClick={() => onSetFloat('right')}>
          <FloatRightIcon />
        </ImgBtn>

        <ImgBtn active={isFree} tooltip="Fri placering - absolut position, ignorerar textflöde" onClick={onToggleFreeMode}>
          <FreeIcon />
        </ImgBtn>

        {!isFree && !imgFloat && (
          <>
            <ToolbarDivider />
            <ImgBtn active={!align || align === 'left'} tooltip="Vänsterjustera" onClick={() => onSetAlign('left')}>
              <AlignLeftIcon />
            </ImgBtn>
            <ImgBtn active={align === 'center'} tooltip="Centrera" onClick={() => onSetAlign('center')}>
              <AlignCenterIcon />
            </ImgBtn>
            <ImgBtn active={align === 'right'} tooltip="Högerjustera" onClick={() => onSetAlign('right')}>
              <AlignRightIcon />
            </ImgBtn>
          </>
        )}

        {isFree && !isBackground && (
          <>
            <ToolbarDivider />
            <ToolbarLabel>Flöde</ToolbarLabel>
            <ImgBtn active={wrapText === 'none' || !wrapText} tooltip="Ingen textomflödning - lägger sig ovanpå text" onClick={() => onSetWrapText('none')}>
              <WrapNoneIcon />
            </ImgBtn>
            <ImgBtn active={wrapText === 'left'} tooltip="Text flödar till höger om bilden" onClick={() => onSetWrapText('left')}>
              <FloatLeftIcon />
            </ImgBtn>
            <ImgBtn active={wrapText === 'right'} tooltip="Text flödar till vänster om bilden" onClick={() => onSetWrapText('right')}>
              <FloatRightIcon />
            </ImgBtn>
          </>
        )}

        {isFree && (
          <>
            <ToolbarDivider />
            <ImgBtn active={false} tooltip={`Fyll hela sidan (${PRESENTATION_PAGE_WIDTH}x${PRESENTATION_PAGE_HEIGHT} px)`} onClick={onFillPage}>
              <FillPageIcon />
            </ImgBtn>
          </>
        )}

        {isFree && !isBackground && layerTotal > 1 && (
          <>
            <ToolbarDivider />
            <ToolbarLabel>Lager</ToolbarLabel>
            <ImgBtn active={false} disabled={atBottom} tooltip="Skicka bakåt" onClick={onSendBackward}>
              <LayerDownIcon />
            </ImgBtn>
            <span
              style={{
                fontSize: 10,
                minWidth: 24,
                textAlign: 'center',
                fontFamily: 'system-ui,sans-serif',
                color: '#475569',
                fontWeight: 600,
              }}
            >
              {layerRank}/{layerTotal}
            </span>
            <ImgBtn active={false} disabled={atTop} tooltip="Flytta framåt" onClick={onBringForward}>
              <LayerUpIcon />
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
              <BackgroundIcon />
            </ImgBtn>
          </>
        )}

        <ToolbarDivider />

        <ImgBtn active={false} danger tooltip="Ta bort bild" onClick={onDelete}>
          <TrashIcon />
        </ImgBtn>
      </div>
    </TooltipProvider>
  );
}

function ToolbarDivider() {
  return <div style={{ width: 1, height: 16, background: '#e2e8f0', margin: '0 2px', flexShrink: 0 }} />;
}

function ToolbarLabel({ children }: { children: ReactNode }) {
  return (
    <span style={{ fontSize: 10, color: '#94a3b8', paddingRight: 2, fontFamily: 'system-ui,sans-serif', userSelect: 'none' }}>
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
          onMouseDown={(e) => {
            e.preventDefault();
            if (!disabled) onClick();
          }}
          className={[
            'inline-flex h-8 w-8 items-center justify-center rounded-md border text-slate-600 transition-colors',
            disabled ? 'cursor-default border-slate-200 bg-slate-50 opacity-40' : '',
            !disabled && active ? 'border-blue-200 bg-blue-50 text-blue-700 shadow-sm' : '',
            !disabled && !active && danger ? 'border-red-200 bg-white text-red-500 hover:bg-red-50' : '',
            !disabled && !active && !danger ? 'border-transparent bg-white hover:border-slate-200 hover:bg-slate-50 hover:text-slate-900' : '',
          ].join(' ')}
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

function BlockIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
      <rect x="2" y="7" width="16" height="6" rx="1.5" />
      <rect x="2" y="2" width="16" height="2" rx="1" opacity=".35" />
      <rect x="2" y="16" width="16" height="2" rx="1" opacity=".35" />
    </svg>
  );
}

function FloatLeftIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
      <rect x="2" y="3" width="7" height="7" rx="1" />
      <rect x="11" y="3" width="7" height="1.5" rx=".75" opacity=".45" />
      <rect x="11" y="6" width="7" height="1.5" rx=".75" opacity=".45" />
      <rect x="11" y="9" width="5" height="1.5" rx=".75" opacity=".45" />
      <rect x="2" y="13" width="16" height="1.5" rx=".75" opacity=".45" />
      <rect x="2" y="16" width="12" height="1.5" rx=".75" opacity=".45" />
    </svg>
  );
}

function FloatRightIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
      <rect x="11" y="3" width="7" height="7" rx="1" />
      <rect x="2" y="3" width="7" height="1.5" rx=".75" opacity=".45" />
      <rect x="2" y="6" width="7" height="1.5" rx=".75" opacity=".45" />
      <rect x="2" y="9" width="5" height="1.5" rx=".75" opacity=".45" />
      <rect x="2" y="13" width="16" height="1.5" rx=".75" opacity=".45" />
      <rect x="2" y="16" width="12" height="1.5" rx=".75" opacity=".45" />
    </svg>
  );
}

function FreeIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
      <rect x="2" y="2" width="16" height="16" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 2" />
      <path d="M10 5.5 7.5 8h5L10 5.5zm0 9 2.5-2.5h-5L10 14.5zm-4.5-4.5L8 12.5v-5L5.5 10zm9 0L12 7.5v5l2.5-2.5z" fillRule="evenodd" />
    </svg>
  );
}

function AlignLeftIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="15" y2="12" />
      <line x1="3" y1="18" x2="18" y2="18" />
    </svg>
  );
}

function AlignCenterIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="6" y1="12" x2="18" y2="12" />
      <line x1="4" y1="18" x2="20" y2="18" />
    </svg>
  );
}

function AlignRightIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="9" y1="12" x2="21" y2="12" />
      <line x1="6" y1="18" x2="21" y2="18" />
    </svg>
  );
}

function LayerUpIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="17 11 12 6 7 11" />
      <line x1="12" y1="6" x2="12" y2="18" />
      <line x1="4" y1="20" x2="20" y2="20" />
    </svg>
  );
}

function LayerDownIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="7 13 12 18 17 13" />
      <line x1="12" y1="18" x2="12" y2="6" />
      <line x1="4" y1="4" x2="20" y2="4" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
      <path d="M9 6V4h6v2" />
    </svg>
  );
}

function FillPageIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 20 20" fill="currentColor">
      <rect x="3" y="2" width="14" height="16" rx="1" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <rect x="5" y="4" width="10" height="12" rx=".5" />
    </svg>
  );
}

function BackgroundIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="6" width="20" height="12" rx="2" />
      <path d="M2 10h20M2 14h20" strokeDasharray="3 2" />
    </svg>
  );
}

function WrapNoneIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
      <rect x="2" y="2" width="16" height="16" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <line x1="6" y1="6" x2="14" y2="14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="14" y1="6" x2="6" y2="14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
