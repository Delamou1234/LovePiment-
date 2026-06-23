import { redirect } from 'next/navigation';

/** Ancienne route par lien — redirige vers le flux par code. */
export default function ReinitialiserMotDePassePage() {
  redirect('/mot-de-passe-oublie');
}
