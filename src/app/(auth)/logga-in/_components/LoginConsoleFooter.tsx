'use client';

import { ShieldCheck } from '@phosphor-icons/react';

interface LoginConsoleFooterProps {
  note: string;
}

export function LoginConsoleFooter({ note }: LoginConsoleFooterProps) {
  return (
    <div className="auth-console-footer">
      <ShieldCheck size={17} weight="duotone" />
      <span>{note}</span>
    </div>
  );
}
