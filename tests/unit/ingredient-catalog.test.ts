import { describe, it, expect } from 'vitest';
// @ts-expect-error - plain data module without types
import { categories, ingredients } from '../../prisma/seed-data/ingredient-catalog.mjs';

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

  it('gives every ingredient a name and emoji', () => {
    for (const items of Object.values(ingredients as Record<string, Array<[string, string]>>)) {
      for (const [name, emoji] of items) {
        expect(name.trim().length).toBeGreaterThan(0);
        expect(emoji.trim().length).toBeGreaterThan(0);
      }
    }
  });
});
