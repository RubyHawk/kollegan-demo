'use client';

import type { CSSProperties, ReactNode } from 'react';
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  List,
  ListOrdered,
  Minus,
  Settings,
} from 'lucide-react';

export const inputStyle: CSSProperties = {
  width: '100%',
  padding: '4px 7px',
  fontSize: 12,
  border: '1px solid var(--ui-border)',
  borderRadius: 4,
  fontFamily: 'system-ui, sans-serif',
  color: 'var(--ui-text)',
  background: 'var(--ui-surface-raised)',
  outline: 'none',
  boxSizing: 'border-box',
};

export function TBtn({ active, onClick, title, bold, italic, underline, children }: {
  active?: boolean; onClick: () => void; title?: string;
  bold?: boolean; italic?: boolean; underline?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={(event) => { event.preventDefault(); onClick(); }}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 26,
        height: 26,
        padding: '0 4px',
        background: active ? 'var(--ui-surface-selected)' : 'transparent',
        border: active ? '1px solid var(--ui-accent-border)' : '1px solid transparent',
        color: active ? 'var(--ui-accent)' : 'var(--ui-text)',
        borderRadius: 4,
        cursor: 'pointer',
        flexShrink: 0,
        fontWeight: bold ? 700 : 400,
        fontStyle: italic ? 'italic' : 'normal',
        textDecoration: underline ? 'underline' : 'none',
        fontFamily: 'system-ui, sans-serif',
        fontSize: 12,
      }}
      onMouseEnter={(event) => { if (!active) event.currentTarget.style.background = 'var(--ui-surface-hover)'; }}
      onMouseLeave={(event) => { event.currentTarget.style.background = active ? 'var(--ui-surface-selected)' : 'transparent'; }}
    >
      {children}
    </button>
  );
}

export function Sep() {
  return (
    <div
      style={{
        width: 1,
        height: 20,
        background: 'var(--ui-border)',
        margin: '0 2px',
        alignSelf: 'center',
        flexShrink: 0,
      }}
    />
  );
}

export function DesignSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <p
        style={{
          fontSize: 10,
          fontWeight: 700,
          color: 'var(--ui-text-muted)',
          fontFamily: 'system-ui,sans-serif',
          textTransform: 'uppercase',
          letterSpacing: 0,
          margin: '0 0 8px',
          borderBottom: '1px solid var(--ui-border)',
          paddingBottom: 4,
        }}
      >
        {title}
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>{children}</div>
    </div>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p style={{ fontSize: 10, color: 'var(--ui-text-muted)', fontFamily: 'system-ui,sans-serif', marginBottom: 2, marginTop: 0 }}>{label}</p>
      {children}
    </div>
  );
}

export function ColorRow({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <input
        type="color"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        style={{ width: 32, height: 24, padding: 0, border: '1px solid var(--ui-border)', borderRadius: 4, cursor: 'pointer' }}
      />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        style={{ ...inputStyle, width: 80, fontFamily: 'monospace' }}
        maxLength={7}
      />
    </div>
  );
}

export function ToggleRow({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 12, fontFamily: 'system-ui,sans-serif', color: 'var(--ui-text)' }}>
      <input type="checkbox" checked={value} onChange={(event) => onChange(event.target.checked)} style={{ cursor: 'pointer', accentColor: 'var(--ui-accent)' }} />
      {label}
    </label>
  );
}

export function AlignLIcon() {
  return <AlignLeft size={14} strokeWidth={1.75} />;
}

export function AlignCIcon() {
  return <AlignCenter size={14} strokeWidth={1.75} />;
}

export function AlignRIcon() {
  return <AlignRight size={14} strokeWidth={1.75} />;
}

export function BulletIcon() {
  return <List size={14} strokeWidth={1.75} />;
}

export function OListIcon() {
  return <ListOrdered size={14} strokeWidth={1.75} />;
}

export function HrIcon() {
  return <Minus size={14} strokeWidth={1.75} />;
}

export function SettingsIcon() {
  return <Settings size={14} strokeWidth={1.75} />;
}
