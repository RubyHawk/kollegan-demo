import type { RestaurantMenuCategoryView, RestaurantMenuItemView } from '@modules/supporting/restaurant-menu';
import { parseMenuVariants } from '@shared/lib/menu/menu-variants';
import { MenuGlyph } from './menu-glyphs';
import { MenuCategoryNav, type MenuNavCategory } from './menu-category-nav';
import { AddToCart } from './cart/add-to-cart';
import { categoryDisplay, menuItemParts, menuSlug, priceParts } from '../_lib/menu-visuals';

// Either interactive "add" chips (when online ordering is live) or the static price.
function MenuItemAction({ item, label, enableOrdering }: { item: RestaurantMenuItemView; label: string; enableOrdering: boolean }) {
  const variants = enableOrdering && item.isAvailable ? parseMenuVariants(item.tags, item.priceCents) : [];
  if (variants.length === 0) return <MenuPrice item={item} />;
  return <AddToCart item={{ id: item.id, name: label, currency: item.currency }} variants={variants} />;
}

function MenuPrice({ item }: { item: RestaurantMenuItemView }) {
  const parts = priceParts(item);

  if (parts.length === 0) {
    return <span className="fluffy-price fluffy-price--ask">Fråga oss</span>;
  }

  if (parts.length === 1 && parts[0]?.label === 'Pris') {
    return (
      <span className="fluffy-price fluffy-price--single">
        {parts[0]?.value}
        <i>:-</i>
      </span>
    );
  }

  return (
    <div className="fluffy-price" aria-label="Priser">
      {parts.map((part) => (
        <span key={part.label} className="fluffy-price__tier">
          <abbr title={part.label}>{part.label}</abbr>
          <b>{part.value}</b>
        </span>
      ))}
    </div>
  );
}

function MenuItemRow({ item, enableOrdering }: { item: RestaurantMenuItemView; enableOrdering: boolean }) {
  const { label } = menuItemParts(item.name);
  const available = item.isAvailable;

  return (
    <article className="fluffy-item" data-unavailable={available ? undefined : ''}>
      <div className="fluffy-item__text">
        <h4 className="fluffy-item__name">
          {label}
          {available ? null : <span className="fluffy-item__flag">Slut för dagen</span>}
        </h4>
        {item.description ? <p className="fluffy-item__desc">{item.description}</p> : null}
        {item.allergens.length > 0 ? (
          <p className="fluffy-item__allergens">{item.allergens.join(' · ')}</p>
        ) : null}
      </div>
      <MenuItemAction item={item} label={label} enableOrdering={enableOrdering} />
    </article>
  );
}

function FeaturedCard({ item, enableOrdering }: { item: RestaurantMenuItemView; enableOrdering: boolean }) {
  const { label } = menuItemParts(item.name);
  return (
    <article className="fluffy-pop__card">
      <div className="fluffy-pop__media" aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={item.imageUrl ?? ''} alt="" />
      </div>
      <div className="fluffy-pop__copy">
        <h4>{label}</h4>
        {item.description ? <p>{item.description}</p> : null}
        <MenuItemAction item={item} label={label} enableOrdering={enableOrdering} />
      </div>
    </article>
  );
}

function MenuSection({ category, enableOrdering }: { category: RestaurantMenuCategoryView; enableOrdering: boolean }) {
  const display = categoryDisplay(category);
  return (
    <section id={`cat-${menuSlug(category.name)}`} className="fluffy-cat">
      <header className="fluffy-cat__head">
        <span className="fluffy-cat__glyph">
          <MenuGlyph iconKey={display.iconKey} />
        </span>
        <div>
          <h3 className="fluffy-cat__name">{display.label}</h3>
          {category.description ? <p className="fluffy-cat__desc">{category.description}</p> : null}
        </div>
      </header>
      <div className="fluffy-cat__items">
        {category.items.map((item) => (
          <MenuItemRow key={item.id} item={item} enableOrdering={enableOrdering} />
        ))}
      </div>
    </section>
  );
}

/**
 * The full menu experience: a sticky scroll-spy category nav, an optional "Populärt" row of
 * photographed items, and one always-visible section per category. Used on the homepage and /meny.
 */
export function MenuBoard({ categories, enableOrdering = false }: { categories: RestaurantMenuCategoryView[]; enableOrdering?: boolean }) {
  const cats = categories.filter((category) => category.items.length > 0);

  if (cats.length === 0) {
    return (
      <div className="fluffy-shell">
        <div className="fluffy-menu-empty">
          <h3>Menyn laddas</h3>
          <p>Menyn kunde inte hämtas just nu. Försök igen om en liten stund.</p>
        </div>
      </div>
    );
  }

  const navCategories: MenuNavCategory[] = cats.map((category) => {
    const display = categoryDisplay(category);
    return { id: category.id, slug: menuSlug(category.name), label: display.label, iconKey: display.iconKey };
  });

  const featured = cats
    .flatMap((category) => category.items)
    .filter((item) => item.imageUrl && item.isAvailable)
    .slice(0, 3);

  return (
    <>
      <MenuCategoryNav categories={navCategories} />
      <div className="fluffy-menu-body">
        <div className="fluffy-shell">
          {featured.length >= 2 ? (
            <section className="fluffy-pop" aria-label="Populärt just nu">
              <h3 className="fluffy-pop__title">Populärt just nu</h3>
              <div className="fluffy-pop__grid">
                {featured.map((item) => (
                  <FeaturedCard key={item.id} item={item} enableOrdering={enableOrdering} />
                ))}
              </div>
            </section>
          ) : null}

          <div className="fluffy-menu-cats">
            {cats.map((category) => (
              <MenuSection key={category.id} category={category} enableOrdering={enableOrdering} />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
