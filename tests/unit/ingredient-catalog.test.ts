import { describe, it, expect } from 'vitest';
import { categories, ingredients } from '../../prisma/seed-data/ingredients/index.mjs';

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replaceAll('å', 'a').replaceAll('ä', 'a').replaceAll('ö', 'o')
    .replaceAll('é', 'e').replaceAll('è', 'e')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const categoryIds: string[] = categories.map((category: { id: string }) => category.id);

describe('ingredient catalog seed data', () => {
  it('has unique category ids', () => {
    expect(new Set(categoryIds).size).toBe(categoryIds.length);
  });

  it('includes the "other" bucket used for custom additions', () => {
    expect(categoryIds).toContain('other');
  });

  it('references only known categories', () => {
    for (const key of Object.keys(ingredients)) {
      expect(categoryIds).toContain(key);
    }
  });

  it('produces globally unique ingredient slugs', () => {
    const slugs = Object.values(ingredients as Record<string, Array<[string]>>)
      .flat()
      .map((tuple) => slugify(tuple[0]));
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('gives every ingredient a non-empty name', () => {
    for (const items of Object.values(ingredients as Record<string, Array<[string]>>)) {
      for (const [name] of items) {
        expect(typeof name).toBe('string');
        expect(name.trim().length).toBeGreaterThan(0);
      }
    }
  });

  // Emoji is optional per ingredient; the generator falls back to the category
  // emoji, so every category must carry one.
  it('gives every category a fallback emoji', () => {
    for (const category of categories as Array<{ emoji?: string }>) {
      expect((category.emoji ?? '').trim().length).toBeGreaterThan(0);
    }
  });

  it('has at least 1000 ingredients', () => {
    const total = Object.values(ingredients as Record<string, unknown[]>).reduce((sum, items) => sum + items.length, 0);
    expect(total).toBeGreaterThanOrEqual(1000);
  });
});
