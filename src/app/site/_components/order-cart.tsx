'use client';

import { useState, type FormEvent } from 'react';
import { CheckCircle2Icon, MinusIcon, PlusIcon, ShoppingBagIcon, Trash2Icon } from 'lucide-react';
import { createPublicOrder, type PublicOrderFulfillmentType } from '@shared/lib/api/restaurant.api';
import { formatPriceCents, type MenuVariant } from '@shared/lib/menu/menu-variants';

export interface OrderMenuItem {
  id: string;
  name: string;
  description: string | null;
  currency: string;
  variants: MenuVariant[];
}

export interface OrderMenuCategory {
  id: string;
  name: string;
  items: OrderMenuItem[];
}

interface CartLine {
  menuItemId: string;
  name: string;
  variantLabel: string;
  unitPriceCents: number;
  currency: string;
  quantity: number;
}

const MAX_PER_LINE = 50;

function lineKey(menuItemId: string, label: string) {
  return `${menuItemId}::${label}`;
}

export function OrderCart({ menu, phone }: { menu: OrderMenuCategory[]; phone: string | null }) {
  const [lines, setLines] = useState<Record<string, CartLine>>({});
  const [fulfillment, setFulfillment] = useState<PublicOrderFulfillmentType>('takeaway');
  const [status, setStatus] = useState<'idle' | 'saving' | 'error'>('idle');
  const [error, setError] = useState('');
  const [confirmation, setConfirmation] = useState<{ orderNumber: number; fulfillmentType: string } | null>(null);

  const cartLines = Object.values(lines);
  const itemCount = cartLines.reduce((sum, line) => sum + line.quantity, 0);
  const subtotalCents = cartLines.reduce((sum, line) => sum + line.unitPriceCents * line.quantity, 0);
  const currency = cartLines[0]?.currency ?? menu[0]?.items[0]?.currency ?? 'SEK';

  function addVariant(item: OrderMenuItem, variant: MenuVariant) {
    const key = lineKey(item.id, variant.label);
    setLines((prev) => {
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
    setConfirmation(null);
    setStatus('idle');
  }

  function setQuantity(key: string, quantity: number) {
    setLines((prev) => {
      if (!prev[key]) return prev;
      if (quantity <= 0) {
        const { [key]: _removed, ...rest } = prev;
        return rest;
      }
      return { ...prev, [key]: { ...prev[key]!, quantity: Math.min(quantity, MAX_PER_LINE) } };
    });
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (cartLines.length === 0) return;
    const form = new FormData(event.currentTarget);
    setStatus('saving');
    setError('');
    try {
      const result = await createPublicOrder({
        fulfillmentType: fulfillment,
        customerName: String(form.get('customerName') ?? ''),
        customerPhone: String(form.get('customerPhone') ?? ''),
        deliveryAddress: fulfillment === 'delivery' ? String(form.get('deliveryAddress') ?? '') : null,
        note: String(form.get('note') ?? '') || null,
        items: cartLines.map((line) => ({
          menuItemId: line.menuItemId,
          quantity: line.quantity,
          variantLabel: line.variantLabel || null,
        })),
      });
      setConfirmation({ orderNumber: result.orderNumber, fulfillmentType: result.fulfillmentType });
      setLines({});
      setStatus('idle');
      event.currentTarget.reset();
    } catch (err) {
      setError((err as Error).message);
      setStatus('error');
    }
  }

  if (confirmation) {
    return (
      <div className="fluffy-card fluffy-cart-confirm fluffy-rise" role="status">
        <span className="fluffy-cart-confirm__icon" aria-hidden="true"><CheckCircle2Icon /></span>
        <h2>Tack! Din beställning är mottagen.</h2>
        <p className="fluffy-cart-confirm__number">Ordernr #{confirmation.orderNumber}</p>
        <p>
          {confirmation.fulfillmentType === 'delivery'
            ? 'Vi förbereder din mat och kör ut den till dig. Du betalar vid leverans.'
            : 'Vi förbereder din mat för avhämtning. Du betalar när du hämtar.'}
        </p>
        {phone ? <p className="fluffy-muted">Frågor? Ring oss på {phone}.</p> : null}
        <button type="button" className="fluffy-button fluffy-button--primary" onClick={() => setConfirmation(null)}>
          Beställ igen
        </button>
      </div>
    );
  }

  return (
    <div className="fluffy-cart-layout">
      <div className="fluffy-cart-menu">
        {menu.map((category) => (
          <section key={category.id} className="fluffy-cart-cat">
            <h3>{category.name}</h3>
            <ul className="fluffy-cart-items">
              {category.items.map((item) => (
                <li key={item.id} className="fluffy-cart-item">
                  <div className="fluffy-cart-item__head">
                    <p className="fluffy-cart-item__name">{item.name}</p>
                    {item.description ? <p className="fluffy-cart-item__desc">{item.description}</p> : null}
                  </div>
                  <div className="fluffy-variant-row">
                    {item.variants.map((variant) => (
                      <button
                        key={variant.label || 'single'}
                        type="button"
                        className="fluffy-variant-btn"
                        onClick={() => addVariant(item, variant)}
                        aria-label={`Lägg till ${item.name}${variant.label ? ` ${variant.label}` : ''} för ${formatPriceCents(variant.priceCents, item.currency)}`}
                      >
                        <PlusIcon aria-hidden="true" />
                        {variant.label ? <span className="fluffy-variant-btn__size">{variant.label}</span> : null}
                        <span className="fluffy-variant-btn__price">{formatPriceCents(variant.priceCents, item.currency)}</span>
                      </button>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <aside className="fluffy-cart-panel" id="kassa" aria-label="Din beställning">
        <div className="fluffy-cart-panel__head">
          <span className="fluffy-cart-panel__icon" aria-hidden="true"><ShoppingBagIcon /></span>
          <h2>Din beställning</h2>
        </div>

        {cartLines.length === 0 ? (
          <p className="fluffy-cart-empty">Varukorgen är tom. Lägg till något gott från menyn.</p>
        ) : (
          <ul className="fluffy-cart-lines">
            {cartLines.map((line) => {
              const key = lineKey(line.menuItemId, line.variantLabel);
              return (
                <li key={key} className="fluffy-cart-line">
                  <div className="fluffy-cart-line__info">
                    <span className="fluffy-cart-line__name">{line.name}</span>
                    <span className="fluffy-cart-line__price">{formatPriceCents(line.unitPriceCents * line.quantity, line.currency)}</span>
                  </div>
                  <div className="fluffy-qty">
                    <button type="button" onClick={() => setQuantity(key, line.quantity - 1)} aria-label={`Minska antal ${line.name}`}>
                      {line.quantity === 1 ? <Trash2Icon aria-hidden="true" /> : <MinusIcon aria-hidden="true" />}
                    </button>
                    <span aria-live="polite">{line.quantity}</span>
                    <button type="button" onClick={() => setQuantity(key, line.quantity + 1)} aria-label={`Öka antal ${line.name}`}>
                      <PlusIcon aria-hidden="true" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        <div className="fluffy-cart-subtotal">
          <span>Summa</span>
          <span>{formatPriceCents(subtotalCents, currency)}</span>
        </div>

        <form onSubmit={onSubmit} className="fluffy-cart-form">
          <fieldset className="fluffy-fulfillment" aria-label="Hämtning eller leverans">
            <button
              type="button"
              aria-pressed={fulfillment === 'takeaway'}
              onClick={() => setFulfillment('takeaway')}
            >
              Avhämtning
            </button>
            <button
              type="button"
              aria-pressed={fulfillment === 'delivery'}
              onClick={() => setFulfillment('delivery')}
            >
              Leverans
            </button>
          </fieldset>

          <div className="fluffy-form__grid">
            <label className="fluffy-field">
              Namn
              <input name="customerName" required maxLength={120} className="fluffy-input" autoComplete="name" />
            </label>
            <label className="fluffy-field">
              Telefon
              <input name="customerPhone" required minLength={5} maxLength={40} className="fluffy-input" autoComplete="tel" inputMode="tel" />
            </label>
          </div>

          {fulfillment === 'delivery' ? (
            <label className="fluffy-field">
              Leveransadress
              <textarea name="deliveryAddress" required rows={2} maxLength={400} className="fluffy-input" autoComplete="street-address" placeholder="Gata, nummer, postnr och ort" />
            </label>
          ) : null}

          <label className="fluffy-field">
            Övrigt (allergier, önskemål)
            <textarea name="note" rows={2} maxLength={1000} className="fluffy-input" />
          </label>

          <p className="fluffy-cart-paynote">
            {fulfillment === 'delivery' ? 'Du betalar kontant eller med kort vid leverans.' : 'Du betalar kontant eller med kort vid avhämtning.'}
          </p>

          <button
            type="submit"
            className="fluffy-button fluffy-button--dark"
            disabled={cartLines.length === 0 || status === 'saving'}
          >
            {status === 'saving'
              ? 'Skickar...'
              : `Skicka beställning${itemCount > 0 ? ` • ${formatPriceCents(subtotalCents, currency)}` : ''}`}
          </button>

          {status === 'error' ? <p role="alert" className="fluffy-error">{error || 'Det gick inte att skicka beställningen.'}</p> : null}
        </form>
      </aside>

      {itemCount > 0 ? (
        <a href="#kassa" className="fluffy-cart-jump">
          <ShoppingBagIcon aria-hidden="true" />
          {itemCount} {itemCount === 1 ? 'vara' : 'varor'} • {formatPriceCents(subtotalCents, currency)}
        </a>
      ) : null}
    </div>
  );
}
