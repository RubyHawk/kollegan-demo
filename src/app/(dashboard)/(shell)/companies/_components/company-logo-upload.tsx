'use client';

import { useId, useRef, useState } from 'react';
import { Image as ImageIcon, Trash2, Upload } from 'lucide-react';
import { cn } from '@shared/lib/utils';
import { Button } from '@shared/ui/button';
import { InlineAlert } from '@shared/ui/inline-alert';

const ACCEPTED_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/avif',
  'image/gif',
]);

const MAX_FILE_BYTES = 2 * 1024 * 1024;
const RECOMMENDED_SIZE = 'Kvadratisk PNG eller WebP, helst 512x512 px, max 2 MB.';

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Kunde inte läsa bildfilen.'));
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.readAsDataURL(file);
  });
}

function loadImageMeta(dataUrl: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const image = new window.Image();
    image.onerror = () => reject(new Error('Kunde inte läsa bildens storlek.'));
    image.onload = () => resolve({ width: image.width, height: image.height });
    image.src = dataUrl;
  });
}

interface CompanyLogoUploadProps {
  value: string;
  onChange: (nextValue: string) => void;
}

export function CompanyLogoUpload({ value, onChange }: CompanyLogoUploadProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<{ width: number; height: number } | null>(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleFile = async (file: File) => {
    setError(null);

    if (!ACCEPTED_TYPES.has(file.type)) {
      setMeta(null);
      setError('Använd PNG, JPG, WebP, AVIF eller GIF.');
      return;
    }

    if (file.size > MAX_FILE_BYTES) {
      setMeta(null);
      setError('Loggan är för stor. Max 2 MB.');
      return;
    }

    setLoading(true);
    try {
      const dataUrl = await readFileAsDataUrl(file);
      const dimensions = await loadImageMeta(dataUrl);
      setMeta(dimensions);
      onChange(dataUrl);
    } catch (uploadError) {
      setMeta(null);
      setError(uploadError instanceof Error ? uploadError.message : 'Kunde inte läsa loggan.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          const file = event.dataTransfer.files?.[0];
          if (file) void handleFile(file);
        }}
        className={cn(
          'group flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-[var(--ui-radius-lg)] border border-dashed bg-[var(--ui-surface)] px-4 py-5 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ui-focus)] focus-visible:ring-offset-2',
          dragging
            ? 'border-[var(--ui-accent-border)] bg-[var(--ui-surface-selected)]'
            : 'border-[var(--ui-border)] hover:border-[var(--ui-border-strong)] hover:bg-[var(--ui-surface-hover)]',
        )}
      >
        {value ? (
          <div className="flex w-full flex-col items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={value}
              alt="Förhandsvisning av företagslogga"
              className="h-20 w-20 rounded-[var(--ui-radius-lg)] border border-[var(--ui-border)] bg-[var(--ui-surface-raised)] object-contain p-2"
            />
            <div className="space-y-1">
              <p className="text-sm font-medium text-[var(--ui-text)]">Loggan är redo att sparas</p>
              <p className="text-xs text-[var(--ui-text-muted)]">Klicka eller droppa en ny bild för att byta ut den.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-[var(--ui-radius-lg)] border border-[var(--ui-accent-border)] bg-[var(--ui-accent-subtle)] text-[var(--ui-accent)]">
              <Upload size={22} strokeWidth={1.75} />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-[var(--ui-text)]">Dra in loggan här eller klicka för att välja</p>
              <p className="text-xs leading-5 text-[var(--ui-text-muted)]">{RECOMMENDED_SIZE}</p>
            </div>
          </div>
        )}
      </div>

      <input
        id={inputId}
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/avif,image/gif"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void handleFile(file);
          event.currentTarget.value = '';
        }}
      />

      <div className="flex flex-wrap items-center justify-between gap-2 rounded-[var(--ui-radius-lg)] border border-[var(--ui-border)] bg-[var(--ui-surface)] px-3 py-2.5">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase text-[var(--ui-text-muted)]">Logga</p>
          <p className="mt-1 text-sm text-[var(--ui-text-secondary)]">
            {meta
              ? `${meta.width}x${meta.height} px`
              : value
                ? 'Sparad som bilddata på företaget.'
                : 'Ingen logga vald ännu.'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" variant="secondary" size="compact" onClick={() => inputRef.current?.click()}>
            <ImageIcon size={16} strokeWidth={1.75} />
            {value ? 'Byt logga' : 'Välj logga'}
          </Button>
          {value ? (
            <Button
              type="button"
              variant="ghost"
              size="compact"
              onClick={() => {
                onChange('');
                setMeta(null);
                setError(null);
              }}
              className="text-[var(--ui-danger-text)] hover:text-[var(--ui-danger-text)]"
            >
              <Trash2 size={16} strokeWidth={1.75} />
              Ta bort
            </Button>
          ) : null}
        </div>
      </div>

      {loading ? <p className="text-xs text-[var(--ui-text-muted)]">Läser in loggan...</p> : null}
      {error ? <InlineAlert tone="danger">{error}</InlineAlert> : null}
    </div>
  );
}
