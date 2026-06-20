'use client';

import Link from 'next/link';
import { ShoppingBagIcon } from 'lucide-react';
import { formatPriceCents } from '@shared/lib/menu/menu-variants';
import { useCart } from './cart-context';

// Header mini-cart: appears only once the cart has something in it, and links to the checkout.
export function HeaderCartButton({ href }: { href: string }) {
  const { itemCount, subtotalCents, currency } = useCart();
  if (itemCount === 0) return null;

  return (
    <Link
      href={href}
      className="fluffy-header__cta fluffy-header__cta--cart"
      aria-label={`Till kassan, ${itemCount} ${itemCount === 1 ? 'vara' : 'varor'}, ${formatPriceCents(subtotalCents, currency)}`}
    >
      <ShoppingBagIcon size={18} aria-hidden="true" />
      <span className="fluffy-header__cart-count">{itemCount}</span>
      <span className="fluffy-header__cart-sum">{formatPriceCents(subtotalCents, currency)}</span>
    </Link>
  );
}
