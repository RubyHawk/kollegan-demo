'use client';

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { MenuVariant } from '@shared/lib/menu/menu-variants';

export interface CartItemInput {
  id: string;
  name: string;
  currency: string;
}

export interface CartLine {
  menuItemId: string;
  name: string;
  variantLabel: string;
  unitPriceCents: number;
  currency: string;
  quantity: number;
}

const MAX_PER_LINE = 50;
const STORAGE_KEY = 'fluffys-cart-v1';

export function cartLineKey(menuItemId: string, label: string) {
  return `${menuItemId}::${label}`;
}

interface CartContextValue {
  lines: CartLine[];
  itemCount: number;
  subtotalCents: number;
  currency: string;
  addVariant: (item: CartItemInput, variant: MenuVariant) => void;
  setQuantity: (key: string, quantity: number) => void;
  variantQuantity: (menuItemId: string, label: string) => number;
  clear: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

// Shared customer cart for the public site. State lives here (one provider in the site layout) so the
// menu "add" chips, the header mini-cart, and the /bestall checkout all read and write the same cart.
// Persisted to localStorage so it survives reloads; hydrated client-side to avoid SSR mismatch.
export function CartProvider({ children }: { children: ReactNode }) {
  const [linesByKey, setLinesByKey] = useState<Record<string, CartLine>>({});
  const [hydrated, setHydrated] = useState(false);

  // One-time client hydration from localStorage. setState-in-effect is intentional: the cart must
  // render empty on the server and first client paint (to avoid a hydration mismatch), then fill in.
  useEffect(() => {
    let stored: Record<string, CartLine> | null = null;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Record<string, CartLine>;
        if (parsed && typeof parsed === 'object') stored = parsed;
      }
    } catch {
      /* ignore corrupt storage */
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional one-time hydration
    if (stored) setLinesByKey(stored);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(linesByKey));
    } catch {
      /* ignore quota/availability errors */
    }
  }, [linesByKey, hydrated]);

  const value = useMemo<CartContextValue>(() => {
    const lines = Object.values(linesByKey);
    return {
      lines,
      itemCount: lines.reduce((sum, line) => sum + line.quantity, 0),
      subtotalCents: lines.reduce((sum, line) => sum + line.unitPriceCents * line.quantity, 0),
      currency: lines[0]?.currency ?? 'SEK',
      addVariant(item, variant) {
        const key = cartLineKey(item.id, variant.label);
        setLinesByKey((prev) => {
          const existing = prev[key];
          if (existing) {
            return { ...prev, [key]: { ...existing, quantity: Math.min(existing.quantity + 1, MAX_PER_LINE) } };
          }
          return {
            ...prev,
            [key]: {
              menuItemId: item.id,
              name: variant.label ? `${item.name} (${variant.label})` : item.name,
              variantLabel: variant.label,
              unitPriceCents: variant.priceCents,
              currency: item.currency,
              quantity: 1,
            },
          };
        });
      },
      setQuantity(key, quantity) {
        setLinesByKey((prev) => {
          if (!prev[key]) return prev;
          if (quantity <= 0) {
            return Object.fromEntries(Object.entries(prev).filter(([existingKey]) => existingKey !== key));
          }
          return { ...prev, [key]: { ...prev[key]!, quantity: Math.min(quantity, MAX_PER_LINE) } };
        });
      },
      variantQuantity(menuItemId, label) {
        return linesByKey[cartLineKey(menuItemId, label)]?.quantity ?? 0;
      },
      clear() {
        setLinesByKey({});
      },
    };
  }, [linesByKey]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within a CartProvider');
  return ctx;
}
