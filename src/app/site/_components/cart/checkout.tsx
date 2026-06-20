'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { CheckCircle2Icon, MinusIcon, PlusIcon, ShoppingBagIcon, Trash2Icon } from 'lucide-react';
import { createPublicOrder, type PublicOrderFulfillmentType } from '@shared/lib/api/restaurant.api';
import { formatPriceCents } from '@shared/lib/menu/menu-variants';
import { cartLineKey, useCart } from './cart-context';

// /bestall checkout: reviews the shared cart, picks pickup/delivery, collects contact details, and
// submits the public order. On success it clears the cart and shows an order-number confirmation.
export function Checkout({ phone, menuHref }: { phone: string | null; menuHref: string }) {
  const cart = useCart();
  const [fulfillment, setFulfillment] = useState<PublicOrderFulfillmentType>('takeaway');
  const [status, setStatus] = useState<'idle' | 'saving' | 'error'>('idle');
  const [error, setError] = useState('');
  const [confirmation, setConfirmation] = useState<{ orderNumber: number; fulfillmentType: string } | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (cart.lines.length === 0) return;
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
        items: cart.lines.map((line) => ({
          menuItemId: line.menuItemId,
          quantity: line.quantity,
          variantLabel: line.variantLabel || null,
        })),
      });
      setConfirmation({ orderNumber: result.orderNumber, fulfillmentType: result.fulfillmentType });
      cart.clear();
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
        <Link href={menuHref} className="fluffy-button fluffy-button--primary">Beställ mer</Link>
      </div>
    );
  }

  if (cart.lines.length === 0) {
    return (
      <div className="fluffy-card fluffy-cart-empty-card fluffy-rise">
        <span className="fluffy-cart-panel__icon" aria-hidden="true"><ShoppingBagIcon /></span>
        <h2>Varukorgen är tom</h2>
        <p>Lägg till något gott från menyn så dyker det upp här.</p>
        <Link href={menuHref} className="fluffy-button fluffy-button--primary">Se menyn</Link>
      </div>
    );
  }

  return (
    <aside className="fluffy-cart-panel fluffy-cart-panel--checkout fluffy-rise" aria-label="Din beställning">
      <div className="fluffy-cart-panel__head">
        <span className="fluffy-cart-panel__icon" aria-hidden="true"><ShoppingBagIcon /></span>
        <h2>Din beställning</h2>
      </div>

      <ul className="fluffy-cart-lines">
        {cart.lines.map((line) => {
          const key = cartLineKey(line.menuItemId, line.variantLabel);
          return (
            <li key={key} className="fluffy-cart-line">
              <div className="fluffy-cart-line__info">
                <span className="fluffy-cart-line__name">{line.name}</span>
                <span className="fluffy-cart-line__price">{formatPriceCents(line.unitPriceCents * line.quantity, line.currency)}</span>
              </div>
              <div className="fluffy-qty">
                <button type="button" onClick={() => cart.setQuantity(key, line.quantity - 1)} aria-label={`Minska antal ${line.name}`}>
                  {line.quantity === 1 ? <Trash2Icon aria-hidden="true" /> : <MinusIcon aria-hidden="true" />}
                </button>
                <span aria-live="polite">{line.quantity}</span>
                <button type="button" onClick={() => cart.setQuantity(key, line.quantity + 1)} aria-label={`Öka antal ${line.name}`}>
                  <PlusIcon aria-hidden="true" />
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="fluffy-cart-subtotal">
        <span>Summa</span>
        <span>{formatPriceCents(cart.subtotalCents, cart.currency)}</span>
      </div>

      <form onSubmit={onSubmit} className="fluffy-cart-form">
        <fieldset className="fluffy-fulfillment" aria-label="Hämtning eller leverans">
          <button type="button" aria-pressed={fulfillment === 'takeaway'} onClick={() => setFulfillment('takeaway')}>
            Avhämtning
          </button>
          <button type="button" aria-pressed={fulfillment === 'delivery'} onClick={() => setFulfillment('delivery')}>
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

        <button type="submit" className="fluffy-button fluffy-button--dark" disabled={cart.lines.length === 0 || status === 'saving'}>
          {status === 'saving' ? 'Skickar...' : `Skicka beställning • ${formatPriceCents(cart.subtotalCents, cart.currency)}`}
        </button>

        {status === 'error' ? <p role="alert" className="fluffy-error">{error || 'Det gick inte att skicka beställningen.'}</p> : null}
      </form>
    </aside>
  );
}
