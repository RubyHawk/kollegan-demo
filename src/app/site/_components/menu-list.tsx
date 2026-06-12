import type { RestaurantMenuCategoryView } from '@modules/supporting/restaurant-menu';
import { priceLabel } from '../_lib/public-site-data';

export function MenuList({ categories, compact = false }: { categories: RestaurantMenuCategoryView[]; compact?: boolean }) {
  if (categories.length === 0) {
    return (
      <div className="rounded-lg border border-[#211f1c]/10 bg-white p-5 text-sm font-semibold text-[#211f1c]/70">
        Menyn kunde inte hämtas just nu.
      </div>
    );
  }

  return (
    <div className={compact ? 'grid gap-4 md:grid-cols-2' : 'grid gap-5'}>
      {categories.map((category) => (
        <section key={category.id} className="fluffy-rise rounded-lg border border-[#211f1c]/10 bg-white p-5 shadow-sm">
          <div className="mb-4">
            <h2 className="text-2xl font-black text-[#211f1c]">{category.name}</h2>
            {category.description ? <p className="mt-1 text-sm leading-6 text-[#211f1c]/65">{category.description}</p> : null}
          </div>
          <div className="divide-y divide-[#211f1c]/10">
            {category.items.length === 0 ? (
              <p className="py-4 text-sm text-[#211f1c]/60">Fler favoriter kommer snart.</p>
            ) : category.items.map((item) => (
              <article key={item.id} className="py-4">
                <div className="flex items-start justify-between gap-4">
                  <h3 className="font-bold text-[#211f1c]">{item.name}</h3>
                  <span className="shrink-0 text-right text-sm font-black text-[#bf4f2f]">{priceLabel(item.priceCents, item.currency, item.tags)}</span>
                </div>
                {item.description ? <p className="mt-1 text-sm leading-6 text-[#211f1c]/70">{item.description}</p> : null}
                {item.tags.length > 0 ? (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {item.tags.map((tag) => (
                      <span key={tag} className="rounded-md border border-[#211f1c]/10 bg-[#f4d06f]/20 px-2 py-0.5 text-xs font-bold text-[#211f1c]/70">
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
