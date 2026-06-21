import type { Metadata } from 'next';
import { ComptePageContent } from '@/modules/compte/components/ComptePageContent';

export const metadata: Metadata = {
  title: 'Mon compte — KabiShop',
  description: 'Gérez votre profil, vos préférences et consultez vos commandes KabiShop.',
  robots: { index: false, follow: false },
};

export default function ComptePage() {
  return <ComptePageContent />;
}
