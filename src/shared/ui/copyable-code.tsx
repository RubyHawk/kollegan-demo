'use client';

import { useState } from 'react';
import { Check, Copy } from '@phosphor-icons/react';
import { Button } from '@shared/ui/button';

interface CopyableCodeProps {
  value: string;
  label?: string;
  masked?: boolean;
}

export function CopyableCode({ value, label = 'Secret', masked = false }: CopyableCodeProps) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <div className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface-0)] p-2">
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-medium text-[var(--text-muted)]">{label}</p>
        <code className="block truncate text-xs tracking-[0.2em] text-[var(--text-primary)]">
          {masked ? value.replace(/./g, '•') : value}
        </code>
      </div>
      <Button type="button" variant="outline" size="sm" onClick={() => void copy()}>
        {copied ? <Check /> : <Copy />}
        {copied ? 'Copied' : 'Copy'}
      </Button>
    </div>
  );
}
