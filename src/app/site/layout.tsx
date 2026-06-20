import './fluffys-public.css';
import './fluffys-public-type.css';
import './fluffys-public-texture.css';
import './fluffys-public-header.css';
import './fluffys-public-home.css';
import './fluffys-public-collage.css';
import './fluffys-public-menu.css';
import './fluffys-public-menu-responsive.css';
import './fluffys-public-hours.css';
import './fluffys-public-route.css';
import './fluffys-public-footer.css';
import './fluffys-public-forms.css';
import './fluffys-public-order.css';
import './fluffys-public-cart.css';
import type { ReactNode } from 'react';
import { CartProvider } from './_components/cart/cart-context';

export default function SiteLayout({ children }: { children: ReactNode }) {
  return <CartProvider>{children}</CartProvider>;
}
