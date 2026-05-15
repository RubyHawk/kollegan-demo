'use client';

import { useMemo, useRef } from 'react';
import { cn } from '@shared/lib/utils';

interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  disabled?: boolean;
  autoFocus?: boolean;
  ariaLabel?: string;
  className?: string;
}

export function OtpInput({
  value,
  onChange,
  length = 6,
  disabled = false,
  autoFocus = false,
  ariaLabel = 'Verification code',
  className,
}: OtpInputProps) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const chars = useMemo(
    () => Array.from({ length }, (_, index) => value[index] ?? ''),
    [length, value],
  );

  function setNextValue(index: number, nextChar: string) {
    const nextChars = [...chars];
    nextChars[index] = nextChar;
    onChange(nextChars.join('').slice(0, length));
  }

  function focusIndex(index: number) {
    refs.current[index]?.focus();
    refs.current[index]?.select();
  }

  function handleChange(index: number, rawValue: string) {
    const digits = rawValue.replace(/\D/g, '');
    if (!digits) {
      setNextValue(index, '');
      return;
    }

    if (digits.length > 1) {
      const next = [...chars];
      digits.slice(0, length - index).split('').forEach((digit, offset) => {
        next[index + offset] = digit;
      });
      onChange(next.join('').slice(0, length));
      focusIndex(Math.min(index + digits.length, length - 1));
      return;
    }

    setNextValue(index, digits);
    if (index < length - 1) focusIndex(index + 1);
  }

  function handleKeyDown(index: number, event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Backspace') {
      if (chars[index]) {
        setNextValue(index, '');
      } else if (index > 0) {
        focusIndex(index - 1);
        setNextValue(index - 1, '');
      }
    }

    if (event.key === 'ArrowLeft' && index > 0) {
      event.preventDefault();
      focusIndex(index - 1);
    }

    if (event.key === 'ArrowRight' && index < length - 1) {
      event.preventDefault();
      focusIndex(index + 1);
    }
  }

  function handlePaste(event: React.ClipboardEvent<HTMLInputElement>) {
    const digits = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    if (!digits) return;
    event.preventDefault();
    onChange(digits);
    focusIndex(Math.min(digits.length, length - 1));
  }

  return (
    <div className={cn('flex items-center gap-2', className)} role="group" aria-label={ariaLabel}>
      {chars.map((char, index) => (
        <input
          key={index}
          ref={(node) => {
            refs.current[index] = node;
          }}
          aria-label={`${ariaLabel} digit ${index + 1}`}
          inputMode="numeric"
          autoComplete={index === 0 ? 'one-time-code' : 'off'}
          autoFocus={autoFocus && index === 0}
          disabled={disabled}
          value={char}
          maxLength={1}
          onChange={(event) => handleChange(index, event.target.value)}
          onKeyDown={(event) => handleKeyDown(index, event)}
          onPaste={handlePaste}
          className="h-[52px] w-[52px] rounded-lg border border-[var(--border)] bg-[var(--surface-0)] text-center text-lg font-semibold text-[var(--text-primary)] outline-none transition-colors [font-variant-numeric:tabular-nums] focus:border-[var(--accent)]/60 focus:ring-2 focus:ring-[var(--accent)]/30 disabled:cursor-not-allowed disabled:opacity-60"
        />
      ))}
    </div>
  );
}
