import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();

function read(path: string) {
  return readFileSync(resolve(root, path), 'utf8');
}

describe('Quiet ERP design tokens', () => {
  it('defines structurally equivalent light and dark ui token sets', () => {
    const light = read('src/shared/design-tokens/ui-light.css');
    const dark = read('src/shared/design-tokens/ui-dark.css');

    const tokens = [
      '--ui-bg',
      '--ui-surface',
      '--ui-surface-subtle',
      '--ui-surface-raised',
      '--ui-surface-hover',
      '--ui-surface-active',
      '--ui-surface-selected',
      '--ui-border',
      '--ui-border-subtle',
      '--ui-border-strong',
      '--ui-text',
      '--ui-text-secondary',
      '--ui-text-muted',
      '--ui-text-disabled',
      '--ui-text-inverse',
      '--ui-accent',
      '--ui-accent-hover',
      '--ui-accent-active',
      '--ui-accent-subtle',
      '--ui-accent-border',
      '--ui-focus',
      '--ui-success-bg',
      '--ui-success-text',
      '--ui-warning-bg',
      '--ui-warning-text',
      '--ui-danger-bg',
      '--ui-danger-text',
      '--ui-info-bg',
      '--ui-info-text',
    ];

    for (const token of tokens) {
      expect(light).toContain(token);
      expect(dark).toContain(token);
    }

    expect(light).toContain('oklch(');
    expect(dark).toContain('oklch(');
  });

  it('keeps legacy surface and status variables as aliases', () => {
    const aliases = read('src/shared/design-tokens/ui-aliases.css');

    expect(aliases).toContain('--surface: var(--ui-surface)');
    expect(aliases).toContain('--accent: var(--ui-accent)');
    expect(aliases).toContain('--status-success-bg: var(--ui-success-bg)');
    expect(aliases).toContain('--status-danger-text: var(--ui-danger-text)');
  });

  it('maps shadcn and Tailwind variables through ui tokens', () => {
    const globals = read('src/app/globals.css');

    expect(globals).toContain('--background: var(--ui-bg)');
    expect(globals).toContain('--primary: var(--ui-accent)');
    expect(globals).toContain('--ring: var(--ui-focus)');
    expect(globals).toContain('--color-background: var(--background)');
  });

  it('configures shadcn generation for Lucide icons', () => {
    const config = JSON.parse(read('components.json')) as { iconLibrary?: string };

    expect(config.iconLibrary).toBe('lucide');
  });
});

