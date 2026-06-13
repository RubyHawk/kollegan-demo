import Link from 'next/link';
import { CupSodaIcon, PizzaIcon, SaladIcon, SandwichIcon, SoupIcon, UtensilsIcon } from 'lucide-react';
import type { RestaurantMenuCategoryView, RestaurantMenuItemView } from '@modules/supporting/restaurant-menu';
import { publicSiteHref } from '../_lib/public-site-data';
import {
  categoryDisplay,
  categoryImage,
  itemPriceFallback,
  menuItemImage,
  menuItemParts,
  menuSlug,
  priceParts,
} from '../_lib/menu-visuals';

type MenuListProps = {
  categories: RestaurantMenuCategoryView[];
  activeSlug?: string;
  variant?: 'overview' | 'focused' | 'preview';
};

function tabHref(routePrefix: string, slug: string | null) {
  const path: `/${string}` = slug ? `/meny?kategori=${encodeURIComponent(slug)}` : '/meny';
  return publicSiteHref(routePrefix, path);
}

function CategoryBadge({ index }: { index: number }) {
  return <span className="fluffy-category-badge">{String(index + 1).padStart(2, '0')}</span>;
}

function CategoryIcon({ iconKey }: { iconKey: string }) {
  const props = { 'aria-hidden': true, size: 34, strokeWidth: 2 } as const;

  if (iconKey === 'pizza') return <PizzaIcon {...props} />;
  if (iconKey === 'subs') return <SandwichIcon {...props} />;
  if (iconKey === 'panini') return <UtensilsIcon {...props} />;
  if (iconKey === 'salad') return <SaladIcon {...props} />;
  if (iconKey === 'sides') return <SoupIcon {...props} />;
  if (iconKey === 'drinks') return <CupSodaIcon {...props} />;
  return <UtensilsIcon {...props} />;
}

function PriceColumns({ item }: { item: RestaurantMenuItemView }) {
  const parts = priceParts(item);

  if (parts.length === 0) {
    return <span className="fluffy-menu-price-empty">Fråga oss</span>;
  }

  return (
    <dl className="fluffy-price-columns" aria-label="Priser">
      {parts.slice(0, 4).map((part) => (
        <div key={`${item.id}-${part.label}`} className="fluffy-price-columns__part">
          <dt>{part.label}</dt>
          <dd>{part.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function MenuItemRow({ item }: { item: RestaurantMenuItemView }) {
  const { number, label } = menuItemParts(item.name);

  return (
    <article className="fluffy-menu-row">
      <div className="fluffy-menu-row__name">
        {number ? <span className="fluffy-menu-number">{number}</span> : null}
        <div>
          <h3>{label}</h3>
          {item.description ? <p>{item.description}</p> : null}
          {item.allergens.length > 0 ? <p className="fluffy-menu-allergens">Allergener: {item.allergens.join(', ')}</p> : null}
        </div>
      </div>
      <PriceColumns item={item} />
    </article>
  );
}

function FeaturedItemCard({
  category,
  item,
  index,
}: {
  category: RestaurantMenuCategoryView;
  item: RestaurantMenuItemView;
  index: number;
}) {
  const { number, label } = menuItemParts(item.name);
  const price = itemPriceFallback(item);
  const image = menuItemImage(category, item);

  return (
    <article className="fluffy-featured-item">
      <div className="fluffy-featured-item__copy">
        <span className="fluffy-menu-number">{number ?? String(index + 1)}</span>
        <h3>{label}</h3>
        {item.description ? <p>{item.description}</p> : null}
        {price ? <strong>{price}</strong> : null}
      </div>
      <div className="fluffy-featured-item__media" aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={image} alt="" />
      </div>
    </article>
  );
}

function CategorySection({
  category,
  index,
  focused,
}: {
  category: RestaurantMenuCategoryView;
  index: number;
  focused: boolean;
}) {
  const display = categoryDisplay(category);
  const featured = focused ? category.items.slice(0, 3) : [];
  const rows = focused ? category.items.slice(featured.length) : category.items;
  const isOpen = focused || index < 3;

  return (
    <details className="fluffy-menu-category" open={isOpen}>
      <summary className="fluffy-menu-category__summary">
        <span className="fluffy-menu-category__title">
          <CategoryBadge index={index} />
          <span>{display.label}</span>
        </span>
        {category.description ? <span className="fluffy-menu-category__description">{category.description}</span> : null}
      </summary>

      {category.items.length === 0 ? (
        <p className="fluffy-menu-empty">Fler favoriter kommer snart.</p>
      ) : (
        <>
          {featured.length > 0 ? (
            <div className="fluffy-featured-grid">
              {featured.map((item, itemIndex) => (
                <FeaturedItemCard key={item.id} category={category} item={item} index={itemIndex} />
              ))}
            </div>
          ) : null}

          {rows.length > 0 ? (
            <div className="fluffy-menu-rows">
              {rows.map((item) => (
                <MenuItemRow key={item.id} item={item} />
              ))}
            </div>
          ) : null}
        </>
      )}
    </details>
  );
}

export function MenuTabs({
  categories,
  activeSlug,
  routePrefix = '',
}: {
  categories: RestaurantMenuCategoryView[];
  activeSlug?: string;
  routePrefix?: string;
}) {
  return (
    <nav className="fluffy-menu-tabs" aria-label="Menyfilter">
      <Link href={tabHref(routePrefix, null)} aria-current={!activeSlug ? 'page' : undefined}>
        Alla
      </Link>
      {categories.map((category) => {
        const slug = menuSlug(category.name);
        const display = categoryDisplay(category);
        return (
          <Link key={category.id} href={tabHref(routePrefix, slug)} aria-current={activeSlug === slug ? 'page' : undefined}>
            <CategoryIcon iconKey={display.iconKey} />
            {display.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function MenuCategoryPreview({ categories, routePrefix = '' }: { categories: RestaurantMenuCategoryView[]; routePrefix?: string }) {
  const preview = categories.slice(0, 5);

  if (preview.length === 0) return null;

  return (
    <section className="fluffy-menu-preview" aria-labelledby="fluffy-menu-preview-title">
      <div className="fluffy-menu-preview__intro">
        <p id="fluffy-menu-preview-title">Menyn</p>
        <span>Något för alla smaker. Bygg din favorit.</span>
      </div>
      <div className="fluffy-menu-preview__items">
        {preview.map((category, index) => {
          const display = categoryDisplay(category);
          return (
            <Link key={category.id} href={tabHref(routePrefix, menuSlug(category.name))} className="fluffy-menu-preview__item">
              <CategoryBadge index={index} />
              <span className="fluffy-menu-preview__icon">
                <CategoryIcon iconKey={display.iconKey} />
              </span>
              <strong>{display.label}</strong>
              {category.description ? <span>{category.description}</span> : null}
            </Link>
          );
        })}
      </div>
    </section>
  );
}

export function MenuBoardHero({ category }: { category: RestaurantMenuCategoryView | null }) {
  const image = category ? categoryImage(category) : '/fluffys/menu/pizza-kebab-board.jpg';

  return (
    <div className="fluffy-menu-board-hero" aria-hidden="true">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={image} alt="" />
    </div>
  );
}

export function MenuList({ categories, activeSlug, variant = 'overview' }: MenuListProps) {
  if (categories.length === 0) {
    return (
      <div className="fluffy-card fluffy-info-card">
        <h2>Menyn laddas</h2>
        <p>Menyn kunde inte hämtas just nu.</p>
      </div>
    );
  }

  const activeCategory = activeSlug ? categories.find((category) => menuSlug(category.name) === activeSlug) : null;
  const visibleCategories = variant === 'focused' && activeCategory ? [activeCategory] : categories;

  return (
    <div className={variant === 'focused' ? 'fluffy-menu-board fluffy-menu-board--focused' : 'fluffy-menu-board'}>
      {visibleCategories.map((category) => (
        <CategorySection
          key={category.id}
          category={category}
          index={categories.findIndex((entry) => entry.id === category.id)}
          focused={variant === 'focused' && Boolean(activeCategory)}
        />
      ))}
    </div>
  );
}
