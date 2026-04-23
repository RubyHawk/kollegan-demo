'use client';

import type { CSSProperties, ReactNode } from 'react';

export const inputStyle: CSSProperties = {
  width: '100%', padding: '4px 7px', fontSize: 12,
  border: '1px solid var(--border)', borderRadius: 4,
  fontFamily: 'system-ui, sans-serif', color: 'var(--text-primary)',
  background: 'var(--surface-0)', outline: 'none', boxSizing: 'border-box',
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
      onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minWidth: 26, height: 26, padding: '0 4px',
        background: active ? 'var(--accent-subtle)' : 'transparent',
        border:     active ? '1px solid var(--accent-border)' : '1px solid transparent',
        color: active ? 'var(--accent)' : 'var(--text-primary)',
        borderRadius: 3, cursor: 'pointer', flexShrink: 0,
        fontWeight: bold ? 700 : 400,
        fontStyle:  italic ? 'italic' : 'normal',
        textDecoration: underline ? 'underline' : 'none',
        fontFamily: 'system-ui, sans-serif', fontSize: 12,
      }}
      onMouseEnter={(e) => { if (!active) (e.currentTarget as HTMLElement).style.background = 'var(--surface-active)'; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = active ? 'var(--accent-subtle)' : 'transparent'; }}
    >
      {children}
    </button>
  );
}

export function Sep() {
  return <div style={{ width: 1, height: 20, background: 'var(--border)', margin: '0 2px', alignSelf: 'center', flexShrink: 0 }} />;
}

export function DesignSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', fontFamily: 'system-ui,sans-serif', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 8px', borderBottom: '1px solid var(--border)', paddingBottom: 4 }}>
        {title}
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>{children}</div>
    </div>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'system-ui,sans-serif', marginBottom: 2, marginTop: 0 }}>{label}</p>
      {children}
    </div>
  );
}

export function ColorRow({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <input type="color" value={value} onChange={(e) => onChange(e.target.value)}
        style={{ width: 32, height: 24, padding: 0, border: '1px solid var(--border)', borderRadius: 3, cursor: 'pointer' }} />
      <input value={value} onChange={(e) => onChange(e.target.value)}
        style={{ ...inputStyle, width: 80, fontFamily: 'monospace' }} maxLength={7} />
    </div>
  );
}

export function ToggleRow({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 12, fontFamily: 'system-ui,sans-serif', color: 'var(--text-primary)' }}>
      <input type="checkbox" checked={value} onChange={(e) => onChange(e.target.checked)} style={{ cursor: 'pointer', accentColor: 'var(--accent)' }} />
      {label}
    </label>
  );
}

// ── Icons ──────────────────────────────────────────────────────────────────────

const sv = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

export function AlignLIcon()  { return <svg width="12" height="12" viewBox="0 0 24 24" {...sv}><line x1="21" y1="6" x2="3" y2="6"/><line x1="15" y1="12" x2="3" y2="12"/><line x1="17" y1="18" x2="3" y2="18"/></svg>; }
export function AlignCIcon()  { return <svg width="12" height="12" viewBox="0 0 24 24" {...sv}><line x1="21" y1="6" x2="3" y2="6"/><line x1="17" y1="12" x2="7" y2="12"/><line x1="19" y1="18" x2="5" y2="18"/></svg>; }
export function AlignRIcon()  { return <svg width="12" height="12" viewBox="0 0 24 24" {...sv}><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="12" x2="9" y2="12"/><line x1="21" y1="18" x2="7" y2="18"/></svg>; }
export function BulletIcon()  { return <svg width="12" height="12" viewBox="0 0 24 24" {...sv}><line x1="9" y1="6" x2="20" y2="6"/><line x1="9" y1="12" x2="20" y2="12"/><line x1="9" y1="18" x2="20" y2="18"/><circle cx="4" cy="6" r="1" fill="currentColor" stroke="none"/><circle cx="4" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="4" cy="18" r="1" fill="currentColor" stroke="none"/></svg>; }
export function OListIcon()   { return <svg width="12" height="12" viewBox="0 0 24 24" {...sv}><line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="10" y1="18" x2="21" y2="18"/><path d="M4 6h1v4"/><path d="M4 10H6"/><path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"/></svg>; }
export function HrIcon()      { return <svg width="12" height="12" viewBox="0 0 24 24" {...sv}><line x1="3" y1="12" x2="21" y2="12"/></svg>; }
export function SettingsIcon(){ return <svg width="12" height="12" viewBox="0 0 24 24" {...sv}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>; }
