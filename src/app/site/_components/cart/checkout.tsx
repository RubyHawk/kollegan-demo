'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { CheckCircle2Icon, MinusIcon, PlusIcon, ShoppingBagIcon, SmartphoneIcon, Trash2Icon } from 'lucide-react';
import {
  createPublicOrder,
  type PublicOrderFulfillmentType,
  type PublicOrderPaymentChoice,
} from '@shared/lib/api/restaurant.api';
import { formatPriceCents } from '@shared/lib/menu/menu-variants';
import { cartLineKey, useCart } from './cart-context';

type OnlineProvider = 'card' | 'swish';

// /bestall checkout: reviews the shared cart, picks pickup/delivery and how to pay (on arrival, or
// online by card/Swish when enabled), and submits the public order. Card redirects to Stripe; Swish
// shows an app-switch prompt; pay-on-arrival shows an order-number confirmation.
export function Checkout({
  phone,
  menuHref,
  confirmHref,
  providers,
}: {
  phone: string | null;
  menuHref: string;
  confirmHref: string;
  providers: OnlineProvider[];
}) {
  const cart = useCart();
  const [fulfillment, setFulfillment] = useState<PublicOrderFulfillmentType>('takeaway');
  const [payment, setPayment] = useState<PublicOrderPaymentChoice>('arrival');
  const [status, setStatus] = useState<'idle' | 'saving' | 'error'>('idle');
  const [error, setError] = useState('');
  const [confirmation, setConfirmation] = useState<{ orderNumber: number; fulfillmentType: string; paymentError: boolean } | null>(null);
  const [swish, setSwish] = useState<{ token: string | null } | null>(null);

  const payChoice: PublicOrderPaymentChoice = providers.includes(payment as OnlineProvider) ? payment : 'arrival';

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
        payment: payChoice,
        items: cart.lines.map((line) => ({
          menuItemId: line.menuItemId,
          quantity: line.quantity,
          variantLabel: line.variantLabel || null,
        })),
      });

      if (result.payment?.redirectUrl) {
        cart.clear();
        window.location.assign(result.payment.redirectUrl);
        return;
      }
      if (result.payment?.provider === 'swish') {
        cart.clear();
        setSwish({ token: result.payment.swishToken ?? null });
        setStatus('idle');
        return;
      }

      setConfirmation({ orderNumber: result.orderNumber, fulfillmentType: result.fulfillmentType, paymentError: result.paymentError === true });
      cart.clear();
      setStatus('idle');
      event.currentTarget.reset();
    } catch (err) {
      setError((err as Error).message);
      setStatus('error');
    }
  }

  if (swish) {
    // Swish m-commerce app-switch: token + URL-encoded return callbackurl so the app brings the
    // customer back to the confirmation page after they approve the payment.
    const returnUrl = typeof window !== 'undefined' ? `${window.location.origin}${confirmHref}` : confirmHref;
    const appSwitch = swish.token
      ? `swish://paymentrequest?token=${encodeURIComponent(swish.token)}&callbackurl=${encodeURIComponent(returnUrl)}`
      : null;
    return (
      <div className="fluffy-card fluffy-cart-confirm fluffy-rise" role="status">
        <span className="fluffy-cart-confirm__icon" aria-hidden="true"><SmartphoneIcon /></span>
        <h2>Öppna Swish för att betala</h2>
        <p>Vi har skickat en betalförfrågan till Swish. Öppna appen och godkänn betalningen — din beställning bekräftas så fort den är klar.</p>
        {appSwitch ? (
          <a href={appSwitch} className="fluffy-button fluffy-button--primary">Öppna Swish</a>
        ) : null}
        <button type="button" className="fluffy-link" onClick={() => setSwish(null)}>Avbryt</button>
      </div>
    );
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
        {confirmation.paymentError ? (
          <p className="fluffy-cart-paynote">Onlinebetalningen kunde inte startas — betala på plats i stället.</p>
        ) : null}
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

  const submitLabel = status === 'saving'
    ? 'Skickar...'
    : payChoice === 'card'
      ? `Betala med kort • ${formatPriceCents(cart.subtotalCents, cart.currency)}`
      : payChoice === 'swish'
        ? `Betala med Swish • ${formatPriceCents(cart.subtotalCents, cart.currency)}`
        : `Skicka beställning • ${formatPriceCents(cart.subtotalCents, cart.currency)}`;

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
          <button type="button" aria-pressed={fulfillment === 'takeaway'} onClick={() => setFulfillment('takeaway')}>Avhämtning</button>
          <button type="button" aria-pressed={fulfillment === 'delivery'} onClick={() => setFulfillment('delivery')}>Leverans</button>
        </fieldset>

        {providers.length > 0 ? (
          <fieldset className="fluffy-fulfillment fluffy-pay" aria-label="Betalsätt">
            <button type="button" aria-pressed={payChoice === 'arrival'} onClick={() => setPayment('arrival')}>Betala på plats</button>
            {providers.includes('card') ? (
              <button type="button" aria-pressed={payChoice === 'card'} onClick={() => setPayment('card')}>Kort</button>
            ) : null}
            {providers.includes('swish') ? (
              <button type="button" aria-pressed={payChoice === 'swish'} onClick={() => setPayment('swish')}>Swish</button>
            ) : null}
          </fieldset>
        ) : null}

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
          {payChoice === 'card'
            ? 'Du skickas vidare till en säker kortbetalning.'
            : payChoice === 'swish'
              ? 'Du godkänner betalningen i Swish-appen.'
              : fulfillment === 'delivery'
                ? 'Du betalar kontant eller med kort vid leverans.'
                : 'Du betalar kontant eller med kort vid avhämtning.'}
        </p>

        <button type="submit" className="fluffy-button fluffy-button--dark" disabled={cart.lines.length === 0 || status === 'saving'}>
          {submitLabel}
        </button>

        {status === 'error' ? <p role="alert" className="fluffy-error">{error || 'Det gick inte att skicka beställningen.'}</p> : null}
      </form>
    </aside>
  );
}
