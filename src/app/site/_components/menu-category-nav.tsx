'use client';

import { useEffect, useState } from 'react';
import { MenuGlyph } from './menu-glyphs';

export type MenuNavCategory = {
  id: string;
  slug: string;
  label: string;
  iconKey: string;
};

export function MenuCategoryNav({ categories }: { categories: MenuNavCategory[] }) {
  const [active, setActive] = useState(categories[0]?.slug ?? '');

  useEffect(() => {
    const sections = categories
      .map((c) => document.getElementById(`cat-${c.slug}`))
      .filter((el): el is HTMLElement => Boolean(el));
    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const onscreen = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (onscreen[0]) setActive(onscreen[0].target.id.replace('cat-', ''));
      },
      // Trigger when a section reaches just under the sticky header + nav, biasing to the top one.
      { rootMargin: '-150px 0px -62% 0px', threshold: 0 },
    );
    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, [categories]);

  return (
    <nav className="fluffy-menu-nav" aria-label="Menykategorier">
      <div className="fluffy-shell fluffy-menu-nav__scroller">
        {categories.map((c) => (
          <a
            key={c.id}
            href={`#cat-${c.slug}`}
            className="fluffy-menu-nav__pill"
            aria-current={active === c.slug ? 'true' : undefined}
            onClick={() => setActive(c.slug)}
          >
            <span className="fluffy-menu-nav__glyph">
              <MenuGlyph iconKey={c.iconKey} />
            </span>
            {c.label}
          </a>
        ))}
      </div>
    </nav>
  );
}
