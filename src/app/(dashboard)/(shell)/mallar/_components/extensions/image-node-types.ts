export type ImgPosition = 'inline' | 'free';
export type ImgFloat = 'left' | 'right' | null;
export type ImgAlign = 'left' | 'center' | 'right' | null;
export type ImgWrapText = 'none' | 'left' | 'right';

export interface StackItem {
  pos: number;
  zIndex: number;
}
