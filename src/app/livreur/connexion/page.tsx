import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Connexion',
  robots: { index: false, follow: false },
};

/** Ancienne URL — redirige vers la connexion unique. */
export default function LivreurConnexionPage() {
  redirect('/connexion?redirect=/livreur');
}
