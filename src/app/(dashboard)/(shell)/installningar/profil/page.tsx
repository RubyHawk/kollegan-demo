import { redirect } from 'next/navigation';

/**
 * /settings/profile — redirects to /settings which contains the Profil tab.
 */
export default function SettingsProfilePage() {
  redirect('/installningar');
}
