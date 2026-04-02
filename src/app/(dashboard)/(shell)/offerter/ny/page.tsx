import { redirect } from 'next/navigation';

/**
 * /offers/new — server-side redirect into the offers page with the wizard pre-opened.
 * The sidebar "Ny offert" link points here; we immediately send the user to /offers?new=true
 * so the client can auto-trigger the wizard on mount.
 */
export default function NewOfferRedirectPage() {
  redirect('/offerter?new=true');
}
