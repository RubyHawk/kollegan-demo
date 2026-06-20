'use client';

import { CheckIcon, PlusIcon } from 'lucide-react';
import { formatPriceCents, type MenuVariant } from '@shared/lib/menu/menu-variants';
import { useCart, type CartItemInput } from './cart-context';

// Interactive priced "add" chips, used in place of the static price on orderable menu rows. One chip
// per size (e.g. S / M / L) or a single chip for fixed-price items; clicking a chip adds that exact
// variant to the shared cart and shows its in-cart quantity.
export function AddToCart({ item, variants }: { item: CartItemInput; variants: MenuVariant[] }) {
  const cart = useCart();
  if (variants.length === 0) return null;

  return (
    <div className="fluffy-add" role="group" aria-label={`Lägg till ${item.name}`}>
      {variants.map((variant) => {
        const qty = cart.variantQuantity(item.id, variant.label);
        return (
          <button
            key={variant.label || 'single'}
            type="button"
            className="fluffy-add__btn"
            data-incart={qty > 0 ? '' : undefined}
            onClick={() => cart.addVariant(item, variant)}
            aria-label={`Lägg till ${item.name}${variant.label ? ` storlek ${variant.label}` : ''} för ${formatPriceCents(variant.priceCents, item.currency)}`}
          >
            {variant.label ? <span className="fluffy-add__size">{variant.label}</span> : null}
            <span className="fluffy-add__price">{formatPriceCents(variant.priceCents, item.currency)}</span>
            {qty > 0 ? (
              <span className="fluffy-add__count" aria-hidden="true"><CheckIcon /> {qty}</span>
            ) : (
              <PlusIcon className="fluffy-add__plus" aria-hidden="true" />
            )}
          </button>
        );
      })}
    </div>
  );
}
