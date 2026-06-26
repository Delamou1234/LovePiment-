import type { Metadata } from 'next';
import { CompteProfilPageContent } from '@/modules/compte/components/CompteProfilPageContent';

export const metadata: Metadata = {
  title: 'Mon profil — Love Piment&',
  description: 'Gérez votre photo, vos coordonnées et la sécurité de votre compte Love Piment&.',
  robots: { index: false, follow: false },
};

export default function CompteProfilPage() {
  return <CompteProfilPageContent />;
}
