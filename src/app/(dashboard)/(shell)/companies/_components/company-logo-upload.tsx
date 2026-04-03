'use client';

import { useId, useRef, useState } from 'react';
import { ImageSquare, Trash, UploadSimple } from '@phosphor-icons/react';
import { cn } from '@shared/lib/utils';

const ACCEPTED_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/avif',
  'image/gif',
]);

const MAX_FILE_BYTES = 2 * 1024 * 1024;
const RECOMMENDED_SIZE = 'Kvadratisk PNG eller WebP, helst 512×512 px, max 2 MB.';

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
    const image = new Image();
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
          if (file) {
            void handleFile(file);
          }
        }}
        className={cn(
          'group flex min-h-[164px] cursor-pointer flex-col items-center justify-center rounded-[28px] border border-dashed bg-[var(--surface)] px-4 py-5 text-center transition-colors',
          dragging
            ? 'border-[var(--accent)] bg-[var(--accent)]/6'
            : 'border-[var(--border)] hover:border-[var(--accent)]/45 hover:bg-[var(--surface-alt)]',
        )}
      >
        {value ? (
          <div className="flex w-full flex-col items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={value}
              alt="Förhandsvisning av företagslogga"
              className="h-20 w-20 rounded-2xl border border-[var(--border)] bg-white object-contain p-2 shadow-sm"
            />
            <div className="space-y-1">
              <p className="text-sm font-medium text-[var(--text-primary)]">Loggan är redo att sparas</p>
              <p className="text-xs text-[var(--text-muted)]">
                Klicka eller droppa en ny bild för att byta ut den.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--accent)]/10 text-[var(--accent)]">
              <UploadSimple size={22} weight="bold" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-[var(--text-primary)]">Dra in loggan här eller klicka för att välja</p>
              <p className="text-xs leading-5 text-[var(--text-muted)]">{RECOMMENDED_SIZE}</p>
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
          if (file) {
            void handleFile(file);
          }
          event.currentTarget.value = '';
        }}
      />

      <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--text-muted)]">Logga</p>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            {meta
              ? `${meta.width}×${meta.height} px`
              : value
                ? 'Sparad som bilddata på företaget.'
                : 'Ingen logga vald ännu.'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] px-3 py-2 text-xs font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--surface-alt)]"
          >
            <ImageSquare size={15} weight="duotone" />
            {value ? 'Byt logga' : 'Välj logga'}
          </button>
          {value && (
            <button
              type="button"
              onClick={() => {
                onChange('');
                setMeta(null);
                setError(null);
              }}
              className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] px-3 py-2 text-xs font-medium text-[var(--text-muted)] transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
            >
              <Trash size={15} weight="duotone" />
              Ta bort
            </button>
          )}
        </div>
      </div>

      {loading && <p className="text-xs text-[var(--text-muted)]">Läser in loggan…</p>}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
