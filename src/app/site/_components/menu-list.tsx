import type { RestaurantMenuCategoryView } from '@modules/supporting/restaurant-menu';
import { priceLabel } from '../_lib/public-site-data';

export function MenuList({ categories, compact = false }: { categories: RestaurantMenuCategoryView[]; compact?: boolean }) {
  if (categories.length === 0) {
    return (
      <div className="fluffy-card fluffy-info-card">
        <h2>Menyn laddas</h2>
        <p>Menyn kunde inte hämtas just nu.</p>
      </div>
    );
  }

  return (
    <div className={compact ? 'fluffy-menu-grid fluffy-menu-grid--compact' : 'fluffy-menu-grid'}>
      {categories.map((category) => (
        <section key={category.id} className="fluffy-card fluffy-menu-category">
          <div>
            <h2>{category.name}</h2>
            {category.description ? <p className="fluffy-menu-category__description">{category.description}</p> : null}
          </div>
          <div className="fluffy-menu-items">
            {category.items.length === 0 ? (
              <article className="fluffy-menu-item">
                <p>Fler favoriter kommer snart.</p>
              </article>
            ) : category.items.map((item) => (
              <article key={item.id} className="fluffy-menu-item">
                <div className="fluffy-menu-item__top">
                  <h3>{item.name}</h3>
                  <span className="fluffy-price">{priceLabel(item.priceCents, item.currency, item.tags)}</span>
                </div>
                {item.description ? <p>{item.description}</p> : null}
                {item.tags.length > 0 ? (
                  <div className="fluffy-tags">
                    {item.tags.map((tag) => (
                      <span key={tag} className="fluffy-tag">
                        {tag}
                      </span>
                    ))}
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
