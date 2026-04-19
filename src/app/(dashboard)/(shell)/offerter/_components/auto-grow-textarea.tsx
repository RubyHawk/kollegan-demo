import { useCallback, useEffect, useRef } from 'react';

export function AutoGrowTextarea({
  value,
  onChange,
  onFocus,
  placeholder,
  className,
  minRows = 2,
}: {
  value: string;
  onChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onFocus?: () => void;
  placeholder?: string;
  className?: string;
  minRows?: number;
}) {
  const ref = useRef<HTMLTextAreaElement | null>(null);
  const adjustHeight = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = '0px';
    el.style.height = `${el.scrollHeight}px`;
  }, []);

  useEffect(() => {
    adjustHeight();
  }, [adjustHeight, value]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let frameId: number | null = null;
    const scheduleAdjustHeight = () => {
      if (frameId !== null) cancelAnimationFrame(frameId);
      frameId = requestAnimationFrame(() => {
        frameId = null;
        adjustHeight();
      });
    };

    const resizeObserver = typeof ResizeObserver !== 'undefined'
      ? new ResizeObserver(() => scheduleAdjustHeight())
      : null;

    resizeObserver?.observe(el);
    window.addEventListener('resize', scheduleAdjustHeight);

    return () => {
      if (frameId !== null) cancelAnimationFrame(frameId);
      resizeObserver?.disconnect();
      window.removeEventListener('resize', scheduleAdjustHeight);
    };
  }, [adjustHeight]);

  return (
    <textarea
      ref={ref}
      value={value}
      rows={minRows}
      onChange={onChange}
      onFocus={onFocus}
      placeholder={placeholder}
      className={className}
      style={{ overflow: 'hidden' }}
    />
  );
}
